import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Plus, Calendar, DollarSign, TrendingUp, AlertTriangle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { formatCurrency } from "@/lib/currency"
import { Progress } from "@/components/ui/progress"

// Dados mockados - implementar com banco de dados posteriormente
const mockBudgets = [
    { id: 1, name: "Marketing Digital", budget: 5000, spent: 3200, category: "Marketing" },
    { id: 2, name: "Pessoal", budget: 15000, spent: 14500, category: "RH" },
    { id: 3, name: "Infraestrutura", budget: 2000, spent: 800, category: "TI" },
    { id: 4, name: "Materiais", budget: 3000, spent: 1200, category: "Operacional" },
]

const FinancialBudgets = () => {
    const navigate = useNavigate()
    const [budgets] = useState(mockBudgets)

    const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
    const percentUsed = (totalSpent / totalBudget) * 100

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return "text-red-500"
        if (percent >= 70) return "text-amber-500"
        return "text-emerald-500"
    }

    const getProgressColor = (percent: number) => {
        if (percent >= 90) return "bg-red-500"
        if (percent >= 70) return "bg-amber-500"
        return "bg-emerald-500"
    }

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
                            <FileText className="h-6 w-6 text-indigo-500" />
                            Orçamentos
                        </h1>
                        <p className="text-muted-foreground">Controle e acompanhamento de orçamentos mensais</p>
                    </div>
                </div>
                <Button className="bg-indigo-500 hover:bg-indigo-600 gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Orçamento
                </Button>
            </div>

            {/* Card de Resumo Geral */}
            <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Orçamento Total</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBudget)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
                            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Disponível</p>
                            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalBudget - totalSpent)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">% Utilizado</p>
                            <p className={`text-2xl font-bold ${getStatusColor(percentUsed)}`}>{percentUsed.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Progress value={percentUsed} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Orçamentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((budget) => {
                    const percent = (budget.spent / budget.budget) * 100
                    const remaining = budget.budget - budget.spent
                    const isOverBudget = remaining < 0

                    return (
                        <Card key={budget.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                                    {percent >= 90 && (
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    )}
                                </div>
                                <CardDescription>{budget.category}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Gasto: {formatCurrency(budget.spent)}</span>
                                    <span className={getStatusColor(percent)}>
                                        {isOverBudget ? 'Excedido!' : `${formatCurrency(remaining)} restante`}
                                    </span>
                                </div>
                                <Progress value={Math.min(percent, 100)} className={`h-2 ${percent >= 100 ? '[&>div]:bg-red-500' : ''}`} />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{percent.toFixed(0)}% utilizado</span>
                                    <span>Limite: {formatCurrency(budget.budget)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Nota */}
            <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Em desenvolvimento:</strong> A funcionalidade completa de orçamentos com criação, edição e integração com transações será implementada em breve.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

export default FinancialBudgets
