/**
 * POST /api/cron/reminders
 *
 * Bearer-token-guarded endpoint invoked by GitHub Actions on a daily
 * schedule (7am Riyadh = 4am UTC). Walks every project, computes which
 * renewals are due in the next 30 days (or overdue), and sends one
 * digest email per project that has an email on file.
 *
 * Idempotency: every renewal carries `lastSentAt`; we skip anything
 * reminded in the last 7 days so a botched workflow run doesn't double-
 * email the user.
 */

import { NextResponse } from 'next/server';
import { listAllProjects, updateProject, type Renewal } from '@/lib/project-store';
import { urgencyOf } from '@/lib/renewals';
import { getResend, senderAddress, isEmailEnabled } from '@/infrastructure/email/resend-client';
import { renderRenewalReminder } from '@/infrastructure/email/templates/renewal-reminder';

export const runtime = 'nodejs';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ProjectResult {
  projectId: string;
  email: string;
  reminded: number;
  status: 'sent' | 'skipped' | 'failed';
  error?: string;
}

export async function POST(req: Request) {
  // 1. Auth gate — require the shared secret as a Bearer token.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Email provider readiness.
  if (!isEmailEnabled()) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured', sent: 0 }, { status: 503 });
  }
  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: 'email client unavailable' }, { status: 503 });
  }

  const baseUrl =
    process.env.DEPLOYMENT_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

  const today = new Date();
  const now = today.getTime();
  const projects = listAllProjects();
  const results: ProjectResult[] = [];

  for (const project of projects) {
    if (!project.email || !project.renewals || project.renewals.length === 0) continue;

    // Refresh statuses against today's date (the stored `status` was
    // computed at orchestration time; cron runs continuously).
    const refreshed: Renewal[] = project.renewals.map((r) => ({
      ...r,
      status: urgencyOf(r.dueDate, today),
    }));

    const reminderEligible = refreshed.filter(
      (r) =>
        (r.status === 'overdue' || r.status === 'urgent' || r.status === 'soon') &&
        (!r.lastSentAt || now - Date.parse(r.lastSentAt) > SEVEN_DAYS_MS),
    );

    if (reminderEligible.length === 0) {
      results.push({
        projectId: project.id,
        email: project.email,
        reminded: 0,
        status: 'skipped',
      });
      continue;
    }

    const { subject, html, text } = renderRenewalReminder({
      companyName: project.companyName || 'محلك',
      projectId: project.id,
      renewals: reminderEligible,
      baseUrl,
    });

    try {
      const sendResult = await resend.emails.send({
        from: senderAddress(),
        to: project.email,
        subject,
        html,
        text,
      });
      if (sendResult.error) throw new Error(sendResult.error.message);

      const sentAt = new Date().toISOString();
      const eligibleIds = new Set(reminderEligible.map((r) => r.entityId));
      const stamped: Renewal[] = refreshed.map((r) =>
        eligibleIds.has(r.entityId) ? { ...r, lastSentAt: sentAt } : r,
      );
      updateProject(project.id, { renewals: stamped });

      results.push({
        projectId: project.id,
        email: project.email,
        reminded: reminderEligible.length,
        status: 'sent',
      });
    } catch (err) {
      results.push({
        projectId: project.id,
        email: project.email,
        reminded: 0,
        status: 'failed',
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  const summary = {
    totalProjects: projects.length,
    eligibleProjects: results.length,
    sent: results.filter((r) => r.status === 'sent').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    runAt: new Date().toISOString(),
  };

  return NextResponse.json({ ...summary, results });
}
