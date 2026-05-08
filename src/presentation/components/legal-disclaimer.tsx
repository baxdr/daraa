export function LegalDisclaimer() {
  return (
    <div className="mb-6 mt-16 flex items-start gap-3 border-t border-rule pt-5 text-[11px] leading-relaxed text-muted">
      <span className="font-mono text-[10px] tracking-widest text-accent">§</span>
      <p className="max-w-2xl">
        أداة استرشادية. نتائج الفحص تستند إلى قراءة آلية لما هو منشور علناً، ولا تُعدّ تشخيصاً
        قانونياً. راجع الجهات الرسمية أو مستشاراً قانونياً قبل اتخاذ أي قرار ملزم.
      </p>
    </div>
  );
}
