type StatusMode = 'establishment' | 'compliance' | 'operational';

const STATUS_CONFIG: Record<
  StatusMode,
  { label: string; bg: string; text: string; border: string }
> = {
  establishment: {
    label: 'مرحلة التأسيس',
    bg: 'bg-accent-soft',
    text: 'text-accent-strong',
    border: 'border-accent/30',
  },
  compliance: {
    label: 'فحص الامتثال',
    bg: 'bg-warn-soft',
    text: 'text-warn-strong',
    border: 'border-warn/30',
  },
  operational: {
    label: 'مراقبة تشغيلية',
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
  },
};

export function StatusModeIndicator({ mode }: { mode: StatusMode }) {
  const config = STATUS_CONFIG[mode];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] font-bold tracking-widest ${config.bg} ${config.text} ${config.border}`}
      role="status"
      aria-label={`الحالة: ${config.label}`}
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
