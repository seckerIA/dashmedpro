import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  AlertCircle
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
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { RecurringTransactionsManager } from "@/components/financial/RecurringTransactionsManager"
import { RecurringTransactionsWidget } from "@/components/financial/RecurringTransactionsWidget"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency, formatCurrencyShort, formatNumberShort } from "@/lib/currency"
import { EnhancedTooltip } from "@/components/charts/EnhancedTooltip"
import { getGradient, CHART_COLORS } from "@/lib/chart-colors"

import { AccountForm } from "@/components/financial/AccountForm"
import { useState } from "react"

const Financial = () => {
  const navigate = useNavigate();
  const { isAdmin, isVendedor, isGestorTrafego, isSecretaria } = useUserProfile();
  const { metrics, monthlyData, expensesByCategory, costsBreakdown, cashFlowProjection, isLoading } = useFinancialMetrics();
  const { accountsSummary, totalBalance } = useFinancialAccounts();
  const { transactions } = useFinancialTransactions();
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  // Pegar últimas 5 transações
  const recentTransactions = transactions?.slice(0, 5) || [];

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
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
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

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Saldo Total */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-none text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-emerald-100">{isSecretaria ? "Total de Sinais" : "Saldo Total"}</p>
              <Wallet className="w-5 h-5 text-emerald-100" />
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(metrics?.totalBalance || 0)}</p>
            <p className="text-xs text-emerald-100">{isSecretaria ? "Acumulado" : "Todas as contas"}</p>
          </CardContent>
        </Card>

        {/* Receitas do Mês */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{isSecretaria ? "Sinais do Mês" : "Receitas do Mês"}</p>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-500 mb-1">{formatCurrency(metrics?.monthRevenue || 0)}</p>
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
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Despesas do Mês</p>
                  <ArrowDownLeft className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-500 mb-1">{formatCurrency((metrics?.monthExpenses || 0) + (metrics?.monthTotalCosts || 0))}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">+8.2% vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            {/* Custos Totais */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Custos Totais</p>
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-3xl font-bold text-orange-500 mb-1">{formatCurrency(metrics?.monthTotalCosts || 0)}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Custos de serviços</span>
                </div>
              </CardContent>
            </Card>

            {/* Lucro Líquido */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  <DollarSign className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-500 mb-1">{formatCurrency(metrics?.monthNetProfit || 0)}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {accountsSummary.map((account) => (
                <Card key={account.id} className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          {account.type === 'conta_corrente' && <Building2 className="w-4 h-4 text-blue-500" />}
                          {account.type === 'poupanca' && <PieChart className="w-4 h-4 text-blue-500" />}
                          {account.type === 'caixa' && <Wallet className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{account.name}</p>
                          <p className="text-xs text-muted-foreground">{account.bank_name || '-'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(account.balance || 0)}</p>
                  </CardContent>
                </Card>
              ))}
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
                    labelLine={false}
                    label={({ name, percent }) => {
                      if (percent < 0.05) return '';
                      return `${name}: ${(percent * 100).toFixed(1)}%`;
                    }}
                    outerRadius={100}
                    innerRadius={60}
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
                <BarChart data={expensesByCategory || []} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrencyShort(value)} />
                  <YAxis type="category" dataKey="name" width={100} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                  <EnhancedTooltip valueFormatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
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
                    {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { icon: Receipt, label: 'Transações', color: 'blue', path: '/financeiro/transacoes' },
              { icon: DollarSign, label: 'Sinais', color: 'yellow', path: '/financeiro/sinais' },
              { icon: Building2, label: 'Contas', color: 'emerald', path: null },
              { icon: ShoppingCart, label: 'Categorias', color: 'purple', path: null },
              { icon: Zap, label: 'Recorrências', color: 'orange', path: null },
              { icon: BarChart3, label: 'Relatórios', color: 'pink', path: null },
              { icon: FileText, label: 'Orçamentos', color: 'indigo', path: null },
              { icon: TrendingUp, label: 'Previsões', color: 'cyan', path: null },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => item.path && navigate(item.path)}
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

      <AccountForm
        open={isAccountFormOpen}
        onOpenChange={setIsAccountFormOpen}
      />
    </div>
  )
}

export default Financial
