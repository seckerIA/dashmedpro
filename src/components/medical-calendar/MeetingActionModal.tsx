import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MeetingActionType = 'cancel' | 'delete';

interface MeetingActionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    meetingTitle: string;
    actionType: MeetingActionType;
    onConfirm: (reason?: string) => void;
    isLoading?: boolean;
}

export function MeetingActionModal({
    open,
    onOpenChange,
    meetingTitle,
    actionType,
    onConfirm,
    isLoading = false,
}: MeetingActionModalProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        onConfirm(reason || undefined);
        setReason('');
    };

    const handleClose = () => {
        setReason('');
        onOpenChange(false);
    };

    const config = {
        cancel: {
            title: 'Cancelar Reunião',
            description: `Você está prestes a cancelar a reunião "${meetingTitle}". Esta ação pode ser revertida posteriormente.`,
            icon: XCircle,
            iconColor: 'text-orange-500',
            iconBg: 'bg-orange-500/10',
            confirmText: 'Confirmar Cancelamento',
            confirmVariant: 'default' as const,
            showReason: true,
            reasonLabel: 'Motivo do cancelamento (opcional)',
            reasonPlaceholder: 'Informe o motivo do cancelamento...',
        },
        delete: {
            title: 'Excluir Reunião',
            description: `Você está prestes a excluir permanentemente a reunião "${meetingTitle}". Esta ação não pode ser desfeita.`,
            icon: Trash2,
            iconColor: 'text-destructive',
            iconBg: 'bg-destructive/10',
            confirmText: 'Excluir Reunião',
            confirmVariant: 'destructive' as const,
            showReason: false,
            reasonLabel: '',
            reasonPlaceholder: '',
        },
    };

    const currentConfig = config[actionType];
    const Icon = currentConfig.icon;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className={cn('p-3 rounded-full', currentConfig.iconBg)}>
                            <Icon className={cn('h-6 w-6', currentConfig.iconColor)} />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">{currentConfig.title}</DialogTitle>
                        </div>
                    </div>
                    <DialogDescription className="pt-4 text-base">
                        {currentConfig.description}
                    </DialogDescription>
                </DialogHeader>

                {currentConfig.showReason && (
                    <div className="space-y-2 py-4">
                        <Label htmlFor="cancel-reason">{currentConfig.reasonLabel}</Label>
                        <Textarea
                            id="cancel-reason"
                            placeholder={currentConfig.reasonPlaceholder}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Voltar
                    </Button>
                    <Button
                        variant={currentConfig.confirmVariant}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processando...' : currentConfig.confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
