'use client';

interface ChatErrorBannerProps {
  message: string;
  hasSession: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ChatErrorBanner({ message, hasSession, onRetry, onDismiss }: ChatErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-3 flex flex-col gap-2 border-s-2 border-danger bg-danger/5 px-3 py-2"
    >
      <span className="text-sm text-danger">{message}</span>
      <div className="flex gap-2">
        {!hasSession && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 border border-danger px-2 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-paper"
          >
            أعد المحاولة
          </button>
        )}
        {hasSession && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 border border-danger px-2 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-paper"
          >
            تجاهل التنبيه
          </button>
        )}
      </div>
    </div>
  );
}
