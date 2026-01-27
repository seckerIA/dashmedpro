import { Suspense } from 'react'
import { requireAuth, createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

async function getOrganization(organizationId: string | null) {
    if (!organizationId) return null

    const supabase = await createClient()
    const { data } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()

    return data
}

function SidebarFallback() {
    return (
        <aside className="w-64 bg-sidebar border-r animate-pulse">
            <div className="p-4 space-y-4">
                <div className="h-16 bg-muted rounded-2xl" />
                <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-2xl" />
                    ))}
                </div>
            </div>
        </aside>
    )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const profile = await requireAuth()
    const organization = await getOrganization(profile.organization_id)

    return (
        <DashboardShell userProfile={profile} organization={organization}>
            <Suspense fallback={<SidebarFallback />}>
                {children}
            </Suspense>
        </DashboardShell>
    )
}
