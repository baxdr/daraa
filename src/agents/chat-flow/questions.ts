/**
 * Question definitions — the source of truth for what the chat asks,
 * the Arabic text, the quick-answer buttons, and which terms get
 * surfaced as expandable chips.
 *
 * Single flow: small physical shop (coffee / restaurant / grocery /
 * laundry / salon) → operational compliance + license tracking.
 */

import type { Question, QuestionId } from './types';

export const FIRST_QUESTION: QuestionId = 'q_company_name';

export const QUESTIONS: Record<QuestionId, Question> = {
  q_company_name: {
    id: 'q_company_name',
    text: 'أهلاً! أنا درع — مساعدك لمتابعة رخص محلك والتذكير بمواعيد التجديد. وش اسم المحل؟',
    hint: 'اسم المحل التجاري كما هو مسجّل — مثال: «كافيه الأصالة»، «بقالة النخيل»، «مغسلة بيان».',
    input: { kind: 'text', placeholder: 'اكتب اسم المحل — مثال: كوفي الأصالة' },
  },

  op1_vertical: {
    id: 'op1_vertical',
    text: 'ممتاز. وش نوع نشاط المحل؟',
    hint: 'نوع النشاط يحدد الجهات التي يطبق عليك — مثال: المطاعم تحتاج SFDA، الصالونات تحتاج وزارة الصحة.',
    options: [
      { value: 'coffee', label: 'كوفي شوب / مقهى' },
      { value: 'restaurant', label: 'مطعم' },
      { value: 'grocery', label: 'بقالة / سوبر ماركت' },
      { value: 'laundry', label: 'مغسلة ملابس' },
      { value: 'salon', label: 'صالون / مركز تجميل' },
    ],
  },
  op2_city: {
    id: 'op2_city',
    text: 'في أي مدينة المحل؟',
    hint: 'الإجراءات قد تختلف من أمانة لأخرى — اختر مدينتك.',
    options: [
      { value: 'riyadh', label: 'الرياض' },
      { value: 'jeddah', label: 'جدة' },
      { value: 'mecca', label: 'مكة المكرمة' },
      { value: 'medina', label: 'المدينة المنورة' },
      { value: 'dammam', label: 'الدمام' },
      { value: 'khobar', label: 'الخُبَر' },
      { value: 'other', label: 'مدينة ثانية' },
    ],
  },
  op3_cr_issue_date: {
    id: 'op3_cr_issue_date',
    text: 'متى تاريخ إصدار السجل التجاري؟',
    hint: 'صيغة: YYYY-MM-DD (مثال 2024-03-15). نحسب موعد التجديد القادم — السجل التجاري يُجدَّد سنوياً.',
    input: { kind: 'date', placeholder: 'مثال: 2024-03-15' },
  },
  op4_municipal_last_renewed: {
    id: 'op4_municipal_last_renewed',
    text: 'متى آخر تجديد لرخصة البلدية؟',
    hint: 'لو ما عندك تاريخ بالضبط، تقدر تتخطى — راح نفترض أنها صدرت مع السجل التجاري.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15',
      skipLabel: 'تخطى — ما أدري بالضبط',
    },
  },
  op5_civil_defense_last: {
    id: 'op5_civil_defense_last',
    text: 'متى آخر شهادة سلامة من الدفاع المدني؟',
    hint: 'شهادة السلامة (طفايات، مخارج طوارئ، كواشف دخان) تُجدَّد سنوياً.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15',
      skipLabel: 'تخطى — ما عندي تاريخ',
    },
  },
  op5b_extinguishers_count: {
    id: 'op5b_extinguishers_count',
    text: 'كم طفاية حريق صالحة عندك في المحل حالياً؟',
    hint: 'العدد الأدنى المُوصى به: 2 لكل محل صغير + إضافية قرب أي مصدر حرارة (مطبخ، تيار كهرباء).',
    input: { kind: 'number', placeholder: 'اكتب الرقم — مثال: 3' },
  },
  op5c_extinguishers_last_check: {
    id: 'op5c_extinguishers_last_check',
    text: 'متى آخر فحص دوري للطفايات؟',
    hint: 'الطفايات تتطلب فحص دوري كل 6 أشهر — صلاحية مكتوبة على ملصق الطفاية.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-09-01',
      skipLabel: 'تخطى — ما لقيت تاريخ',
    },
  },
  op5d_emergency_exit: {
    id: 'op5d_emergency_exit',
    text: 'هل عندك مخرج طوارئ مستقل + لوحة إرشادية؟',
    hint: 'الدفاع المدني يطلب مخرج طوارئ منفصل عن المدخل الرئيسي + لوحة مضاءة فوقه.',
    options: [
      { value: 'yes', label: 'نعم، موجود' },
      { value: 'no', label: 'لا — المخرج الرئيسي فقط' },
    ],
  },
  op6_sfda_cert_date: {
    id: 'op6_sfda_cert_date',
    text: 'متى آخر ترخيص من هيئة الغذاء والدواء (SFDA)؟',
    hint: 'يُجدَّد سنوياً — انتهاؤه يعني إيقاف فوري للنشاط.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15',
      skipLabel: 'تخطى',
    },
  },
  op6b_ventilation: {
    id: 'op6b_ventilation',
    text: 'هل المطبخ/منطقة التحضير فيه نظام شفط/تهوية مطابق؟',
    hint: 'الدفاع المدني يطلب شفط دهون فوق فرن/مشاط + تهوية كافية. غيابه سبب رئيسي للمخالفات.',
    options: [
      { value: 'yes', label: 'نعم، متوفر' },
      { value: 'no', label: 'لا' },
      { value: 'unknown', label: 'ما أدري' },
    ],
  },
  op6c_refrigeration_check: {
    id: 'op6c_refrigeration_check',
    text: 'متى آخر صيانة دورية للثلاجات/المبردات؟',
    hint: 'المبردات تحتاج صيانة دورية لتظل عند 4°م أو أقل — اضطراب التبريد يفسد المنتجات.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-12-01',
      skipLabel: 'تخطى — ما تذكر',
    },
  },
  op7_hygiene_certs: {
    id: 'op7_hygiene_certs',
    text: 'كم موظف عنده شهادة صحية سارية حالياً؟',
    hint: 'الشهادات الصحية إلزامية لكل من يتعامل مع الغذاء/البشرة. تُجدَّد سنوياً.',
    input: { kind: 'number', placeholder: 'اكتب الرقم — مثال: 4' },
  },
  op8_employee_count: {
    id: 'op8_employee_count',
    text: 'إجمالي عدد الموظفين الحالي؟',
    hint: 'نحتاج الرقم لتقدير وضعك في نطاقات — ١٠ موظفين فأكثر تستوجب نسبة توطين.',
    input: { kind: 'number', placeholder: 'مثال: 6' },
  },
  op9_lease_expiry: {
    id: 'op9_lease_expiry',
    text: 'متى ينتهي عقد إيجار المحل؟',
    hint: 'لو الإيجار قارب الانتهاء بنذكّرك قبل ما تصير أزمة.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2025-06-30',
      skipLabel: 'تخطى',
    },
  },
  op10_signage_approved: {
    id: 'op10_signage_approved',
    text: 'لوحة المحل (الإعلانية) معتمدة من البلدية؟',
    hint: 'لوحة المحل تحتاج موافقة بلدية بمواصفات محددة — لوحات غير معتمدة يصير عليها مخالفات.',
    options: [
      { value: 'yes', label: 'نعم، معتمدة' },
      { value: 'no', label: 'لا — أو منتهية' },
      { value: 'unknown', label: 'ما أدري' },
    ],
  },
};
