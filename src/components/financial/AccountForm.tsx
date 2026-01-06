
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
import { formatCurrencyInput, parseCurrencyToNumber } from "@/lib/currency";
import { Loader2 } from "lucide-react";

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

export function AccountForm({ open, onOpenChange, account }: AccountFormProps) {
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
            initial_balance: 0, // Inicializa como número 0 para satisfazer o tipo
            color: "#3b82f6",
        },
    });

    useEffect(() => {
        if (open) {
            if (account) {
                reset({
                    name: account.name,
                    type: account.type as any,
                    bank_name: account.bank_name || "",
                    initial_balance: account.initial_balance || 0,
                    color: account.color || "#3b82f6",
                });
            } else {
                reset({
                    name: "",
                    type: "conta_corrente",
                    bank_name: "",
                    initial_balance: 0,
                    color: "#3b82f6",
                });
            }
        }
    }, [account, open, reset]);

    const onSubmit = (data: AccountFormData) => {
        // O valor de initial_balance vem do formulário, que pode ser string mascarada.
        // O Zod schema já tem um transform, mas se o useForm estiver manipulando 'any', precisamos garantir.
        // Convertendo explicitamente para garantir que seja number no payload

        // Em um form com inputs controlados de máscara, as vezes o valor "bruto" no submit ainda precisa de limpeza extra se o resolver não atuou como esperado ou se o tipo de input conflitou.
        // Mas como definimos z.string().transform(...), 'data.initial_balance' JÁ É number aqui (inferred types).

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
                    onOpenChange(false);
                    reset();
                }
            });
        } else {
            createAccount({
                name: data.name,
                type: data.type,
                bank_name: data.bank_name || null,
                initial_balance: Number(data.initial_balance), // Garante number
                current_balance: Number(data.initial_balance), // Garante number
                color: data.color,
                is_active: true
            }, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                }
            });
        }
    };

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrencyInput(e.target.value);
        // Precisamos setar o valor no form. Como o field é transformado, isso pode ser tricky com types.
        // Vamos usar any para contornar a rigidez do TS aqui temporariamente, pois o input é texto visualmente.
        setValue("initial_balance", formatted as any);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Conta" : "Nova Conta"}</DialogTitle>
                </DialogHeader>

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
                            <Label htmlFor="color">Cor de Identificação</Label>
                            <div className="flex gap-3 items-center">
                                <div className="relative group">
                                    <div
                                        className="w-10 h-10 rounded-full border-2 border-border shadow-sm overflow-hidden ring-offset-background transition-all hover:scale-105 group-hover:ring-2 ring-emerald-500/50 cursor-pointer"
                                        style={{ backgroundColor: watch("color") }}
                                    >
                                        <Input
                                            id="color"
                                            type="color"
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer p-0 border-none"
                                            {...register("color")}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <Input
                                        {...register("color")}
                                        placeholder="#000000"
                                        className="uppercase"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank_name">Instituição Financeira</Label>
                        <Input
                            id="bank_name"
                            {...register("bank_name")}
                            placeholder="Ex: Nubank, Itaú, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="initial_balance">Saldo Inicial</Label>
                        <Input
                            id="initial_balance"
                            {...register("initial_balance")}
                            onChange={handleBalanceChange}
                            placeholder="R$ 0,00"
                            disabled={isEditing}
                        />
                        {isEditing && (
                            <p className="text-xs text-muted-foreground">
                                O saldo inicial não pode ser alterado após a criação. Para ajustar o saldo, crie uma transação de ajuste.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                </form>
            </DialogContent>
        </Dialog>
    );
}
