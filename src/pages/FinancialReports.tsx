import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Download, Calendar, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from "recharts"

const FinancialReports = () => {
    const navigate = useNavigate()
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    })

    const { metrics, monthlyData, expensesByCategory, isLoading } = useFinancialMetrics({
        startDate: dateRange?.from,
        endDate: dateRange?.to,
    })

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <BarChart3 className="h-6 w-6 text-pink-500" />
                            Relatórios Financeiros
                        </h1>
                        <p className="text-muted-foreground">Análises detalhadas das suas finanças</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "dd/MM/yyyy")
                                    )
                                ) : (
                                    "Selecionar período"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar PDF
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
            ) : (
                <>
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Total Receitas</p>
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(metrics?.monthRevenue || 0)}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Total Despesas</p>
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-500">{formatCurrency(metrics?.monthExpenses || 0)}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-blue-500">{formatCurrency(metrics?.monthNetProfit || 0)}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                                    <PieChart className="w-5 h-5 text-purple-500" />
                                </div>
                                <p className="text-2xl font-bold text-purple-500">{(metrics?.netProfitMargin || 0).toFixed(1)}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Evolução Mensal */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Evolução Mensal</CardTitle>
                                <CardDescription>Receitas vs Despesas ao longo do tempo</CardDescription>
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
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="month" />
                                        <YAxis tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                        <Area type="monotone" dataKey="receitas" stroke="#10b981" fill="url(#colorReceitas)" name="Receitas" />
                                        <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="url(#colorDespesas)" name="Despesas" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Despesas por Categoria */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Despesas por Categoria</CardTitle>
                                <CardDescription>Distribuição das despesas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={expensesByCategory || []}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {(expensesByCategory || []).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default FinancialReports
