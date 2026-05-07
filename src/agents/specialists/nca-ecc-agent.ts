import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';
import { ECC_TOTAL_CONTROLS, ECC_DOMAINS, getControlsForDomain } from '@/knowledge/nca-ecc';

/**
 * NCA-ECC compliance specialist.
 *
 * Distinct from `pdpl_nca`: pdpl_nca handles privacy (PDPL); this handles
 * the full 114-control NCA-ECC framework. Mandatory for B2G suppliers and
 * critical-infrastructure operators.
 *
 * Branches:
 *   - serves-government clients (drives whether ECC is in-scope at all)
 *   - data-location outside KSA (third-party + cloud domain emphasis)
 *
 * Outbox:
 *   1. Broadcast scope assessment to ALL.
 *   2. Tell document agent about ECC governance + policy templates.
 *   3. Tell mohr_gosi about CISO + cybersecurity team requirement.
 */
export class NcaEccAgent implements Agent {
  readonly id: AgentId = 'nca_ecc';
  readonly dependencies: readonly AgentId[] = ['pdpl_nca'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const pdplSignal = inbox.find(
      (m) => m.from === 'pdpl_nca' && (m.type === 'dependency' || m.type === 'data_share'),
    );
    if (!pdplSignal) {
      return { status: 'blocked', reason: 'بانتظار إنجاز جاهزية PDPL أولاً' };
    }

    // Branch 1 — actually B2G? If not, surface as advisory only.
    const willServeGov = context.answers.q7_government_clients === 'yes';

    // Branch 2 — cloud usage outside KSA hits the third-party domain.
    const dataOutside = context.answers.q6_data_location === 'outside';

    const govControls = getControlsForDomain('governance');
    const defenceControls = getControlsForDomain('defence');

    const requirements: string[] = [
      `تطبيق ${ECC_TOTAL_CONTROLS} ضابط ECC موزّعة على ${ECC_DOMAINS.length} نطاقات`,
      'تعيين رئيس أمن سيبراني (CISO) سعودي بكفاءة موثّقة (ECC-1-2-2)',
      'تأسيس إدارة أمن سيبراني مستقلة عن تقنية المعلومات (ECC-1-2-1)',
      `وضع استراتيجية أمن سيبراني موثّقة (${govControls[0]?.id ?? 'ECC-1-1-1'})`,
      'برنامج توعية مستمر لكل الموظفين + محاكاة تصيّد دورية (ECC-1-10-1, ECC-1-10-3)',
      `تطبيق ${defenceControls.length} ضابط دفاع تشمل MFA، التشفير، تقوية الأنظمة`,
    ];
    if (dataOutside) {
      requirements.push('استضافة البيانات الحساسة على مزود سحابي معتمد داخل المملكة (ECC-4-2-1)');
      requirements.push('تشفير البيانات من جهة العميل قبل الترحيل للسحابة (ECC-4-2-3)');
    }

    const explainAr = willServeGov
      ? `لأنك ستتعامل مع جهات حكومية — الالتزام بضوابط NCA-ECC الـ${ECC_TOTAL_CONTROLS} إلزامي للتأهل. التطبيق الكامل يستغرق 6-12 شهر ويتطلب CISO وفريق متخصّص.`
      : `ضوابط NCA-ECC تطبّق أساساً على الجهات الحكومية وموردي البنية التحتية الحيوية. لو خططك تشمل عقود حكومية مستقبلاً، ابدأ التحضير الآن — التطبيق الكامل يستغرق 6-12 شهر.`;

    const outbox: AgentMessage[] = [
      {
        from: 'nca_ecc',
        to: 'ALL',
        type: 'data_share',
        payload: {
          inScope: willServeGov,
          totalControls: ECC_TOTAL_CONTROLS,
          domains: ECC_DOMAINS.length,
        },
        messageAr: willServeGov
          ? `NCA-ECC إلزامي لك (${ECC_TOTAL_CONTROLS} ضابط) — التأهل لعقود حكومية يبدأ بهذي الضوابط.`
          : 'NCA-ECC استشاري لنشاطك حالياً — لكن مفيد كأساس أمني عام.',
      },
      {
        from: 'nca_ecc',
        to: 'document',
        type: 'data_share',
        payload: {
          templatesNeeded: [
            'ecc_strategy_template',
            'cybersecurity_policy_master',
            'incident_response_plan',
            'risk_register',
          ],
        },
        messageAr:
          'يولّد وكيل المستندات: استراتيجية ECC + سياسة أمن سيبراني شاملة + خطة استجابة + سجل مخاطر.',
      },
      {
        from: 'nca_ecc',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { needsCISO: willServeGov, needsCyberTeam: willServeGov },
        messageAr: willServeGov
          ? 'تعيين CISO سعودي إلزامي قبل التأهل لأي عقد حكومي — أدخل ذلك في خطة التوظيف.'
          : 'لو خططك تشمل B2G، خطّط لتعيين CISO ضمن أول 6 موظفين تقنيين.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'nca_ecc',
        nameAr: 'الهيئة الوطنية للأمن السيبراني — ECC',
        nameSimpleAr: 'الالتزام بضوابط NCA-ECC',
        explainAr,
        estimatedCostSar: { min: 30_000, max: 150_000 },
        estimatedTimeAr: '٦ إلى ١٢ شهر للالتزام الكامل',
        officialUrl: 'https://nca.gov.sa',
        renewalPeriodAr: 'مراجعة سنوية',
        requirements,
        commonMistakeAr:
          'كثير من الشركات تظن أن PDPL = NCA-ECC. هما إطاران مختلفان: PDPL للخصوصية، ECC للأمن السيبراني العام.',
        ...(willServeGov
          ? {
              criticalWarningAr:
                'الالتزام الجزئي بـ ECC لا يكفي للتأهل الحكومي — كل ضوابط النطاق المطلوب يجب أن تُطبَّق وتُدقَّق سنوياً.',
            }
          : {}),
      },
      outbox,
    };
  }
}
