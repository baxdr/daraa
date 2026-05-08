export function StatBar({ number, label }: { number: string; label: string }) {
  return (
    <div className="border-b border-rule px-6 py-8 last:border-b-0 last:border-s-0 sm:border-b-0 sm:border-s sm:border-rule md:px-8 md:py-10">
      <div className="font-display text-3xl font-extrabold leading-none tracking-tighter text-ink md:text-4xl">
        {number}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{label}</p>
    </div>
  );
}
