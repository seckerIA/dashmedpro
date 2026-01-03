import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FollowUpScheduleModal } from './FollowUpScheduleModal';
import { Clock } from 'lucide-react';

interface FollowUpActionProps {
  dealId: string;
  dealTitle: string;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void; // Opcional agora
  needsFollowUp?: boolean; // Opcional - pode ser removido futuramente
}

export function FollowUpAction({ dealId, dealTitle }: FollowUpActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Impede que o clique se propague para o card arrastável
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full hover:bg-blue-500/10 hover:text-blue-600"
        onClick={() => setIsModalOpen(true)}
        onPointerDown={handleInteraction}
      >
        <Clock className="w-4 h-4 mr-2" />
        Agendar Follow-up
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
