import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4 rounded" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[80px] mb-2" />
                        <Skeleton className="h-3 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function TaskListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <Skeleton className="h-5 w-[200px] mb-2" />
                            <Skeleton className="h-4 w-[300px]" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-[80px]" />
                        <Skeleton className="h-4 w-[60px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px]" />
                </div>
            ))}
        </div>
    );
}
