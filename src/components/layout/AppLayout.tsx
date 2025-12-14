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

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebarRef = useRef<ImperativePanelHandle>(null)
  const { profile } = useUserProfile()
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
            className="min-h-screen w-full"
            onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
            }}
        >
        <ResizablePanel
            ref={sidebarRef}
            defaultSize={20}
            collapsedSize={3}
            collapsible={true}
            minSize={3}
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
            {/* Header - Nexus Dark Theme */}
            <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shadow-card">
                <div className="flex items-center gap-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={toggleSidebar}
                                className="p-2 hover:bg-muted rounded-lg transition-all duration-200"
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
                        <h1 className="text-lg font-semibold text-foreground">Olá, {displayName}</h1>
                        <p className="text-sm text-muted-foreground">DashMed Pro</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Navigation Links */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Cadastro rápido</span>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-primary font-medium border-b border-primary">Ajuda</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Comunicações</span>
                            <NotificationBell />
                        </div>
                    </div>
                    
                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 border-l border-border">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{displayName}</span>
                            <span className="text-xs text-muted-foreground">Cargo: {displayRole}</span>
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