import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRMDealWithContact } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, Edit, Trash2, TrendingUp, Clock, Mail, Phone, Building2, Stethoscope, AlertTriangle } from "lucide-react";
import { FollowUpAction } from "./FollowUpAction";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/currency";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getContactService } from "@/lib/crm";
import { getServiceConfig } from "@/constants/services";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

interface AnimatedDealCardProps {
  deal: CRMDealWithContact;
  onClick?: () => void;
  onEdit?: (deal: CRMDealWithContact) => void;
  onDelete?: (dealId: string) => void;
  onScheduleCall?: (deal: CRMDealWithContact) => void;
  isDeleting?: boolean;
  isHighlighted?: boolean;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void;
  showOwnerBadge?: boolean;
}

export function AnimatedDealCard({
  deal,
  onClick,
  onEdit,
  onDelete,
  onScheduleCall,
  isDeleting,
  isHighlighted,
  onToggleFollowUp,
  showOwnerBadge
}: AnimatedDealCardProps) {
  const { isSecretaria } = useUserProfile();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const getStageColor = (stage: string) => {
    const colors = {
      'lead_novo': 'from-slate-500/10 to-slate-600/5 border-slate-500/20',
      'qualificado': 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
      'apresentacao': 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
      'proposta': 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
      'negociacao': 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20',
      'fechado_ganho': 'from-green-500/10 to-green-600/5 border-green-500/20',
      'fechado_perdido': 'from-red-500/10 to-red-600/5 border-red-500/20',
    };
    return colors[stage as keyof typeof colors] || 'from-gray-500/10 to-gray-600/5 border-gray-500/20';
  };

  const cardClasses = `
    relative overflow-visible transition-all duration-100 ease-out cursor-pointer border-2
    ${isHovered ? 'shadow-glow scale-[1.01] -translate-y-0.5 border-primary/60' : 'shadow-card hover:shadow-lg border-border/40'}
    ${isHighlighted ? 'ring-2 ring-primary shadow-glow scale-[1.01] -translate-y-0.5 bg-gradient-to-br from-primary/10 to-primary/5' : 'bg-gradient-to-br from-card/80 to-card/40'}
    ${getStageColor(deal.stage)}
    backdrop-blur-sm
    group
  `.trim();

  // Service value vem do contato (se existir) ou do deal
  const contactServiceValue = (deal.contact as any)?.service_value;
  const displayedServiceValue = contactServiceValue ?? deal.value ?? null;
  const hasDifferentValue = deal.value != null && deal.value !== displayedServiceValue;

  const ownerName = deal.owner_profile?.full_name || deal.owner_profile?.email?.split('@')[0] || 'Desconhecido';
  const ownerInitials = ownerName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Service pode estar no custom_fields do contato como procedure_id
  const contactService = getContactService(deal.contact);
  const serviceConfig = contactService ? getServiceConfig(contactService) : null;

  return (
    <Card
      className={cardClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        zIndex: isHovered ? 100 : 1,
        transform: 'translateZ(0)', // GPU acceleration
        willChange: isHovered ? 'transform, box-shadow' : 'auto',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent transform -skew-x-12 -z-10"
        style={{
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          willChange: 'transform',
        }}
      />

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 -z-10" />

      {/* Card Content */}
      <div className="relative p-3 space-y-3" style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

        {/* Header: Title and Actions */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {deal.title || 'Sem título'}
            </h4>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Edit Button */}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deal);
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}

            {/* Delete Button */}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                    disabled={isDeleting}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="backdrop-blur-xl bg-background/95">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Contrato</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o contrato "{deal.title}"?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(deal.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Badges Row: Status, Follow-up and Owner */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge de Em Tratamento */}
          {deal.is_in_treatment && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 border-green-500/20">
              <Stethoscope className="w-3 h-3 mr-1" />
              Em Tratamento
            </Badge>
          )}
          {/* Badge de Inadimplente */}
          {deal.is_defaulting && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-red-500/10 text-red-600 border-red-500/20">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Inadimplente
            </Badge>
          )}
          {/* Badge de Follow-up removido (campo legacy) */}
          {showOwnerBadge && deal.owner_profile && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 bg-primary/5 border-primary/20 text-primary"
              title={`Responsável: ${ownerName}`}
            >
              {ownerName}
            </Badge>
          )}
        </div>

        {/* Contact Information */}
        {deal.contact && (
          <div className="space-y-2 border-t border-border/50 pt-2">
            {/* Contact Name */}
            {deal.contact.full_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{deal.contact.full_name}</span>
              </div>
            )}

            {/* Company */}
            {deal.contact.company && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{deal.contact.company}</span>
              </div>
            )}

            {/* Email */}
            {deal.contact.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{deal.contact.email}</span>
              </div>
            )}

            {/* Phone */}
            {deal.contact.phone && (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{deal.contact.phone}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanPhone = deal.contact!.phone!.replace(/\D/g, '');
                      navigate(`/whatsapp?phone=${cleanPhone}`);
                    }}
                  >
                    <Phone className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-green-500/20 hover:text-green-600"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const cleanPhone = deal.contact!.phone!.replace(/\D/g, '');
                      navigate(`/whatsapp?phone=${cleanPhone}`);
                    }}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Service Badge */}
            {serviceConfig && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0.5 ${serviceConfig.bgColor} ${serviceConfig.textColor} border-0 font-medium`}
                >
                  {serviceConfig.label}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Service Value - Highlighted - oculto para secretária */}
        {!isSecretaria && displayedServiceValue !== null && (
          <div
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 rounded-lg p-2.5"
            style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}
          >
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide whitespace-nowrap flex-shrink-0">
                Valor do Serviço
              </span>
              <span className="text-lg font-bold text-green-700 tabular-nums truncate">
                {formatCurrency(displayedServiceValue)}
              </span>
            </div>
          </div>
        )}

        {/* Deal Value (if different from service value) - oculto para secretária */}
        {!isSecretaria && hasDifferentValue && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="text-xs">Valor do Negócio:</span>
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(deal.value)}
            </span>
          </div>
        )}

        {/* Follow-up Action - Removed legacy needs_follow_up logic */}

        {/* Footer: Expected Close Date */}
        {deal.expected_close_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>
              {formatDistanceToNow(new Date(deal.expected_close_date), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          </div>
        )}
      </div>

    </Card>
  );
}
