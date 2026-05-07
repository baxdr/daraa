/**
 * ZATCA (هيئة الزكاة والضريبة والجمارك) knowledge base.
 *
 * Covers:
 *   - VAT thresholds and obligations
 *   - E-invoicing phases + technical requirements (Fatoora)
 *   - Withholding tax categories
 *   - Excise tax (selective tax) products
 *   - Real Estate Transaction Tax (RETT)
 *   - Corporate income tax (foreign-owned shares)
 *   - Customs (separate file: customs.ts handles import/export specifically)
 *
 * IMPORTANT: All thresholds and rates here are from publicly available ZATCA
 * documentation as of 2024. They WILL change. The agent layer must surface
 * "تحقّق من zatca.gov.sa للتحديثات" alongside any number quoted from this file.
 */

import type { Severity } from '@/agents/types';

/* ─────────────────────────── VAT thresholds ───────────────────────────── */

export interface VatThresholds {
  /** Mandatory registration threshold — annual taxable supplies SAR. */
  mandatoryRegistrationSar: number;
  /** Voluntary registration threshold — below mandatory but eligible. */
  voluntaryRegistrationSar: number;
  /** Standard VAT rate. Was 5% until July 2020. */
  standardRatePercent: number;
}

export const VAT: VatThresholds = {
  mandatoryRegistrationSar: 375_000,
  voluntaryRegistrationSar: 187_500,
  standardRatePercent: 15,
};

/* ─────────────────────── E-invoicing phases (Fatoora) ─────────────────── */

export interface EInvoicePhase {
  id: 'phase_1' | 'phase_2';
  nameAr: string;
  /** When this phase became mandatory. */
  mandatoryFromAr: string;
  requirementsAr: string[];
}

export const E_INVOICE_PHASES: readonly EInvoicePhase[] = [
  {
    id: 'phase_1',
    nameAr: 'المرحلة الأولى — جيل الفاتورة (Generation)',
    mandatoryFromAr: 'إلزامية منذ 4 ديسمبر 2021',
    requirementsAr: [
      'إصدار جميع الفواتير إلكترونياً (لا يُسمح بفواتير ورقية مكتوبة يدوياً)',
      'صيغة منظّمة (XML / PDF/A-3 مع XML مدمج)',
      'حقول إلزامية: الرقم الضريبي للبائع/المشتري، اسم البائع، عنوان، تاريخ',
      'QR Code إلزامي على كل فاتورة B2C',
      'تخزين الفواتير الإلكترونية لمدة لا تقل عن ٦ سنوات',
    ],
  },
  {
    id: 'phase_2',
    nameAr: 'المرحلة الثانية — التكامل (Integration)',
    mandatoryFromAr: 'بدأت تدريجياً من 1 يناير 2023 على موجات حسب الحجم',
    requirementsAr: [
      'ربط مباشر مع منصة فاتورة الخاصة بـ ZATCA عبر API',
      'الحصول على شهادة CSID من ZATCA لكل جهاز إصدار',
      'ختم رقمي معتمد (Cryptographic Stamp) على كل فاتورة',
      'إرسال فواتير B2B للهيئة *قبل* تسليمها للمشتري (Clearance)',
      'إرسال فواتير B2C للهيئة *خلال 24 ساعة* من إصدارها (Reporting)',
      'تسلسل غير قابل للتلاعب (UUID + Hash chain)',
    ],
  },
] as const;

/* ────────────────────── Withholding tax (WHT) ─────────────────────────── */

export interface WhtRule {
  category: string;
  ratePercent: number;
  appliesTo: string;
}

export const WHT_RULES: readonly WhtRule[] = [
  { category: 'إيجار', ratePercent: 5, appliesTo: 'مدفوعات الإيجار للأشخاص غير المقيمين' },
  {
    category: 'خدمات فنية واستشارية',
    ratePercent: 5,
    appliesTo: 'الخدمات المقدّمة من جهات غير مقيمة',
  },
  { category: 'أرباح أسهم وحصص', ratePercent: 5, appliesTo: 'توزيعات الأرباح للملاك غير المقيمين' },
  { category: 'فوائد قروض', ratePercent: 5, appliesTo: 'الفوائد المدفوعة لجهات غير مقيمة' },
  {
    category: 'إتاوات / حقوق امتياز',
    ratePercent: 15,
    appliesTo: 'حقوق الملكية الفكرية والإتاوات',
  },
  {
    category: 'مدفوعات للشركة الأم',
    ratePercent: 5,
    appliesTo: 'الخدمات داخل المجموعة (intercompany)',
  },
  { category: 'تذاكر دولية', ratePercent: 5, appliesTo: 'مدفوعات لشركات الطيران والشحن الأجنبية' },
] as const;

/* ────────────────────── Excise tax (selective) ────────────────────────── */

export interface ExciseProduct {
  productAr: string;
  ratePercent: number;
  notesAr?: string;
}

export const EXCISE_PRODUCTS: readonly ExciseProduct[] = [
  { productAr: 'منتجات التبغ', ratePercent: 100 },
  { productAr: 'مشروبات الطاقة', ratePercent: 100 },
  { productAr: 'المشروبات الغازية', ratePercent: 50 },
  { productAr: 'المشروبات المحلّاة', ratePercent: 50 },
  { productAr: 'الأدوات والسوائل الإلكترونية للتبغ', ratePercent: 100 },
] as const;

/* ────────────────────── Real Estate Transaction Tax ───────────────────── */

export const RETT_RATE_PERCENT = 5;

/* ────────────────── Corporate income tax (Saudi/Foreign) ──────────────── */

/**
 * Saudi/GCC ownership share is subject to Zakat (2.5%).
 * Foreign ownership share is subject to corporate income tax (20%).
 * Mixed ownership: blended treatment.
 */
export const ZAKAT_RATE_PERCENT = 2.5;
export const CORPORATE_INCOME_TAX_PERCENT = 20;

/* ────────────────────── ZATCA rules (catalog) ─────────────────────────── */

export interface ZatcaRule {
  id: string;
  titleAr: string;
  requirementAr: string;
  severity: Severity;
  appliesTo:
    | 'all' // every registered business
    | 'vat_registered' // companies past VAT threshold
    | 'b2b_einvoice' // phase-2 wave applicable
    | 'large_only' // ≥40m SAR turnover (phase-2 first wave)
    | 'foreign_owned' // companies with foreign ownership
    | 'real_estate' // real-estate transactions
    | 'excise'; // selling excise-eligible products
  /** Statutory penalty ceiling in SAR. 0 = compliance-only (suspension/contractual). */
  penaltyCapSar: number;
}

export const ZATCA_RULES: readonly ZatcaRule[] = [
  // VAT registration
  {
    id: 'zatca_vat_registration_mandatory',
    titleAr: 'التسجيل الإلزامي في ضريبة القيمة المضافة',
    requirementAr:
      'يجب التسجيل في ضريبة القيمة المضافة عند تجاوز الإيرادات السنوية الخاضعة 375,000 ريال.',
    severity: 'critical',
    appliesTo: 'all',
    penaltyCapSar: 10_000,
  },
  {
    id: 'zatca_vat_registration_voluntary',
    titleAr: 'التسجيل الاختياري في ضريبة القيمة المضافة',
    requirementAr:
      'يحق للمنشأة التسجيل اختيارياً عند تجاوز إيراداتها السنوية 187,500 ريال (للحصول على خصم ضريبة المدخلات).',
    severity: 'low',
    appliesTo: 'all',
    penaltyCapSar: 0,
  },
  {
    id: 'zatca_vat_filing_periodic',
    titleAr: 'الإقرار الضريبي الدوري',
    requirementAr:
      'يجب تقديم الإقرار الضريبي شهرياً (إيرادات ≥40 مليون) أو ربع سنوياً (أقل من 40 مليون) خلال آخر يوم من الشهر التالي للفترة.',
    severity: 'critical',
    appliesTo: 'vat_registered',
    penaltyCapSar: 50_000,
  },
  {
    id: 'zatca_vat_payment_on_time',
    titleAr: 'سداد الضريبة في الموعد',
    requirementAr:
      'يجب سداد ضريبة القيمة المضافة المستحقة خلال آخر يوم من الشهر التالي. التأخير يخضع لغرامة 5% شهرياً.',
    severity: 'critical',
    appliesTo: 'vat_registered',
    penaltyCapSar: 0,
  },
  // E-invoicing
  {
    id: 'zatca_einvoice_phase1',
    titleAr: 'إصدار الفواتير إلكترونياً (المرحلة الأولى)',
    requirementAr:
      'يجب إصدار جميع الفواتير الضريبية إلكترونياً بصيغة منظّمة مع QR code للفواتير B2C.',
    severity: 'critical',
    appliesTo: 'vat_registered',
    penaltyCapSar: 50_000,
  },
  {
    id: 'zatca_einvoice_phase2_integration',
    titleAr: 'الربط الإلكتروني مع منصة فاتورة (المرحلة الثانية)',
    requirementAr:
      'يجب الربط التقني مع منصة فاتورة وإرسال الفواتير قبل/خلال 24 ساعة (Clearance/Reporting) حسب نوع الفاتورة.',
    severity: 'critical',
    appliesTo: 'b2b_einvoice',
    penaltyCapSar: 50_000,
  },
  {
    id: 'zatca_einvoice_csid',
    titleAr: 'الحصول على شهادة CSID',
    requirementAr:
      'كل جهاز يصدر فواتير في المرحلة الثانية يجب أن يحصل على شهادة Cryptographic Stamp ID من ZATCA قبل الإطلاق.',
    severity: 'critical',
    appliesTo: 'b2b_einvoice',
    penaltyCapSar: 0,
  },
  {
    id: 'zatca_einvoice_storage',
    titleAr: 'حفظ الفواتير الإلكترونية',
    requirementAr: 'يجب حفظ الفواتير الإلكترونية بصيغتها الأصلية لمدة لا تقل عن 6 سنوات.',
    severity: 'medium',
    appliesTo: 'vat_registered',
    penaltyCapSar: 50_000,
  },
  // Withholding tax
  {
    id: 'zatca_wht_filing',
    titleAr: 'إقرار الاستقطاع الضريبي',
    requirementAr:
      'يجب تقديم إقرار الاستقطاع الضريبي شهرياً عن المدفوعات الخاضعة للأشخاص غير المقيمين والسداد خلال 10 أيام.',
    severity: 'critical',
    appliesTo: 'all',
    penaltyCapSar: 50_000,
  },
  // Zakat / Corporate tax
  {
    id: 'zatca_zakat_annual',
    titleAr: 'الزكاة السنوية',
    requirementAr:
      'يجب تقديم إقرار الزكاة السنوي للحصص السعودية والخليجية خلال 120 يوماً من نهاية السنة المالية.',
    severity: 'critical',
    appliesTo: 'all',
    penaltyCapSar: 0,
  },
  {
    id: 'zatca_corporate_tax_foreign',
    titleAr: 'ضريبة الدخل على الحصص الأجنبية',
    requirementAr:
      'تخضع حصص الملاك الأجانب لضريبة دخل بنسبة 20% — يجب تقديم إقرار سنوي وسداد الضريبة.',
    severity: 'critical',
    appliesTo: 'foreign_owned',
    penaltyCapSar: 0,
  },
  // Excise
  {
    id: 'zatca_excise_registration',
    titleAr: 'التسجيل في الضريبة الانتقائية',
    requirementAr:
      'يجب التسجيل في الضريبة الانتقائية عند استيراد أو إنتاج أو تخزين السلع الانتقائية (تبغ، مشروبات طاقة، إلخ).',
    severity: 'critical',
    appliesTo: 'excise',
    penaltyCapSar: 50_000,
  },
  // RETT
  {
    id: 'zatca_rett_payment',
    titleAr: 'ضريبة التصرفات العقارية',
    requirementAr: 'يجب احتساب وسداد ضريبة التصرفات العقارية بنسبة 5% عند بيع أو نقل ملكية العقار.',
    severity: 'critical',
    appliesTo: 'real_estate',
    penaltyCapSar: 0,
  },
  // General record keeping
  {
    id: 'zatca_record_keeping',
    titleAr: 'حفظ السجلات المحاسبية',
    requirementAr:
      'يجب حفظ كل السجلات والمستندات المحاسبية باللغة العربية لمدة 6 سنوات على الأقل وإتاحتها للهيئة عند الطلب.',
    severity: 'critical',
    appliesTo: 'all',
    penaltyCapSar: 50_000,
  },
  {
    id: 'zatca_arabic_invoices',
    titleAr: 'إصدار الفواتير باللغة العربية',
    requirementAr:
      'يجب أن تكون الفواتير الضريبية باللغة العربية (يجوز إصدارها بلغة إضافية بشرط أن تكون العربية أساسية).',
    severity: 'medium',
    appliesTo: 'vat_registered',
    penaltyCapSar: 1_000,
  },
];

/* ────────────────────────── Helpers ───────────────────────────────────── */

/** Returns the ZATCA rules a project should worry about given its profile. */
export function getRulesForProfile(profile: {
  annualRevenueSar?: number;
  hasForeignOwner?: boolean;
  isRealEstate?: boolean;
  sellsExciseGoods?: boolean;
}): readonly ZatcaRule[] {
  const annualRev = profile.annualRevenueSar ?? 0;
  const isVatRegistered = annualRev >= VAT.mandatoryRegistrationSar;
  const isLarge = annualRev >= 40_000_000;

  return ZATCA_RULES.filter((rule) => {
    switch (rule.appliesTo) {
      case 'all':
        return true;
      case 'vat_registered':
        return isVatRegistered;
      case 'b2b_einvoice':
        return isVatRegistered; // simplified — actual phase-2 waves are date+revenue gated
      case 'large_only':
        return isLarge;
      case 'foreign_owned':
        return profile.hasForeignOwner === true;
      case 'real_estate':
        return profile.isRealEstate === true;
      case 'excise':
        return profile.sellsExciseGoods === true;
    }
  });
}

export const ZATCA_TOTAL_RULES = ZATCA_RULES.length;
