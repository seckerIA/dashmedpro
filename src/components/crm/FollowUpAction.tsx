import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FollowUpScheduleModal } from './FollowUpScheduleModal';
import { Clock } from 'lucide-react';

interface FollowUpActionProps {
  dealId: string;
  dealTitle: string;
  onToggleFollowUp: (dealId: string, needsFollowUp: boolean) => void;
  needsFollowUp: boolean;
}

export function FollowUpAction({ dealId, dealTitle, onToggleFollowUp, needsFollowUp }: FollowUpActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Impede que o clique se propague para o card arrastável
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  if (needsFollowUp) {
    return (
      <>
        <div className="flex gap-2" onPointerDown={handleInteraction}>
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-blue-500 hover:bg-blue-600"
            onClick={() => setIsModalOpen(true)}
          >
            <Clock className="w-4 h-4 mr-2" />
            Agendar Follow-up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleFollowUp(dealId, false)}
          >
            Remover
          </Button>
        </div>
        <FollowUpScheduleModal
          dealId={dealId}
          dealTitle={dealTitle}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full hover:bg-orange-500/10 hover:text-orange-600"
      onClick={() => onToggleFollowUp(dealId, true)}
      onPointerDown={handleInteraction}
    >
      <Clock className="w-4 h-4 mr-2" />
      Marcar Follow-up
    </Button>
  );
}
