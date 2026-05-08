import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Municipality — behavior depends on what Civil Defense's inbox message
 * carried. Restaurants with a kitchen get an additional commercial-kitchen
 * requirement; sites not on the ground floor surface a warning because
 * many food activities are ground-floor-only.
 *
 * If MOHR broadcast a red-nitaqat warning, Municipality surfaces that too —
 * many balady services are constrained while the zone is red.
 */
export class MunicipalityAgent implements Agent {
  readonly id: AgentId = 'municipality';
  readonly dependencies: readonly AgentId[] = ['civil_defense'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const safetyCert = inbox.find(
      (m) =>
        m.from === 'civil_defense' &&
        m.type === 'dependency' &&
        m.payload?.safetyCertReady === true,
    );
    if (!safetyCert) {
      return {
        status: 'blocked',
        reason: 'لم نستلم تأكيد شهادة السلامة من متخصّص الدفاع المدني',
      };
    }

    // Signals forwarded by Civil Defense.
    const hasKitchen = Boolean(safetyCert.payload?.hasKitchen);
    const nonGroundFloor = Boolean(safetyCert.payload?.nonGroundFloor);

    const cost = this.estimateCost(context.vertical, hasKitchen);
    const licenceLabel = this.licenceLabel(context.vertical);

    const requirements: string[] = [
      'إثبات الموافقة على الموقع في منصّة بلدي',
      'شهادة السلامة (مُستلمة من الدفاع المدني)',
    ];
    if (hasKitchen) requirements.push('ترخيص مطبخ تجاري — إضافي لأن المحل يحتوي مطبخ');

    const warnings: string[] = [];
    if (nonGroundFloor && context.vertical === 'restaurant') {
      warnings.push(
        'الموقع ليس في الدور الأرضي — بعض أنشطة المطاعم تتطلّب الدور الأرضي، راجع اشتراطات بلديتك قبل توقيع العقد.',
      );
    }

    // Cross-agent input: MOHR flagged red nitaqat → constrain municipality services.
    const mohrWarning = inbox.find(
      (m) => m.from === 'mohr_gosi' && m.type === 'warning' && m.payload?.nitaqatZone === 'red',
    );
    if (mohrWarning) {
      warnings.push(
        'النطاق أحمر — بعض خدمات البلدية تتقيّد، وقد يُرفض طلب التجديد أو الإصدار الجديد حتى تصحيح النطاق.',
      );
    }

    const commonMistakeAr =
      'تحقّق من تطابق نشاطك المسجّل مع نوع رخصة البلدية على منصة بلدي قبل أي تجديد — تغيير النشاط بدون تحديث الرخصة يعرّضك لمخالفات.';

    const criticalWarningAr = warnings.length > 0 ? warnings.join(' ') : undefined;

    const outbox: AgentMessage[] = [
      {
        from: 'municipality',
        to: 'sfda',
        type: 'dependency',
        payload: { municipalityLicense: 'pending-issuance', licenceLabel, hasKitchen },
        messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ ترخيص الغذاء بالتوازي.`,
      },
      {
        from: 'municipality',
        to: 'moh',
        type: 'dependency',
        payload: { municipalityLicense: 'pending-issuance', licenceLabel },
        messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ الترخيص الصحي.`,
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'municipality',
        nameAr: 'أمانة المنطقة (بلدي)',
        nameSimpleAr: licenceLabel,
        explainAr: 'الرخصة اللي تسمح لك تفتح محلك في الموقع. بدونها ما تقدر تشغّل النشاط رسمياً.',
        estimatedCostSar: cost,
        estimatedTimeAr: '٣ إلى ٧ أيام',
        officialUrl: 'https://balady.gov.sa',
        renewalMonths: 12,
        commonMistakeAr,
        ...(criticalWarningAr !== undefined ? { criticalWarningAr } : {}),
        requirements,
      },
      outbox,
    };
  }

  private licenceLabel(vertical: AgentContext['vertical']): string {
    switch (vertical) {
      case 'restaurant':
      case 'coffee':
        return 'رخصة بلدية (نشاط غذائي)';
      case 'grocery':
        return 'رخصة بلدية (تجزئة غذائية)';
      case 'salon':
        return 'رخصة بلدية (صالون / تجميل)';
      case 'laundry':
        return 'رخصة بلدية (مغسلة)';
    }
  }

  private estimateCost(
    vertical: AgentContext['vertical'],
    hasKitchen: boolean,
  ): { min: number; max: number } {
    const base = (() => {
      switch (vertical) {
        case 'restaurant':
        case 'coffee':
          return { min: 500, max: 3000 };
        case 'grocery':
          return { min: 500, max: 2500 };
        case 'salon':
          return { min: 500, max: 2000 };
        case 'laundry':
          return { min: 500, max: 2000 };
      }
    })();
    if (hasKitchen) return { min: base.min + 500, max: base.max + 1500 };
    return base;
  }
}
