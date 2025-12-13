import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SalesCallWithRelations, CALL_STATUS_LABELS, CALL_STATUS_COLORS } from '@/types/salesCalls';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  FileText,
  Edit,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { useSalesCalls } from '@/hooks/useSalesCalls';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface CallDetailsModalProps {
  call: SalesCallWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (call: SalesCallWithRelations) => void;
}

export function CallDetailsModal({ call, open, onOpenChange, onEdit }: CallDetailsModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { markAsCompleted, markAsCancelled, markAsNoShow } = useSalesCalls();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!call) return null;

  const statusColors = CALL_STATUS_COLORS[call.status];
  const initials = call.contact.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleMarkAsCompleted = async () => {
    setIsProcessing(true);
    try {
      await markAsCompleted.mutateAsync(call.id);
      toast({
        title: 'Call marcada como realizada',
        description: 'A call foi marcada como realizada com sucesso.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a call como realizada.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsCancelled = async () => {
    setIsProcessing(true);
    try {
      await markAsCancelled.mutateAsync(call.id);
      toast({
        title: 'Call cancelada',
        description: 'A call foi cancelada com sucesso.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a call.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsNoShow = async () => {
    setIsProcessing(true);
    try {
      await markAsNoShow.mutateAsync(call.id);
      toast({
        title: 'Call marcada como não compareceu',
        description: 'A call foi marcada como não compareceu.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a call.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToContact = () => {
    onOpenChange(false);
    navigate('/crm');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Detalhes da Call
          </DialogTitle>
          <DialogDescription>
            Informações completas da call de vendas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Cabeçalho com cliente */}
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{call.title}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{call.contact.full_name}</span>
              </div>
              {call.contact.company && (
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{call.contact.company}</span>
                </div>
              )}
            </div>
            <Badge 
              variant="secondary" 
              className={`${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
            >
              {CALL_STATUS_LABELS[call.status]}
            </Badge>
          </div>

          <Separator />

          {/* Informações da call */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Data e Horário</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(call.scheduled_at), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm font-medium mt-1">
                  {format(parseISO(call.scheduled_at), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Duração</p>
                <p className="text-sm text-muted-foreground">
                  {call.duration_minutes} minutos
                </p>
              </div>
            </div>

            {call.deal && (
              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Deal Relacionado</p>
                  <p className="text-sm text-muted-foreground">
                    {call.deal.title}
                  </p>
                </div>
              </div>
            )}

            {call.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">Notas</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {call.notes}
                  </p>
                </div>
              </div>
            )}

            {call.completed_at && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-positive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Realizada em</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(call.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Ações */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => onEdit(call)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Call
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleGoToContact}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Contato no CRM
            </Button>

            {call.status === 'scheduled' && (
              <>
                <Separator className="my-2" />
                
                <Button
                  variant="outline"
                  className="w-full justify-start text-positive hover:text-positive"
                  onClick={handleMarkAsCompleted}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Realizada
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleMarkAsCancelled}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar Call
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleMarkAsNoShow}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Marcar como Não Compareceu
                </Button>
              </>
            )}
          </div>

          {/* Metadados */}
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Criada em: {format(parseISO(call.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
            <p>Atualizada em: {format(parseISO(call.updated_at), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

