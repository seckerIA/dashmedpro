import { 
  BarChart3, 
  Calculator, 
  TrendingUp, 
  Users, 
  Mail, 
  FileText, 
  Target, 
  PieChart,
  Home,
  Settings,
  UserPlus,
  LogOut,
  CheckSquare2,
  Sparkles,
  Compass,
  Calendar
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import dashmedLogo from "@/assets/dashmed-logo.png"
import { ThemeToggle } from "@/components/ui/theme-toggle"

type NavigationItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  variant?: 'new';
  adminOnly?: boolean;
};

const navigationGroups: Array<{
  label: string;
  items: NavigationItem[];
}> = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Tarefas", url: "/tarefas", icon: CheckSquare2 },
    ]
  },
  {
    label: "Vendas & Marketing",
    items: [
      { title: "Marketing", url: "/marketing", icon: TrendingUp },
      { title: "Comercial", url: "/comercial", icon: Target },
      { title: "Guia de Prospecção", url: "/comercial/guia-prospeccao", icon: Compass, badge: "Novo", variant: "new" as const },
      { title: "Calculadora", url: "/calculadora", icon: Calculator, badge: "Novo", variant: "new" as const },
      { title: "CRM", url: "/crm", icon: Users },
      { title: "Calendário", url: "/calendar", icon: Calendar, badge: "Novo", variant: "new" as const },
      { title: "Funil de Vendas", url: "/funil-vendas", icon: BarChart3 },
    ]
  },
  {
    label: "Ferramentas",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: PieChart },
      { title: "E-mail Marketing", url: "/email-marketing", icon: Mail },
      { title: "Landing Pages", url: "/landing-pages", icon: FileText },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ]
  },
  {
    label: "Administração",
    items: [
      { title: "Gerenciar Equipe", url: "/equipe", icon: UserPlus, adminOnly: true },
    ]
  }
]

interface AppSidebarProps {
  isCollapsed: boolean;
}

export function AppSidebar({ isCollapsed }: AppSidebarProps) {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { isAdmin, isVendedor, isGestorTrafego } = useUserProfile()
  
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: "Tente novamente.",
      });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Logo Section - DashMed Pro */}
            <div className={`flex items-center gap-3 p-4 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="p-2 bg-white/10 rounded-lg transition-all duration-300">
                <img 
                  src={dashmedLogo} 
                  alt="DashMed Pro Logo" 
                  className="w-8 h-8 transition-smooth"
                />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg">DASHMED PRO</span>
                  <span className="text-white/70 text-xs">DashMed Pro</span>
                </div>
              )}
            </div>

            {/* Navigation Items - Grouped with Separators */}
            <div className="space-y-6">
              {navigationGroups.map((group, groupIndex) => {
                // Filtrar itens do grupo baseado nas permissões
                const filteredItems = group.items.filter(item => {
                  // Se o item tem adminOnly, só mostrar para admin/dono
                  if (item.adminOnly && !isAdmin) {
                    return false;
                  }
                  
                  // Vendedores NÃO podem ver:
                  if (isVendedor) {
                    // - Página Financeiro
                    if (item.url === '/financeiro') return false;
                    // - Relatórios (dados sensíveis)
                    if (item.url === '/relatorios') return false;
                    // - Marketing completo
                    if (item.url === '/marketing') return false;
                  }
                  
                  // Gestor de Tráfego NÃO pode ver:
                  if (isGestorTrafego) {
                    // - Página Financeiro
                    if (item.url === '/financeiro') return false;
                    // - CRM
                    if (item.url === '/crm') return false;
                  }
                  
                  return true;
                });

                // Se não há itens no grupo após filtrar, não renderizar o grupo
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={group.label} className="space-y-1">
                    {/* Group Label */}
                    {!isCollapsed && (
                      <div className="px-3 mb-2">
                        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                          {group.label}
                        </span>
                      </div>
                    )}
                    
                    {/* Separator for collapsed state */}
                    {isCollapsed && groupIndex > 0 && (
                      <div className="h-px bg-white/10 my-2" />
                    )}
                    
                    {/* Group Items */}
                    {filteredItems.map((item) => {
                    const active = isActive(item.url)
                    const linkContent = (
                      <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="flex items-center gap-3">
                          <item.icon className={`
                            w-5 h-5 transition-all duration-200
                            ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                          `} />
                          {!isCollapsed && (
                            <span className={`
                              font-medium transition-all duration-200
                              ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                            `}>
                              {item.title}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && item.badge && (
                          <Badge 
                            variant={item.variant === 'new' ? 'default' : 'secondary'} 
                            className={`
                              text-xs px-2 py-0 h-5 
                              ${item.variant === 'new' 
                                ? 'bg-primary/20 text-primary-foreground border-primary/30' 
                                : 'bg-white/20 text-white border-white/30'
                              }
                            `}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    );
                    
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to={item.url} 
                            end={item.url === "/"} 
                            className={`
                              block p-3 rounded-lg transition-all duration-200 group relative
                              ${active 
                                ? 'bg-white/10 text-white' 
                                : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }
                            `}
                          >
                            {linkContent}
                            {active && (
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                          </NavLink>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right" className="bg-card text-foreground border-border">
                            <div className="flex items-center gap-2">
                              {item.title}
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )
                  })}
                </div>
              );
              })}
            </div>

            {/* Settings and User Section - Bottom */}
            <div className="space-y-1 pt-6 border-t border-white/10">
              {/* Theme Toggle */}
              <div className={isCollapsed ? "flex justify-center" : ""}>
                <ThemeToggle isCollapsed={isCollapsed} />
              </div>
              
              {/* Settings */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink 
                    to="/configuracoes" 
                    className={({ isActive: active }) => `
                      block p-3 rounded-lg transition-all duration-200 group relative
                      ${active 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {({ isActive: active }) => (
                      <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <Settings className={`
                          w-5 h-5 transition-all duration-200
                          ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                        `} />
                        {!isCollapsed && (
                          <span className={`
                            font-medium transition-all duration-200
                            ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                          `}>
                            Configurações
                          </span>
                        )}
                        {active && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                      </div>
                    )}
                  </NavLink>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-card text-foreground border-border">
                    Configurações
                  </TooltipContent>
                )}
              </Tooltip>
              
              {/* User info and logout */}
              {!isCollapsed && (
                <div className="p-3 mt-4 bg-white/5 rounded-lg">
                  <div className="text-xs text-white/60 mb-2 truncate">
                    {user?.email}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start p-2 h-8 hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}