import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Maroof — ecommerce-only merchant verification platform run by MCI.
 * Depends on the CR being issued.
 *
 * Branches:
 *   - vertical (only `services`/ecommerce surfaces this — others get a softer warning)
 *   - has-website signal from MCI/research (changes which evidence Maroof needs)
 *
 * Outbox:
 *   1. Broadcast verification status to ALL — useful for chat/document agents.
 *   2. Warn pdpl_nca that consumer-protection language must align with privacy policy.
 *   3. Optional: hint research agent if MCI signal lacks the website URL.
 */
export class MaroofAgent implements Agent {
  readonly id: AgentId = 'maroof';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري' };
    }

    // Branch 1 — vertical relevance.
    const isEcommerce = context.vertical === 'services';
    const explainAr = isEcommerce
      ? 'توثيق متجرك الإلكتروني على معروف يرفع ثقة العملاء ويسرّع حل النزاعات. شارة "متجر موثّق" تظهر في نتائج البحث وتزيد التحويل.'
      : 'حتى لو نشاطك الأساسي مو متجر إلكتروني، التسجيل في معروف مفيد لو عندك صفحة بيع أو بوابة دفع — يعزز الثقة بشكل عام.';

    // Branch 2 — has the user provided a website URL? Affects what evidence
    // Maroof requires + whether we'd recommend deferring or not.
    const hasWebsite =
      typeof context.websiteUrl === 'string' && context.websiteUrl.trim().length > 0;
    const requirements: string[] = [
      'رابط موقع المتجر النشط (نطاق فعّال + شهادة SSL)',
      'سياسة استرجاع وإرجاع واضحة على صفحة منفصلة',
      'وسائل تواصل (واتساب/إيميل/جوال) مع زمن استجابة محدد',
      'شعار متجر بدقة لا تقل عن 512×512 بكسل',
      'معلومات بنكية للدفع (IBAN لاستلام التحويلات)',
    ];
    if (!hasWebsite) {
      requirements.push('ملاحظة: ما عندك موقع جاهز بعد — سجّل في معروف بعد الإطلاق الأول للمتجر');
    }

    // Branch 3 — establishment vs operational compliance.
    const estimatedTimeAr =
      context.mode === 'operational_compliance'
        ? 'مراجعة سنوية للحالة — تجديد تلقائي لو ما تغيّرت بياناتك'
        : 'يوم واحد (إلكتروني)';

    const outbox: AgentMessage[] = [
      {
        from: 'maroof',
        to: 'ALL',
        type: 'data_share',
        payload: {
          maroofRequired: isEcommerce,
          hasWebsiteEvidence: hasWebsite,
        },
        messageAr: isEcommerce
          ? 'توثيق معروف مطلوب لمتجرك — جهّز سياسة استرجاع وروابط تواصل واضحة قبل التسجيل.'
          : 'معروف اختياري لنشاطك — لكنه يضيف ثقة لو في صفحة بيع.',
      },
      {
        from: 'maroof',
        to: 'pdpl_nca',
        type: 'dependency',
        payload: { needsAlignedPrivacyPolicy: true },
        messageAr:
          'سياسة الاسترجاع المنشورة لمعروف يجب أن تتسق مع سياسة الخصوصية — احرص على ربطها وعدم تكرار المتطلبات.',
      },
    ];
    if (!hasWebsite) {
      outbox.push({
        from: 'maroof',
        to: 'research',
        type: 'update',
        payload: { reason: 'no_website_url' },
        messageAr:
          'لم نستلم رابط موقع المتجر — قد نحتاج توقيف خطوة معروف حتى يكتمل الإطلاق التقني.',
      });
    }

    return {
      status: 'complete',
      data: {
        entityId: 'maroof',
        nameAr: 'منصة معروف — وزارة التجارة',
        nameSimpleAr: 'توثيق المتجر (معروف)',
        explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr,
        officialUrl: 'https://maroof.sa',
        renewalPeriodAr: 'سنوي',
        requirements,
        ...(isEcommerce
          ? {}
          : {
              criticalWarningAr:
                'معروف مصمّم للمتاجر الإلكترونية أساساً — راجع جدوى التسجيل لنشاطك الفعلي قبل التقديم.',
            }),
      },
      outbox,
    };
  }
}
