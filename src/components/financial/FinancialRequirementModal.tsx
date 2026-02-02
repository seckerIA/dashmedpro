import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AccountForm } from '@/components/financial/AccountForm'; // Assumindo caminho
import { useFinancialAccounts } from '@/hooks/useFinancialAccounts';
import { HandCoins, Wallet } from 'lucide-react';

interface FinancialRequirementModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function FinancialRequirementModal({
    isOpen,
    onOpenChange,
    onSuccess,
}: FinancialRequirementModalProps) {
    const { createAccount, isCreating, accounts } = useFinancialAccounts();
    const [showForm, setShowForm] = useState(false);

    // Se já tem contas e o modal está aberto, fecha automaticamente (autocorreção)
    React.useEffect(() => {
        if (isOpen && accounts && accounts.length > 0 && !showForm) {
            onOpenChange(false);
            if (onSuccess) onSuccess();
        }
    }, [accounts, isOpen, onSuccess, onOpenChange, showForm]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 mb-4">
                        <HandCoins className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <DialogTitle className="text-center text-xl">⚠️ Conta Bancária Obrigatória</DialogTitle>
                    <DialogDescription className="text-center pt-2 space-y-2" asChild>
                        <div className="text-sm text-muted-foreground">
                            <p className="font-semibold text-orange-600 dark:text-orange-400">
                                Antes de marcar consultas como pagas, você PRECISA cadastrar uma conta bancária!
                            </p>
                            <p>
                                Sem uma conta cadastrada, os pagamentos das consultas <strong className="text-destructive">NÃO serão registrados</strong> no financeiro e você perderá o controle do seu faturamento.
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {!showForm ? (
                        <div className="bg-muted/50 p-4 rounded-lg border border-dashed text-sm text-center text-muted-foreground flex flex-col items-center gap-2">
                            <Wallet className="h-8 w-8 text-muted-foreground/50" />
                            <p>Nenhuma conta encontrada.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-4 bg-background">
                            <AccountForm
                                open={true}
                                onOpenChange={() => { }}
                                embedded={true}
                                onSuccess={() => {
                                    setShowForm(false);
                                    // O useEffect vai cuidar de fechar e chamar onSuccess
                                }}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    )}
                </div>

                {!showForm && (
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => setShowForm(true)} className="w-full">
                            Cadastrar Conta Agora
                        </Button>
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                            Cancelar e voltar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
