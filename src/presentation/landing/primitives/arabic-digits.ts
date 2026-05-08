/** Convert Latin digits in a string to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩). */
export function toArabicDigits(input: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  return input.replace(/\d/g, (d) => arabicDigits[Number(d)] ?? d);
}
