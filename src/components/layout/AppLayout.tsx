import { ReactNode, useState, useRef, useEffect } from "react"
import { AppSidebar } from "./AppSidebar"
import { BottomNav } from "./BottomNav"
import { SkipLink } from "./SkipLink"
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
import { Link, useLocation } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/useUserProfile"
import { NotificationBell } from "@/components/notifications/NotificationBell"


import { cn } from "@/lib/utils"
import { useOverdueAppointments } from "@/hooks/useOverdueAppointments"
import { OverdueAppointmentsList } from "@/components/shared/OverdueAppointmentsList"
import { AlertTriangle } from "lucide-react"
import { GlobalSearch } from "@/components/crm/GlobalSearch"
// import { CortanaButtonCompact } from "@/components/cortana" // Cortana desativada
import { useAppointmentAlerts } from "@/hooks/useAppointmentAlerts"
import { AppointmentAlertModal } from "@/components/alerts/AppointmentAlertModal"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface AppLayoutProps {
  children: ReactNode
  hideSidebar?: boolean
  title?: string
  noScroll?: boolean
}

export function AppLayout({ children, hideSidebar = false, title: explicitTitle, noScroll = false }: AppLayoutProps) {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showOverdueList, setShowOverdueList] = useState(false)
  const sidebarRef = useRef<ImperativePanelHandle>(null)

  // Mapeamento de títulos por rota
  const getTitle = () => {
    if (explicitTitle) return explicitTitle
    const path = location.pathname

    if (path.startsWith('/whatsapp')) return "WhatsApp Chat"
    if (path.startsWith('/crm')) return "Pipeline de Vendas"
    if (path.startsWith('/calendar')) return "Agenda Médica"
    if (path.startsWith('/patients')) return "Pacientes"
    if (path.startsWith('/financial')) return "Financeiro"
    if (path.startsWith('/reports')) return "Relatórios"
    if (path.startsWith('/settings')) return "Configurações"
    if (path.startsWith('/tasks')) return "Minhas Tarefas"
    if (path.startsWith('/followup')) return "Follow-up IA"

    return "Dashboard"
  }

  const title = getTitle()
  const isWhatsApp = location.pathname.startsWith('/whatsapp')
  const shouldNoScroll = noScroll || isWhatsApp

  const { profile } = useUserProfile()
  const { hasOverdue, overdueCount } = useOverdueAppointments()
  const {
    currentAlert,
    hasAlert,
    minutesUntilAppointment,
    dismissAlert,
    openMedicalRecord,
  } = useAppointmentAlerts()
  const isMobile = useIsMobile()
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isDesktop = windowWidth >= 1024
  const isLargeDesktop = windowWidth >= 1280

  const displayName = profile?.full_name || profile?.email || 'Usuário'
  const displayRole = profile?.role || 'vendedor'

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((n) => n?.[0] || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const showDesktopSidebar = !hideSidebar && isDesktop
  const showMobileSidebar = !hideSidebar && !isDesktop

  const toggleSidebar = () => {
    if (isCollapsed) {
      sidebarRef.current?.expand()
    } else {
      sidebarRef.current?.collapse()
    }
  }

  return (
    <>
      <SkipLink />
      <TooltipProvider>
        <ResizablePanelGroup
          direction="horizontal"
          className="h-screen w-full overflow-hidden font-sans"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
          }}
        >
          {/* Sidebar Panel - Only show if not hidden and is desktop */}
          {showDesktopSidebar && (
            <>
              <ResizablePanel
                ref={sidebarRef}
                defaultSize={16}
                collapsedSize={5}
                collapsible={true}
                minSize={13}
                maxSize={22}
                onCollapse={() => {
                  setIsCollapsed(true)
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`
                }}
                onExpand={() => {
                  setIsCollapsed(false)
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`
                }}
                className="transition-all duration-300 ease-in-out border-r border-border bg-sidebar"
              >
                <AppSidebar isCollapsed={isCollapsed} />
              </ResizablePanel>

              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={showDesktopSidebar ? 80 : 100}>
            <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
              {/* Header - estilo Dabang */}
              <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-card border-b border-border shadow-card z-30">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  {/* Mobile Sidebar Trigger */}
                  {showMobileSidebar && (
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-1 hover:bg-muted"
                        >
                          <Menu className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="p-0 w-72 border-none">
                        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                        <SheetDescription className="sr-only">
                          Acesse as principais seções do sistema DashMed Pro.
                        </SheetDescription>
                        <AppSidebar isCollapsed={false} />
                      </SheetContent>
                    </Sheet>
                  )}

                  {/* Desktop Toggle Sidebar */}
                  {showDesktopSidebar && (
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

                  <div className="flex flex-col min-w-0 truncate">
                    <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight truncate">
                      {title}
                    </h1>
                    {title === "Dashboard" && (
                      <p className="hidden md:block text-xs text-muted-foreground truncate">
                        Visão geral de vendas e CRM
                      </p>
                    )}
                  </div>

                  {/* Barra de busca - Only on large desktop to prevent crowding */}
                  {isLargeDesktop && (
                    <div className="hidden lg:flex items-center ml-4 flex-1 max-w-sm">
                      <GlobalSearch />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                  {/* <CortanaButtonCompact className="mr-2" /> */}{/* Cortana desativada */}
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
                      <NotificationBell />
                    </div>
                  </div>

                  {/* User Profile */}
                  <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-border">
                    <Avatar className="h-8 w-8 md:h-9 md:w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col">
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
              <main
                id="main-content"
                className={cn(
                  "flex-1 bg-background",
                  !shouldNoScroll && "p-4 md:p-6 pb-24 md:pb-6 overflow-auto"
                )}
              >
                {children}
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>

      {/* Modal de consultas pendentes */}
      <OverdueAppointmentsList open={showOverdueList} onOpenChange={setShowOverdueList} />

      {/* Modal de alerta de consulta proxima */}
      {hasAlert && currentAlert && (
        <AppointmentAlertModal
          appointment={currentAlert}
          minutesUntil={minutesUntilAppointment}
          onDismiss={dismissAlert}
          onOpenRecord={() => openMedicalRecord(currentAlert)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {!hideSidebar && <BottomNav />}
    </>
  )
}