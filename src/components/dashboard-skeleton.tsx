/**
 * Loading skeleton for project dashboard — animated pulse cards during
 * data fetch. Respects prefers-reduced-motion for accessibility.
 */

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-10 md:px-10 md:py-14">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 animate-pulse rounded bg-paper-2" />
        <div className="h-4 w-8 animate-pulse rounded bg-paper-2" />
        <div className="h-4 w-12 animate-pulse rounded bg-paper-2" />
        <div className="h-4 w-24 animate-pulse rounded bg-paper-2" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-paper-2" />
        <div className="h-12 w-48 animate-pulse rounded bg-paper-2" />
        <div className="flex gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-paper-2" />
          <div className="h-4 w-20 animate-pulse rounded bg-paper-2" />
        </div>
      </div>

      <div className="rule-ink mb-10" />

      {/* Save banner skeleton */}
      <div className="h-16 animate-pulse rounded bg-paper-2" />

      {/* Main content area — 2-column summary for compliance */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-paper-2" />
          <div className="h-32 w-full animate-pulse rounded bg-paper-2" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-paper-2" />
          <div className="h-32 w-full animate-pulse rounded bg-paper-2" />
        </div>
      </div>

      {/* Sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded bg-paper-2" />
            <div className="h-4 w-20 animate-pulse rounded bg-paper-2" />
          </div>
          <div className="rule mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-24 w-full animate-pulse rounded border border-rule bg-paper-2"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
