import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GeneralMeeting, MEETING_TYPE_LABELS, MEETING_STATUS_LABELS, MEETING_TYPE_COLORS, MEETING_STATUS_COLORS } from '@/types/generalMeetings';
import { Edit, Trash2, CheckCircle2, XCircle, Clock, MapPin, Users, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: GeneralMeeting | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkCompleted?: () => void;
  onCancel?: () => void;
}

export function MeetingDetailsModal({
  open,
  onOpenChange,
  meeting,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCancel,
}: MeetingDetailsModalProps) {
  if (!meeting) return null;

  const startTime = parseISO(meeting.start_time);
  const endTime = parseISO(meeting.end_time);
  const typeColors = MEETING_TYPE_COLORS[meeting.meeting_type];
  const statusColors = MEETING_STATUS_COLORS[meeting.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            {meeting.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1',
                typeColors.bg,
                typeColors.text,
                typeColors.border
              )}
            >
              {MEETING_TYPE_LABELS[meeting.meeting_type]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'inline-flex items-center gap-1',
                statusColors.bg,
                statusColors.text,
                statusColors.border
              )}
            >
              {MEETING_STATUS_LABELS[meeting.status]}
            </Badge>
            {meeting.is_busy && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                Indisponível para consultas
              </Badge>
            )}
          </div>

          {/* Informações principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horário */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Horário</span>
              </div>
              <p className="text-base font-semibold">
                {format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-lg font-bold text-primary">
                {format(startTime, 'HH:mm', { locale: ptBR })} - {format(endTime, 'HH:mm', { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                Duração: {meeting.duration_minutes} minutos
              </p>
            </div>

            {/* Local */}
            {meeting.location && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Local</span>
                </div>
                <p className="text-base">{meeting.location}</p>
              </div>
            )}
          </div>

          {/* Participantes */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-medium">Participantes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {meeting.attendees.map((attendee, index) => (
                  <Badge key={index} variant="secondary">
                    {attendee}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          {meeting.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Descrição</span>
              </div>
              <p className="text-base whitespace-pre-wrap">{meeting.description}</p>
            </div>
          )}

          {/* Notas Internas */}
          {meeting.notes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Notas Internas</span>
              </div>
              <p className="text-base whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{meeting.notes}</p>
            </div>
          )}

          {/* Informações de criação */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>
              Criado em: {format(parseISO(meeting.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            {meeting.updated_at !== meeting.created_at && (
              <p>
                Atualizado em: {format(parseISO(meeting.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="flex-1 sm:flex-none">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {meeting.status !== 'completed' && onMarkCompleted && (
              <Button variant="outline" onClick={onMarkCompleted} className="flex-1 sm:flex-none">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Concluído
              </Button>
            )}
            {meeting.status !== 'cancelled' && onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Reunião
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}







