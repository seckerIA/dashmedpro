import { ReactNode, useState, useRef } from "react"
import { AppSidebar } from "./AppSidebar"
import { Button } from "@/components/ui/button"
import { AlignJustify, Search, ChevronDown } from "lucide-react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { ImperativePanelHandle } from "react-resizable-panels"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/useUserProfile"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { LivePerformanceCard } from "@/components/prospecting/LivePerformanceCard"
import { useOverdueAppointments } from "@/hooks/useOverdueAppointments"
import { AlertTriangle } from "lucide-react"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const { profile } = useUserProfile()
  const { hasOverdue, overdueCount } = useOverdueAppointments()
  const displayName = profile?.full_name || profile?.email || 'Usuário'
  const displayRole = profile?.role || 'vendedor'

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((n) => n?.[0] || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const toggleSidebar = () => {
    if (isCollapsed) {
      sidebarRef.current?.expand()
    } else {
      sidebarRef.current?.collapse()
    }
  }

  return (
    <TooltipProvider>
        <ResizablePanelGroup 
            direction="horizontal" 
            className="h-screen w-full overflow-hidden font-sans"
            onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
            }}
        >
        <ResizablePanel
          ref={sidebarRef}
          defaultSize={20}
          collapsedSize={5}
          collapsible={true}
          minSize={5}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`
          }}
          onExpand={() => {
            setIsCollapsed(false)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`
          }}
          className="transition-all duration-300 ease-in-out"
        >
          <AppSidebar isCollapsed={isCollapsed} />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <div className="flex-1 flex flex-col h-full bg-background">
            {/* Header - estilo Dabang */}
            <header className="h-20 flex items-center justify-between px-8 bg-card border-b border-border shadow-card">
              <div className="flex items-center gap-6 flex-1">
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
                  <div className="relative w-full">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar contratos, contatos..."
                      className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-muted/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <a 
                    href="https://wa.me/5524999409021" 
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
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 cursor-pointer hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                              {overdueCount} Pendente{overdueCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Consultas com mais de 12h aguardando confirmação</p>
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
                    <AvatarImage src={profile?.avatar_url || undefined} />
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
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 bg-background overflow-auto">
              {children}
            </main>
          </div>
        </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Card de Performance Global - aparece em todas as páginas quando há expediente ativo */}
        <LivePerformanceCard />
    </TooltipProvider>
  )
}