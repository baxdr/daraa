export const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخُبَر',
  other: 'مدينة أخرى',
};

export function verticalDisplayLabel(v: string): string {
  switch (v) {
    case 'restaurant':
      return 'مطعم / كوفي شوب';
    case 'salon':
      return 'صالون / مركز تجميل';
    case 'tech':
      return 'شركة تقنية';
    case 'services':
      return 'متجر إلكتروني';
    case 'construction':
      return 'مقاولات / بناء';
    default:
      return v;
  }
}
