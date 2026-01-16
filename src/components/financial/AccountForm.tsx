import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { FinancialAccount } from "@/types/financial";
import { formatCurrencyInput, parseCurrencyToNumber, formatCurrency } from "@/lib/currency";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PREDEFINED_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#64748b", // Slate
    "#000000", // Black
];

const accountSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    type: z.enum(['conta_corrente', 'poupanca', 'caixa', 'investimento', 'outros']),
    bank_name: z.string().optional(),
    initial_balance: z.string().optional().transform((val) => val ? parseCurrencyToNumber(val) : 0),
    color: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: FinancialAccount | null;
}

export function AccountForm({ open, onOpenChange, account, onSuccess, onCancel, embedded = false }: AccountFormProps & { onSuccess?: () => void, onCancel?: () => void, embedded?: boolean }) {
    const { createAccount, updateAccount, isCreating, isUpdating } = useFinancialAccounts();
    const isEditing = !!account;
    const isLoading = isCreating || isUpdating;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            type: "conta_corrente",
            bank_name: "",
            initial_balance: 0,
            color: "#3b82f6",
        },
    });

    const selectedColor = watch("color");

    useEffect(() => {
        if (open || embedded) {
            if (account) {
                reset({
                    name: account.name,
                    type: account.type as any,
                    bank_name: account.bank_name || "",
                    // O schema espera string para o formulário, mas transforma em número no submit
                    // @ts-ignore
                    initial_balance: formatCurrency(account.initial_balance || 0),
                    color: account.color || "#3b82f6",
                });
            } else {
                reset({
                    name: "",
                    type: "conta_corrente",
                    bank_name: "",
                    // @ts-ignore
                    initial_balance: "R$ 0,00",
                    color: "#3b82f6",
                });
            }
        }
    }, [account, open, embedded, reset]);

    const onSubmit = (data: AccountFormData) => {
        if (isEditing && account) {
            updateAccount({
                id: account.id,
                updates: {
                    name: data.name,
                    type: data.type,
                    bank_name: data.bank_name,
                    color: data.color
                }
            }, {
                onSuccess: () => {
                    if (onOpenChange) onOpenChange(false);
                    if (onSuccess) onSuccess();
                    reset();
                }
            });
        } else {
            createAccount({
                name: data.name,
                type: data.type,
                bank_name: data.bank_name || null,
                initial_balance: Number(data.initial_balance),
                current_balance: Number(data.initial_balance),
                color: data.color,
                is_active: true
            }, {
                onSuccess: () => {
                    if (onOpenChange) onOpenChange(false);
                    if (onSuccess) onSuccess();
                    reset();
                }
            });
        }
    };

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        setValue("initial_balance", formatted as any);
    };

    const FormContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                    id="name"
                    {...register("name")}
                    placeholder="Ex: Nubank Principal"
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                        value={watch("type")}
                        onValueChange={(value) => setValue("type", value as any)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="conta_corrente">Conta Corrente</SelectItem>
                            <SelectItem value="poupanca">Poupança</SelectItem>
                            <SelectItem value="caixa">Caixa Físico</SelectItem>
                            <SelectItem value="investimento">Investimento</SelectItem>
                            <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bank_name">Instituição</Label>
                    <Input
                        id="bank_name"
                        {...register("bank_name")}
                        placeholder="Ex: Nubank, Itaú"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="initial_balance">Saldo Inicial</Label>
                <Input
                    id="initial_balance"
                    {...register("initial_balance")}
                    onChange={handleBalanceChange}
                    placeholder="R$ 0,00"
                    disabled={isEditing}
                    className="font-mono"
                />
                {isEditing && (
                    <p className="text-xs text-muted-foreground">
                        O saldo inicial não pode ser alterado após a criação. Para ajustar, crie uma transação.
                    </p>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Cor de Identificação</Label>
                    <span className="text-xs text-muted-foreground uppercase">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {PREDEFINED_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setValue("color", color)}
                            className={cn(
                                "w-8 h-8 rounded-full transition-all flex items-center justify-center hover:scale-110 focus:outline-none ring-offset-background",
                                selectedColor === color
                                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                                    : "hover:ring-2 hover:ring-muted-foreground/20"
                            )}
                            style={{ backgroundColor: color }}
                        >
                            {selectedColor === color && (
                                <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                            )}
                        </button>
                    ))}
                    <div className="relative group">
                        <div className={cn(
                            "w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary transition-colors",
                            !PREDEFINED_COLORS.includes(selectedColor || '') && selectedColor ? "ring-2 ring-offset-2 ring-primary border-transparent bg-background" : ""
                        )}>
                            <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: !PREDEFINED_COLORS.includes(selectedColor || '') ? selectedColor : 'transparent' }}
                            />
                            <Input
                                type="color"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                {...register("color")}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={embedded ? "flex justify-end gap-2 pt-4" : "hidden"}>
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Salvar Alterações" : "Criar Conta"}
                </Button>
            </div>

            {!embedded && (
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange && onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Salvar Alterações" : "Criar Conta"}
                    </Button>
                </DialogFooter>
            )}
        </form>
    );

    if (embedded) {
        return FormContent;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                </DialogHeader>
                {FormContent}
            </DialogContent>
        </Dialog>
    );
}
