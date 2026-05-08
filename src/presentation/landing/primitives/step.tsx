interface StepProps {
  num: string;
  icon: string;
  title: string;
  body: string;
}

export function Step({ num, icon, title, body }: StepProps) {
  return (
    <li className="relative">
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-5xl font-extrabold leading-none text-accent md:text-6xl">
            {num}
          </span>
          <span className="text-3xl" aria-hidden>
            {icon}
          </span>
        </div>
        <h3 className="font-display text-xl font-extrabold tracking-tight">{title}</h3>
      </div>
      <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink-2">{body}</p>
    </li>
  );
}
