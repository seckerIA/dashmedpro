'use client'

import React, { useState, useEffect } from "react"
import {
  BarChart3,
  Calculator,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Target,
  PieChart,
  Home,
  Settings,
  UserPlus,
  LogOut,
  CheckSquare2,
  Compass,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Workflow,
  Brain,
  ShoppingCart,
  Megaphone,
  Receipt,
  MessageCircle,
  Building2,
  Zap,
  CircleDollarSign,
  Package
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type NavigationItem = {
  title: string
  url: string
  icon: React.ComponentType<any>
  badge?: string
  variant?: 'new'
  adminOnly?: boolean
  medicoOnly?: boolean
  secretariaOnly?: boolean
  subItems?: NavigationItem[]
  hidden?: boolean
  alertBadge?: boolean
}

const navigationGroups: Array<{
  label: string
  items: NavigationItem[]
}> = [
    {
      label: "Principal",
      items: [
        { title: "Dashboard", url: "/", icon: Home },
        { title: "Tarefas", url: "/tasks", icon: CheckSquare2 },
        { title: "Estoque", url: "/inventory", icon: Package, alertBadge: true },
      ]
    },
    {
      label: "Vendas & Marketing",
      items: [
        { title: "Marketing", url: "/marketing", icon: TrendingUp },
        {
          title: "CRM",
          url: "/crm",
          icon: Target,
          subItems: [
            { title: "Dashboard", url: "/crm?tab=dashboard", icon: BarChart3 },
            { title: "Pipeline", url: "/crm?tab=pipeline", icon: Workflow },
            { title: "Leads & Conversoes", url: "/crm?tab=leads", icon: TrendingUp },
            { title: "Inteligencia", url: "/crm?tab=intelligence", icon: Brain },
            { title: "Vendas & Procedimentos", url: "/crm?tab=sales", icon: ShoppingCart },
            { title: "Campanhas", url: "/crm?tab=campaigns", icon: Megaphone },
            { title: "Relatorios", url: "/crm?tab=reports", icon: BarChart3 },
          ]
        },
        { title: "Tabela de Precos", url: "/procedures", icon: DollarSign, medicoOnly: true, badge: "Novo", variant: "new" as const },
        { title: "Metricas de Equipe", url: "/team-metrics", icon: Users },
        { title: "Calendario", url: "/agenda", icon: Calendar, badge: "Novo", variant: "new" as const },
      ]
    },
    {
      label: "Atendimento",
      items: [
        { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle, badge: "Novo", variant: "new" as const },
        { title: "Prontuarios", url: "/medical-records", icon: ClipboardList, medicoOnly: true },
        { title: "Meu Financeiro", url: "/secretary/financial", icon: Receipt, secretariaOnly: true },
      ]
    },
    {
      label: "Ferramentas",
      items: [
        {
          title: "Financeiro",
          url: "/financial",
          icon: PieChart,
          subItems: [
            { title: "Dashboard", url: "/financial?tab=dashboard", icon: BarChart3 },
            { title: "Transacoes", url: "/financial?tab=transacoes", icon: Receipt },
            { title: "Sinais", url: "/financial?tab=sinais", icon: CircleDollarSign },
            { title: "Contas", url: "/financial?tab=contas", icon: Building2 },
            { title: "Categorias", url: "/financial?tab=categorias", icon: ShoppingCart },
            { title: "Recorrencias", url: "/financial?tab=recorrencias", icon: Zap },
            { title: "Relatorios", url: "/financial?tab=relatorios", icon: BarChart3 },
            { title: "Orcamentos", url: "/financial?tab=orcamentos", icon: FileText },
            { title: "Previsoes", url: "/financial?tab=previsoes", icon: TrendingUp },
          ]
        },
        { title: "Relatorios", url: "/reports", icon: BarChart3 },
      ]
    },
    {
      label: "Administracao",
      items: [
        { title: "Gerenciar Equipe", url: "/team", icon: UserPlus, medicoOnly: true },
      ]
    }
  ]

interface AppSidebarProps {
  isCollapsed?: boolean
  userProfile: {
    id: string
    email: string
    full_name?: string | null
    role: string
    organization_id?: string | null
  }
  organization?: {
    name: string
  } | null
}

export function AppSidebar({ isCollapsed = false, userProfile, organization }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentPath = pathname
  const currentSearch = searchParams.toString() ? `?${searchParams.toString()}` : ''

  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'dono'
  const isMedico = userProfile.role === 'medico'
  const isSecretaria = userProfile.role === 'secretaria'
  const isVendedor = userProfile.role === 'vendedor'
  const isGestorTrafego = userProfile.role === 'gestor_trafego'

  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    if (currentPath.startsWith('/crm')) {
      setExpandedItems(['CRM'])
    } else if (currentPath.startsWith('/financial')) {
      setExpandedItems(['Financeiro'])
    }
  }, [currentPath])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? [] : [title]
    )
  }

  const isExpanded = (title: string) => expandedItems.includes(title)
  const isActive = (path: string) => currentPath === path

  const isSubItemActive = (url: string) => {
    const [basePath, queryString] = url.split('?')
    if (currentPath !== basePath) return false
    if (!queryString) return currentPath === basePath && !currentSearch
    return currentSearch === `?${queryString}`
  }

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success("Logout realizado com sucesso")
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error("Erro ao fazer logout")
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={`flex h-full flex-col bg-sidebar text-sidebar-foreground font-sans ${isCollapsed ? 'w-full' : ''}`}>
        <ScrollArea className="flex-1">
          <div className={`${isCollapsed ? 'p-1 space-y-3' : 'p-4 space-y-4'}`}>
            {/* Logo Section */}
            <div
              className={`
                flex items-center
                ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-4 px-5 py-4'}
                rounded-2xl bg-white/5 shadow-sm
                transition-all duration-300
              `}
            >
              <Image
                src="/dashmed-logo.png"
                alt="DashMed Pro Logo"
                width={isCollapsed ? 40 : 48}
                height={isCollapsed ? 40 : 48}
                className="transition-all duration-300"
              />
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-foreground font-semibold text-xl tracking-wide whitespace-nowrap overflow-hidden">
                    {organization?.name || "DASHMED PRO"}
                  </span>
                  <span className="text-muted-foreground text-sm whitespace-nowrap overflow-hidden">
                    {organization ? "DASHMED PRO" : "Dashboard"}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation Items */}
            <div className={isCollapsed ? 'space-y-2.5' : 'space-y-4'}>
              {navigationGroups.map((group, groupIndex) => {
                const filteredItems = group.items.filter(item => {
                  if (item.hidden) return false

                  const hiddenUrls = [
                    '/calculadora',
                    '/email-marketing',
                    '/landing-pages',
                    '/reports',
                  ]
                  if (hiddenUrls.includes(item.url)) return false

                  if (item.adminOnly === true && !isAdmin) return false
                  if (item.medicoOnly === true && !isMedico && !isAdmin) return false
                  if (item.secretariaOnly === true && !isSecretaria) return false

                  if (isVendedor) {
                    if (item.url === '/financial') return false
                    if (item.url === '/reports') return false
                    if (item.url === '/marketing') return false
                  }

                  if (isGestorTrafego) {
                    if (item.url === '/financial') return false
                    if (item.url === '/crm') return false
                  }

                  if (isSecretaria) {
                    if (item.url === '/marketing') return false
                    if (item.url === '/financial') return false
                    if (item.url === '/inventory') return false
                    if (item.url === '/team-metrics') return false
                  }

                  return true
                })

                if (filteredItems.length === 0) return null

                return (
                  <div key={group.label} className="space-y-1">
                    {!isCollapsed && (
                      <div className="px-3 mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-[0.18em] whitespace-nowrap overflow-hidden text-ellipsis">
                          {group.label}
                        </span>
                      </div>
                    )}

                    {isCollapsed && groupIndex > 0 && (
                      <div className="h-px bg-white/10 my-1" />
                    )}

                    {filteredItems.map((item) => {
                      const hasSubItems = item.subItems && item.subItems.length > 0
                      const active = isActive(item.url) || (hasSubItems && currentPath.startsWith(item.url.split('?')[0]))
                      const expanded = isExpanded(item.title)

                      // Popover for collapsed sidebar with sub-items
                      if (hasSubItems && isCollapsed) {
                        return (
                          <Popover key={item.title}>
                            <PopoverTrigger asChild>
                              <button
                                className={`
                                  group relative w-full flex items-center justify-center
                                  p-2.5 rounded-2xl text-base font-medium
                                  transition-all duration-200
                                  ${active
                                    ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                  }
                                `}
                              >
                                <item.icon
                                  className={`
                                    w-8 h-8 transition-all duration-300
                                    ${active
                                      ? 'text-primary fill-primary/20 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)] scale-110 rotate-3'
                                      : 'text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-105'
                                    }
                                  `}
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="right"
                              align="start"
                              className="w-56 p-2 bg-sidebar border-white/10"
                            >
                              <div className="space-y-1">
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                  {item.title}
                                </div>
                                {item.subItems
                                  ?.filter(subItem => {
                                    if (isSecretaria && subItem.url.includes('intelligence')) return false
                                    return true
                                  })
                                  .map((subItem) => {
                                    const subActive = isSubItemActive(subItem.url)
                                    return (
                                      <Link
                                        key={subItem.title}
                                        href={subItem.url}
                                        className={`
                                          flex items-center gap-3 px-3 py-2 rounded-xl
                                          text-sm font-medium transition-all duration-200
                                          ${subActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                          }
                                        `}
                                      >
                                        <subItem.icon className="w-4 h-4" />
                                        {subItem.title}
                                      </Link>
                                    )
                                  })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )
                      }

                      // Expanded sidebar with sub-items
                      if (hasSubItems && !isCollapsed) {
                        return (
                          <div key={item.title} className="space-y-1">
                            <button
                              onClick={() => {
                                router.push(item.url)
                                if (!expanded) {
                                  toggleExpanded(item.title)
                                }
                              }}
                              className={`
                                group relative w-full flex items-center justify-between
                                px-4 py-3.5 rounded-2xl text-base font-medium
                                transition-all duration-200
                                ${active
                                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                  : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                }
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <item.icon
                                  className={`
                                    w-7 h-7 transition-all duration-300
                                    ${active
                                      ? 'text-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] scale-110'
                                      : 'text-muted-foreground group-hover:text-foreground group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'
                                    }
                                  `}
                                />
                                <span
                                  className={`
                                    text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                                    ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                                  `}
                                >
                                  {item.title}
                                </span>
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExpanded(item.title)
                                }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                              >
                                {expanded ? (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform duration-200" />
                                )}
                              </div>
                            </button>

                            <div
                              className={`
                                overflow-hidden transition-all duration-300 ease-in-out
                                ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                              `}
                            >
                              <div className="pl-4 space-y-0.5 pt-1">
                                {item.subItems
                                  ?.filter(subItem => {
                                    if (isSecretaria && subItem.url.includes('intelligence')) return false
                                    return true
                                  })
                                  .map((subItem) => {
                                    const subActive = isSubItemActive(subItem.url)
                                    return (
                                      <Link
                                        key={subItem.title}
                                        href={subItem.url}
                                        className={`
                                          group flex items-center gap-3 px-4 py-2.5 rounded-xl
                                          text-sm font-medium transition-all duration-200
                                          ${subActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                          }
                                        `}
                                      >
                                        <subItem.icon
                                          className={`
                                            w-5 h-5 transition-all duration-200
                                            ${subActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}
                                          `}
                                        />
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{subItem.title}</span>
                                      </Link>
                                    )
                                  })}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Normal item without sub-items
                      const linkContent = (
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                          <div className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}>
                            <item.icon
                              className={`
                                w-7 h-7 transition-all duration-300
                                ${active
                                  ? 'text-primary fill-primary/20 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)] scale-110 rotate-3'
                                  : 'text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.5)] group-hover:scale-105'
                                }
                              `}
                            />
                            {!isCollapsed && (
                              <span
                                className={`
                                  text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                                  ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
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
                                  : 'bg-accent/50 text-foreground border-border'
                                }
                              `}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )

                      return (
                        <Tooltip key={item.title}>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.url}
                              onClick={() => setExpandedItems([])}
                              className={`
                                group relative w-full block
                                ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                                rounded-2xl text-base font-medium
                                transition-all duration-200
                                ${active
                                  ? 'bg-gradient-to-r from-blue-600/20 to-blue-400/10 text-blue-400 border-l-2 border-l-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                                  : 'text-muted-foreground hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                }
                              `}
                            >
                              {linkContent}
                            </Link>
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
                )
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Settings and User Section */}
        <div className={`flex-shrink-0 border-t border-border ${isCollapsed ? 'p-1 space-y-2.5' : 'p-4 space-y-2.5'}`}>
          <ThemeToggle isCollapsed={isCollapsed} />

          {/* Settings */}
          {(() => {
            const active = isActive('/settings')
            const linkContent = (
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                <div className={`flex items-center ${isCollapsed ? '' : 'gap-4'}`}>
                  <Settings
                    className={`
                      w-7 h-7 transition-all duration-200
                      ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                      group-hover:scale-105
                    `}
                  />
                  {!isCollapsed && (
                    <span
                      className={`
                        text-lg font-medium transition-colors duration-200 whitespace-nowrap overflow-hidden
                        ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}
                      `}
                    >
                      Configuracoes
                    </span>
                  )}
                </div>
              </div>
            )

            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className={`
                      group relative w-full block
                      ${isCollapsed ? 'p-2.5' : 'px-4 py-3.5'}
                      rounded-2xl text-base font-medium
                      transition-all duration-200
                      ${active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    {linkContent}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-card text-foreground border-border">
                    Configuracoes
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })()}

          {/* User info and logout */}
          {!isCollapsed && (
            <div className="mt-3 px-3 py-2.5 bg-white/5 rounded-2xl">
              <div className="text-sm text-muted-foreground mb-2 truncate">
                {userProfile.email}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start px-2.5 py-2 h-9 rounded-2xl text-base text-muted-foreground hover:text-foreground hover:bg-accent"
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
