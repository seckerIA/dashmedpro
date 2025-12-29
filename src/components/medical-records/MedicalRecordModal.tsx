import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MedicalRecordForm } from './MedicalRecordForm';
import { PatientHistorySidebar } from './PatientHistorySidebar';
import { useMemo } from 'react';

interface MedicalRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  appointmentId?: string | null;
  recordId?: string | null;
  contactName?: string;
}

export function MedicalRecordModal({
  open,
  onOpenChange,
  contactId,
  appointmentId,
  recordId,
  contactName,
}: MedicalRecordModalProps) {
  const handleSave = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const title = useMemo(() => {
    if (recordId) {
      return 'Editar Prontuário';
    }
    if (contactName) {
      return `Novo Prontuário - ${contactName}`;
    }
    return 'Novo Prontuário';
  }, [recordId, contactName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Main Form - Scrollable */}
          <div className="flex-1 overflow-y-auto pr-2">
            <MedicalRecordForm
              recordId={recordId}
              contactId={contactId}
              appointmentId={appointmentId}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>

          {/* Sidebar - Patient History */}
          <div className="w-80 flex-shrink-0 overflow-y-auto">
            <PatientHistorySidebar contactId={contactId} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
