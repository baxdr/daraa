/**
 * Third-party tracker scanner — SSRF-guarded. Detects analytics / marketing
 * / chat services loaded by the site by matching well-known domain strings
 * in the homepage's static source.
 *
 * Dynamic trackers loaded via GTM containers or JS post-render are missed —
 * that's the Cheerio-only trade-off documented in DESIGN.md §15.
 */

import * as cheerio from 'cheerio';
import { safeFetch, UrlGuardError } from '@/infrastructure/http/url-guard';

export interface TrackerHit {
  domain: string;
  displayName: string;
  category: 'analytics' | 'advertising' | 'chat' | 'marketing' | 'session_replay' | 'other';
  crossBorder: boolean;
}

export interface ThirdPartyCheck {
  detected: TrackerHit[];
  crossBorderCount: number;
  categories: Record<TrackerHit['category'], number>;
  error?: string;
}

const KNOWN_TRACKERS: TrackerHit[] = [
  {
    domain: 'google-analytics.com',
    displayName: 'Google Analytics',
    category: 'analytics',
    crossBorder: true,
  },
  {
    domain: 'googletagmanager.com',
    displayName: 'Google Tag Manager',
    category: 'analytics',
    crossBorder: true,
  },
  {
    domain: 'connect.facebook.net',
    displayName: 'Facebook Pixel',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'facebook.net',
    displayName: 'Facebook Pixel',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'static.hotjar.com',
    displayName: 'Hotjar',
    category: 'session_replay',
    crossBorder: true,
  },
  { domain: 'hotjar.com', displayName: 'Hotjar', category: 'session_replay', crossBorder: true },
  { domain: 'mxpnl.com', displayName: 'Mixpanel', category: 'analytics', crossBorder: true },
  { domain: 'cdn.mxpnl.com', displayName: 'Mixpanel', category: 'analytics', crossBorder: true },
  { domain: 'amplitude.com', displayName: 'Amplitude', category: 'analytics', crossBorder: true },
  { domain: 'api.segment.io', displayName: 'Segment', category: 'analytics', crossBorder: true },
  { domain: 'cdn.segment.com', displayName: 'Segment', category: 'analytics', crossBorder: true },
  { domain: 'intercomcdn.com', displayName: 'Intercom', category: 'chat', crossBorder: true },
  { domain: 'widget.intercom.io', displayName: 'Intercom', category: 'chat', crossBorder: true },
  { domain: 'list-manage.com', displayName: 'Mailchimp', category: 'marketing', crossBorder: true },
  { domain: 'js.hs-scripts.com', displayName: 'HubSpot', category: 'marketing', crossBorder: true },
  { domain: 'js.hubspot.com', displayName: 'HubSpot', category: 'marketing', crossBorder: true },
  {
    domain: 'cdn.mouseflow.com',
    displayName: 'Mouseflow',
    category: 'session_replay',
    crossBorder: true,
  },
  {
    domain: 'linkedin.com/px',
    displayName: 'LinkedIn Insight',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'snap.licdn.com',
    displayName: 'LinkedIn Insight',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'static.ads-twitter.com',
    displayName: 'Twitter/X Pixel',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'analytics.tiktok.com',
    displayName: 'TikTok Pixel',
    category: 'advertising',
    crossBorder: true,
  },
  {
    domain: 'clarity.ms',
    displayName: 'Microsoft Clarity',
    category: 'session_replay',
    crossBorder: true,
  },
];

export async function scanThirdParty(url: string): Promise<ThirdPartyCheck> {
  const empty: ThirdPartyCheck = {
    detected: [],
    crossBorderCount: 0,
    categories: {
      analytics: 0,
      advertising: 0,
      chat: 0,
      marketing: 0,
      session_replay: 0,
      other: 0,
    },
  };

  let html: string;
  try {
    const { response } = await safeFetch(url, {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) return { ...empty, error: `http_${response.status}` };
    html = await response.text();
  } catch (err) {
    return {
      ...empty,
      error:
        err instanceof UrlGuardError
          ? err.reason
          : err instanceof Error
            ? err.message
            : 'fetch_failed',
    };
  }

  return analyseThirdParty(html);
}

/**
 * Pure HTML analyser — detects trackers from a page's static source. Used by
 * the `scanThirdParty` live path above AND by offline tooling (precompute
 * scripts) that already has the HTML in hand and doesn't need SSRF fetch.
 */
export function analyseThirdParty(html: string): ThirdPartyCheck {
  const empty: ThirdPartyCheck = {
    detected: [],
    crossBorderCount: 0,
    categories: {
      analytics: 0,
      advertising: 0,
      chat: 0,
      marketing: 0,
      session_replay: 0,
      other: 0,
    },
  };

  const $ = cheerio.load(html);
  const haystack = [
    html,
    ...$('script[src]')
      .map((_, el) => $(el).attr('src') ?? '')
      .get(),
    ...$('link[href]')
      .map((_, el) => $(el).attr('href') ?? '')
      .get(),
    ...$('iframe[src]')
      .map((_, el) => $(el).attr('src') ?? '')
      .get(),
    ...$('img[src]')
      .map((_, el) => $(el).attr('src') ?? '')
      .get(),
  ]
    .join('\n')
    .toLowerCase();

  const seen = new Set<string>();
  const hits: TrackerHit[] = [];
  for (const tracker of KNOWN_TRACKERS) {
    if (haystack.includes(tracker.domain.toLowerCase()) && !seen.has(tracker.displayName)) {
      seen.add(tracker.displayName);
      hits.push(tracker);
    }
  }

  const categories = { ...empty.categories };
  let crossBorderCount = 0;
  for (const h of hits) {
    categories[h.category] += 1;
    if (h.crossBorder) crossBorderCount += 1;
  }

  return { detected: hits, crossBorderCount, categories };
}
