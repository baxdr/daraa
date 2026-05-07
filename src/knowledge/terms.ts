/**
 * Plain-Arabic dictionary of compliance + business terms (150+ entries).
 *
 * Every term the chat or agents might surface to a non-technical founder is
 * explained here in one sentence with an everyday analogy. The UI renders
 * these inside a collapsed `💡 وش يعني X؟` chip — the user taps to expand.
 *
 * Copy style: Gulf/Saudi dialect — "وش"، "مثل"، "خلنا". No MSA formality.
 *
 * Categories (for navigation, not enforced):
 *   - Government bodies      (gov_*)
 *   - Tax & finance          (tax_*)
 *   - Business entity types  (entity_*)
 *   - Licensing & permits    (license_*)
 *   - Cybersecurity          (sec_*)
 *   - Data privacy           (priv_*)
 *   - Intellectual property  (ip_*)
 *   - Customs & logistics    (customs_*)
 *   - Employment             (emp_*)
 *   - Compliance & audit     (audit_*)
 *   - Tech infrastructure    (tech_*)
 *   - Risk & governance      (risk_*)
 *   - Banking & payments     (bank_*)
 */

export type TermId =
  // Original 15
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
  | 'cookie_consent'
  // Government bodies
  | 'gov_MCI'
  | 'gov_MOMRAH'
  | 'gov_BALADY'
  | 'gov_MOH'
  | 'gov_HRSD'
  | 'gov_GOSI'
  | 'gov_SFDA'
  | 'gov_SAIP'
  | 'gov_MAROOF'
  | 'gov_MISA'
  | 'gov_CITC'
  | 'gov_MONSHAAT'
  | 'gov_FASAH'
  | 'gov_SABER'
  | 'gov_NCA'
  | 'gov_civil_defense'
  // Tax & finance
  | 'tax_VAT'
  | 'tax_withholding'
  | 'tax_zakat'
  | 'tax_corporate'
  | 'tax_excise'
  | 'tax_RETT'
  | 'tax_einvoice_phase1'
  | 'tax_einvoice_phase2'
  | 'tax_fatoora'
  | 'tax_CSID'
  | 'tax_QR_invoice'
  | 'tax_fiscal_year'
  | 'tax_input_tax'
  | 'tax_output_tax'
  // Business entity types
  | 'entity_LLC'
  | 'entity_sole_prop'
  | 'entity_single_person'
  | 'entity_joint_stock'
  | 'entity_holding'
  | 'entity_foreign_branch'
  | 'entity_free_zone'
  | 'entity_mixed_ownership'
  // Licensing & permits
  | 'license_CR'
  | 'license_balady'
  | 'license_civil_defense_cert'
  | 'license_health_license'
  | 'license_contractor_classification'
  | 'license_activity_code'
  | 'license_misa_investment'
  | 'license_food'
  // Cybersecurity
  | 'sec_HTTPS'
  | 'sec_TLS'
  | 'sec_MFA'
  | 'sec_SSO'
  | 'sec_VPN'
  | 'sec_IDS'
  | 'sec_IPS'
  | 'sec_SOC'
  | 'sec_SIEM'
  | 'sec_CSIRT'
  | 'sec_vulnerability_scan'
  | 'sec_zero_trust'
  | 'sec_hashing'
  | 'sec_SAST'
  | 'sec_DAST'
  | 'sec_penetration_test'
  | 'sec_HSM'
  | 'sec_phishing'
  | 'sec_ransomware'
  // Data privacy
  | 'priv_data_subject'
  | 'priv_controller'
  | 'priv_processor'
  | 'priv_joint_controller'
  | 'priv_anonymization'
  | 'priv_pseudonymization'
  | 'priv_lawful_basis'
  | 'priv_opt_in'
  | 'priv_opt_out'
  | 'priv_sensitive_data'
  | 'priv_profiling'
  | 'priv_automated_decision'
  | 'priv_DPIA'
  | 'priv_data_minimization'
  | 'priv_purpose_limitation'
  // Intellectual property
  | 'ip_trademark'
  | 'ip_copyright'
  | 'ip_patent'
  | 'ip_industrial_design'
  | 'ip_trade_secret'
  // Customs & logistics
  | 'customs_HS_code'
  | 'customs_CoC'
  | 'customs_GS1'
  | 'customs_LC'
  | 'customs_bonded_warehouse'
  | 'customs_FOB'
  | 'customs_CIF'
  | 'customs_port_code'
  // Employment
  | 'emp_nitaqat'
  | 'emp_qiwa'
  | 'emp_mudad'
  | 'emp_saudization'
  | 'emp_end_of_service'
  | 'emp_work_visa'
  | 'emp_iqama'
  | 'emp_GOSI_subscription'
  // Compliance & audit
  | 'audit_KYC'
  | 'audit_AML'
  | 'audit_due_diligence'
  | 'audit_ISO_27001'
  | 'audit_SOC_2'
  | 'audit_GDPR_compare'
  | 'audit_internal_audit'
  | 'audit_external_audit'
  | 'audit_compliance_program'
  | 'audit_evidence'
  // Tech infrastructure
  | 'tech_API'
  | 'tech_cloud'
  | 'tech_IaaS'
  | 'tech_SaaS'
  | 'tech_PaaS'
  | 'tech_on_premises'
  | 'tech_hybrid_cloud'
  | 'tech_microservices'
  // Risk & governance
  | 'risk_appetite'
  | 'risk_treatment'
  | 'risk_RACI'
  | 'risk_RTO'
  | 'risk_RPO'
  | 'risk_BIA'
  | 'risk_DRP'
  | 'risk_BCP'
  | 'risk_change_management'
  | 'risk_incident_response'
  // Banking & payments
  | 'bank_IBAN'
  | 'bank_SWIFT'
  | 'bank_payment_gateway'
  | 'bank_settlement'
  | 'bank_chargeback'
  // Privacy & users (extra)
  | 'priv_tracker'
  | 'priv_fingerprinting'
  | 'priv_session'
  | 'priv_marketing_consent';

export interface TermExplanation {
  term: string; // raw acronym / English name
  termAr: string; // Arabic name
  simpleExplanation: string; // one sentence, plain Arabic
  analogy?: string; // everyday-life analogy
  example?: string; // concrete example
  whenRequired?: string; // conditionality
  whatToDo?: string; // next step
}

export const TERMS: Record<TermId, TermExplanation> = {
  // ─── Original 15 ────────────────────────────────────────────────────────
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

  // ─── Government bodies ──────────────────────────────────────────────────
  gov_MCI: {
    term: 'MCI',
    termAr: 'وزارة التجارة',
    simpleExplanation: 'الجهة اللي تسجّل شركتك رسمياً وتعطيك السجل التجاري — أول خطوة لأي مشروع.',
    analogy: 'مثل الأحوال المدنية بس للشركات.',
    whatToDo: 'كل التسجيل إلكتروني عبر منصة الأعمال — ما يحتاج تروح فرع.',
  },
  gov_MOMRAH: {
    term: 'MOMRAH',
    termAr: 'وزارة الشؤون البلدية والقروية والإسكان',
    simpleExplanation: 'تشرف على الأمانات والبلديات وتصنيف المقاولين والإسكان.',
    whenRequired: 'مهمة لو شغلك في المقاولات أو يحتاج رخصة بلدية.',
  },
  gov_BALADY: {
    term: 'Balady',
    termAr: 'منصة بلدي',
    simpleExplanation: 'منصة موحّدة تستخرج منها رخص البلدية (التشغيل الفعلي للمحل).',
    whatToDo: 'تحقّق من balady.gov.sa إن الموقع اللي تبي تأجره مرخّص لنشاطك قبل أي توقيع.',
  },
  gov_MOH: {
    term: 'MOH',
    termAr: 'وزارة الصحة',
    simpleExplanation:
      'إذا شغلك يلمس البشرة أو الشعر أو الصحة (صالون، عيادة، صيدلية)، تحتاج ترخيص صحي منهم.',
    whenRequired: 'مطلوب لصالونات التجميل، العيادات، الصيدليات، ومراكز الصحة.',
  },
  gov_HRSD: {
    term: 'HRSD',
    termAr: 'وزارة الموارد البشرية والتنمية الاجتماعية',
    simpleExplanation: 'تشرف على ملف المنشأة ونظام نطاقات والسعودة وعقود العمل.',
    whatToDo: 'تفتح ملف المنشأة عندهم بعد ما تستخرج السجل التجاري — مجاناً وإلكترونياً.',
  },
  gov_GOSI: {
    term: 'GOSI',
    termAr: 'المؤسسة العامة للتأمينات الاجتماعية',
    simpleExplanation: 'تسجّل موظفينك فيها وتدفع اشتراكات شهرية — حقهم النظامي.',
    example: 'الاشتراك للسعوديين 21.5% (شركة 9.75% + موظف 9.75% + 2% فروقات بدون مهنية).',
  },
  gov_SFDA: {
    term: 'SFDA',
    termAr: 'الهيئة العامة للغذاء والدواء',
    simpleExplanation: 'الجهة اللي تراقب كل شي يلمس الغذاء أو الدواء أو الأجهزة الطبية.',
    whenRequired: 'مطلوبة للمطاعم، الكوفي شوب، استيراد مواد غذائية، الأدوية، والمستلزمات الطبية.',
  },
  gov_SAIP: {
    term: 'SAIP',
    termAr: 'الهيئة السعودية للملكية الفكرية',
    simpleExplanation: 'تسجّل عندهم العلامة التجارية وبراءات الاختراع وحقوق المصنفات.',
    whatToDo: 'سجّل علامتك التجارية قبل أي إطلاق — بعدين يصير معقد.',
  },
  gov_MAROOF: {
    term: 'Maroof',
    termAr: 'منصة معروف',
    simpleExplanation: 'منصة من وزارة التجارة توثّق المتاجر الإلكترونية وتزيد ثقة العملاء.',
    whatToDo: 'التسجيل مجاني — يعطيك شارة "متجر موثّق" ترفع التحويل.',
  },
  gov_MISA: {
    term: 'MISA',
    termAr: 'وزارة الاستثمار',
    simpleExplanation:
      'لو في شريك أجنبي في شركتك، تحتاج ترخيص استثمار من MISA قبل ما تطلع السجل التجاري.',
    whenRequired: 'مطلوب لأي حصة ملكية أجنبية (حتى لو 1%).',
  },
  gov_CITC: {
    term: 'CITC',
    termAr: 'هيئة الاتصالات وتقنية المعلومات',
    simpleExplanation:
      'تشرف على قطاع الاتصالات والإنترنت ومنصات المحتوى. لو عندك تطبيق محتوى أو خدمة اتصالات لازم تتعامل معهم.',
    whenRequired: 'مطلوبة لو نشاطك في الاتصالات، البث، البودكاست المنظّم، أو الخدمات السحابية.',
  },
  gov_MONSHAAT: {
    term: "Monsha'at",
    termAr: 'منشآت — الهيئة العامة للمنشآت الصغيرة والمتوسطة',
    simpleExplanation: 'تدعم رواد الأعمال والشركات الصغيرة والمتوسطة بتمويل، تدريب، وحاضنات أعمال.',
    whatToDo: 'سجّل شركتك معهم لتاهلها للبرامج والمنح — مجاني.',
  },
  gov_FASAH: {
    term: 'FASAH',
    termAr: 'منصة فسح للتخليص الجمركي',
    simpleExplanation: 'بوابة الجمارك الإلكترونية لكل عمليات الاستيراد والتصدير.',
    whatToDo: 'تحتاج حساب فسح + توكيل لمخلّص جمركي قبل أول شحنة.',
  },
  gov_SABER: {
    term: 'Saber',
    termAr: 'منصة سابر',
    simpleExplanation:
      'منصة الهيئة السعودية للمواصفات والمقاييس — تتأكد إن كل منتج مستورد مطابق للمواصفات.',
    whenRequired: 'مطلوبة لأي شحنة منتجات قبل ما توصل المنفذ — وإلا ترجع.',
  },
  gov_NCA: {
    term: 'NCA',
    termAr: 'الهيئة الوطنية للأمن السيبراني',
    simpleExplanation:
      'الجهة المنظّمة للأمن السيبراني في المملكة — تصدر ضوابط ECC وتراقب الالتزام.',
    whenRequired: 'مطلوبة لأي جهة حكومية أو شركة تتعامل معها كمورد رئيسي.',
  },
  gov_civil_defense: {
    term: 'Civil Defense',
    termAr: 'الدفاع المدني (998)',
    simpleExplanation: 'يفحصون مكانك ويتأكدون من معايير السلامة (طفايات حريق، مخارج طوارئ، تهوية).',
    whatToDo:
      'في كثير من المناطق شهادة الدفاع المدني تجي قبل رخصة البلدية — تحقّق من التسلسل لحيّك.',
  },

  // ─── Tax & finance ──────────────────────────────────────────────────────
  tax_VAT: {
    term: 'VAT',
    termAr: 'ضريبة القيمة المضافة',
    simpleExplanation:
      '15% تضيفها على فواتيرك للعميل وتورّدها لـ ZATCA. إلزامية لو إيراداتك السنوية تجاوزت 375 ألف ريال.',
    example: 'لو بعت بـ 100 ريال — تحصّل 115 من العميل وتورّد 15 لـ ZATCA.',
  },
  tax_withholding: {
    term: 'Withholding Tax',
    termAr: 'الاستقطاع الضريبي',
    simpleExplanation:
      'لما تدفع لشخص أو شركة برا السعودية، لازم تستقطع نسبة معيّنة من المبلغ وتورّدها لـ ZATCA.',
    example: 'تدفع لـ AWS الأمريكية 10,000$ مقابل خدمات؟ تستقطع 5% (500$) وتدفعها لـ ZATCA.',
  },
  tax_zakat: {
    term: 'Zakat',
    termAr: 'الزكاة',
    simpleExplanation:
      'تطبّق على حصص الملاك السعوديين والخليجيين بنسبة 2.5% من وعاء الزكاة سنوياً.',
    example: 'لو شركتك سعودية 100% — كل شي زكاة، ما في ضريبة دخل.',
  },
  tax_corporate: {
    term: 'Corporate Income Tax',
    termAr: 'ضريبة الدخل على الشركات',
    simpleExplanation:
      'تطبّق على حصص الملاك الأجانب فقط بنسبة 20% من الأرباح الصافية. الحصص السعودية تحت الزكاة لا الضريبة.',
    whenRequired: 'مطلوبة لو في شريك أجنبي بأي نسبة ملكية.',
  },
  tax_excise: {
    term: 'Excise Tax',
    termAr: 'الضريبة الانتقائية',
    simpleExplanation:
      'ضريبة على منتجات معيّنة (تبغ 100%، مشروبات طاقة 100%، مشروبات غازية 50%، مشروبات محلّاة 50%).',
    whenRequired: 'مطلوبة لو تستورد أو تنتج أو تخزّن هذي المنتجات.',
  },
  tax_RETT: {
    term: 'RETT',
    termAr: 'ضريبة التصرفات العقارية',
    simpleExplanation: '5% على بيع أو نقل ملكية العقارات. يدفعها البائع.',
    example: 'بيع عقار بـ مليون؟ ZATCA تأخذ 50 ألف.',
  },
  tax_einvoice_phase1: {
    term: 'E-Invoicing Phase 1',
    termAr: 'الفوترة الإلكترونية - المرحلة الأولى',
    simpleExplanation: 'إصدار الفواتير إلكترونياً (PDF/A-3 + XML) مع QR Code للفواتير B2C.',
    whenRequired: 'إلزامية منذ ديسمبر 2021 لكل المسجّلين في VAT.',
  },
  tax_einvoice_phase2: {
    term: 'E-Invoicing Phase 2',
    termAr: 'الفوترة الإلكترونية - المرحلة الثانية',
    simpleExplanation:
      'الربط المباشر مع منصة فاتورة عبر API: B2B قبل التسليم (Clearance)، B2C خلال 24 ساعة (Reporting).',
    whatToDo: 'تطوير تقني فعلي في POS أو نظام فوترتك + شهادة CSID + ختم رقمي. ليس مجرد تسجيل.',
  },
  tax_fatoora: {
    term: 'Fatoora',
    termAr: 'منصة فاتورة',
    simpleExplanation: 'بوابة ZATCA الإلكترونية لاستقبال الفواتير في المرحلة الثانية.',
  },
  tax_CSID: {
    term: 'CSID',
    termAr: 'شهادة الختم الرقمي للجهاز',
    simpleExplanation:
      'كل جهاز يصدر فواتير في المرحلة الثانية لازم له شهادة Cryptographic Stamp ID فريدة.',
    whatToDo: 'تطلبها من ZATCA إلكترونياً قبل الإطلاق.',
  },
  tax_QR_invoice: {
    term: 'QR Code on Invoice',
    termAr: 'رمز QR على الفاتورة',
    simpleExplanation:
      'مربع باركود يحوي معلومات البائع والفاتورة — إلزامي على كل فاتورة B2C في المرحلة الأولى.',
  },
  tax_fiscal_year: {
    term: 'Fiscal Year',
    termAr: 'السنة المالية',
    simpleExplanation: 'فترة 12 شهر تحسب فيها أرباحك وتقدّم إقراراتك. عادة من يناير إلى ديسمبر.',
    whatToDo: 'تقدّم إقرار الزكاة خلال 120 يوم من نهاية السنة المالية.',
  },
  tax_input_tax: {
    term: 'Input VAT',
    termAr: 'ضريبة المدخلات',
    simpleExplanation:
      'الـ VAT اللي دفعتها للموردين على مشترياتك. تخصمها من الـ VAT اللي تحصّلها من عملائك.',
  },
  tax_output_tax: {
    term: 'Output VAT',
    termAr: 'ضريبة المخرجات',
    simpleExplanation: 'الـ VAT اللي تحصّلها من عملائك على مبيعاتك.',
    example: 'مخرجات 10,000 - مدخلات 6,000 = 4,000 تورّدها لـ ZATCA.',
  },

  // ─── Business entity types ──────────────────────────────────────────────
  entity_LLC: {
    term: 'LLC',
    termAr: 'شركة ذات مسؤولية محدودة (ذ.م.م)',
    simpleExplanation:
      'الشكل الأشهر للشركات. الشركاء مسؤوليتهم محدودة بحصصهم — لو فلست الشركة ما يمسّ أملاكهم الشخصية.',
    whenRequired: 'مناسبة من شريكين فأكثر، أو شريك واحد + رأس مال أكبر.',
  },
  entity_sole_prop: {
    term: 'Sole Proprietorship',
    termAr: 'مؤسسة فردية',
    simpleExplanation:
      'شركة شخص واحد بدون فصل قانوني بين أملاك المالك وأملاك المنشأة. أرخص وأبسط لكن أعلى مخاطر.',
    whenRequired: 'مناسبة لمشاريع صغيرة برأس مال محدود.',
  },
  entity_single_person: {
    term: 'Single-Person LLC',
    termAr: 'شركة شخص واحد (ذ.م.م)',
    simpleExplanation:
      'مزايا الـ LLC (مسؤولية محدودة) لكن بمالك واحد. تحمي أملاكه الشخصية من ديون الشركة.',
    whatToDo: 'مفضّلة على المؤسسة الفردية إذا كنت توقّع عقود كبيرة أو تستهدف نمو سريع.',
  },
  entity_joint_stock: {
    term: 'Joint-Stock Company',
    termAr: 'شركة مساهمة',
    simpleExplanation:
      'شركة كبيرة برأس مال موزّع على أسهم. مناسبة للشركات الكبيرة أو التي تبي تطرح في تداول.',
    whenRequired: 'رأس مال أدنى 500 ألف للمساهمة المقفلة، 30 مليون للمدرجة.',
  },
  entity_holding: {
    term: 'Holding Company',
    termAr: 'شركة قابضة',
    simpleExplanation:
      'شركة تملك شركات أخرى (تابعة). تستخدم للهيكلة الضريبية وتنويع الأنشطة وفصل المخاطر.',
  },
  entity_foreign_branch: {
    term: 'Foreign Branch',
    termAr: 'فرع شركة أجنبية',
    simpleExplanation: 'بدلاً من تأسيس شركة سعودية جديدة، تسجّل فرعاً للشركة الأم الأجنبية.',
    whatToDo: 'يحتاج ترخيص MISA + شهادة من بلد المنشأ.',
  },
  entity_free_zone: {
    term: 'Free Zone Company',
    termAr: 'شركة في منطقة حرة',
    simpleExplanation:
      'شركات مسجّلة في مناطق اقتصادية خاصة (مثل ICONIC، ICZ) بحوافز ضريبية لكن بقيود على السوق المحلي.',
    whenRequired: 'مناسبة للتصدير، اللوجستيات، أو الـ R&D.',
  },
  entity_mixed_ownership: {
    term: 'Mixed Ownership',
    termAr: 'ملكية مختلطة',
    simpleExplanation:
      'شركة فيها شركاء سعوديون/خليجيون + شركاء أجانب — تخضع للزكاة جزئياً والضريبة جزئياً.',
    whatToDo: 'احسب نسبة كل طرف بدقة عشان تعرف نسبة الزكاة مقابل الضريبة.',
  },

  // ─── Licensing & permits ────────────────────────────────────────────────
  license_CR: {
    term: 'CR',
    termAr: 'السجل التجاري',
    simpleExplanation: 'الوثيقة الرسمية اللي تثبت إن شركتك مسجّلة قانونياً في المملكة.',
    analogy: 'مثل شهادة الميلاد للشركة.',
    whatToDo: 'يتجدد سنوياً — تجاهله غرامة وتجميد للحساب.',
  },
  license_balady: {
    term: 'Balady License',
    termAr: 'رخصة بلدية',
    simpleExplanation: 'الرخصة اللي تسمح لك تشغّل محلك في موقع معيّن. بدونها ما تقدر تفتح للزبائن.',
    whatToDo: 'تأكّد من balady.gov.sa إن نشاطك يتطابق مع زنّينة الموقع قبل أي إيجار.',
  },
  license_civil_defense_cert: {
    term: 'Civil Defense Certificate',
    termAr: 'شهادة السلامة',
    simpleExplanation:
      'شهادة من الدفاع المدني تثبت إن مكانك يستوفي معايير السلامة (طفايات، مخارج، تهوية).',
    whenRequired: 'مطلوبة قبل رخصة البلدية في معظم المناطق.',
  },
  license_health_license: {
    term: 'Health License',
    termAr: 'الترخيص الصحي',
    simpleExplanation:
      'ترخيص من وزارة الصحة للأنشطة اللي تلمس صحة الناس (عيادات، صالونات، صيدليات).',
  },
  license_contractor_classification: {
    term: 'Contractor Classification',
    termAr: 'شهادة تصنيف المقاولين',
    simpleExplanation:
      'شهادة من وكالة التصنيف تحدد فئة شركة المقاولات والحدود المالية للمشاريع اللي تقدر تنافس عليها.',
    whenRequired: 'إلزامية للتنافس على المشاريع الحكومية الكبيرة.',
  },
  license_activity_code: {
    term: 'Business Activity Code',
    termAr: 'رمز النشاط التجاري (ISIC)',
    simpleExplanation: 'رمز رقمي يحدد طبيعة نشاطك الرسمي. كل ترخيص ورخصة وحساب مرتبط بأرقام نشاطك.',
    whatToDo: 'اختر النشاط بدقة — التغيير لاحقاً يحتاج تعديل سجل وقد يفتح متطلبات جديدة.',
  },
  license_misa_investment: {
    term: 'MISA Investment License',
    termAr: 'ترخيص الاستثمار من MISA',
    simpleExplanation: 'ترخيص لازم لأي شراكة أجنبية في شركة سعودية — يجي قبل السجل التجاري.',
    whenRequired: 'لأي حصة ملكية أجنبية ولو 1%.',
  },
  license_food: {
    term: 'Food Establishment License',
    termAr: 'ترخيص المنشأة الغذائية (SFDA)',
    simpleExplanation: 'ترخيص خاص لكل منشأة تتعامل مع الغذاء — مطعم، كوفي، مصنع، مستودع.',
    whatToDo: 'يحتاج فحص ميداني للمنشأة وفحص دوري متابعة.',
  },

  // ─── Cybersecurity ──────────────────────────────────────────────────────
  sec_HTTPS: {
    term: 'HTTPS',
    termAr: 'HTTPS — البروتوكول الآمن',
    simpleExplanation:
      'موقعك يبدأ بـ https:// مو http:// — معناه إن البيانات بين موقعك ومتصفح الزائر مشفّرة.',
    analogy: 'بدون HTTPS مثل ما ترسل خطاب مكشوف؛ مع HTTPS مثل ظرف مغلّق.',
  },
  sec_TLS: {
    term: 'TLS',
    termAr: 'TLS — Transport Layer Security',
    simpleExplanation:
      'البروتوكول التشفيري اللي يستخدمه HTTPS. الإصدارات الحالية: TLS 1.2 و TLS 1.3.',
    whatToDo: 'لا تستخدم TLS 1.0 أو 1.1 — مهجورة وغير آمنة.',
  },
  sec_MFA: {
    term: 'MFA',
    termAr: 'التحقق متعدد العوامل',
    simpleExplanation:
      'بدل ما تسجّل الدخول بكلمة المرور بس، تطلب رمز إضافي (من تطبيق أو رسالة) — يصعّب اختراق الحساب.',
    analogy: 'مثل الباب اللي يحتاج مفتاح + بصمة — لو فقدت أحدهم لسه ما تنفتح.',
    whatToDo: 'فعّلها على كل حسابات الإدارة (Admin, GitHub, Cloud) — هذي قاعدة وليست ميزة.',
  },
  sec_SSO: {
    term: 'SSO',
    termAr: 'الدخول الموحّد',
    simpleExplanation:
      'تسجيل دخول واحد يعطي وصول لعدة تطبيقات. مثلاً Google SSO يدخّلك على Gmail و Drive و Calendar.',
    whenRequired: 'مفيد للمؤسسات الكبيرة لتقليل كلمات المرور المتفرّقة.',
  },
  sec_VPN: {
    term: 'VPN',
    termAr: 'الشبكة الافتراضية الخاصة',
    simpleExplanation: 'نفق مشفّر بين جهازك والشبكة — يستخدم للوصول الآمن للأنظمة من خارج المكتب.',
    whatToDo: 'كل وصول عن بُعد لأنظمة العمل لازم يمر عبر VPN + MFA — قاعدة NCA-ECC.',
  },
  sec_IDS: {
    term: 'IDS',
    termAr: 'نظام كشف التسلل',
    simpleExplanation: 'يراقب الشبكة ويبلّغ لو لاحظ نشاط مشبوه — لكن لا يوقفه.',
  },
  sec_IPS: {
    term: 'IPS',
    termAr: 'نظام منع التسلل',
    simpleExplanation: 'مثل IDS لكن يقدر يوقف الهجوم لحظياً قبل ما يصل لأنظمتك.',
  },
  sec_SOC: {
    term: 'SOC',
    termAr: 'مركز عمليات الأمن السيبراني',
    simpleExplanation: 'فريق أو خدمة تراقب أنظمتك على مدار الساعة وتستجيب للحوادث الأمنية.',
    whenRequired: 'مطلوبة للشركات الكبيرة والقطاع الحيوي.',
  },
  sec_SIEM: {
    term: 'SIEM',
    termAr: 'إدارة معلومات وأحداث الأمان',
    simpleExplanation:
      'نظام يجمع سجلات الأمان من كل أنظمتك في مكان واحد ويحلّلها لاكتشاف الأنماط الخطرة.',
  },
  sec_CSIRT: {
    term: 'CSIRT',
    termAr: 'فريق الاستجابة لحوادث الأمن السيبراني',
    simpleExplanation:
      'الفريق المسؤول عن التعامل مع الاختراقات والحوادث — يحدد الأدوار والإجراءات.',
    whatToDo: 'NCA-ECC تشترط تشكيله رسمياً مع مسارات تواصل موثّقة.',
  },
  sec_vulnerability_scan: {
    term: 'Vulnerability Scanning',
    termAr: 'فحص الثغرات',
    simpleExplanation: 'فحص دوري آلي لاكتشاف نقاط الضعف في أنظمتك قبل ما يكتشفها المهاجمون.',
    whatToDo: 'شهري على الأقل — معالجة الحرجة خلال 14 يوم.',
  },
  sec_zero_trust: {
    term: 'Zero Trust',
    termAr: 'انعدام الثقة',
    simpleExplanation:
      'مبدأ "لا تثق بأحد، تحقّق من كل شي" — حتى المستخدمون والأجهزة داخل الشبكة يتم التحقق منهم باستمرار.',
    analogy: 'بدل ما تحط حارس عند البوابة بس، تحط حراسة على كل غرفة.',
  },
  sec_hashing: {
    term: 'Hashing',
    termAr: 'التجزئة',
    simpleExplanation:
      'تحويل البيانات (مثل كلمة المرور) لقيمة ثابتة الطول لا يمكن عكسها. تستخدم لتخزين كلمات المرور بأمان.',
    whatToDo: 'استخدم خوارزميات قوية (bcrypt, Argon2) — لا MD5 ولا SHA-1.',
  },
  sec_SAST: {
    term: 'SAST',
    termAr: 'فحص الكود الساكن',
    simpleExplanation:
      'فحص آلي لكود البرنامج (قبل التشغيل) لاكتشاف الثغرات. مدمج عادة في خط CI/CD.',
  },
  sec_DAST: {
    term: 'DAST',
    termAr: 'فحص التطبيق الديناميكي',
    simpleExplanation: 'فحص التطبيق وهو يشتغل (لا الكود) — يحاكي هجمات حقيقية لاكتشاف الثغرات.',
  },
  sec_penetration_test: {
    term: 'Penetration Testing',
    termAr: 'اختبار الاختراق',
    simpleExplanation:
      'مهاجم أخلاقي محترف يحاول يخترق أنظمتك بأذن منك ويسلّمك تقرير بالثغرات — اختبار حقيقي.',
    whenRequired: 'سنوياً على الأقل للشركات الحساسة.',
  },
  sec_HSM: {
    term: 'HSM',
    termAr: 'وحدة أمان الأجهزة',
    simpleExplanation:
      'جهاز مادي مخصّص لتخزين المفاتيح التشفيرية بأعلى مستوى أمان — لا يمكن سحبها منه.',
    whenRequired: 'إلزامية للقطاع المصرفي والبنية التحتية الحيوية (FIPS 140-2 Level 3+).',
  },
  sec_phishing: {
    term: 'Phishing',
    termAr: 'التصيّد الإلكتروني',
    simpleExplanation:
      'محاولة خداع موظفينك أو عملائك للنقر على روابط أو إعطاء كلمات مرور عبر إيميل أو رسائل مزوّرة.',
    whatToDo: 'NCA-ECC تشترط محاكاة دورية للتصيّد لقياس وعي الموظفين.',
  },
  sec_ransomware: {
    term: 'Ransomware',
    termAr: 'فدية إلكترونية',
    simpleExplanation:
      'برنامج خبيث يشفّر بياناتك ويطلب فدية لفك التشفير. أكبر تهديد سيبراني على الشركات.',
    whatToDo: 'النسخ الاحتياطي المنفصل + التدريب + تحديث النظام = 80% من الحماية.',
  },

  // ─── Data privacy ───────────────────────────────────────────────────────
  priv_data_subject: {
    term: 'Data Subject',
    termAr: 'صاحب البيانات',
    simpleExplanation:
      'الشخص اللي تخصّه البيانات — العميل، الموظف، الزائر. هو صاحب الحقوق في PDPL.',
  },
  priv_controller: {
    term: 'Data Controller',
    termAr: 'متحكّم البيانات',
    simpleExplanation:
      'الجهة اللي تقرّر ليش وكيف تجمع البيانات. عادةً هي شركتك إذا كنت تجمع بيانات عملائك مباشرة.',
    whatToDo: 'المتحكّم هو المسؤول الأساسي عن الالتزام بـ PDPL.',
  },
  priv_processor: {
    term: 'Data Processor',
    termAr: 'معالج البيانات',
    simpleExplanation:
      'جهة تعالج البيانات نيابةً عن المتحكّم — مثل مزود تخزين سحابي أو شركة تسويق تنفّذ حملات لك.',
    whenRequired: 'كل معالج لازم يربطه عقد مكتوب يحدد المسؤوليات (Data Processing Agreement).',
  },
  priv_joint_controller: {
    term: 'Joint Controller',
    termAr: 'متحكّم مشترك',
    simpleExplanation:
      'لما جهتان أو أكثر يقرّرون معاً أهداف ووسائل المعالجة — مسؤولية مشتركة عن الالتزام.',
  },
  priv_anonymization: {
    term: 'Anonymization',
    termAr: 'إخفاء الهوية',
    simpleExplanation:
      'إزالة كل ما يربط البيانات بالشخص بشكل لا يمكن عكسه. البيانات المُجهَّلة لا تخضع لـ PDPL.',
  },
  priv_pseudonymization: {
    term: 'Pseudonymization',
    termAr: 'الترميز / إبدال الهوية',
    simpleExplanation:
      'استبدال المعرّفات (الاسم، رقم الجوال) برموز يمكن ربطها لاحقاً بمفتاح منفصل. أقل صرامة من Anonymization.',
  },
  priv_lawful_basis: {
    term: 'Lawful Basis',
    termAr: 'الأساس النظامي للمعالجة',
    simpleExplanation:
      'السبب القانوني اللي يبرّر معالجة البيانات: موافقة، تنفيذ عقد، التزام نظامي، أو مصلحة مشروعة.',
    whatToDo: 'لازم تختار وتوثّق الأساس لكل غرض معالجة.',
  },
  priv_opt_in: {
    term: 'Opt-In',
    termAr: 'موافقة صريحة (إيجابية)',
    simpleExplanation: 'المستخدم يضغط مربع غير محدّد مسبقاً ليوافق. النموذج المطلوب في PDPL.',
  },
  priv_opt_out: {
    term: 'Opt-Out',
    termAr: 'الانسحاب من الموافقة',
    simpleExplanation:
      'المستخدم يكون موافقاً تلقائياً ويختار الانسحاب. غير مقبول في PDPL لجمع البيانات.',
  },
  priv_sensitive_data: {
    term: 'Sensitive Personal Data',
    termAr: 'بيانات شخصية حساسة',
    simpleExplanation:
      'بيانات صحية، دينية، جنائية، بيومترية، مالية. تحتاج موافقة صريحة أعلى من البيانات العادية.',
  },
  priv_profiling: {
    term: 'Profiling',
    termAr: 'تشكيل الملفات الشخصية',
    simpleExplanation:
      'تحليل البيانات لإنشاء توقّعات أو تقييمات للشخص (مثل تقييم ائتماني، استهداف إعلاني). يخضع لقواعد خاصة.',
  },
  priv_automated_decision: {
    term: 'Automated Decision-Making',
    termAr: 'اتخاذ قرار آلي',
    simpleExplanation:
      'قرار يؤثر على شخص بدون تدخل بشري (موافقة قرض، رفض طلب توظيف). يحتاج إفصاح + حق المراجعة البشرية.',
  },
  priv_DPIA: {
    term: 'DPIA',
    termAr: 'تقييم أثر حماية البيانات',
    simpleExplanation:
      'دراسة موثّقة قبل أي معالجة جديدة عالية المخاطر — تحدد التهديدات وتدابير التقليل.',
    whenRequired: 'إلزامية للمعالجة بكميات كبيرة أو استخدام تقنيات جديدة.',
  },
  priv_data_minimization: {
    term: 'Data Minimization',
    termAr: 'تقليل البيانات',
    simpleExplanation: 'مبدأ: اجمع فقط البيانات الضرورية للغرض المحدد — لا أكثر.',
    example: 'تطبيق توصيل ما يحتاج تاريخ ميلاد العميل — اجمع الجوال والعنوان فقط.',
  },
  priv_purpose_limitation: {
    term: 'Purpose Limitation',
    termAr: 'تحديد الغرض',
    simpleExplanation: 'البيانات المجمّعة لغرض معيّن لا تستخدم لغرض مختلف بدون موافقة جديدة.',
  },

  // ─── Intellectual property ──────────────────────────────────────────────
  ip_trademark: {
    term: 'Trademark',
    termAr: 'العلامة التجارية',
    simpleExplanation: 'الاسم، الشعار، أو الرمز اللي يميّز منتجاتك أو خدماتك في السوق.',
    whatToDo: 'سجّل عند SAIP قبل الإطلاق العام — الحماية لـ 10 سنوات قابلة للتجديد.',
  },
  ip_copyright: {
    term: 'Copyright',
    termAr: 'حقوق المصنفات',
    simpleExplanation:
      'حماية المؤلفات الإبداعية: كود برمجي، نصوص، فيديوهات، صور. تنشأ تلقائياً مع الإنشاء، لكن التسجيل يقوّي حقّك في النزاع.',
  },
  ip_patent: {
    term: 'Patent',
    termAr: 'براءة اختراع',
    simpleExplanation:
      'حماية ابتكار تقني جديد لمدة 20 سنة. يحتاج إثبات الجِدّة والابتكار وقابلية التطبيق الصناعي.',
    whenRequired: 'مهمة جداً للشركات التقنية ذات التقنية الخاصة.',
  },
  ip_industrial_design: {
    term: 'Industrial Design',
    termAr: 'النموذج الصناعي',
    simpleExplanation: 'حماية الشكل الجمالي للمنتج (تصميم العبوة، الجهاز). لـ 10 سنوات.',
  },
  ip_trade_secret: {
    term: 'Trade Secret',
    termAr: 'الأسرار التجارية',
    simpleExplanation:
      'معلومات سرية تعطي ميزة تنافسية (وصفة، خوارزمية، قائمة عملاء). محمية بسرّيتها — لا تُسجَّل.',
    whatToDo: 'احمها بـ NDAs مع الموظفين والشركاء + ضوابط أمنية على الوصول.',
  },

  // ─── Customs & logistics ────────────────────────────────────────────────
  customs_HS_code: {
    term: 'HS Code',
    termAr: 'رمز التعرفة الجمركية',
    simpleExplanation:
      'رمز دولي من 8 أرقام يحدد نوع المنتج لأغراض الجمارك. كل سلعة لها رمز يحدد رسومها.',
    whatToDo: 'اطلب من مخلّصك الجمركي تأكيد الرمز قبل أول شحنة — التصنيف الخاطئ يعني غرامات.',
  },
  customs_CoC: {
    term: 'CoC',
    termAr: 'شهادة المطابقة',
    simpleExplanation:
      'شهادة Saber تثبت إن المنتج المستورد مطابق للمواصفات السعودية. بدونها الشحنة ترجع.',
  },
  customs_GS1: {
    term: 'GS1 Barcode',
    termAr: 'باركود GS1',
    simpleExplanation:
      'الرمز الشريطي العالمي للمنتجات. مطلوب للتسجيل في Saber وعرض المنتجات في المتاجر.',
  },
  customs_LC: {
    term: 'Letter of Credit',
    termAr: 'الاعتماد المستندي',
    simpleExplanation:
      'وثيقة مصرفية تضمن دفع المستورد للمصدّر عند تسليم المستندات. تستخدم في التجارة الدولية لتقليل المخاطر.',
  },
  customs_bonded_warehouse: {
    term: 'Bonded Warehouse',
    termAr: 'المستودع الجمركي',
    simpleExplanation:
      'مستودع تخزّن فيه البضائع المستوردة بدون دفع جمارك حتى تخرج للسوق المحلي أو إعادة التصدير.',
  },
  customs_FOB: {
    term: 'FOB',
    termAr: 'تسليم على ظهر السفينة',
    simpleExplanation:
      'مصطلح Incoterm يعني المصدّر يسلّم البضاعة في ميناء التصدير، والمستورد يتحمّل الشحن والتأمين بعدها.',
  },
  customs_CIF: {
    term: 'CIF',
    termAr: 'التكلفة والتأمين والشحن',
    simpleExplanation:
      'مصطلح Incoterm يعني سعر البضاعة + التأمين + الشحن لميناء الوصول. المستورد يتحمّل بعد الميناء فقط.',
  },
  customs_port_code: {
    term: 'Port Code',
    termAr: 'رمز المنفذ',
    simpleExplanation: 'رمز فريد لكل منفذ جمركي (ميناء، مطار، حدود برية) — يستخدم في FASAH.',
  },

  // ─── Employment ─────────────────────────────────────────────────────────
  emp_nitaqat: {
    term: 'Nitaqat',
    termAr: 'نطاقات',
    simpleExplanation:
      'نظام يصنّف المنشآت حسب نسبة السعوديين. الفئات: بلاتيني، أخضر، أصفر، أحمر — كل فئة لها امتيازات أو قيود.',
  },
  emp_qiwa: {
    term: 'Qiwa',
    termAr: 'منصة قوى',
    simpleExplanation:
      'منصة وزارة الموارد البشرية لإدارة العقود، التحويل، الإجازات، وإصدار التأشيرات.',
  },
  emp_mudad: {
    term: 'Mudad',
    termAr: 'منصة مدد',
    simpleExplanation:
      'منصة لحماية الأجور — تتأكد إن الشركات تحوّل رواتب موظفيها إلكترونياً في الوقت المحدد.',
    whenRequired: 'إلزامية لكل المنشآت الخاصة بحجم معيّن.',
  },
  emp_saudization: {
    term: 'Saudization',
    termAr: 'السعودة',
    simpleExplanation:
      'سياسة توظيف نسبة معيّنة من السعوديين في كل قطاع. النسبة تختلف حسب النشاط والحجم.',
  },
  emp_end_of_service: {
    term: 'End of Service Award',
    termAr: 'مكافأة نهاية الخدمة',
    simpleExplanation:
      'مبلغ يستحقه العامل عند انتهاء عقده. عادة نصف راتب لكل سنة في أول 5 سنوات + راتب كامل لكل سنة بعدها.',
  },
  emp_work_visa: {
    term: 'Work Visa',
    termAr: 'تأشيرة العمل',
    simpleExplanation: 'إذن استقدام عامل أجنبي. تطلب من قوى مع توفّر النطاق المناسب.',
  },
  emp_iqama: {
    term: 'Iqama',
    termAr: 'الإقامة',
    simpleExplanation:
      'وثيقة هوية المقيمين الأجانب في المملكة. صالحة سنة وتجدد. مرتبطة بصاحب العمل.',
  },
  emp_GOSI_subscription: {
    term: 'GOSI Subscription',
    termAr: 'اشتراك التأمينات الاجتماعية',
    simpleExplanation:
      'الاشتراك الشهري لكل موظف. للسعوديين 21.5% (شركة + موظف)، للأجانب 2% فروقات مهنية فقط.',
  },

  // ─── Compliance & audit ─────────────────────────────────────────────────
  audit_KYC: {
    term: 'KYC',
    termAr: 'اعرف عميلك',
    simpleExplanation:
      'إجراءات التحقق من هوية العميل قبل تقديم الخدمة. إلزامية في القطاع المالي وخدمات الدفع.',
  },
  audit_AML: {
    term: 'AML',
    termAr: 'مكافحة غسل الأموال',
    simpleExplanation: 'إجراءات لكشف ومنع التحويلات المالية المشبوهة. إلزامية في القطاع المالي.',
  },
  audit_due_diligence: {
    term: 'Due Diligence',
    termAr: 'العناية الواجبة',
    simpleExplanation:
      'فحص شامل لجهة قبل التعاقد معها — ماليتها، التزامها، سجلها — لتقليل المخاطر.',
  },
  audit_ISO_27001: {
    term: 'ISO 27001',
    termAr: 'معيار آيزو 27001',
    simpleExplanation:
      'معيار دولي لإدارة أمن المعلومات. الشهادة فيه تثبت إن شركتك تطبّق أفضل الممارسات.',
    whatToDo:
      'الشهادة تستغرق 6-12 شهر + 50-150 ألف ريال — لكنها تفتح أبواب التعاقد مع الجهات الكبرى.',
  },
  audit_SOC_2: {
    term: 'SOC 2',
    termAr: 'تقرير SOC 2',
    simpleExplanation:
      'معيار أمريكي لتقييم ضوابط الأمن في شركات SaaS. مهم للشركات اللي تبيع لشركات أمريكية.',
  },
  audit_GDPR_compare: {
    term: 'GDPR (compared to PDPL)',
    termAr: 'GDPR (مقارنة بـ PDPL)',
    simpleExplanation:
      'نظام حماية البيانات الأوروبي. PDPL مستوحى منه لكن أبسط وفيه فروقات — مثل حقوق أصحاب البيانات (5 في PDPL مقابل 8 في GDPR).',
  },
  audit_internal_audit: {
    term: 'Internal Audit',
    termAr: 'التدقيق الداخلي',
    simpleExplanation: 'مراجعة دورية من فريق داخلي مستقل للتأكد من الالتزام بالسياسات والضوابط.',
  },
  audit_external_audit: {
    term: 'External Audit',
    termAr: 'التدقيق الخارجي',
    simpleExplanation:
      'مراجعة من جهة خارجية مستقلة (مثل PwC, EY, KPMG, Deloitte) — ضرورية للشهادات الدولية.',
  },
  audit_compliance_program: {
    term: 'Compliance Program',
    termAr: 'برنامج الالتزام',
    simpleExplanation:
      'مجموعة سياسات وإجراءات وأدوار للتأكد من التزام الشركة بالأنظمة. لازم يكون موثّقاً ومُحدَّثاً.',
  },
  audit_evidence: {
    term: 'Audit Evidence',
    termAr: 'دليل التدقيق',
    simpleExplanation:
      'الوثائق والسجلات اللي تثبت تطبيق ضوابط معيّنة. بدونها التدقيق فاشل حتى لو الضابط مطبّق فعلاً.',
  },

  // ─── Tech infrastructure ────────────────────────────────────────────────
  tech_API: {
    term: 'API',
    termAr: 'واجهة برمجة التطبيقات',
    simpleExplanation:
      'طريقة تسمح للبرامج تتكلم مع بعض. مثلاً تطبيقك يستخدم API من ZATCA لإرسال الفواتير.',
  },
  tech_cloud: {
    term: 'Cloud Computing',
    termAr: 'الحوسبة السحابية',
    simpleExplanation:
      'استخدام أنظمة مزود خارجي (AWS, Azure, Google) بدل امتلاك سيرفرات. مرنة وسريعة الإعداد.',
  },
  tech_IaaS: {
    term: 'IaaS',
    termAr: 'البنية التحتية كخدمة',
    simpleExplanation:
      'أبسط نوع سحابة — تأجّر سيرفرات افتراضية وأنت تثبّت وتدير كل شي عليها (AWS EC2 مثلاً).',
  },
  tech_SaaS: {
    term: 'SaaS',
    termAr: 'البرمجيات كخدمة',
    simpleExplanation:
      'تستخدم برنامج جاهز عبر الويب بدون تثبيت (Gmail, Salesforce, Microsoft 365). أعلى مستوى تجريد.',
  },
  tech_PaaS: {
    term: 'PaaS',
    termAr: 'المنصة كخدمة',
    simpleExplanation: 'مزود يدير لك السيرفر والـ runtime، أنت ترفع تطبيقك فقط (Vercel, Heroku).',
  },
  tech_on_premises: {
    term: 'On-Premises',
    termAr: 'في الموقع (محلي)',
    simpleExplanation:
      'سيرفرات في مكتبك أو مركز بياناتك — تتحكم فيها كاملاً لكن تتحمّل كل التكاليف.',
  },
  tech_hybrid_cloud: {
    term: 'Hybrid Cloud',
    termAr: 'سحابة هجينة',
    simpleExplanation:
      'مزيج بين on-premises والسحابة العامة — البيانات الحساسة محلياً والباقي سحابياً.',
  },
  tech_microservices: {
    term: 'Microservices',
    termAr: 'الخدمات المصغّرة',
    simpleExplanation:
      'بناء تطبيقك كمجموعة خدمات صغيرة مستقلة بدل تطبيق ضخم واحد. أسرع للتطوير لكن أصعب للإدارة.',
  },

  // ─── Risk & governance ──────────────────────────────────────────────────
  risk_appetite: {
    term: 'Risk Appetite',
    termAr: 'قابلية المخاطرة',
    simpleExplanation: 'مستوى المخاطر اللي شركتك مستعدة تقبلها لتحقيق أهدافها.',
  },
  risk_treatment: {
    term: 'Risk Treatment',
    termAr: 'علاج المخاطر',
    simpleExplanation:
      'الخيارات للتعامل مع مخاطرة: قبولها، تجنبها (لا تفعلها)، تقليلها (ضوابط)، أو نقلها (تأمين).',
  },
  risk_RACI: {
    term: 'RACI',
    termAr: 'مصفوفة المسؤوليات',
    simpleExplanation:
      'تحدد لكل مهمة: من يُنفّذ (Responsible)، من يُحاسَب (Accountable)، من يُستشار (Consulted)، من يُبلَّغ (Informed).',
  },
  risk_RTO: {
    term: 'RTO',
    termAr: 'هدف وقت الاسترجاع',
    simpleExplanation:
      'الحد الأقصى للوقت اللي تقدر تستحمّله الشركة بدون خدمة. مثلاً RTO = 4 ساعات يعني لازم ترجع خلال 4 ساعات أو خسارة كبيرة.',
  },
  risk_RPO: {
    term: 'RPO',
    termAr: 'هدف نقطة الاسترجاع',
    simpleExplanation:
      'الحد الأقصى لخسارة البيانات المسموح بها. RPO = ساعة يعني لو فقدت بيانات آخر ساعة مقبول، أكثر من ذلك لا.',
  },
  risk_BIA: {
    term: 'BIA',
    termAr: 'تحليل تأثير الأعمال',
    simpleExplanation: 'دراسة تحدد أهم العمليات في شركتك وتأثير توقفها — أساس خطط الاستمرارية.',
  },
  risk_DRP: {
    term: 'DRP',
    termAr: 'خطة التعافي من الكوارث',
    simpleExplanation: 'خطة موثّقة لاسترجاع أنظمتك بعد كارثة (حريق، فيضان، اختراق كبير).',
  },
  risk_BCP: {
    term: 'BCP',
    termAr: 'خطة استمرارية الأعمال',
    simpleExplanation:
      'خطة شاملة لاستمرار أعمال الشركة في مواجهة الأزمات — أوسع من DRP اللي يركز على التقنية فقط.',
  },
  risk_change_management: {
    term: 'Change Management',
    termAr: 'إدارة التغييرات',
    simpleExplanation:
      'عملية موثّقة لاعتماد ومتابعة كل تغيير على الأنظمة — مع خطة تراجع لو التغيير سبّب مشكلة.',
  },
  risk_incident_response: {
    term: 'Incident Response',
    termAr: 'الاستجابة للحوادث',
    simpleExplanation:
      'خطة وإجراءات للتعامل مع الحوادث الأمنية: اكتشاف، احتواء، استئصال، استرجاع، دروس مستفادة.',
  },

  // ─── Banking & payments ─────────────────────────────────────────────────
  bank_IBAN: {
    term: 'IBAN',
    termAr: 'رقم الحساب المصرفي الدولي',
    simpleExplanation: 'رقم موحّد دولياً للحساب البنكي. السعودية يبدأ بـ SA + 22 رقم.',
  },
  bank_SWIFT: {
    term: 'SWIFT Code',
    termAr: 'رمز السويفت',
    simpleExplanation: 'رمز دولي يحدد البنك في التحويلات الخارجية.',
  },
  bank_payment_gateway: {
    term: 'Payment Gateway',
    termAr: 'بوابة الدفع',
    simpleExplanation: 'الجسر بين موقعك والبنوك يعالج المدفوعات (HyperPay, Tap, Moyasar, PayTabs).',
    whatToDo: 'كل بوابة لها رسوم وميزات مختلفة — قارن قبل الاختيار.',
  },
  bank_settlement: {
    term: 'Settlement',
    termAr: 'التسوية',
    simpleExplanation: 'تحويل المبالغ المحصّلة من بوابة الدفع لحسابك البنكي. عادة 1-3 أيام عمل.',
  },
  bank_chargeback: {
    term: 'Chargeback',
    termAr: 'استرداد العملية',
    simpleExplanation:
      'عميل يرجع عملية شرائه عبر بنكه. لو زادت نسبتك يعاقبك مزود الدفع أو يعلّق حسابك.',
  },

  // ─── Privacy & users (extra) ────────────────────────────────────────────
  priv_tracker: {
    term: 'Tracker',
    termAr: 'أداة تتبع',
    simpleExplanation:
      'كود من طرف ثالث يجمع بيانات زوّار موقعك (Google Analytics, Facebook Pixel, Hotjar).',
    whatToDo: 'كل tracker لازم يُذكر في سياسة الخصوصية + موافقة قبل التشغيل في PDPL.',
  },
  priv_fingerprinting: {
    term: 'Fingerprinting',
    termAr: 'بصمة المتصفح',
    simpleExplanation:
      'تقنية تتبع متطوّرة تجمع خصائص جهاز الزائر (متصفح، خطوط، شاشة) لإنشاء معرّف فريد بدون كوكيز.',
    whatToDo: 'يخضع لنفس قواعد الكوكيز في PDPL — موافقة + إفصاح.',
  },
  priv_session: {
    term: 'Session',
    termAr: 'جلسة المستخدم',
    simpleExplanation:
      'فترة استخدام المستخدم لتطبيقك — من تسجيل الدخول حتى الخروج. تخزّن في كوكي session.',
  },
  priv_marketing_consent: {
    term: 'Marketing Consent',
    termAr: 'الموافقة على التسويق',
    simpleExplanation:
      'موافقة منفصلة وصريحة قبل إرسال إيميلات أو رسائل تسويقية. مع آلية إلغاء سهلة في كل رسالة.',
    whatToDo: 'لا تجمع موافقة التسجيل مع الموافقة التسويقية — لازمتين منفصلتين.',
  },
};
