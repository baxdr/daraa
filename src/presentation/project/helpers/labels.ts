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
    case 'coffee':
      return 'كوفي شوب / مقهى';
    case 'restaurant':
      return 'مطعم';
    case 'grocery':
      return 'بقالة / سوبر ماركت';
    case 'laundry':
      return 'مغسلة ملابس';
    case 'salon':
      return 'صالون / مركز تجميل';
    default:
      return v;
  }
}
