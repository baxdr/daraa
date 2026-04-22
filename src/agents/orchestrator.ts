/**
 * Compliance-path orchestrator.
 *
 * Runs fire-and-forget from /api/scan/start. Pipeline:
 *   research → scan (3 sub-scans in parallel) → regulatory → analysis.
 * Emits activities + A2A messages to the bus at each step; client polls
 * /api/scan/[scanId] for progress.
 */

import type { Answers } from './chat-flow';
import { runAnalysis } from './analysis-agent';
import { runResearchAgent } from './research-agent';
import { personalizeGaps } from './personalizer';
import { scanPrivacyPolicy } from '@/scanner/privacy-policy';
import { scanSecurityHeaders } from '@/scanner/security-headers';
import { scanThirdParty } from '@/scanner/third-party';
import type { AgentId, ScanResult } from './types';
import { PDPL_RULES } from '@/knowledge/pdpl';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { updateScan, getScan } from '@/lib/scan-store';

/**
 * For the MVP, compliance only activates one entity specialist: pdpl_nca.
 * (tech/ecommerce don't typically need municipality/sfda/civil_defense
 * running against their live site.) This is the seam where v4's
 * ACTIVITY_TO_AGENTS routing will expand in Phase 5.
 */
function resolveActiveAgents(_answers: Answers): AgentId[] {
  return ['pdpl_nca'];
}

export async function runOrchestrator(scanId: string): Promise<void> {
  const scan = getScan(scanId);
  if (!scan) return;
  const run: RunRef = { kind: 'scan', id: scanId };
  const { answers, url } = scan;
  const activeAgents = resolveActiveAgents(answers);

  emit(run, 'orchestrator', 'started', 'جاري التنسيق بين الوكلاء…');

  try {
    /* ==================================================================
     * 1. Research Agent — latest regulatory updates, broadcast to
     *    whichever specialists are about to run.
     * ================================================================== */
    emit(run, 'research', 'started', 'جاري البحث عن آخر التحديثات التنظيمية…');
    const updates = await runResearchAgent(run, activeAgents);
    emit(
      run,
      'research',
      'completed',
      updates.length === 0
        ? 'لم نجد تحديثات جديدة منذ آخر مراجعة.'
        : `لقينا ${updates.length} تحديث${updates.length > 1 ? 'اً' : ''} — أُرسلت للمتخصصين المعنيّين.`,
    );

    /* ==================================================================
     * 2. Scan Agent — runs 3 sub-scans in parallel against the URL.
     *    Findings get forwarded as data_share messages to pdpl_nca.
     * ================================================================== */
    let scanResult: ScanResult | null = null;
    if (url) {
      updateScan(scanId, { status: 'scanning' });
      emit(run, 'scan', 'started', `جاري زيارة ${url}…`);
      emit(run, 'scan', 'working', '↳ فحص سياسة الخصوصية…');
      emit(run, 'scan', 'working', '↳ فحص رؤوس الأمان (HTTPS, HSTS, CSP…)…');
      emit(run, 'scan', 'working', '↳ فحص أدوات التتبع الخارجية في المصدر…');

      const [privacyPolicy, securityHeaders, thirdParty] = await Promise.all([
        scanPrivacyPolicy(url),
        scanSecurityHeaders(url),
        scanThirdParty(url),
      ]);
      scanResult = { url, scannedAt: new Date().toISOString(), privacyPolicy, securityHeaders, thirdParty };

      // Narrate per-sub-scan outcomes.
      if (privacyPolicy.found) {
        const langAr = privacyPolicy.language === 'ar' ? 'عربي'
          : privacyPolicy.language === 'en' ? 'إنجليزي'
            : privacyPolicy.language === 'both' ? 'عربي + إنجليزي' : 'غير محدد';
        const suffix = privacyPolicy.analysis ? 'واستخرجنا الإشارات'
          : privacyPolicy.error === 'api_key_missing' ? 'بدون تحليل عميق (مفتاح AI غير مُعدّ)'
            : 'بدون تحليل عميق';
        emit(run, 'scan', 'working', `✓ وجدنا سياسة خصوصية (اللغة: ${langAr}) ${suffix}.`);
      } else {
        emit(run, 'scan', 'working', '✓ ما وجدنا صفحة سياسة خصوصية منشورة.');
      }

      const headerPasses = [
        securityHeaders.httpsEnforced,
        securityHeaders.hsts,
        securityHeaders.contentSecurityPolicy,
        securityHeaders.xFrameOptions,
        securityHeaders.referrerPolicy,
      ].filter(Boolean).length;
      emit(run, 'scan', 'working', `✓ رؤوس الأمان: ${headerPasses}/5 مطبّقة (النتيجة: ${securityHeaders.score}%).`);

      if (thirdParty.detected.length === 0) {
        emit(run, 'scan', 'working', '✓ ما لقينا أدوات تتبع خارجية في المصدر.');
      } else {
        const names = thirdParty.detected.slice(0, 4).map((t) => t.displayName).join('، ');
        const extra = thirdParty.detected.length > 4 ? `، و${thirdParty.detected.length - 4} أخرى` : '';
        emit(run, 'scan', 'working', `✓ لقينا ${thirdParty.detected.length} أداة تتبع: ${names}${extra}.`);
      }

      emit(run, 'scan', 'completed', 'اكتمل الفحص الخارجي.');

      // A2A: hand the scan findings over to the PDPL/NCA specialist.
      send(run, {
        from: 'scan',
        to: 'pdpl_nca',
        type: 'data_share',
        messageAr:
          `تسليم نتائج الفحص — سياسة الخصوصية: ${privacyPolicy.found ? 'موجودة' : 'مفقودة'}، ` +
          `رؤوس الأمان: ${securityHeaders.score}%، أدوات التتبع: ${thirdParty.detected.length}.`,
        payload: {
          policyFound: privacyPolicy.found,
          headerScore: securityHeaders.score,
          trackers: thirdParty.detected.length,
        },
      });
      updateScan(scanId, { scanResult });
    } else {
      emit(run, 'scan', 'completed', 'تخطّى المستخدم رابط الموقع — التقرير سيعتمد على إجابات المحادثة فقط.');
      send(run, {
        from: 'scan',
        to: 'pdpl_nca',
        type: 'data_share',
        messageAr: 'لم يُوفَّر رابط للموقع — أكمِل بناءً على إجابات المستخدم فقط.',
      });
    }

    /* ==================================================================
     * 3. Regulatory / pdpl_nca Specialist — loads applicable rules.
     *    Emits a data_share to analysis with the list.
     * ================================================================== */
    emit(run, 'regulatory', 'started', 'جاري تحميل قواعد نظام حماية البيانات (PDPL)…');
    const applicableCount = countApplicableRules(answers);
    emit(run, 'regulatory', 'completed', `حدّدنا ${applicableCount} قاعدة قابلة للتطبيق على شركتك.`);

    send(run, {
      from: 'pdpl_nca',
      to: 'analysis',
      type: 'data_share',
      messageAr: `${applicableCount} قاعدة قابلة للتطبيق — جاهزة للتقييم.`,
      payload: { applicableCount },
    });

    /* ==================================================================
     * 4. Analysis Agent — evaluates every rule, emits the verdict.
     * ================================================================== */
    updateScan(scanId, { status: 'analyzing' });
    emit(run, 'analysis', 'started', 'جاري مقارنة وضع شركتك مع القواعد…');
    const baseAnalysis = runAnalysis({ answers, scan: scanResult });
    emit(
      run,
      'analysis',
      'completed',
      `اكتمل التحليل — نسبة الامتثال ${baseAnalysis.complianceScore}٪، وعدد الفجوات ${baseAnalysis.gaps.length}.`,
    );

    // Personalizer pass — rewrite gap explanations to reference the user's
    // actual answers (sector, user count, hosting location, etc). Falls
    // back silently to the static templates if the key is missing.
    let analysis = baseAnalysis;
    if (baseAnalysis.gaps.length > 0) {
      emit(run, 'analysis', 'working', 'جاري تخصيص شرح الفجوات ببيانات شركتكم…');
      const personalizedGaps = await personalizeGaps(answers, baseAnalysis.gaps);
      analysis = { ...baseAnalysis, gaps: personalizedGaps };
    }

    send(run, {
      from: 'analysis',
      to: 'report',
      type: 'data_share',
      messageAr:
        `نتيجة نهائية — ${analysis.complianceScore}٪ التزام، ${analysis.gaps.length} فجوات، ` +
        `${analysis.totalFineCeilingSar.toLocaleString('en-US')} ريال سقف غرامات.`,
      payload: {
        complianceScore: analysis.complianceScore,
        gapCount: analysis.gaps.length,
        fineCeiling: analysis.totalFineCeilingSar,
      },
    });

    updateScan(scanId, { status: 'complete', analysis });
    emit(run, 'orchestrator', 'completed', 'التقرير جاهز — بنحوّلك له الآن.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    console.error('[orchestrator] pipeline failed:', message);
    emit(run, 'orchestrator', 'error', `حصل خطأ أثناء الفحص: ${message}`);
    updateScan(scanId, { status: 'error', errorMessage: message });
  }
}

function countApplicableRules(answers: Answers): number {
  if (answers.q3_processes_personal_data === 'no') return 0;
  return PDPL_RULES.filter((rule) => {
    switch (rule.appliesTo) {
      case 'all':               return true;
      case 'large_processors':  return answers.q4_user_count === 'over_100k';
      case 'cross_border':      return answers.q6_data_location === 'outside';
    }
  }).length;
}
