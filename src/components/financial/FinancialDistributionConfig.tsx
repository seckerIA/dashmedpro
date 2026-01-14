import { useState } from 'react';
import { useFinancialAccounts } from '@/hooks/useFinancialAccounts';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUserProfile } from '@/hooks/useUserProfile';

interface FinancialDistributionConfigProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FinancialDistributionConfig({ open, onOpenChange }: FinancialDistributionConfigProps) {
    const { accounts, setAsDefault, isLoading } = useFinancialAccounts();
    const { profile } = useUserProfile();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Encontrar conta padrão atual
    const defaultAccount = accounts?.find(acc => acc.is_default);
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(defaultAccount?.id);

    const handleSave = async () => {
        if (!selectedAccountId) return;

        setIsSubmitting(true);
        try {
            await setAsDefault(selectedAccountId);
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao definir conta padrão:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtrar contas: se for admin/dono, vê todas. Se não, vê só as suas.
    // O hook já filtra, mas vamos garantir que estamos mostrando as contas certas.
    const myAccounts = accounts || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Configuração de Distribuição
                    </DialogTitle>
                    <DialogDescription>
                        Defina qual conta bancária receberá automaticamente os pagamentos de consultas e procedimentos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <Alert variant="default" className="bg-primary/5 border-primary/20">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-medium">Como funciona?</AlertTitle>
                        <AlertDescription className="text-muted-foreground text-sm">
                            Todos os pagamentos registrados no calendário médico (consultas finalizadas) e conversões de leads com pagamento adiantado serão lançados na conta selecionada abaixo.
                        </AlertDescription>
                    </Alert>

                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Carregando contas...
                        </div>
                    ) : myAccounts.length === 0 ? (
                        <div className="text-center py-8 space-y-3">
                            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
                            <p className="text-muted-foreground">
                                Nenhuma conta cadastrada. Cadastre uma conta bancária primeiro.
                            </p>
                        </div>
                    ) : (
                        <RadioGroup
                            value={selectedAccountId || defaultAccount?.id}
                            onValueChange={setSelectedAccountId}
                            className="space-y-3"
                        >
                            {myAccounts.map((account) => (
                                <div
                                    key={account.id}
                                    className={`flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-all hover:bg-accent/50 ${selectedAccountId === account.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                                        }`}
                                >
                                    <RadioGroupItem value={account.id} id={account.id} className="mt-1" />
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={account.id} className="font-medium cursor-pointer flex items-center justify-between w-full">
                                            <span>{account.name}</span>
                                            {account.bank_name && (
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {account.bank_name}
                                                </Badge>
                                            )}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {account.account_number ? `Conta: ${account.account_number}` : 'Sem número'}
                                        </p>
                                        {account.is_default && (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                                                <CheckCircle2 className="h-3 w-3" /> Atual Padrão
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting || !selectedAccountId || myAccounts.length === 0}
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Configuração'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
