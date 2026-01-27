import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar Skeleton */}
            <aside className="w-64 border-r hidden md:block">
                <div className="p-4 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header Skeleton */}
                <header className="h-16 border-b px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full md:hidden" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-24 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                {/* Content Skeleton */}
                <main className="flex-1 overflow-auto p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>

                    <Skeleton className="h-[400px] rounded-xl" />
                </main>
            </div>
        </div>
    )
}
