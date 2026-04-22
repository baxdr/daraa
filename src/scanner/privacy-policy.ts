import * as cheerio from 'cheerio';
import type { PrivacyPolicyCheck, PrivacyPolicyAnalysis } from '@/agents/types';
import { callClaude, MODELS, MissingApiKeyError, parseJsonResponse } from '@/lib/claude';
import { safeFetch, UrlGuardError } from '@/lib/url-guard';

const COMMON_PATHS = [
  '/privacy',
  '/privacy-policy',
  '/privacy.html',
  '/privacypolicy',
  '/policies/privacy',
  '/legal/privacy',
  '/سياسة-الخصوصية',
  '/privacy-policy-ar',
];

const PRIVACY_LINK_PATTERNS = [
  /privacy\s*policy/i,
  /\bprivacy\b/i,
  /سياسة\s*الخصوصية/,
  /الخصوصية/,
  /\bبيانات\s*شخصية\b/,
];

/**
 * Find the privacy policy URL for a given site, fetch its text, and run it
 * through Claude Sonnet for a PDPL gap analysis.
 *
 * Every outbound request is SSRF-guarded (rejects private IPs, manual redirect
 * re-validation, 2 MB response cap). Sites rendering content only via client
 * JS are missed by design — Cheerio-only per DESIGN.md §15.
 */
export async function scanPrivacyPolicy(siteUrl: string): Promise<PrivacyPolicyCheck> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return { found: false, error: 'invalid_url' };
  }

  const policyUrl = await findPolicyUrl(origin);
  if (!policyUrl) return { found: false };

  const text = await fetchPolicyText(policyUrl);
  if (!text) return { found: true, policyUrl, error: 'Could not extract text from policy page' };

  const language = detectLanguage(text);
  const hasArabicVersion = language === 'ar' || language === 'both';

  let analysis: PrivacyPolicyAnalysis | undefined;
  let claudeError: string | undefined;
  try {
    analysis = await analyzeWithClaude(text, language);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      claudeError = 'api_key_missing';
    } else {
      claudeError = err instanceof Error ? err.message : 'unknown_error';
      console.warn('[scanner] Claude analysis failed:', claudeError);
    }
  }

  return {
    found: true,
    policyUrl,
    language,
    hasArabicVersion,
    rawTextExcerpt: text.slice(0, 500),
    analysis,
    error: claudeError,
  };
}

async function findPolicyUrl(origin: string): Promise<string | null> {
  const homepageHit = await findPolicyLinkOnPage(origin);
  if (homepageHit) return homepageHit;

  for (const path of COMMON_PATHS) {
    const candidate = origin + path;
    if (await urlExists(candidate)) return candidate;
  }
  return null;
}

async function findPolicyLinkOnPage(pageUrl: string): Promise<string | null> {
  const html = await safeFetchText(pageUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  const candidates: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const text = $(el).text().trim();
    const matchesText = PRIVACY_LINK_PATTERNS.some((p) => p.test(text));
    const matchesHref = /privacy|خصوصية/i.test(href);
    if (matchesText || matchesHref) candidates.push(href);
  });

  for (const href of candidates) {
    try {
      const abs = new URL(href, pageUrl).toString();
      if (await urlExists(abs)) return abs;
    } catch {
      // ignore malformed hrefs
    }
  }
  return null;
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const { response } = await safeFetch(url, { method: 'HEAD', maxBytes: 16 * 1024 });
    if (response.status === 405 || response.status === 501) {
      const retry = await safeFetch(url, {
        method: 'GET',
        headers: { range: 'bytes=0-1024' },
        maxBytes: 16 * 1024,
      });
      return retry.response.ok;
    }
    return response.ok;
  } catch (err) {
    // Any guard error (private IP, bad protocol, etc.) counts as "doesn't exist".
    if (err instanceof UrlGuardError) return false;
    return false;
  }
}

async function safeFetchText(url: string): Promise<string | null> {
  try {
    const { response } = await safeFetch(url, {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchPolicyText(url: string): Promise<string | null> {
  const html = await safeFetchText(url);
  if (!html) return null;
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, noscript').remove();
  const main = $('main').text() || $('article').text() || $('body').text();
  return main.replace(/\s+/g, ' ').trim();
}

function detectLanguage(text: string): 'ar' | 'en' | 'both' | 'unknown' {
  const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  const total = arabicChars + latinChars;
  if (total < 20) return 'unknown';
  const arRatio = arabicChars / total;
  if (arRatio > 0.7) return 'ar';
  if (arRatio < 0.15) return 'en';
  return 'both';
}

async function analyzeWithClaude(text: string, language: string): Promise<PrivacyPolicyAnalysis> {
  const truncated = text.slice(0, 12000);
  const system = `You are a Saudi PDPL (Personal Data Protection Law, Royal Decree M/19 as amended) compliance analyst.

You will receive the extracted text of a company's privacy policy. Analyse it against PDPL expectations. Return ONLY a JSON object matching this exact shape (no prose, no markdown fences):

{
  "mentionsPdpl": boolean,
  "dataSubjectRights": { "covered": string[], "missing": string[] },
  "purposeStated": boolean,
  "legalBasis": boolean,
  "retentionPeriod": boolean,
  "dpoContact": boolean,
  "crossBorder": boolean,
  "thirdParty": boolean,
  "notes": string
}

The PDPL-recognised data subject rights to check for are exactly these five (use these IDs in covered/missing):
- "informed", "access", "copy", "correction", "destruction"

Do NOT import GDPR-specific rights (portability, objection, restriction).

"notes" must be a single Arabic sentence summarising what's notably missing or strong, max 200 characters.`;

  const userPrompt = `Policy language detected: ${language}\n\nPolicy text:\n"""\n${truncated}\n"""`;
  const raw = await callClaude({ model: MODELS.sonnet, system, user: userPrompt, maxTokens: 1024 });
  return parseJsonResponse<PrivacyPolicyAnalysis>(raw);
}
