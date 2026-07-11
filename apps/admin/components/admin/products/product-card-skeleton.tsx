export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Tier 1 */}
      <div className="flex flex-col items-start gap-1.5 px-2.5 pb-2 pt-3 sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div className="h-2.5 w-16 animate-pulse rounded-full bg-gray-200 sm:w-20" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-gray-200" />
      </div>
      {/* Tier 2 */}
      <div className="flex flex-col gap-2 px-2.5 pb-2 sm:flex-row sm:items-start sm:gap-3 sm:px-3">
        <div className="h-24 w-full shrink-0 animate-pulse rounded-lg bg-gray-200 min-[420px]:h-28 sm:h-[72px] sm:w-[72px]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-2 w-16 animate-pulse rounded-full bg-gray-200" />
          <div className="h-3.5 w-full animate-pulse rounded-full bg-gray-200" />
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-gray-200" />
          <div className="flex gap-1 pt-1">
            <div className="h-3 w-12 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-10 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
      {/* Tier 3 */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-2.5 py-2 sm:px-3">
        <div className="h-4 w-16 animate-pulse rounded-full bg-gray-200 sm:w-20" />
        <div className="h-8 w-8 animate-pulse rounded-md bg-gray-200 sm:h-5 sm:w-10" />
      </div>
    </div>
  );
}

export function ProductCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
