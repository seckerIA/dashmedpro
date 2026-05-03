import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FollowUpScheduleModal } from './FollowUpScheduleModal';
import { Clock } from 'lucide-react';

interface FollowUpActionProps {
  dealId: string;
  dealTitle: string;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void; // Opcional agora
  needsFollowUp?: boolean; // Opcional - pode ser removido futuramente
  /** Card compacto no pipeline */
  compact?: boolean;
}

export function FollowUpAction({ dealId, dealTitle, compact }: FollowUpActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Impede que o clique se propague para o card arrastável
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Button
        variant={compact ? 'ghost' : 'outline'}
        size="sm"
        className={
          compact
            ? 'h-7 w-full text-[11px] font-normal text-muted-foreground hover:text-primary hover:bg-muted/60 px-2'
            : 'w-full hover:bg-blue-500/10 hover:text-blue-600'
        }
        onClick={() => setIsModalOpen(true)}
        onPointerDown={handleInteraction}
      >
        <Clock className={compact ? 'w-3 h-3 mr-1.5 shrink-0' : 'w-4 h-4 mr-2'} />
        {compact ? 'Follow-up' : 'Agendar Follow-up'}
      </Button>
      <FollowUpScheduleModal
        dealId={dealId}
        dealTitle={dealTitle}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
