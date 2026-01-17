import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, AlertTriangle, Trash2, Edit, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Progress } from "@/components/ui/progress";
import { useFinancialBudgets, BudgetWithSpent } from "@/hooks/useFinancialBudgets";
import { BudgetForm } from "@/components/financial/BudgetForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FinancialBudgets = () => {
    const {
        budgets,
        isLoading,
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentage,
        deleteBudget,
        isDeleting
    } = useFinancialBudgets();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return "text-red-500";
        if (percent >= 70) return "text-amber-500";
        return "text-emerald-500";
    };

    const handleEdit = (budget: BudgetWithSpent) => {
        setEditingBudget(budget);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (budgetToDelete) {
            await deleteBudget(budgetToDelete);
            setBudgetToDelete(null);
        }
    };

    const handleFormClose = (open: boolean) => {
        setIsFormOpen(open);
        if (!open) setEditingBudget(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="h-6 w-6 text-indigo-500" />
                        Orçamentos
                    </h1>
                    <p className="text-muted-foreground">Controle e acompanhamento de orçamentos mensais</p>
                </div>
                <Button
                    className="bg-indigo-500 hover:bg-indigo-600 gap-2"
                    onClick={() => setIsFormOpen(true)}
                >
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
                            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalRemaining)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">% Utilizado</p>
                            <p className={`text-2xl font-bold ${getStatusColor(overallPercentage)}`}>
                                {overallPercentage.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Progress value={Math.min(overallPercentage, 100)} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Lista de Orçamentos */}
            {(!budgets || budgets.length === 0) ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium mb-2">Nenhum orçamento cadastrado</h3>
                        <p className="text-muted-foreground mb-4">
                            Crie seu primeiro orçamento para controlar seus gastos por categoria.
                        </p>
                        <Button
                            className="bg-indigo-500 hover:bg-indigo-600"
                            onClick={() => setIsFormOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Orçamento
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {budgets.map((budget) => {
                        const percent = budget.percentage_used;
                        const isOverBudget = budget.remaining < 0;

                        return (
                            <Card key={budget.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: budget.category_color || "#3b82f6" }}
                                            />
                                            <CardTitle className="text-lg">{budget.category_name}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {percent >= 90 && (
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(budget)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setBudgetToDelete(budget.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        {format(new Date(budget.period_start), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(budget.period_end), "dd/MM/yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Gasto: {formatCurrency(budget.spent)}</span>
                                        <span className={getStatusColor(percent)}>
                                            {isOverBudget ? 'Excedido!' : `${formatCurrency(budget.remaining)} restante`}
                                        </span>
                                    </div>
                                    <Progress
                                        value={Math.min(percent, 100)}
                                        className={`h-2 ${percent >= 100 ? '[&>div]:bg-red-500' : ''}`}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{percent.toFixed(0)}% utilizado</span>
                                        <span>Limite: {formatCurrency(budget.amount)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Form Dialog */}
            <BudgetForm
                open={isFormOpen}
                onOpenChange={handleFormClose}
                budget={editingBudget}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O orçamento será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default FinancialBudgets
