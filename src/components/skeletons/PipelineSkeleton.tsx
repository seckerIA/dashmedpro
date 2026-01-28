import { Card } from "@/components/ui/card"
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer"

interface PipelineSkeletonProps {
  columns?: number
  cardsPerColumn?: number
}

export function PipelineSkeleton({
  columns = 5,
  cardsPerColumn = 3
}: PipelineSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={colIndex} className="flex-shrink-0 w-72">
          {/* Column Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <SkeletonShimmer className="h-5 w-28" />
              <SkeletonShimmer className="h-5 w-8 rounded-full" />
            </div>
            <SkeletonShimmer className="h-6 w-6 rounded" />
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <Card key={cardIndex} className="p-4 space-y-3">
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <SkeletonShimmer className="h-4 w-3/4" />
                  <SkeletonShimmer className="h-5 w-5 rounded" />
                </div>

                {/* Card Body */}
                <SkeletonShimmer className="h-3 w-1/2" />

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <SkeletonShimmer className="h-6 w-6 rounded-full" />
                    <SkeletonShimmer className="h-3 w-20" />
                  </div>
                  <SkeletonShimmer className="h-5 w-16 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PipelineCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <SkeletonShimmer className="h-4 w-3/4" />
        <SkeletonShimmer className="h-5 w-5 rounded" />
      </div>
      <SkeletonShimmer className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <SkeletonShimmer className="h-6 w-6 rounded-full" />
          <SkeletonShimmer className="h-3 w-20" />
        </div>
        <SkeletonShimmer className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  )
}
