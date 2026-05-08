/**
 * Top-warnings + city-label resolver for the project orchestrator.
 * Pure helpers — no I/O, no LLM.
 */

import type { Answers } from '../chat-flow';
import type { VerticalId } from '@/knowledge/entities';

export const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخُبَر',
  other: 'مدينة أخرى',
};

export function computeTopWarnings(vertical: VerticalId, answers: Answers): string[] {
  const out: string[] = [];

  // Critical safety gaps surface as top warnings even before the gap section.
  if (answers.op5d_emergency_exit === 'no') {
    out.push(
      'مخرج الطوارئ غير مستقل — هذا أكثر سبب لإيقاف نشاط المحل أثناء الفحص الدوري للدفاع المدني. عالجها قبل أي تجديد.',
    );
  }

  const extinguishers = answers.op5b_extinguishers_count ?? 0;
  if (extinguishers > 0 && extinguishers < 2) {
    out.push(
      'عدد الطفايات أقل من الحد الأدنى الموصى به (٢ على الأقل لكل محل صغير). أضف طفايات قبل الفحص القادم.',
    );
  }

  if ((vertical === 'coffee' || vertical === 'restaurant') && answers.op6b_ventilation === 'no') {
    out.push(
      'نظام التهوية/الشفط غير مطابق — المطابخ بدون شفط دهون من أكثر أسباب رفض الفحص الميداني للدفاع المدني والـ SFDA.',
    );
  }

  if (answers.op10_signage_approved === 'no') {
    out.push(
      'لوحة المحل غير معتمدة من البلدية — هذي مخالفة فورية تترصد أثناء الجولات اليومية. حدّث اللوحة قبل الجولة التالية.',
    );
  }

  return out;
}
