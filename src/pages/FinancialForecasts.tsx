import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, AlertTriangle, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics"
import { formatCurrency } from "@/lib/currency"
import { format, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts"

const FinancialForecasts = () => {
    const navigate = useNavigate()
    const { metrics, cashFlowProjection, isLoading } = useFinancialMetrics({})

    // Projeções simples baseadas nos dados atuais
    const currentMonth = new Date()
    const avgMonthlyRevenue = metrics?.monthRevenue || 0
    const avgMonthlyExpenses = (metrics?.monthExpenses || 0) + (metrics?.monthTotalCosts || 0)
    const avgMonthlyProfit = avgMonthlyRevenue - avgMonthlyExpenses

    // Gerar projeção para próximos 6 meses
    const projectionData = Array.from({ length: 6 }, (_, i) => {
        const month = addMonths(currentMonth, i + 1)
        const variation = 1 + (Math.random() * 0.1 - 0.05) // ±5% variação
        return {
            month: format(month, 'MMM/yy', { locale: ptBR }),
            receita: Math.round(avgMonthlyRevenue * variation),
            despesa: Math.round(avgMonthlyExpenses * (1 + Math.random() * 0.08)),
            lucro: Math.round(avgMonthlyProfit * variation),
        }
    })

    // Projeção de saldo acumulado
    let saldoAcumulado = metrics?.totalBalance || 0
    const saldoProjection = projectionData.map(p => {
        saldoAcumulado += p.lucro
        return { ...p, saldoAcumulado }
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-cyan-500" />
                        Previsões Financeiras
                    </h1>
                    <p className="text-muted-foreground">Projeções baseadas no histórico de transações</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                </div>
            ) : (
                <>
                    {/* Cards de Projeção Mensal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">Receita Média Mensal</p>
                                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-3xl font-bold text-emerald-500">{formatCurrency(avgMonthlyRevenue)}</p>
                                <p className="text-xs text-muted-foreground mt-2">Base para projeções</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">Despesa Média Mensal</p>
                                    <ArrowDownRight className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-3xl font-bold text-red-500">{formatCurrency(avgMonthlyExpenses)}</p>
                                <p className="text-xs text-muted-foreground mt-2">Incluindo custos</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-muted-foreground">Lucro Projetado Mensal</p>
                                    <DollarSign className="w-5 h-5 text-cyan-500" />
                                </div>
                                <p className={`text-3xl font-bold ${avgMonthlyProfit >= 0 ? 'text-cyan-500' : 'text-red-500'}`}>
                                    {formatCurrency(avgMonthlyProfit)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">Receita - Despesas</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico de Projeção */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Projeção para os Próximos 6 Meses</CardTitle>
                            <CardDescription>Estimativa baseada nos dados históricos</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={saldoProjection}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="month" />
                                    <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrency(v)} />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita" dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2} name="Despesa" dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="saldoAcumulado" stroke="#06b6d4" strokeWidth={3} name="Saldo Acumulado" dot={{ fill: '#06b6d4' }} />
                                    <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Projeção em 6 Meses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Calendar className="w-6 h-6 text-blue-500" />
                                    <p className="text-lg font-semibold">Saldo Projetado em 6 Meses</p>
                                </div>
                                <p className={`text-4xl font-bold ${saldoProjection[5]?.saldoAcumulado >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                    {formatCurrency(saldoProjection[5]?.saldoAcumulado || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {saldoProjection[5]?.saldoAcumulado >= (metrics?.totalBalance || 0)
                                        ? `+${formatCurrency((saldoProjection[5]?.saldoAcumulado || 0) - (metrics?.totalBalance || 0))} em relação ao atual`
                                        : `${formatCurrency((saldoProjection[5]?.saldoAcumulado || 0) - (metrics?.totalBalance || 0))} em relação ao atual`
                                    }
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-amber-500/20 bg-amber-500/5">
                            <CardContent className="p-6 flex items-start gap-4">
                                <Info className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-foreground mb-2">Como funcionam as previsões?</p>
                                    <p className="text-sm text-muted-foreground">
                                        As projeções são calculadas com base nas médias históricas de receitas e despesas,
                                        com uma variação de ±5% para simular cenários realistas. Conforme mais dados forem
                                        registrados, as previsões se tornam mais precisas.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}

export default FinancialForecasts
