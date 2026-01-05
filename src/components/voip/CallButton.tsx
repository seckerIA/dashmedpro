import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useActiveCall } from '@/hooks/useActiveCall';
import { useVOIPConfig } from '@/hooks/useVOIPConfig';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CallButtonProps {
    phoneNumber: string | null | undefined;
    contactId?: string;
    contactName?: string;
    conversationId?: string;
    className?: string;
    disabled?: boolean;
}

export function CallButton({
    phoneNumber,
    contactId,
    contactName,
    conversationId,
    className,
    disabled = false
}: CallButtonProps) {
    const { makeCall, deviceState } = useActiveCall();
    const { isReady } = useVOIPConfig();

    const handleCall = () => {
        if (phoneNumber) {
            makeCall(phoneNumber, contactId, conversationId, contactName);
        }
    };

    const isCallDisabled = disabled || !phoneNumber || !isReady || deviceState !== 'ready';

    let tooltipText = 'Ligar via VOIP';
    if (!phoneNumber) tooltipText = 'Telefone indisponível';
    else if (!isReady) tooltipText = 'VOIP não configurado';
    else if (deviceState !== 'ready') tooltipText = 'Conectando ao serviço de voz...';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={className}>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCall}
                            disabled={isCallDisabled}
                            className="h-9 w-9"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
