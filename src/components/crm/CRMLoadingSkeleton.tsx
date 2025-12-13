import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CRMLoadingSkeleton() {
  return (
    <div className="min-h-screen space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="flex space-x-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        {/* Pipeline Board Skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 7 }).map((_, stageIndex) => (
            <Card key={stageIndex} className="flex-shrink-0 w-80 animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  {Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, cardIndex) => (
                    <Card key={cardIndex} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <div className="flex gap-1">
                            <Skeleton className="h-5 w-8 rounded" />
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-20" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-16" />
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CRMMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-5 w-8 rounded" />
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-6" />
          </div>
        </div>
        <Skeleton className="h-5 w-20" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
}
