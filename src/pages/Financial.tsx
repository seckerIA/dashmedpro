import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDisplayDate } from "@/utils/dateUtils"
import { AnimatedCurrency } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Download,
  Filter,
  Calendar,
  Building2,
  ShoppingCart,
  Users,
  Home,
  Zap,
  FileText,
  Upload,
  Eye,
  MoreVertical,
  AlertCircle,
  Pencil,
  Trash2,
  User,
  Settings,
  CircleDollarSign
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts"
import { useFinancialTransactions } from "@/hooks/useFinancialTransactions"
import { useNavigate, useSearchParams } from "react-router-dom"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { RecurringTransactionsManager } from "@/components/financial/RecurringTransactionsManager"
import { RecurringTransactionsWidget } from "@/components/financial/RecurringTransactionsWidget"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency, formatCurrencyShort, formatNumberShort } from "@/lib/currency"
import { EnhancedTooltip } from "@/components/charts/EnhancedTooltip"
import { getGradient, CHART_COLORS } from "@/lib/chart-colors"

import { AccountForm } from "@/components/financial/AccountForm"
import { FinancialRequirementModal } from "@/components/financial/FinancialRequirementModal"
import { FinancialPageSkeleton } from "@/components/ui/LoadingSkeletons"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FinancialAccount } from "@/types/financial"

import { FinancialDistributionConfig } from "@/components/financial/FinancialDistributionConfig"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FinancialTransactions from "./FinancialTransactions"
import { SinalTab } from "@/components/financial/SinalTab"
import FinancialBudgets from "./FinancialBudgets"
import FinancialForecasts from "./FinancialForecasts"
import FinancialCategories from "./FinancialCategories"

const Financial = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const { isAdmin, isVendedor, isGestorTrafego, isSecretaria } = useUserProfile();

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", nextTab);
      return params;
    });
  };
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { metrics, monthlyData, expensesByCategory, costsBreakdown, cashFlowProjection, isLoading } = useFinancialMetrics({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  });
  const { accountsSummary, totalBalance, accounts, isLoading: isLoadingAccounts, deleteAccount } = useFinancialAccounts();
  const { transactions } = useFinancialTransactions();
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [isDistributionConfigOpen, setIsDistributionConfigOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Verificar obrigatoriedade de conta bancária
  useEffect(() => {
    if (!isLoadingAccounts && accounts && accounts.length === 0) {
      setShowRequirementModal(true);
    }
  }, [accounts, isLoadingAccounts]);

  // Bloquear acesso para vendedores e gestores de tráfego
  if (isVendedor || isGestorTrafego) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-center text-base">
              Você não tem permissão para acessar o módulo financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permissões Insuficientes</AlertTitle>
              <AlertDescription>
                Este módulo contém informações financeiras sensíveis e está disponível apenas para Administradores e Proprietários.
                Entre em contato com seu gestor para mais informações.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <FinancialPageSkeleton />;
  }

  // Pegar últimas 5 transações
  const recentTransactions = transactions?.slice(0, 5) || [];

  const handleExport = () => {
    // Implementação básica de exportação para CSV
    const headers = ["Data", "Descrição", "Categoria", "Valor", "Tipo", "Status"];
    const rows = transactions?.map(t => [
      formatDisplayDate(t.transaction_date),
      t.description,
      t.category?.name || '-',
      formatCurrency(t.amount),
      t.type,
      t.status
    ]) || [];

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financeiro_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete);
      setAccountToDelete(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Wallet className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Gestão completa de receitas e despesas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(
                "justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/y")} -{" "}
                      {format(dateRange.to, "dd/MM/y")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/y")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex border-b border-border">
                <div className="flex flex-col gap-2 p-3 border-r border-border min-w-[140px] bg-muted/10">
                  <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">Período</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(new Date()),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Este mês
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 1)),
                      to: endOfMonth(subMonths(new Date(), 1))
                    })}
                  >
                    Mês passado
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 3)),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Últimos 3 meses
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfMonth(subMonths(new Date(), 6)),
                      to: endOfMonth(new Date())
                    })}
                  >
                    Últimos 6 meses
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs font-normal"
                    onClick={() => setDateRange({
                      from: startOfYear(new Date()),
                      to: endOfYear(new Date())
                    })}
                  >
                    Este ano
                  </Button>
                </div>
                <div className="p-0">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="p-3"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDistributionConfigOpen(true)}
            className="mr-2"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Distribuição
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => navigate("/financeiro/nova-transacao")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex flex-wrap w-full gap-1.5 h-auto p-1 bg-muted/50 mb-6">
          <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transacoes" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <Receipt className="w-4 h-4 mr-2" />
            Transações
          </TabsTrigger>
          {(!isVendedor && !isGestorTrafego) && (
            <TabsTrigger value="sinais" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
              <CircleDollarSign className="w-4 h-4 mr-2" />
              Sinais
            </TabsTrigger>
          )}
          <TabsTrigger value="contas" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <Building2 className="w-4 h-4 mr-2" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="categorias" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="recorrencias" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <Zap className="w-4 h-4 mr-2" />
            Recorrências
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <FileText className="w-4 h-4 mr-2" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="previsoes" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
            <TrendingUp className="w-4 h-4 mr-2" />
            Previsões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Modal de Configuração de Distribuição */}
            <FinancialDistributionConfig
              open={isDistributionConfigOpen}
              onOpenChange={setIsDistributionConfigOpen}
            />

            {/* Modal de Nova Conta */}
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-white overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-emerald-100">{isSecretaria ? "Total de Sinais" : "Saldo Total"}</p>
                  <Wallet className="w-5 h-5 text-emerald-100" />
                </div>
                <p className="text-xl 2xl:text-2xl font-bold mb-1" title={formatCurrency(metrics?.totalBalance || 0)}>
                  <AnimatedCurrency value={metrics?.totalBalance || 0} duration={1.2} />
                </p>
                <p className="text-xs text-emerald-100">{isSecretaria ? "Acumulado" : "Todas as contas"}</p>
              </CardContent>
            </Card>

            {/* Receitas do Mês */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{isSecretaria ? "Sinais do Mês" : "Receitas do Mês"}</p>
                  <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xl 2xl:text-2xl font-bold text-emerald-500 mb-1" title={formatCurrency(metrics?.monthRevenue || 0)}>
                  <AnimatedCurrency value={metrics?.monthRevenue || 0} duration={1.2} />
                </p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">+12.5% vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            {/* Cards ocultos para secretária */}
            {!isSecretaria && (
              <>
                {/* Despesas do Mês */}
                <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Despesas Variáveis</p>
                      <ArrowDownLeft className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-xl 2xl:text-2xl font-bold text-red-500 mb-1" title={formatCurrency(metrics?.monthExpenses || 0)}>
                      <AnimatedCurrency value={metrics?.monthExpenses || 0} duration={1.2} />
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-muted-foreground">Saídas avulsas</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Custos Fixos */}
                <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Custos Fixos</p>
                      <Zap className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-xl 2xl:text-2xl font-bold text-purple-500 mb-1" title={formatCurrency(metrics?.monthFixedCosts || 0)}>
                      <AnimatedCurrency value={metrics?.monthFixedCosts || 0} duration={1.2} />
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Inclui Marketing</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Lucro Líquido */}
                <Card className="bg-gradient-to-br from-card to-card/50 border-border overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-xl 2xl:text-2xl font-bold text-blue-500 mb-1" title={formatCurrency(metrics?.monthNetProfit || 0)}>
                      <AnimatedCurrency value={metrics?.monthNetProfit || 0} duration={1.2} />
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-muted-foreground">{metrics?.netProfitMargin.toFixed(2)}% margem</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Widget de Transações Recorrentes - Oculto para secretária */}
          {!isSecretaria && <RecurringTransactionsWidget />}

          {/* Contas Bancárias - Oculto para secretária */}
          {!isSecretaria && (
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Contas Bancárias</CardTitle>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all"
                    size="sm"
                    onClick={() => setIsAccountFormOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {accountsSummary.length === 0 && (
                  <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-amber-600">Nenhuma conta bancária cadastrada</AlertTitle>
                    <AlertDescription className="text-amber-600/80">
                      Para que os recebimentos de consultas e transações financeiras sejam registrados corretamente,
                      você precisa cadastrar pelo menos uma conta bancária ativa. Clique em <strong>"Nova Conta"</strong> para começar.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accountsSummary.map((account) => {
                    const accountColor = account.color || '#3b82f6';
                    return (
                      <Card
                        key={account.id}
                        className="relative overflow-hidden border-2 transition-all hover:shadow-lg"
                        style={{
                          borderColor: `${accountColor}30`,
                          background: `linear-gradient(135deg, ${accountColor}08 0%, ${accountColor}03 100%)`
                        }}
                      >
                        {/* Barra de cor no topo */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: accountColor }}
                        />
                        <CardContent className="p-5 pt-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2.5 rounded-xl"
                                style={{ backgroundColor: `${accountColor}20` }}
                              >
                                {account.type === 'conta_corrente' && <Building2 className="w-5 h-5" style={{ color: accountColor }} />}
                                {account.type === 'poupanca' && <PieChart className="w-5 h-5" style={{ color: accountColor }} />}
                                {account.type === 'caixa' && <Wallet className="w-5 h-5" style={{ color: accountColor }} />}
                                {account.type === 'investimento' && <TrendingUp className="w-5 h-5" style={{ color: accountColor }} />}
                                {(!account.type || (account.type as string) === 'outros') && <CreditCard className="w-5 h-5" style={{ color: accountColor }} />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{account.name}</p>
                                <p className="text-xs text-muted-foreground">{account.bank_name || 'Sem instituição'}</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const fullAccount = accounts?.find(a => a.id === account.id);
                                    if (fullAccount) {
                                      setEditingAccount(fullAccount);
                                      setIsAccountFormOpen(true);
                                    }
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setAccountToDelete(account.id)}
                                  className="cursor-pointer text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <p className="text-2xl font-bold text-foreground mb-2">{formatCurrency(account.balance || 0)}</p>

                          {/* Mostrar criador se for admin/dono e tiver owner_name */}
                          {account.owner_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                              <User className="w-3 h-3" />
                              <span>Criada por: <span className="font-medium text-foreground/80">{account.owner_name}</span></span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Botão Card para Nova Conta */}
                  <button
                    onClick={() => setIsAccountFormOpen(true)}
                    className="group flex flex-col items-center justify-center h-full min-h-[160px] p-6 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-emerald-500/50 bg-muted/5 hover:bg-emerald-500/5 transition-all duration-300"
                  >
                    <div className="p-4 rounded-full bg-muted group-hover:bg-emerald-500/10 transition-colors mb-3">
                      <Plus className="w-6 h-6 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="font-medium text-muted-foreground group-hover:text-emerald-600 transition-colors">Adicionar Nova Conta</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Conta corrente, caixa ou investimento</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Receitas vs Despesas */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Receitas vs Despesas</CardTitle>
                <CardDescription>Comparativo dos últimos 5 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData || []}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyShort(value)} />
                    <EnhancedTooltip valueFormatter={(value: number) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Custos por Tipo */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Custos por Tipo</CardTitle>
                <CardDescription>Distribuição dos custos de serviços</CardDescription>
              </CardHeader>
              <CardContent>
                {!costsBreakdown || costsBreakdown.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">📊</p>
                      <p className="text-sm">Nenhum custo registrado no período</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <defs>
                        {(costsBreakdown || []).map((entry, index) => {
                          const gradient = getGradient(index);
                          return (
                            <linearGradient key={index} id={`costGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <Pie
                        data={costsBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => {
                          return `${name}: ${(percent * 100).toFixed(1)}%`;
                        }}
                        outerRadius={80}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      >
                        {(costsBreakdown || []).map((entry, index) => {
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#costGradient-${index})`}
                            />
                          );
                        })}
                      </Pie>
                      <EnhancedTooltip valueFormatter={(value: number) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Despesas por Categoria */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição do mês atual</CardDescription>
              </CardHeader>
              <CardContent>
                {!expensesByCategory || expensesByCategory.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p className="text-lg mb-2">📊</p>
                      <p className="text-sm">Nenhuma despesa registrada no mês atual</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={expensesByCategory || []} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                      <defs>
                        {(expensesByCategory || []).map((entry, index) => {
                          const gradient = getGradient(index);
                          return (
                            <linearGradient key={index} id={`expenseGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={gradient.start} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={gradient.end} stopOpacity={0.7} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyShort(value)} />
                      <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                      <EnhancedTooltip valueFormatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {(expensesByCategory || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#expenseGradient-${index})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fluxo de Caixa com Previsão */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Fluxo de Caixa e Previsão</CardTitle>
              <CardDescription>Saldo acumulado com projeção dos próximos 2 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashFlowProjection || []}>
                  <defs>
                    <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyShort(value)} />
                  <EnhancedTooltip valueFormatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Saldo Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-blue-500 border-dashed"></div>
                  <span className="text-xs text-muted-foreground">Previsão</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transações Recentes */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Transações Recentes</CardTitle>
                  <CardDescription>Últimas 5 movimentações financeiras</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Custos</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDisplayDate(transaction.transaction_date)}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.category?.name || 'Sem categoria'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{transaction.account?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === 'entrada' ? (
                            <>
                              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                              <span className="text-xs text-emerald-500">Entrada</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-500">Saída</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${transaction.type === 'entrada' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.type === 'entrada' && transaction.has_costs ? (
                          <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/20">
                            R$ {formatCurrency(transaction.total_costs || 0)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          {transaction.status || 'concluída'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cards de Navegação Rápida */}
          <Card className="bg-gradient-to-br from-card to-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {[
                  { icon: Receipt, label: 'Transações', color: 'blue', path: '/financeiro/transacoes' },
                  { icon: DollarSign, label: 'Sinais', color: 'yellow', path: '/financeiro/sinais' },
                  { icon: Building2, label: 'Contas', color: 'emerald', path: null, action: 'openAccounts' },
                  { icon: ShoppingCart, label: 'Categorias', color: 'purple', path: '/financeiro/categorias' },
                  { icon: Zap, label: 'Recorrências', color: 'orange', path: '/financeiro/recorrencias' },
                  { icon: BarChart3, label: 'Relatórios', color: 'pink', path: '/financeiro/relatorios' },
                  { icon: FileText, label: 'Orçamentos', color: 'indigo', path: '/financeiro/orcamentos' },
                  { icon: TrendingUp, label: 'Previsões', color: 'cyan', path: '/financeiro/previsoes' },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (item.action === 'openAccounts') {
                        setIsAccountFormOpen(true);
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="flex flex-col items-center justify-center p-6 bg-muted/20 hover:bg-muted/40 rounded-xl border border-border transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className={`p-3 bg-${item.color}-500/10 rounded-xl mb-3`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-500`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="transacoes" className="mt-6">
          <FinancialTransactions embedded />
        </TabsContent>

        <TabsContent value="sinais" className="mt-6">
          <SinalTab />
        </TabsContent>

        <TabsContent value="contas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
              <CardDescription>Gerencie suas contas bancárias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Gestão detalhada de contas em desenvolvimento. Utilize o Dashboard para visualizar o resumo.</p>
                <Button variant="link" onClick={() => setActiveTab('dashboard')}>
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <FinancialCategories />
        </TabsContent>

        <TabsContent value="recorrencias" className="mt-6">
          <RecurringTransactionsManager />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>Análise completa da sua situação financeira</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Conteúdo da aba Relatórios em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-6">
          <FinancialBudgets />
        </TabsContent>

        <TabsContent value="previsoes" className="mt-6">
          <FinancialForecasts />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir esta conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta
              e pode afetar o cálculo do seu saldo total se houver transações vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AccountForm
        open={isAccountFormOpen}
        onOpenChange={(open) => {
          setIsAccountFormOpen(open);
          if (!open) setEditingAccount(null);
        }}
        account={editingAccount}
      />

      <FinancialRequirementModal
        isOpen={showRequirementModal}
        onOpenChange={setShowRequirementModal}
      />
    </div>
  )
}

export default Financial
