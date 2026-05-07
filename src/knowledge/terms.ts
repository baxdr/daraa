/**
 * Plain-Arabic dictionary of compliance terms.
 *
 * Every term the chat might surface to a non-technical founder is explained
 * here in one sentence with an everyday analogy. The UI renders these inside
 * a collapsed `💡 وش يعني X؟` chip — the user taps to expand.
 *
 * Copy style: Gulf/Saudi dialect — "وش"، "مثل"، "خلنا". No MSA formality.
 */

export type TermId =
  | 'PDPL'
  | 'DPO'
  | 'NCA_ECC'
  | 'ZATCA'
  | 'SDAIA'
  | 'SAMA'
  | 'privacy_policy'
  | 'consent'
  | 'data_breach'
  | 'cross_border_transfer'
  | 'data_retention'
  | 'third_party'
  | 'encryption_at_rest'
  | 'security_headers'
  | 'cookie_consent';

export interface TermExplanation {
  term: string; // the raw acronym / English name
  termAr: string; // Arabic name
  simpleExplanation: string; // one sentence, plain Arabic
  analogy?: string; // everyday-life analogy
  example?: string; // concrete example
  whenRequired?: string; // conditionality
  whatToDo?: string; // next step
}

export const TERMS: Record<TermId, TermExplanation> = {
  PDPL: {
    term: 'PDPL',
    termAr: 'نظام حماية البيانات الشخصية',
    simpleExplanation:
      'نظام سعودي جديد يحمي بيانات الناس — مثل أسمائهم وأرقام جوالاتهم وإيميلاتهم. أي شركة تجمع بيانات عملاء سعوديين لازم تلتزم فيه وإلا تتعرض لغرامات.',
    analogy: 'فكّر فيه مثل نظام المرور — لو ما التزمت فيه تجيك مخالفة. هذا نفس الشي بس للبيانات.',
  },
  DPO: {
    term: 'DPO — Data Protection Officer',
    termAr: 'مسؤول حماية البيانات الشخصية',
    simpleExplanation:
      'شخص في شركتك مسؤوليته يتأكد إن الشركة تتعامل مع بيانات العملاء بشكل صحيح ونظامي.',
    analogy: 'مثل ما عندك محاسب يتأكد من الفلوس — هذا يتأكد من البيانات.',
    whenRequired: 'مطلوب لو شركتك تعالج بيانات عدد كبير من الناس.',
    whatToDo:
      'ممكن يكون أحد موظفينك الحاليين — مو لازم توظف شخص جديد. بس لازم يكون عنده صلاحية وتدريب.',
  },
  NCA_ECC: {
    term: 'NCA ECC',
    termAr: 'ضوابط الأمن السيبراني الأساسية',
    simpleExplanation: 'قواعد من الهيئة الوطنية للأمن السيبراني تقول كيف تحمي أنظمتك من الاختراق.',
    analogy: 'مثل ما البيت يحتاج أقفال وكاميرات — موقعك وسيرفراتك يحتاجون حماية.',
    whenRequired: 'مطلوب لو شركتك تتعامل مع أي جهة حكومية.',
  },
  ZATCA: {
    term: 'ZATCA',
    termAr: 'هيئة الزكاة والضريبة والجمارك',
    simpleExplanation:
      'الجهة اللي تتأكد إنك تصدر فواتيرك إلكترونياً بشكل صحيح. لو عندك مبيعات — لازم فواتيرك متكاملة مع نظامهم.',
    whenRequired: 'مطلوب لكل شركة عندها مبيعات وتصدر فواتير.',
  },
  SDAIA: {
    term: 'SDAIA',
    termAr: 'الهيئة السعودية للبيانات والذكاء الاصطناعي',
    simpleExplanation:
      'الجهة الحكومية المسؤولة عن نظام حماية البيانات. هم اللي يراقبون الالتزام ويغرّمون المخالفين.',
    analogy: 'فكّر فيهم مثل "ساهر" بس للبيانات.',
  },
  SAMA: {
    term: 'SAMA',
    termAr: 'البنك المركزي السعودي',
    simpleExplanation:
      'لو شركتك في المجال المالي — تحويلات، مدفوعات، تأمين — البنك المركزي عنده متطلبات أمان خاصة لازم تلتزم فيها.',
    whenRequired: 'مطلوب بس لشركات القطاع المالي — fintech، بنوك، تأمين.',
  },
  privacy_policy: {
    term: 'Privacy Policy',
    termAr: 'سياسة الخصوصية',
    simpleExplanation:
      'صفحة في موقعك تشرح للناس وش البيانات اللي تجمعها، ليش، ووش تسوي فيها، ومع مين تشاركها.',
    analogy: 'مثل عقد واضح بينك وبين عملائك.',
    whatToDo: 'لازم تكون بالعربي، واضحة، سهلة القراءة، ومو مخفية — أي زائر يقدر يوصل لها.',
  },
  consent: {
    term: 'Consent',
    termAr: 'الموافقة',
    simpleExplanation:
      'قبل ما تجمع بيانات أي شخص — لازم يوافق بشكل واضح. مو بس إنه يستخدم موقعك — لازم يضغط "موافق" أو يحدد مربع اختيار.',
    example: 'لما تسجّل في تطبيق ويطلع لك "أوافق على سياسة الخصوصية" — هذي هي الموافقة.',
  },
  data_breach: {
    term: 'Data Breach',
    termAr: 'اختراق بيانات',
    simpleExplanation:
      'لو أحد اخترق أنظمتك وسرق بيانات عملائك — أو حتى شافها بدون إذن. النظام يقول لازم تبلّغ SDAIA خلال 72 ساعة.',
    whatToDo:
      'لازم يكون عندك خطة جاهزة مسبقاً — مين يتصرف ومتى وكيف. ما تنتظر يصير الاختراق وبعدين تفكر.',
  },
  cross_border_transfer: {
    term: 'Cross-Border Data Transfer',
    termAr: 'نقل البيانات عبر الحدود',
    simpleExplanation:
      'لو بيانات عملائك السعوديين مخزنة على سيرفرات برا السعودية — مثلاً AWS في أيرلندا — هذا يعتبر نقل بيانات عبر الحدود وله شروط خاصة.',
    example: 'لو تستخدم AWS أو Google Cloud وسيرفراتك مو في السعودية — هذا ينطبق عليك.',
  },
  data_retention: {
    term: 'Data Retention',
    termAr: 'الاحتفاظ بالبيانات',
    simpleExplanation:
      'كم مدة تحتفظ ببيانات عملائك؟ النظام يقول ما تقدر تخزنها للأبد — لازم تحدد مدة معينة وبعدها تحذفها.',
    example: 'لو عميل ألغى حسابه — كم تحتفظ ببياناته؟ شهر؟ سنة؟ لازم يكون عندك جواب واضح ومكتوب.',
  },
  third_party: {
    term: 'Third-Party Services',
    termAr: 'خدمات الطرف الثالث',
    simpleExplanation:
      'أي أداة أو خدمة خارجية تشارك معها بيانات عملائك. مثل Google Analytics لتتبع الزوار، أو Intercom للمحادثات، أو Mailchimp للإيميلات.',
    whatToDo:
      'لازم تذكر في سياسة الخصوصية كل الأدوات اللي تشارك معها البيانات — وتاخذ موافقة المستخدم.',
  },
  encryption_at_rest: {
    term: 'Encryption at Rest',
    termAr: 'تشفير البيانات المخزنة',
    simpleExplanation:
      'البيانات المخزنة على سيرفراتك تكون مشفّرة — حتى لو أحد وصل للسيرفر ما يقدر يقرأها.',
    analogy: 'مثل خزنة مقفلة — حتى لو سرقتها ما تقدر تفتحها بدون المفتاح.',
    whatToDo: 'لو تستخدم AWS — تأكد إن S3 Encryption و RDS Encryption مفعّلين.',
  },
  security_headers: {
    term: 'Security Headers',
    termAr: 'رؤوس الأمان',
    simpleExplanation: 'إعدادات أمان لموقعك تحميه من أنواع معينة من الهجمات.',
    analogy: 'مثل ما تحط قفل وسلسلة على باب بيتك — هذي أقفال لموقعك.',
    whatToDo: 'أغلبها يضيفها المبرمج بسطر واحد. بس كثير مواقع تنسى تفعّلها.',
  },
  cookie_consent: {
    term: 'Cookie Consent',
    termAr: 'الموافقة على ملفات الارتباط',
    simpleExplanation:
      'الرسالة اللي تطلع لما تدخل موقع وتسأل "هل توافق على الكوكيز؟" — هذي مو تجميل، هذي متطلب قانوني.',
    example: 'البار اللي يطلع تحت في المواقع ويقول "نستخدم ملفات تعريف الارتباط" — هذا هو.',
  },
};
