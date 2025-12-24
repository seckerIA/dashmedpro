import React from "react"
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
  Calendar,
  RotateCcw
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
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
import dashmedLogo from "@/assets/imgdashmed-logo.png"
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
      // { title: "Follow-ups", url: "/follow-ups", icon: RotateCcw }, // Ocultado
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
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { toast } = useToast()
  const { isAdmin, isVendedor, isGestorTrafego, isSecretaria, profile, isLoading: isLoadingProfile } = useUserProfile()
  
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  
  // Debug: verificar permissões (remover em produção)
  React.useEffect(() => {
    if (profile) {
      console.log('Sidebar Debug - Profile Loaded:', { 
        profileId: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role, 
        isActive: profile.is_active,
        isAdmin, 
        isVendedor, 
        isGestorTrafego,
        isLoadingProfile,
        userId: user?.id,
        hasAdminOnlyItems: navigationGroups.some(g => g.items.some(i => i.adminOnly === true))
      });
    } else if (!isLoadingProfile) {
      console.warn('Sidebar Debug - No Profile Found:', {
        userId: user?.id,
        isLoadingProfile
      });
    }
  }, [profile, isAdmin, isVendedor, isGestorTrafego, isLoadingProfile, user?.id]);
  
  const handleSignOut = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppSidebar.tsx:handleSignOut',message:'handleSignOut chamado',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppSidebar.tsx:handleSignOut',message:'chamando signOut',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      await signOut();
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppSidebar.tsx:handleSignOut',message:'signOut completou, mostrando toast',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      // Pequeno delay para garantir que o estado seja atualizado antes do redirecionamento
      setTimeout(() => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppSidebar.tsx:handleSignOut',message:'navegando para login',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        navigate('/login', { replace: true });
      }, 100);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2b337c82-09e3-44a8-815b-68d986435be3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AppSidebar.tsx:handleSignOut',message:'erro em handleSignOut',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run5',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      console.error('Erro ao fazer logout:', error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer logout",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`flex h-full flex-col bg-sidebar text-sidebar-foreground font-sans ${isCollapsed ? 'w-full' : ''}`}>
        <ScrollArea className="flex-1">
          <div className={`${isCollapsed ? 'p-1 space-y-3' : 'p-4 space-y-4'}`}>
            {/* Logo Section - DashMed Pro */}
            <div
              className={`
                flex items-center
                ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-4 px-5 py-4'}
                rounded-2xl bg-white/5 shadow-sm
                transition-all duration-300
              `}
            >
              <img 
                src={dashmedLogo} 
                alt="DashMed Pro Logo" 
                className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} transition-smooth`}
              />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-white font-semibold text-xl tracking-wide">
                    DASHMED PRO
                  </span>
                  <span className="text-white/60 text-sm">
                    Dashboard
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Items - Grouped with Separators */}
            <div className={isCollapsed ? 'space-y-2.5' : 'space-y-4'}>
              {navigationGroups.map((group, groupIndex) => {
                // Filtrar itens do grupo baseado nas permissões
                const filteredItems = group.items.filter(item => {
                  // Abas ocultas temporariamente (não exibir para nenhum cargo)
                  const hiddenUrls = [
                    '/comercial/guia-prospeccao', // Guia de Prospecção
                    '/calculadora', // Calculadora
                    '/funil-vendas', // Funil de Vendas
                    '/email-marketing', // E-mail Marketing
                    '/landing-pages', // Landing Pages
                    '/relatorios', // Relatórios
                  ];
                  if (hiddenUrls.includes(item.url)) {
                    return false;
                  }
                  
                  // Se o item tem adminOnly, só mostrar para admin/dono
                  if (item.adminOnly === true) {
                    // Se ainda está carregando o perfil, não mostrar ainda (evita flash)
                    if (isLoadingProfile || !profile) {
                      return false;
                    }
                    // Verificar se é admin ou dono - verificação direta do role
                    const userRole = profile.role;
                    const userIsAdmin = userRole === 'admin' || userRole === 'dono';
                    if (!userIsAdmin) {
                      return false;
                    }
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
                  
                  // Secretaria NÃO pode ver:
                  if (isSecretaria) {
                    // - Marketing
                    if (item.url === '/marketing') return false;
                    // - Página Financeiro
                    if (item.url === '/financeiro') return false;
                  }
                  
                  return true;
                });

                // Se não há itens no grupo após filtrar, não renderizar o grupo
                if (filteredItems.length === 0) return null;
                
                return (
                  <div key={group.label} className="space-y-1">
                    {/* Group Label */}
                    {!isCollapsed && (
                      <div className="px-3 mb-1.5">
                        <span className="text-xs font-semibold text-white/35 uppercase tracking-[0.18em]">
                          {group.label}
                        </span>
                      </div>
                    )}
                    
                    {/* Separator for collapsed state */}
                    {isCollapsed && groupIndex > 0 && (
                      <div className="h-px bg-white/10 my-1" />
                    )}
                    
                    {/* Group Items */}
                    {filteredItems.map((item) => {
                      const active = isActive(item.url)
                      const linkContent = (
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                          <div className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}>
                            <item.icon
                              className={`
                                w-7 h-7 transition-all duration-200
                                ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                                group-hover:scale-105
                              `}
                            />
                            {!isCollapsed && (
                              <span
                                className={`
                                  text-lg font-medium transition-colors duration-200
                                  ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                                `}
                              >
                                {item.title}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && item.badge && (
                            <Badge
                              variant={item.variant === 'new' ? 'default' : 'secondary'}
                              className={`
                                text-[10px] px-2 h-5 rounded-full border
                                ${item.variant === 'new' 
                                  ? 'bg-primary/15 text-primary border-primary/30' 
                                  : 'bg-white/10 text-white border-white/20'
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
                                group relative w-full block
                                ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                                rounded-2xl text-base font-medium
                                transition-all duration-200
                                ${active 
                                  ? 'bg-primary text-white shadow-sm' 
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }
                              `}
                            >
                              {linkContent}
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
          </div>
        </ScrollArea>

        {/* Settings and User Section - Bottom - Fixed at bottom */}
        <div className={`flex-shrink-0 border-t border-white/10 ${isCollapsed ? 'p-1 space-y-2.5' : 'p-4 space-y-2.5'}`}>
          {/* Theme Toggle */}
          <ThemeToggle isCollapsed={isCollapsed} />
          
          {/* Settings */}
          {(() => {
            const active = isActive('/configuracoes');
            const linkContent = (
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                <div className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}>
                  <Settings
                    className={`
                      w-7 h-7 transition-all duration-200
                      ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                      group-hover:scale-105
                    `}
                  />
                  {!isCollapsed && (
                    <span
                      className={`
                        text-lg font-medium transition-colors duration-200
                        ${active ? 'text-white' : 'text-white/70 group-hover:text-white'}
                      `}
                    >
                      Configurações
                    </span>
                  )}
                </div>
              </div>
            );
            
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink 
                    to="/configuracoes"
                    className={`
                      group relative w-full block
                      ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                      rounded-2xl text-base font-medium
                      transition-all duration-200
                      ${active 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {linkContent}
                  </NavLink>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-card text-foreground border-border">
                    Configurações
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })()}
          
          {/* User info and logout */}
          {!isCollapsed && (
            <div className="mt-3 px-3 py-2.5 bg-white/5 rounded-2xl">
              <div className="text-sm text-white/60 mb-2 truncate">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start px-2.5 py-2 h-9 rounded-2xl text-base text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}