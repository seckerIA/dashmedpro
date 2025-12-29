import { Badge } from '@/components/ui/badge';
import {
  MedicalRecordStatus,
  MEDICAL_RECORD_STATUS_LABELS,
} from '@/types/medicalRecords';
import { FileText, CheckCircle, Eye, Archive } from 'lucide-react';

interface RecordStatusBadgeProps {
  status: MedicalRecordStatus;
  showIcon?: boolean;
}

export function RecordStatusBadge({ status, showIcon = false }: RecordStatusBadgeProps) {
  const getStatusVariant = (status: MedicalRecordStatus) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'reviewed':
        return 'outline';
      case 'archived':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: MedicalRecordStatus) => {
    switch (status) {
      case 'draft':
        return FileText;
      case 'completed':
        return CheckCircle;
      case 'reviewed':
        return Eye;
      case 'archived':
        return Archive;
      default:
        return FileText;
    }
  };

  const Icon = getStatusIcon(status);

  return (
    <Badge variant={getStatusVariant(status)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {MEDICAL_RECORD_STATUS_LABELS[status]}
    </Badge>
  );
}
