import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useFinancialBudgets, BudgetWithSpent } from "@/hooks/useFinancialBudgets";
import { Loader2, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";

interface BudgetFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    budget?: BudgetWithSpent | null;
}

interface FormData {
    category_id: string;
    amount: number;
    period_start: string;
    period_end: string;
}

export function BudgetForm({ open, onOpenChange, budget }: BudgetFormProps) {
    const { data: categories, isLoading: isCategoriesLoading } = useFinancialCategories();
    const { createBudget, updateBudget, isCreating, isUpdating } = useFinancialBudgets();

    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [amountDisplay, setAmountDisplay] = useState<string>("");
    const [periodStart, setPeriodStart] = useState<Date | undefined>(startOfMonth(new Date()));
    const [periodEnd, setPeriodEnd] = useState<Date | undefined>(endOfMonth(new Date()));

    const { handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            category_id: "",
            amount: 0,
            period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
            period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        },
    });

    // Atualizar formulário quando budget ou open mudar
    useEffect(() => {
        if (open) {
            if (budget) {
                setSelectedCategoryId(budget.category_id || "");
                setAmountDisplay(budget.amount ? formatCurrencyInput(budget.amount.toString()) : "");
                setPeriodStart(budget.period_start ? new Date(budget.period_start) : startOfMonth(new Date()));
                setPeriodEnd(budget.period_end ? new Date(budget.period_end) : endOfMonth(new Date()));
                reset({
                    category_id: budget.category_id || "",
                    amount: budget.amount || 0,
                    period_start: budget.period_start || format(startOfMonth(new Date()), "yyyy-MM-dd"),
                    period_end: budget.period_end || format(endOfMonth(new Date()), "yyyy-MM-dd"),
                });
            } else {
                setSelectedCategoryId("");
                setAmountDisplay("");
                setPeriodStart(startOfMonth(new Date()));
                setPeriodEnd(endOfMonth(new Date()));
                reset({
                    category_id: "",
                    amount: 0,
                    period_start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                    period_end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
                });
            }
        }
    }, [budget, open, reset]);

    // Filtrar apenas categorias de saída
    const expenseCategories = categories?.filter(c => c.type === "saida") || [];

    const onSubmit = async (data: FormData) => {
        const numericAmount = parseCurrencyToNumber(amountDisplay) || 0;
        const budgetData = {
            category_id: selectedCategoryId,
            amount: numericAmount,
            period_start: periodStart ? format(periodStart, "yyyy-MM-dd") : data.period_start,
            period_end: periodEnd ? format(periodEnd, "yyyy-MM-dd") : data.period_end,
            status: "active" as const,
        };

        if (budget?.id) {
            await updateBudget({ id: budget.id, updates: budgetData });
        } else {
            createBudget(budgetData);
        }

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        {budget ? "Editar Orçamento" : "Novo Orçamento"}
                    </DialogTitle>
                    <DialogDescription>
                        {budget
                            ? "Atualize as informações do orçamento."
                            : "Defina um limite de gastos para uma categoria em um período."
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Categoria */}
                    <div className="space-y-2">
                        <Label htmlFor="category_id">Categoria de Despesa</Label>
                        <Select
                            value={selectedCategoryId}
                            onValueChange={(value) => {
                                setSelectedCategoryId(value);
                                setValue("category_id", value);
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {isCategoriesLoading ? (
                                    <div className="p-2 text-center text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    </div>
                                ) : expenseCategories.length === 0 ? (
                                    <div className="p-2 text-center text-muted-foreground text-sm">
                                        Nenhuma categoria de despesa cadastrada
                                    </div>
                                ) : (
                                    expenseCategories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: category.color || "#3b82f6" }}
                                                />
                                                {category.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {!selectedCategoryId && errors.category_id && (
                            <p className="text-sm text-red-500">Selecione uma categoria</p>
                        )}
                    </div>

                    {/* Valor Limite */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Valor Limite (R$)</Label>
                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="R$ 0,00"
                            value={amountDisplay}
                            onChange={(e) => {
                                const formatted = formatCurrencyInput(e.target.value);
                                setAmountDisplay(formatted);
                                setValue("amount", parseCurrencyToNumber(formatted) || 0);
                            }}
                        />
                        {(parseCurrencyToNumber(amountDisplay) || 0) <= 0 && amountDisplay !== "" && (
                            <p className="text-sm text-red-500">Informe um valor maior que zero</p>
                        )}
                    </div>

                    {/* Período */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data Inicial</Label>
                            <DatePicker
                                date={periodStart}
                                setDate={(date) => {
                                    setPeriodStart(date);
                                    if (date) setValue("period_start", format(date, "yyyy-MM-dd"));
                                }}
                                label="Início"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Final</Label>
                            <DatePicker
                                date={periodEnd}
                                setDate={(date) => {
                                    setPeriodEnd(date);
                                    if (date) setValue("period_end", format(date, "yyyy-MM-dd"));
                                }}
                                label="Fim"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isCreating || isUpdating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-indigo-500 hover:bg-indigo-600"
                            disabled={isCreating || isUpdating || !selectedCategoryId || (parseCurrencyToNumber(amountDisplay) || 0) <= 0}
                        >
                            {(isCreating || isUpdating) && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {budget ? "Salvar" : "Criar Orçamento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
