import { AGENT_LABELS_AR, type AgentActivity, type AgentMessage, type AgentId } from '@/agents/types';

/**
 * Unified agent timeline.
 *
 * Merges activities (status updates from one agent) and A2A messages
 * (communication between agents) into a single chronological stream, with
 * messages rendered distinctly so the viewer sees inter-agent dialogue.
 */

const STATUS_ICON: Record<AgentActivity['status'], string> = {
  started:   '●',
  working:   '○',
  completed: '✓',
  error:     '!',
};

const MESSAGE_TYPE_LABEL: Record<AgentMessage['type'], string> = {
  dependency: 'اعتمادية',
  data_share: 'تبادل بيانات',
  warning:    'تنبيه',
  update:     'تحديث جديد',
  ack:        'تأكيد',
};

export interface TimelineProps {
  activities: AgentActivity[];
  messages: AgentMessage[];
}

/**
 * Sort activities + messages into one chronological list.
 *
 * createdAt alone isn't stable — synchronous orchestrator code can emit an
 * activity and a message in the same millisecond, producing flicker on each
 * re-render as the array re-sorts. Tie-breaker: within a tick, activities
 * come before messages (status-first narrative), then by seq within kind.
 */
function mergeTimeline(
  activities: AgentActivity[],
  messages: AgentMessage[],
): Array<AgentActivity | AgentMessage> {
  return [...activities, ...messages].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    if (a.kind !== b.kind) return a.kind === 'activity' ? -1 : 1;
    return a.seq - b.seq;
  });
}

export function Timeline({ activities, messages }: TimelineProps) {
  const events = mergeTimeline(activities, messages);
  if (events.length === 0) {
    return <p className="py-2 text-sm text-muted">جاري بدء الوكلاء…</p>;
  }
  return (
    <ol
      className="space-y-0"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="false"
      aria-label="سجل نشاط الوكلاء"
    >
      {events.map((e) =>
        e.kind === 'activity'
          ? <ActivityRow key={`a-${e.seq}`} activity={e} index={e.seq} />
          : <MessageRow  key={`m-${e.seq}`} message={e}  index={e.seq} />,
      )}
    </ol>
  );
}

/* ------------------------------------------------------------------------- */
/* Activity row — one agent reporting its own status.                        */
/* ------------------------------------------------------------------------- */
function ActivityRow({ activity, index }: { activity: AgentActivity; index: number }) {
  const isIndent = activity.messageAr.startsWith('↳') || activity.messageAr.startsWith('✓');
  const color =
    activity.status === 'error'     ? 'text-danger' :
    activity.status === 'completed' ? 'text-accent-strong' :
    activity.status === 'working'   ? 'text-ink' :
                                      'text-ink-2';

  return (
    <li
      className="flex flex-col gap-1 border-b border-rule/50 py-2 animate-slide-in-rtl last:border-b-0 sm:grid sm:grid-cols-[auto_1fr_auto] sm:gap-x-4"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <div className="flex items-baseline justify-between gap-3 sm:contents">
        <span className={`shrink-0 font-mono text-xs tabular-nums ${color}`} aria-hidden>
          {STATUS_ICON[activity.status]}
        </span>
        <span className={`text-[13.5px] leading-relaxed ${color} ${isIndent ? 'ps-2' : ''} flex-1`}>
          {activity.messageAr}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-muted">
          {activity.agentAr}
        </span>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------------- */
/* Message row — agent-to-agent dialogue. Visually distinct from activities  */
/* with an indented card and a "from → to" header.                           */
/* ------------------------------------------------------------------------- */
function MessageRow({ message, index }: { message: AgentMessage; index: number }) {
  const fromLabel = AGENT_LABELS_AR[message.from] ?? message.from;
  const toLabel = message.to === 'ALL' ? 'جميع المتخصصين' : AGENT_LABELS_AR[message.to as AgentId] ?? message.to;

  return (
    <li
      className="animate-slide-in-rtl border-b border-rule/50 py-2.5 last:border-b-0"
      style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-4">
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-accent" aria-hidden>
          ⇄
        </span>
        <div className="min-w-0 rounded-sm border-s-2 border-accent bg-accent-soft/60 px-3 py-2">
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px]">
            <span className="font-mono tracking-widest text-accent">
              {MESSAGE_TYPE_LABEL[message.type]}
            </span>
            <span className="text-muted">·</span>
            <span className="font-display font-extrabold text-ink">{fromLabel}</span>
            <span className="text-muted">→</span>
            <span className="font-display font-extrabold text-ink">{toLabel}</span>
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink">{message.messageAr}</p>
        </div>
      </div>
    </li>
  );
}
