/**
 * Top-warnings + city-label resolver for the project orchestrator.
 * Pure helpers — no I/O, no LLM.
 */

import type { Answers } from '../chat-flow';
import { VERTICALS, type VerticalId } from '@/knowledge/entities';

export const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخُبَر',
  other: 'مدينة أخرى',
};

export function computeTopWarnings(
  mode: 'establishment' | 'compliance' | 'operational_compliance',
  vertical: VerticalId,
  answers: Answers,
): string[] {
  const out: string[] = [];

  // Establishment-only — "don't sign the lease before verifying the activity
  // is allowed at this location" is the product's most distinctive moment.
  if (mode === 'establishment') {
    const isPhysical = vertical === 'restaurant' || vertical === 'salon';
    if (isPhysical && answers.est6_lease_status === 'not_signed') {
      out.push(
        'قبل ما توقّع عقد الإيجار — تأكّد من منصة بلدي (balady.gov.sa) إن الموقع يُرخَّص للنشاط اللي تفكّر فيه. المالك قد يوعدك شفهياً، لكن المرجع الرسمي هو منصة البلدية. وقّع بعد التحقق لتفادي خسارة الإيجار.',
      );
    }
  }

  // Compliance-mode — cross-border hosting without an explicit legal basis.
  if (mode === 'compliance' && answers.q6_data_location === 'outside') {
    out.push(
      'بياناتكم مُستضافة خارج المملكة. نظام حماية البيانات يتطلّب ضمانات إضافية لنقل البيانات عبر الحدود — لا تعتمدوا على اتفاقية الخدمة الافتراضية مع مزوّد السحابة وحدها، راجعوا شروط SDAIA.',
    );
  }

  // Vertical ignorance — unknown vertical placeholder.
  void VERTICALS[vertical];

  return out;
}
