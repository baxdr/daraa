/**
 * Form scanner — detects HTML forms that collect personal data without a
 * consent checkbox or a link to the privacy policy, and lists the sensitive
 * fields they gather. SSRF-guarded like the other scanners.
 */

import * as cheerio from 'cheerio';
import { safeFetch, UrlGuardError } from '@/lib/url-guard';

export interface FormIssue {
  formIndex: number;
  action: string;
  sensitiveFields: string[];
  hasConsent: boolean;
  hasPrivacyLink: boolean;
  violations: string[];
}

export interface FormScanResult {
  formsFound: number;
  results: FormIssue[];
  error?: string;
}

const SENSITIVE_FIELD_HINTS = [
  'email', 'mail',
  'phone', 'tel', 'mobile', 'جوال', 'جوّال',
  'name', 'اسم', 'fullname',
  'id', 'iqama', 'national', 'هوية',
  'password', 'pin',
  'address', 'عنوان',
  'birth', 'dob', 'ميلاد',
];

export async function scanForms(url: string): Promise<FormScanResult> {
  const empty: FormScanResult = { formsFound: 0, results: [] };

  try {
    const { response } = await safeFetch(url, {
      headers: { accept: 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) return { ...empty, error: `http_${response.status}` };
    const html = await response.text();
    return analyseForms(html);
  } catch (err) {
    return {
      ...empty,
      error: err instanceof UrlGuardError ? err.reason : err instanceof Error ? err.message : 'fetch_failed',
    };
  }
}

export function analyseForms(html: string): FormScanResult {
  const $ = cheerio.load(html);
  const forms = $('form');
  const results: FormIssue[] = [];

  forms.each((i, form) => {
    const $form = $(form);
    const action = $form.attr('action') ?? '';

    const sensitiveFields: string[] = [];
    $form.find('input, textarea').each((_, el) => {
      const $el = $(el);
      const type = ($el.attr('type') ?? '').toLowerCase();
      const name = ($el.attr('name') ?? '').toLowerCase();
      const placeholder = ($el.attr('placeholder') ?? '').toLowerCase();
      const id = ($el.attr('id') ?? '').toLowerCase();
      // Sensitive if type matches or any label/hint appears in name/placeholder/id.
      const typeSensitive = ['email', 'tel', 'password'].includes(type);
      const textSensitive = SENSITIVE_FIELD_HINTS.some(
        (hint) => name.includes(hint) || placeholder.includes(hint) || id.includes(hint),
      );
      if (typeSensitive || textSensitive) {
        sensitiveFields.push(name || id || placeholder || type || 'unnamed');
      }
    });

    if (sensitiveFields.length === 0) return; // not a data-collecting form

    const hasConsent = $form.find('input[type="checkbox"]').length > 0;
    const hasPrivacyLink =
      $form.find('a[href*="privacy"], a[href*="خصوصية"]').length > 0 ||
      /موافق.*(سياسة|شروط)|أوافق/.test($form.text());

    const violations: string[] = [];
    if (!hasConsent) {
      violations.push('يجمع بيانات شخصية بدون مربع موافقة صريح');
    }
    if (!hasPrivacyLink) {
      violations.push('بدون رابط لسياسة الخصوصية قريب من الفورم');
    }

    results.push({
      formIndex: i,
      action,
      sensitiveFields: [...new Set(sensitiveFields)],
      hasConsent,
      hasPrivacyLink,
      violations,
    });
  });

  return { formsFound: forms.length, results };
}
