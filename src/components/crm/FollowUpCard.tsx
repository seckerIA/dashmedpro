import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CRMDealWithContact } from "@/types/crm";
import { FollowUp } from "@/types/followUp";
import { formatDistanceToNow, format, parseISO, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, DollarSign, Clock, Phone, Mail, MessageCircle, CheckCircle2, AlertCircle, Edit } from "lucide-react";
import { getServiceConfig } from "@/constants/services";

interface FollowUpCardProps {
  deal: CRMDealWithContact;
  followUp?: FollowUp; // Follow-up agendado opcional
  onClick?: () => void;
  onCompleteFollowUp?: (followUpId: string) => void;
  onEditFollowUp?: (followUp: FollowUp) => void;
}

export function FollowUpCard({ deal, followUp, onClick, onCompleteFollowUp, onEditFollowUp }: FollowUpCardProps) {
  const formatCurrency = (value: string | number | null) => {
    if (!value) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  // Calcular se está atrasado
  let isOverdue = false;
  let isScheduledToday = false;
  
  if (followUp) {
    // Se tem follow-up agendado, verificar a data/hora
    const scheduledDateTime = parseISO(`${followUp.scheduled_date}T${followUp.scheduled_time}`);
    isOverdue = isBefore(scheduledDateTime, new Date());
    isScheduledToday = isToday(scheduledDateTime);
  } else if (deal.contact?.last_contact_at) {
    // Se não tem follow-up mas tem último contato, usar lógica antiga (3 dias)
    isOverdue = new Date().getTime() - new Date(deal.contact.last_contact_at).getTime() > 3 * 24 * 60 * 60 * 1000;
  } else {
    // Sem contato
    isOverdue = true;
  }

  return (
    <Card 
      onClick={onClick}
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border cursor-pointer hover:border-primary/30"
    >
      {/* Indicador de urgência/status */}
      {isScheduledToday && !isOverdue ? (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-300 text-xs px-2 py-0.5">
            Hoje
          </Badge>
        </div>
      ) : isOverdue ? (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      ) : null}
      
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {deal.title}
            </h4>
            {deal.contact && deal.contact.full_name && (
              <div className="space-y-1 mt-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{deal.contact.full_name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Follow-up Agendado */}
        {followUp ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3 text-primary" />
              <span className={`font-medium ${isOverdue ? 'text-red-500' : isScheduledToday ? 'text-blue-600' : 'text-muted-foreground'}`}>
                {format(parseISO(followUp.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às {followUp.scheduled_time}
              </span>
            </div>
            
            {followUp.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 pl-4 border-l-2 border-primary/30">
                {followUp.description}
              </p>
            )}

            {/* Badge de Status e Ações */}
            <div className="flex items-center justify-between">
              <Badge 
                variant={followUp.status === 'concluido' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {followUp.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                {followUp.status === 'concluido' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {followUp.status === 'cancelado' && <AlertCircle className="w-3 h-3 mr-1" />}
                {followUp.status === 'pendente' ? 'Pendente' : followUp.status === 'concluido' ? 'Concluído' : 'Cancelado'}
              </Badge>

              {followUp.status === 'pendente' && (
                <div className="flex gap-1">
                  {onEditFollowUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFollowUp(followUp);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {onCompleteFollowUp && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs hover:bg-green-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteFollowUp(followUp.id);
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Último contato (quando não há follow-up agendado) */
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {deal.contact?.last_contact_at ? (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(deal.contact.last_contact_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="w-3 h-3" />
                <span>Sem contato</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
