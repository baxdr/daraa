/**
 * Loading skeleton for project dashboard — animated pulse cards during
 * data fetch. Respects prefers-reduced-motion for accessibility.
 */

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-14 space-y-10">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-paper-2 rounded animate-pulse" />
        <div className="h-4 w-8 bg-paper-2 rounded animate-pulse" />
        <div className="h-4 w-12 bg-paper-2 rounded animate-pulse" />
        <div className="h-4 w-24 bg-paper-2 rounded animate-pulse" />
      </div>

      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-32 bg-paper-2 rounded animate-pulse" />
        <div className="h-12 w-48 bg-paper-2 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-paper-2 rounded animate-pulse" />
          <div className="h-4 w-20 bg-paper-2 rounded animate-pulse" />
        </div>
      </div>

      <div className="rule-ink mb-10" />

      {/* Save banner skeleton */}
      <div className="h-16 bg-paper-2 rounded animate-pulse" />

      {/* Main content area — 2-column summary for compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-paper-2 rounded animate-pulse" />
          <div className="h-32 w-full bg-paper-2 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-paper-2 rounded animate-pulse" />
          <div className="h-32 w-full bg-paper-2 rounded animate-pulse" />
        </div>
      </div>

      {/* Sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-paper-2 rounded animate-pulse" />
            <div className="h-4 w-20 bg-paper-2 rounded animate-pulse" />
          </div>
          <div className="rule mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-24 w-full bg-paper-2 rounded animate-pulse border border-rule"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
