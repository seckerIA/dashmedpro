import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showCheckbox?: boolean
  showAvatar?: boolean
  showActions?: boolean
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showCheckbox = true,
  showAvatar = true,
  showActions = true
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-border bg-muted/30">
        {showCheckbox && <SkeletonShimmer className="h-4 w-4 rounded" />}
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonShimmer
            key={i}
            className="h-4"
            style={{ width: `${Math.random() * 60 + 40}px` }}
          />
        ))}
        {showActions && <SkeletonShimmer className="h-4 w-16 ml-auto" />}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 items-center border-b border-border/50 hover:bg-muted/10 transition-colors"
        >
          {showCheckbox && <SkeletonShimmer className="h-4 w-4 rounded" />}
          {showAvatar && <SkeletonShimmer className="h-10 w-10 rounded-full flex-shrink-0" />}
          {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, colIndex) => (
            <SkeletonShimmer
              key={colIndex}
              className="h-4"
              style={{ width: `${Math.random() * 80 + 60}px` }}
            />
          ))}
          {showActions && (
            <SkeletonShimmer className="h-8 w-8 rounded ml-auto flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}

export function TableWithHeaderSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Table Header Actions */}
      <div className="flex items-center justify-between">
        <SkeletonShimmer className="h-10 w-64 rounded-md" />
        <div className="flex gap-2">
          <SkeletonShimmer className="h-10 w-24 rounded-md" />
          <SkeletonShimmer className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <TableSkeleton rows={rows} />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <SkeletonShimmer className="h-4 w-48" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonShimmer key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
