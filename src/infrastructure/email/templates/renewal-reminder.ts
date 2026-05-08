/**
 * Renewal-reminder email template (HTML + plain text).
 *
 * Generated server-side by the cron endpoint. Arabic-first; uses simple
 * inline styles so it renders consistently across email clients.
 */

import type { Renewal } from '@/lib/project-store';
import { daysUntil } from '@/lib/renewals';

interface RenewalReminderInput {
  companyName: string;
  projectId: string;
  renewals: readonly Renewal[];
  baseUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const URGENCY_LABEL: Record<Renewal['status'], string> = {
  overdue: 'متأخر',
  urgent: 'عاجل',
  soon: 'قريب',
  ok: 'ساري',
};

const URGENCY_COLOR: Record<Renewal['status'], string> = {
  overdue: '#a3261c',
  urgent: '#a3261c',
  soon: '#a16207',
  ok: '#15803d',
};

export function renderRenewalReminder(input: RenewalReminderInput): RenderedEmail {
  const { companyName, projectId, renewals, baseUrl } = input;
  const projectUrl = `${baseUrl.replace(/\/$/, '')}/project/${projectId}`;

  const overdue = renewals.filter((r) => r.status === 'overdue');
  const urgent = renewals.filter((r) => r.status === 'urgent');
  const soon = renewals.filter((r) => r.status === 'soon');

  const subject =
    overdue.length > 0
      ? `${overdue.length} رخصة متأخرة في ${companyName}`
      : urgent.length > 0
        ? `${urgent.length} رخصة تنتهي قريباً في ${companyName}`
        : `تذكير: ${soon.length} رخصة تحتاج تجديد قريب`;

  const rowsHtml = renewals
    .map((r) => {
      const days = daysUntil(r.dueDate);
      const daysLabel = days < 0 ? `متأخّر بـ ${Math.abs(days)} يوم` : `${days} يوم متبقي`;
      const color = URGENCY_COLOR[r.status];
      return `
<tr>
  <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;">
    <div style="font-weight:bold;color:#1c1917;">${escapeHtml(r.entityNameAr)}</div>
    <div style="font-size:13px;color:#57534e;margin-top:4px;">
      موعد التجديد: ${escapeHtml(r.dueDate)} · ${daysLabel}
    </div>
  </td>
  <td style="padding:12px 16px;border-bottom:1px solid #e7e5e4;text-align:end;white-space:nowrap;">
    <span style="display:inline-block;padding:4px 10px;background-color:${color}1a;color:${color};font-weight:bold;font-size:12px;border-radius:4px;">
      ${URGENCY_LABEL[r.status]}
    </span>
  </td>
</tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f4f1;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f4f1;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e7e5e4;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #e7e5e4;">
            <div style="font-size:28px;font-weight:900;color:#1c1917;letter-spacing:-0.5px;">درع</div>
            <div style="font-size:13px;color:#78716c;margin-top:6px;">
              متابعة رخص ${escapeHtml(companyName)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h1 style="font-size:20px;font-weight:bold;color:#1c1917;margin:0 0 12px 0;line-height:1.4;">
              ${escapeHtml(subject)}
            </h1>
            <p style="font-size:15px;color:#44403c;line-height:1.6;margin:0 0 24px 0;">
              راجعنا حالة رخص محلك واللي يحتاج إجراء قريب — هذي القائمة:
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5e4;">
              ${rowsHtml}
            </table>
            <div style="margin-top:28px;text-align:center;">
              <a href="${escapeAttr(projectUrl)}" style="display:inline-block;padding:14px 32px;background-color:#1c1917;color:#ffffff;font-weight:bold;text-decoration:none;font-size:14px;">
                افتح تقرير المحل
              </a>
            </div>
            <p style="font-size:12px;color:#78716c;line-height:1.6;margin:24px 0 0 0;">
              تستلم هذه التذكيرات لأنك حفظت محلك في درع. تقدر تلغي الاشتراك من
              <a href="${escapeAttr(projectUrl)}" style="color:#1c1917;">صفحة المشروع</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textRows = renewals
    .map((r) => {
      const days = daysUntil(r.dueDate);
      const daysLabel = days < 0 ? `متأخّر بـ ${Math.abs(days)} يوم` : `${days} يوم متبقي`;
      return `- ${r.entityNameAr} | ${r.dueDate} | ${daysLabel} (${URGENCY_LABEL[r.status]})`;
    })
    .join('\n');

  const text = `درع — متابعة رخص ${companyName}

${subject}

${textRows}

افتح التقرير: ${projectUrl}
`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
