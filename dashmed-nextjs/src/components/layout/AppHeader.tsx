'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, AlignJustify, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GlobalSearch } from '@/components/crm/GlobalSearch'
import { CortanaButtonCompact } from '@/components/cortana/CortanaButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useOverdueAppointments } from '@/hooks/useOverdueAppointments'
import { OverdueAppointmentsList } from '@/components/shared/OverdueAppointmentsList'

export function AppHeader({
    userProfile,
    isCollapsed,
    toggleSidebar
}: {
    userProfile: any
    isCollapsed?: boolean
    toggleSidebar?: () => void
}) {
    const router = useRouter()
    const [showOverdueList, setShowOverdueList] = useState(false)
    const { hasOverdue, overdueCount } = useOverdueAppointments()

    // Fallback values if profile is incomplete
    const displayName = userProfile?.full_name || userProfile?.email || 'Usuário'
    const displayRole = userProfile?.role || 'vendedor'

    const initials = (userProfile?.full_name || userProfile?.email || 'U')
        .split(' ')
        .map((n: string) => n?.[0] || '')
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const handleLogout = async () => {
        try {
            const supabase = createClient()
            await supabase.auth.signOut()
            toast.success('Logout realizado')
            router.push('/login')
            router.refresh()
        } catch (error) {
            toast.error('Erro ao fazer logout')
        }
    }

    return (
        <>
            <TooltipProvider>
                <header className="h-20 flex items-center justify-between px-8 bg-card border-b border-border shadow-card">
                    <div className="flex items-center gap-6 flex-1">
                        {toggleSidebar && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={toggleSidebar}
                                        className="p-2 hover:bg-muted rounded-xl transition-all duration-200"
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <AlignJustify className="w-5 h-5 text-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>{isCollapsed ? "Expandir Menu" : "Recolher Menu"}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        <div className="flex flex-col">
                            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                                Dashboard
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Visão geral de vendas e CRM
                            </p>
                        </div>

                        {/* Barra de busca */}
                        <div className="hidden md:flex items-center ml-8 flex-1 max-w-md">
                            <GlobalSearch />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <CortanaButtonCompact className="mr-2" />
                        <div className="hidden md:flex items-center gap-6 text-sm">
                            <a
                                href="https://wa.me/5511999998888"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-medium border-b border-primary/60 hover:border-primary transition-colors cursor-pointer"
                            >
                                Ajuda
                            </a>
                            <div className="flex items-center gap-4">
                                {hasOverdue && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => setShowOverdueList(true)}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                                            >
                                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                                                    {overdueCount} Pendente{overdueCount > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Clique para ver consultas pendentes</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Comunicações</span>
                                    <NotificationBell />
                                </div>
                            </div>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={userProfile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground leading-tight">
                                    {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground leading-tight">
                                    Cargo: {displayRole}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2 h-8 w-8 text-muted-foreground hover:text-destructive">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </header>
            </TooltipProvider>

            <OverdueAppointmentsList open={showOverdueList} onOpenChange={setShowOverdueList} />
        </>
    )
}
