import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MessageCircle, Calendar, DollarSign, Clock } from 'lucide-react';

interface SmartReplyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectReply: (text: string) => void;
    customerName?: string;
}

const SUGGESTIONS = [
    {
        icon: MessageCircle,
        label: 'Saudação Inicial',
        text: 'Olá! Tudo bem? Sou a secretária do Dr. e estou aqui para te ajudar. Como posso ser útil hoje?'
    },
    {
        icon: Calendar,
        label: 'Disponibilidade',
        text: 'Temos horários disponíveis para esta semana. Qual seria o melhor período para você (manhã ou tarde)?'
    },
    {
        icon: DollarSign,
        label: 'Solicitar Pagamento',
        text: 'Para confirmar seu agendamento, precisamos de um sinal de 50%. Posso enviar a chave PIX?'
    },
    {
        icon: Clock,
        label: 'Atraso / Espera',
        text: 'O Dr. está validando alguns exames e irá atrasar cerca de 10 minutos. Agradecemos sua compreensão!'
    },
    {
        icon: MessageCircle,
        label: 'Pós-Consulta',
        text: 'Olá! O Dr. pediu para saber como você está se sentindo após o procedimento de ontem. Alguma dúvida?'
    }
];

export function SmartReplyDialog({
    open,
    onOpenChange,
    onSelectReply,
    customerName
}: SmartReplyDialogProps) {

    const handleSelect = (text: string) => {
        // Personalizar com nome se disponível
        const finalText = customerName
            ? text.replace('Olá!', `Olá ${customerName}!`)
            : text;

        onSelectReply(finalText);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-purple-600">
                        <Sparkles className="h-5 w-5" />
                        Sugestões da IA
                    </DialogTitle>
                    <DialogDescription>
                        Escolha uma resposta rápida para enviar.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[300px] mt-4">
                    <div className="grid gap-2 pr-4">
                        {SUGGESTIONS.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="justify-start h-auto py-3 px-4 text-left whitespace-normal hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all group"
                                onClick={() => handleSelect(suggestion.text)}
                            >
                                <suggestion.icon className="h-4 w-4 mr-3 shrink-0 text-muted-foreground group-hover:text-purple-500" />
                                <div className="flex-1">
                                    <div className="font-semibold text-xs mb-1 text-foreground/80 group-hover:text-purple-700">
                                        {suggestion.label}
                                    </div>
                                    <div className="text-sm text-muted-foreground group-hover:text-purple-600/80">
                                        {suggestion.text}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>

                <div className="bg-muted/30 p-3 rounded-md text-[10px] text-muted-foreground mt-2 flex gap-2 items-start">
                    <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                    <p>
                        Estas são sugestões baseadas em interações comuns. Em breve, a IA aprenderá com seu histórico de conversas.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
