/**
 * Dialog para atribuir/transferir conversa para uma secretária
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, User, Check } from 'lucide-react';
import { useWhatsAppAssignment } from '@/hooks/useWhatsAppAssignment';
import { useSecretaryDoctorLinks } from '@/hooks/useSecretaryDoctors';
import { cn } from '@/lib/utils';

interface AssignConversationDialogProps {
    conversationId: string;
    currentAssignedTo?: string | null;
    conversationOwnerId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AssignConversationDialog({
    conversationId,
    currentAssignedTo,
    conversationOwnerId,
    open,
    onOpenChange,
    onSuccess,
}: AssignConversationDialogProps) {
    const [selectedSecretary, setSelectedSecretary] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const { pool, isLoadingPool, assignConversation, isAssigning } = useWhatsAppAssignment();
    const { allLinks } = useSecretaryDoctorLinks();

    // Se não houver pool configurado, usar secretárias vinculadas
    const availableSecretaries = pool.length > 0
        ? pool.filter(p => p.is_active && p.is_available)
        : allLinks
            .filter(link => link.doctor_id === conversationOwnerId)
            .map(link => ({
                id: link.id,
                secretary_id: link.secretary_id,
                secretary: link.secretary,
                is_active: true,
                is_available: true,
                total_assigned: 0,
            }));

    const handleAssign = async () => {
        if (!selectedSecretary) return;

        try {
            await assignConversation({
                conversationId,
                secretaryId: selectedSecretary,
                notes: notes || undefined,
            });
            onOpenChange(false);
            onSuccess?.();
            setSelectedSecretary(null);
            setNotes('');
        } catch (error) {
            // Error handled by mutation
        }
    };

    const isTransfer = !!currentAssignedTo;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isTransfer ? 'Transferir Conversa' : 'Atribuir Conversa'}
                    </DialogTitle>
                    <DialogDescription>
                        {isTransfer
                            ? 'Selecione a secretária para receber esta conversa.'
                            : 'Selecione uma secretária para atender esta conversa.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoadingPool ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : availableSecretaries.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma secretária disponível. Configure o pool de atribuição nas configurações.
                        </p>
                    ) : (
                        <RadioGroup
                            value={selectedSecretary || ''}
                            onValueChange={setSelectedSecretary}
                            className="space-y-2"
                        >
                            {availableSecretaries.map((member) => {
                                const isCurrentAssigned = member.secretary_id === currentAssignedTo;

                                return (
                                    <label
                                        key={member.id}
                                        htmlFor={member.secretary_id}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                            selectedSecretary === member.secretary_id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-muted/50',
                                            isCurrentAssigned && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <RadioGroupItem
                                            value={member.secretary_id}
                                            id={member.secretary_id}
                                            disabled={isCurrentAssigned}
                                        />
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={member.secretary?.avatar_url || undefined} />
                                            <AvatarFallback>
                                                {member.secretary?.full_name?.[0] || <User className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {member.secretary?.full_name || member.secretary?.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.total_assigned} conversas atribuídas
                                            </p>
                                        </div>
                                        {isCurrentAssigned && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Check className="h-3 w-3 mr-1" />
                                                Atual
                                            </Badge>
                                        )}
                                    </label>
                                );
                            })}
                        </RadioGroup>
                    )}

                    {isTransfer && (
                        <div className="mt-4">
                            <Label htmlFor="notes" className="text-sm">
                                Notas da transferência (opcional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Ex: Paciente solicita informações sobre procedimento X"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="mt-1.5"
                                rows={2}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedSecretary || isAssigning}
                    >
                        {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isTransfer ? 'Transferir' : 'Atribuir'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
