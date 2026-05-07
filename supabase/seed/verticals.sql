-- درع Phase 1: Knowledge Base seed — Verticals
-- Inserts 5 verticals into knowledge_versions for later retrieval by the app.
-- Each payload contains the full Vertical + entity list, mirroring the app's runtime model.

-- TODO: Phase 6 will expand these stubs with deeper PDPL rules (35+), NCA-ECC (114 controls),
-- ZATCA Phase 2 integration details, and custom terms per vertical.

insert into public.knowledge_versions (namespace, version, payload, content_hash)
values
  (
    'verticals',
    1,
    jsonb_build_object(
      'id', 'restaurant',
      'labelAr', 'مطعم / كوفي شوب',
      'shipsInMvp', true,
      'entities', jsonb_build_array(
        jsonb_build_object(
          'id', 'mci',
          'nameAr', 'وزارة التجارة',
          'nameSimpleAr', 'السجل التجاري',
          'explainAr', 'أول خطوة لأي مشروع — تسجّل شركتك رسمياً.',
          'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1600),
          'estimatedTimeAr', 'يوم واحد (إلكتروني)',
          'order', 1,
          'dependencies', jsonb_build_array(),
          'renewalPeriodAr', 'سنوي',
          'officialUrl', 'https://mc.gov.sa'
        ),
        jsonb_build_object(
          'id', 'zatca',
          'nameAr', 'هيئة الزكاة والضريبة والجمارك',
          'nameSimpleAr', 'التسجيل الضريبي',
          'explainAr', 'تسجّل ضريبياً لإصدار فواتير رسمية.',
          'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0),
          'estimatedTimeAr', 'يوم واحد (إلكتروني)',
          'order', 2,
          'dependencies', jsonb_build_array('mci'),
          'officialUrl', 'https://zatca.gov.sa'
        ),
        jsonb_build_object(
          'id', 'mol',
          'nameAr', 'وزارة الموارد البشرية',
          'nameSimpleAr', 'ملف المنشأة + نطاقات',
          'explainAr', 'تفتح ملف لمنشأتك للتوظيف.',
          'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0),
          'estimatedTimeAr', 'يوم واحد (إلكتروني)',
          'order', 3,
          'dependencies', jsonb_build_array('mci'),
          'officialUrl', 'https://www.hrsd.gov.sa'
        ),
        jsonb_build_object(
          'id', 'gosi',
          'nameAr', 'المؤسسة العامة للتأمينات الاجتماعية',
          'nameSimpleAr', 'تسجيل التأمينات',
          'explainAr', 'تسجّل موظفينك في التأمينات.',
          'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0),
          'estimatedTimeAr', 'يوم واحد (إلكتروني)',
          'order', 4,
          'dependencies', jsonb_build_array('mol'),
          'renewalPeriodAr', 'اشتراك شهري',
          'officialUrl', 'https://www.gosi.gov.sa'
        ),
        jsonb_build_object(
          'id', 'civil_defense',
          'nameAr', 'الدفاع المدني',
          'nameSimpleAr', 'شهادة السلامة',
          'explainAr', 'فحص السلامة والحريق والمخارج.',
          'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1000),
          'estimatedTimeAr', '٣ إلى ١٤ يوم',
          'order', 5,
          'dependencies', jsonb_build_array('mci'),
          'renewalPeriodAr', 'سنوي',
          'officialUrl', 'https://www.998.gov.sa'
        ),
        jsonb_build_object(
          'id', 'municipality',
          'nameAr', 'أمانة المنطقة (بلدي)',
          'nameSimpleAr', 'رخصة البلدية',
          'explainAr', 'رخصة تشغيل المحل.',
          'estimatedCostSar', jsonb_build_object('min', 500, 'max', 3000),
          'estimatedTimeAr', '٣ إلى ٧ أيام',
          'order', 6,
          'dependencies', jsonb_build_array('civil_defense'),
          'renewalPeriodAr', 'سنوي',
          'officialUrl', 'https://balady.gov.sa'
        ),
        jsonb_build_object(
          'id', 'sfda',
          'nameAr', 'الهيئة العامة للغذاء والدواء',
          'nameSimpleAr', 'ترخيص الغذاء',
          'explainAr', 'ترخيص صحي لتقديم الغذاء والمشروبات.',
          'estimatedCostSar', jsonb_build_object('min', 1000, 'max', 3000),
          'estimatedTimeAr', '٧ إلى ١٤ يوم',
          'order', 7,
          'dependencies', jsonb_build_array('municipality'),
          'renewalPeriodAr', 'سنوي',
          'officialUrl', 'https://sfda.gov.sa'
        )
      )
    ),
    'v1-restaurant-20260507'
  ),
  (
    'verticals',
    1,
    jsonb_build_object(
      'id', 'tech',
      'labelAr', 'شركة تقنية / تطبيق',
      'shipsInMvp', true,
      'entities', jsonb_build_array(
        jsonb_build_object('id', 'mci', 'nameAr', 'وزارة التجارة', 'nameSimpleAr', 'السجل التجاري', 'explainAr', 'أول خطوة.', 'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1600), 'estimatedTimeAr', 'يوم واحد', 'order', 1, 'dependencies', jsonb_build_array(), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://mc.gov.sa'),
        jsonb_build_object('id', 'zatca', 'nameAr', 'هيئة الزكاة والضريبة والجمارك', 'nameSimpleAr', 'التسجيل الضريبي', 'explainAr', 'تسجيل ضريبي.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 2, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://zatca.gov.sa'),
        jsonb_build_object('id', 'mol', 'nameAr', 'وزارة الموارد البشرية', 'nameSimpleAr', 'ملف المنشأة', 'explainAr', 'ملف للموارد البشرية.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 3, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://www.hrsd.gov.sa'),
        jsonb_build_object('id', 'gosi', 'nameAr', 'المؤسسة العامة للتأمينات الاجتماعية', 'nameSimpleAr', 'التأمينات', 'explainAr', 'تسجيل التأمينات.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 4, 'dependencies', jsonb_build_array('mol'), 'renewalPeriodAr', 'اشتراك شهري', 'officialUrl', 'https://www.gosi.gov.sa'),
        jsonb_build_object('id', 'pdpl_readiness', 'nameAr', 'نظام حماية البيانات الشخصية', 'nameSimpleAr', 'جاهزية PDPL', 'explainAr', 'سياسة خصوصية ومسار موافقة.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'مستمر', 'order', 5, 'dependencies', jsonb_build_array('mci'), 'renewalPeriodAr', 'مستمر', 'officialUrl', 'https://sdaia.gov.sa'),
        jsonb_build_object('id', 'zatca_einvoice_onboarding', 'nameAr', 'الفوترة الإلكترونية', 'nameSimpleAr', 'ربط Fatoora', 'explainAr', 'ربط منصتك مع ZATCA.', 'estimatedCostSar', jsonb_build_object('min', 500, 'max', 3000), 'estimatedTimeAr', '٧ إلى ١٤ يوم', 'order', 6, 'dependencies', jsonb_build_array('zatca'), 'renewalPeriodAr', 'مستمر', 'officialUrl', 'https://zatca.gov.sa')
      )
    ),
    'v1-tech-20260507'
  ),
  (
    'verticals',
    1,
    jsonb_build_object(
      'id', 'salon',
      'labelAr', 'صالون / مركز تجميل',
      'shipsInMvp', true,
      'entities', jsonb_build_array(
        jsonb_build_object('id', 'mci', 'nameAr', 'وزارة التجارة', 'nameSimpleAr', 'السجل التجاري', 'explainAr', 'أول خطوة.', 'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1600), 'estimatedTimeAr', 'يوم واحد', 'order', 1, 'dependencies', jsonb_build_array(), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://mc.gov.sa'),
        jsonb_build_object('id', 'zatca', 'nameAr', 'هيئة الزكاة والضريبة والجمارك', 'nameSimpleAr', 'التسجيل الضريبي', 'explainAr', 'تسجيل ضريبي.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 2, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://zatca.gov.sa'),
        jsonb_build_object('id', 'mol', 'nameAr', 'وزارة الموارد البشرية', 'nameSimpleAr', 'ملف المنشأة', 'explainAr', 'ملف للموارد البشرية.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 3, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://www.hrsd.gov.sa'),
        jsonb_build_object('id', 'gosi', 'nameAr', 'المؤسسة العامة للتأمينات الاجتماعية', 'nameSimpleAr', 'التأمينات', 'explainAr', 'تسجيل التأمينات.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 4, 'dependencies', jsonb_build_array('mol'), 'renewalPeriodAr', 'اشتراك شهري', 'officialUrl', 'https://www.gosi.gov.sa'),
        jsonb_build_object('id', 'civil_defense_salon', 'nameAr', 'الدفاع المدني', 'nameSimpleAr', 'شهادة السلامة', 'explainAr', 'فحص السلامة.', 'estimatedCostSar', jsonb_build_object('min', 200, 'max', 800), 'estimatedTimeAr', '٣ إلى ١٤ يوم', 'order', 5, 'dependencies', jsonb_build_array('mci'), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://www.998.gov.sa'),
        jsonb_build_object('id', 'municipality_salon', 'nameAr', 'أمانة المنطقة', 'nameSimpleAr', 'رخصة البلدية', 'explainAr', 'رخصة تشغيل الصالون.', 'estimatedCostSar', jsonb_build_object('min', 500, 'max', 2000), 'estimatedTimeAr', '٣ إلى ٧ أيام', 'order', 6, 'dependencies', jsonb_build_array('civil_defense_salon'), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://balady.gov.sa'),
        jsonb_build_object('id', 'moh_salon_license', 'nameAr', 'وزارة الصحة', 'nameSimpleAr', 'الترخيص الصحي', 'explainAr', 'ترخيص صحي.', 'estimatedCostSar', jsonb_build_object('min', 500, 'max', 2000), 'estimatedTimeAr', '٧ إلى ١٤ يوم', 'order', 7, 'dependencies', jsonb_build_array('municipality_salon'), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://www.moh.gov.sa')
      )
    ),
    'v1-salon-20260507'
  ),
  (
    'verticals',
    1,
    jsonb_build_object(
      'id', 'construction',
      'labelAr', 'مقاولات / بناء',
      'shipsInMvp', true,
      'entities', jsonb_build_array(
        jsonb_build_object('id', 'mci', 'nameAr', 'وزارة التجارة', 'nameSimpleAr', 'السجل التجاري', 'explainAr', 'أول خطوة.', 'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1600), 'estimatedTimeAr', 'يوم واحد', 'order', 1, 'dependencies', jsonb_build_array(), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://mc.gov.sa'),
        jsonb_build_object('id', 'zatca', 'nameAr', 'هيئة الزكاة والضريبة والجمارك', 'nameSimpleAr', 'التسجيل الضريبي', 'explainAr', 'تسجيل ضريبي.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 2, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://zatca.gov.sa'),
        jsonb_build_object('id', 'mol', 'nameAr', 'وزارة الموارد البشرية', 'nameSimpleAr', 'ملف المنشأة', 'explainAr', 'ملف للموارد البشرية.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 3, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://www.hrsd.gov.sa'),
        jsonb_build_object('id', 'gosi', 'nameAr', 'المؤسسة العامة للتأمينات الاجتماعية', 'nameSimpleAr', 'التأمينات', 'explainAr', 'تسجيل التأمينات.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 4, 'dependencies', jsonb_build_array('mol'), 'renewalPeriodAr', 'اشتراك شهري', 'officialUrl', 'https://www.gosi.gov.sa'),
        jsonb_build_object('id', 'civil_defense_office', 'nameAr', 'الدفاع المدني', 'nameSimpleAr', 'شهادة سلامة المكتب', 'explainAr', 'فحص السلامة.', 'estimatedCostSar', jsonb_build_object('min', 150, 'max', 500), 'estimatedTimeAr', '٣ إلى ١٠ أيام', 'order', 5, 'dependencies', jsonb_build_array('mci'), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://www.998.gov.sa'),
        jsonb_build_object('id', 'municipality_office', 'nameAr', 'أمانة المنطقة', 'nameSimpleAr', 'رخصة مكتب مقاولات', 'explainAr', 'رخصة تشغيل المكتب.', 'estimatedCostSar', jsonb_build_object('min', 500, 'max', 2000), 'estimatedTimeAr', '٣ إلى ٧ أيام', 'order', 6, 'dependencies', jsonb_build_array('civil_defense_office'), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://balady.gov.sa'),
        jsonb_build_object('id', 'contractor_classification', 'nameAr', 'تصنيف المقاولين', 'nameSimpleAr', 'شهادة التصنيف', 'explainAr', 'تصنيف للمشاريع الحكومية.', 'estimatedCostSar', jsonb_build_object('min', 1000, 'max', 5000), 'estimatedTimeAr', '١٤ إلى ٣٠ يوم', 'order', 7, 'dependencies', jsonb_build_array('municipality_office'), 'renewalPeriodAr', 'كل 3 سنوات', 'officialUrl', 'https://momrah.gov.sa')
      )
    ),
    'v1-construction-20260507'
  ),
  (
    'verticals',
    1,
    jsonb_build_object(
      'id', 'services',
      'labelAr', 'متجر إلكتروني',
      'shipsInMvp', true,
      'entities', jsonb_build_array(
        jsonb_build_object('id', 'mci', 'nameAr', 'وزارة التجارة', 'nameSimpleAr', 'السجل التجاري', 'explainAr', 'أول خطوة.', 'estimatedCostSar', jsonb_build_object('min', 200, 'max', 1600), 'estimatedTimeAr', 'يوم واحد', 'order', 1, 'dependencies', jsonb_build_array(), 'renewalPeriodAr', 'سنوي', 'officialUrl', 'https://mc.gov.sa'),
        jsonb_build_object('id', 'maroof', 'nameAr', 'منصة معروف', 'nameSimpleAr', 'توثيق المتجر', 'explainAr', 'توثيق المتجر الإلكتروني.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 3, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://maroof.sa'),
        jsonb_build_object('id', 'zatca', 'nameAr', 'هيئة الزكاة والضريبة والجمارك', 'nameSimpleAr', 'التسجيل الضريبي', 'explainAr', 'تسجيل ضريبي.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 2, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://zatca.gov.sa'),
        jsonb_build_object('id', 'mol', 'nameAr', 'وزارة الموارد البشرية', 'nameSimpleAr', 'ملف المنشأة', 'explainAr', 'ملف للموارد البشرية.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 3, 'dependencies', jsonb_build_array('mci'), 'officialUrl', 'https://www.hrsd.gov.sa'),
        jsonb_build_object('id', 'gosi', 'nameAr', 'المؤسسة العامة للتأمينات الاجتماعية', 'nameSimpleAr', 'التأمينات', 'explainAr', 'تسجيل التأمينات.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'يوم واحد', 'order', 4, 'dependencies', jsonb_build_array('mol'), 'renewalPeriodAr', 'اشتراك شهري', 'officialUrl', 'https://www.gosi.gov.sa'),
        jsonb_build_object('id', 'pdpl_readiness', 'nameAr', 'نظام حماية البيانات الشخصية', 'nameSimpleAr', 'جاهزية PDPL', 'explainAr', 'سياسة خصوصية.', 'estimatedCostSar', jsonb_build_object('min', 0, 'max', 0), 'estimatedTimeAr', 'مستمر', 'order', 5, 'dependencies', jsonb_build_array('mci'), 'renewalPeriodAr', 'مستمر', 'officialUrl', 'https://sdaia.gov.sa'),
        jsonb_build_object('id', 'zatca_einvoice_onboarding', 'nameAr', 'الفوترة الإلكترونية', 'nameSimpleAr', 'ربط Fatoora', 'explainAr', 'ربط مع ZATCA.', 'estimatedCostSar', jsonb_build_object('min', 500, 'max', 3000), 'estimatedTimeAr', '٧ إلى ١٤ يوم', 'order', 6, 'dependencies', jsonb_build_array('zatca'), 'renewalPeriodAr', 'مستمر', 'officialUrl', 'https://zatca.gov.sa')
      )
    ),
    'v1-services-20260507'
  )
on conflict do nothing;
