import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { SkeletonShimmer } from "@/components/ui/skeleton-shimmer"

export function DashboardMetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <SkeletonShimmer className="h-8 w-20 mb-2" />
            <SkeletonShimmer className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function DashboardChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <SkeletonShimmer className="h-6 w-40" />
        <div className="flex gap-2">
          <SkeletonShimmer className="h-8 w-20 rounded-md" />
          <SkeletonShimmer className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <SkeletonShimmer className="h-[300px] w-full rounded-lg" />
    </Card>
  )
}

export function DashboardAgendaSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <SkeletonShimmer className="h-6 w-48" />
        <SkeletonShimmer className="h-6 w-8 rounded-full" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/50">
            <SkeletonShimmer className="h-12 w-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <SkeletonShimmer className="h-4 w-3/4" />
              <SkeletonShimmer className="h-3 w-1/2" />
            </div>
            <SkeletonShimmer className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DashboardFullSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonShimmer className="h-8 w-64" />
          <SkeletonShimmer className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <SkeletonShimmer className="h-10 w-32 rounded-xl" />
          <SkeletonShimmer className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Metrics */}
      <DashboardMetricsSkeleton />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <DashboardChartSkeleton />
          <DashboardAgendaSkeleton />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-4">
            <SkeletonShimmer className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonShimmer className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <SkeletonShimmer className="h-3 w-24" />
                    <SkeletonShimmer className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
