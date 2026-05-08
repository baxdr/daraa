/**
 * Question definitions — the source of truth for what the chat asks,
 * the Arabic text, the quick-answer buttons, and which terms get
 * surfaced as expandable chips.
 */

import type { Question, QuestionId } from './types';

export const FIRST_QUESTION: QuestionId = 'q0_mode';

export const QUESTIONS: Record<QuestionId, Question> = {
  q0_mode: {
    id: 'q0_mode',
    text: 'أهلاً! أنا درع — مستشار ذكي للتأسيس والامتثال في السعودية. وش تبي تسوي اليوم؟',
    hint: 'اختر الأنسب لوضعك — تقدر تغيّر لاحقاً إذا احتجت.',
    options: [
      { value: 'establishment', label: '🏢 أبدأ مشروع جديد — تأسيس وتسجيل الشركة' },
      { value: 'compliance', label: '🔍 عندي شركة شغّالة — أفحص امتثالها الرقمي (PDPL, NCA)' },
      { value: 'operational_compliance', label: '📋 عندي محل أو مطعم — أتابع رخصي وتجديداتي' },
    ],
  },

  q_company_name: {
    id: 'q_company_name',
    text: 'تمام. وش اسم المشروع أو الشركة اللي في بالك؟',
    hint: 'الاسم بيطلع في عقد التأسيس، التقرير، والمستندات اللي بنجهّزها لك — خلّيه الاسم التجاري اللي تبغى يُسجَّل به. مثال: شركة النخيل للتجارة أو كوفي الأصالة.',
    input: { kind: 'text', placeholder: 'اكتب اسم الشركة — مثال: شركة النخيل' },
  },

  /* ---------------- Establishment branch ---------------- */

  est1_vertical: {
    id: 'est1_vertical',
    text: 'ممتاز! وش نوع المشروع اللي تفكّر فيه؟',
    hint: 'مثال: مطعم، تطبيق، متجر إلكتروني، صالون تجميل، أو مقاولات.',
    options: [
      { value: 'restaurant', label: 'مطعم / كوفي شوب' },
      { value: 'tech', label: 'شركة تقنية / تطبيق' },
      { value: 'services', label: 'متجر إلكتروني' },
      { value: 'salon', label: 'صالون / مركز تجميل' },
      { value: 'construction', label: 'مقاولات / بناء' },
    ],
  },
  est2_city: {
    id: 'est2_city',
    text: 'في أي مدينة؟',
    hint: 'مثال: الرياض، جدة، الدمام، مكة المكرمة، أبها أو مدينة أخرى.',
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
  est3_partner_count: {
    id: 'est3_partner_count',
    text: 'كم عدد الشركاء المؤسسين؟ (عدّ نفسك ضمنهم)',
    hint: 'مثال: ١ إذا أنت لوحدك، ٢ إذا أنت وشريك واحد.',
    input: { kind: 'number', placeholder: 'اكتب الرقم فقط — مثال: 2' },
  },
  est4_capital_sar: {
    id: 'est4_capital_sar',
    text: 'كم رأس المال التقريبي اللي ناويين تبدأون فيه (بالريال)؟',
    hint: 'رقم تقريبي يكفي — مثال: ٥٠،٠٠٠ ريال أو اكتب الرقم فقط مثل 50000. نبي نحدد نوع الكيان المناسب (مؤسسة فردية، شركة ذات مسؤولية محدودة، إلخ).',
    input: { kind: 'number', placeholder: 'اكتب الرقم فقط — مثال: 50000' },
  },
  est5_foreign_partner: {
    id: 'est5_foreign_partner',
    text: 'هل أحد الشركاء غير سعودي؟',
    hint: 'وجود شريك أجنبي يغيّر بعض المتطلبات (ترخيص استثمار أجنبي).',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا — كلنا سعوديين' },
    ],
  },
  est6_lease_status: {
    id: 'est6_lease_status',
    text: 'وضع الموقع الحالي؟',
    hint: 'هذا السؤال مهم — فيه تنبيه مهم نشاركه معك بعد ما نعرف الإجابة.',
    options: [
      { value: 'not_signed', label: 'لقينا محل ولم نوقّع العقد' },
      { value: 'signed', label: 'وقّعنا عقد الإيجار' },
      { value: 'no_location_yet', label: 'لسا ندوّر' },
    ],
  },

  /* ---------------- Compliance branch ---------------- */

  q1_company_type: {
    id: 'q1_company_type',
    text: 'ممتاز. وش نوع شركتك؟',
    options: [
      { value: 'saas', label: 'SaaS' },
      { value: 'ecommerce', label: 'متجر إلكتروني' },
      { value: 'fintech', label: 'Fintech' },
      { value: 'services', label: 'خدمات' },
      { value: 'other', label: 'أخرى' },
    ],
  },

  q2_employee_count: {
    id: 'q2_employee_count',
    text: 'ممتاز. كم عدد موظفينكم تقريباً؟',
    hint: 'اكتب الرقم فقط — تقريبي يكفي.',
    input: { kind: 'number', placeholder: 'مثال: 25' },
  },

  q3_processes_personal_data: {
    id: 'q3_processes_personal_data',
    text: 'هل تطبيقكم أو خدمتكم تجمع بيانات شخصية من عملاء سعوديين؟',
    hint: 'يعني أشياء مثل: أسماء، أرقام جوال، إيميلات، عناوين، أو أي معلومات تعرّف الشخص. السؤال هذا مهم لأنه يحدد هل يطبّق عليك نظام حماية البيانات الشخصية (PDPL) أو لا.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
    ],
    terms: ['PDPL'],
  },

  q4_user_count: {
    id: 'q4_user_count',
    text: 'كم عدد المستخدمين أو العملاء اللي عندكم بياناتهم تقريباً؟',
    options: [
      { value: 'under_10k', label: 'أقل من ١٠ آلاف' },
      { value: '10k_100k', label: 'بين ١٠ آلاف و ١٠٠ ألف' },
      { value: 'over_100k', label: 'أكثر من ١٠٠ ألف' },
    ],
  },

  q5_dpo_appointed: {
    id: 'q5_dpo_appointed',
    text: 'هذا عدد كبير — وهذا يعني إن شركتك ملزمة بتعيين مسؤول حماية بيانات (DPO). هل عيّنتم شخص لهذا الدور؟',
    hint: 'المادة ٣٢ من اللائحة التنفيذية تلزم الشركات اللي تعالج بيانات عدد كبير من الناس بتعيين DPO موثّق. ما يحتاج يكون توظيف جديد — يقدر يكون أحد موظفينك الحاليين.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
      { value: 'unknown', label: 'وش هذا؟' },
    ],
    terms: ['DPO'],
  },

  q6_data_location: {
    id: 'q6_data_location',
    text: 'بياناتكم وين مستضافة؟ يعني السيرفرات اللي عليها بيانات عملائكم.',
    hint: 'إذا السيرفرات خارج السعودية (مثل AWS إيرلندا أو GCP فرانكفورت) — يصير نقل بيانات عبر الحدود ويحتاج مبرّر قانوني واضح قبل أي تدقيق.',
    options: [
      { value: 'saudi', label: 'داخل السعودية' },
      { value: 'outside', label: 'خارج السعودية (AWS/Azure/GCP)' },
      { value: 'unknown', label: 'ما أدري' },
    ],
    terms: ['cross_border_transfer'],
  },

  q7_government_clients: {
    id: 'q7_government_clients',
    text: 'هل شركتكم تتعامل مع أي جهة حكومية سعودية؟',
    hint: 'التعامل مع جهات حكومية يضيف طبقة أمن سيبراني إضافية — ضوابط NCA ECC الأساسية مطلوبة قبل أي عقد، وتشمل HTTPS وسجلات المراجعة وضبط صلاحيات الوصول.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
    ],
    terms: ['NCA_ECC'],
  },

  q8_website_url: {
    id: 'q8_website_url',
    text: 'ممتاز — جمعت صورة واضحة عن شركتك. لو عطيتني رابط موقعكم بقدر أفحصه وأعطيك تقرير أدق. تقدر تتخطى لو ما عندك موقع جاهز.',
    hint: 'إذا ما عندك موقع الحين، اضغط "تخطى" — تقدر تضيفه لاحقاً.',
    input: {
      kind: 'url_or_skip',
      placeholder: 'https://yourcompany.sa',
      skipLabel: 'تخطى — ما عندي موقع حالياً',
    },
  },

  /* ---------------- Operational-compliance branch (physical) ---------------- */

  op1_vertical: {
    id: 'op1_vertical',
    text: 'ممتاز. وش نوع نشاطكم؟',
    hint: 'مثال: مطعم، صالون تجميل، مقاولات أو محل تجزئة.',
    options: [
      { value: 'restaurant', label: 'مطعم / كوفي شوب' },
      { value: 'salon', label: 'صالون / مركز تجميل' },
      { value: 'construction', label: 'مقاولات / مكتب بناء' },
      { value: 'retail', label: 'محل تجزئة' },
    ],
  },
  op2_city: {
    id: 'op2_city',
    text: 'في أي مدينة؟',
    hint: 'مثال: الرياض، جدة، الدمام، مكة المكرمة أو أبها.',
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
    text: 'متى أصدرتم السجل التجاري؟',
    hint: 'صيغة: YYYY-MM-DD مثال: 2024-03-15. نحتاج التاريخ عشان نحسب موعد التجديد القادم — السجل التجاري يُجدَّد سنوياً.',
    input: { kind: 'date', placeholder: 'مثال: 2024-03-15' },
  },
  op4_municipal_last_renewed: {
    id: 'op4_municipal_last_renewed',
    text: 'متى آخر تجديد لرخصة البلدية؟',
    hint: 'لو ما عندك تاريخ بالضبط، تقدر تتخطى وراح نفترض أنها جديدة مع السجل التجاري.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى — ما أدري بالضبط',
    },
  },
  op5_civil_defense_last: {
    id: 'op5_civil_defense_last',
    text: 'متى آخر شهادة سلامة من الدفاع المدني؟',
    hint: 'شهادة السلامة (الطفايات، مخارج الطوارئ، كواشف الدخان) تُجدَّد سنوياً. لو عندك تاريخ قريب عطنا إياه.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى — ما عندنا تاريخ',
    },
  },
  op6_sfda_cert_date: {
    id: 'op6_sfda_cert_date',
    text: 'متى آخر ترخيص من هيئة الغذاء والدواء (SFDA)؟',
    hint: 'فقط للمطاعم والكوفي شوب — يُجدَّد سنوياً وإلا تُوقف الخدمة.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى',
    },
  },
  op7_employee_count: {
    id: 'op7_employee_count',
    text: 'كم عدد موظفينكم الحالي؟',
    hint: 'اكتب الرقم فقط. نحتاج الرقم لتقدير وضعكم في نطاقات — ١٠ موظفين فأكثر تستوجب نسبة توطين معيّنة.',
    input: { kind: 'number', placeholder: 'مثال: 6' },
  },
  op8_lease_expiry: {
    id: 'op8_lease_expiry',
    text: 'متى ينتهي عقد الإيجار؟',
    hint: 'لو الإيجار قارب الانتهاء بنذكّرك قبل ما تصير أزمة — تقدر تتخطى لو ما عندك التاريخ.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى',
    },
  },
  op9_has_website: {
    id: 'op9_has_website',
    text: 'هل عندكم موقع إلكتروني أو متجر أونلاين؟',
    hint: 'لو نعم، بنضيف طبقة فحص رقمي (PDPL + رؤوس الأمان) فوق الامتثال التشغيلي.',
    options: [
      { value: 'yes', label: 'نعم، عندنا موقع' },
      { value: 'no', label: 'لا — فقط محل فعلي' },
    ],
  },
  op10_website_url: {
    id: 'op10_website_url',
    text: 'ممتاز — عطنا رابط موقعكم عشان نفحصه.',
    input: {
      kind: 'url_or_skip',
      placeholder: 'https://yourbrand.sa',
      skipLabel: 'تخطى — ابقَ على الامتثال التشغيلي فقط',
    },
  },
};
