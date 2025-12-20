import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, MapPin, Users, MoreVertical, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GeneralMeeting, MEETING_TYPE_LABELS, MEETING_STATUS_LABELS, MEETING_TYPE_COLORS, MEETING_STATUS_COLORS } from '@/types/generalMeetings';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  meeting: GeneralMeeting;
  onEdit?: () => void;
  onDelete?: () => void;
  onMarkCompleted?: () => void;
  onCancel?: () => void;
}

export function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onMarkCompleted,
  onCancel,
}: MeetingCardProps) {
  const startTime = format(parseISO(meeting.start_time), 'HH:mm', { locale: ptBR });
  const endTime = format(parseISO(meeting.end_time), 'HH:mm', { locale: ptBR });
  const typeColors = MEETING_TYPE_COLORS[meeting.meeting_type];
  const statusColors = MEETING_STATUS_COLORS[meeting.status];

  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200 border-border bg-gradient-card",
      meeting.is_busy && "border-orange-500/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Conteúdo principal */}
          <div className="flex-1 space-y-3">
            {/* Header: Horário e Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-lg">{startTime}</span>
                {meeting.end_time && (
                  <>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-sm text-muted-foreground">{endTime}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>

            {/* Título */}
            <div>
              <h3 className="font-semibold text-base">{meeting.title}</h3>
            </div>

            {/* Informações adicionais */}
            <div className="space-y-2">
              {meeting.description && (
                <p className="text-sm text-muted-foreground">{meeting.description}</p>
              )}

              {meeting.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{meeting.location}</span>
                </div>
              )}

              {meeting.attendees && meeting.attendees.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{meeting.attendees.join(', ')}</span>
                </div>
              )}

              {meeting.is_busy && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                  Indisponível para consultas
                </Badge>
              )}
            </div>
          </div>

          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {meeting.status !== 'completed' && onMarkCompleted && (
                <DropdownMenuItem onClick={onMarkCompleted}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </DropdownMenuItem>
              )}
              {meeting.status !== 'cancelled' && onCancel && (
                <DropdownMenuItem onClick={onCancel}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}











