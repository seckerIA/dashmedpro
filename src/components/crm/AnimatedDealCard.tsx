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
import { useState } from "react";
import { getServiceConfig } from "@/constants/services";
import { formatCurrency } from "@/lib/currency";
import { useUserProfile } from "@/hooks/useUserProfile";

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
    relative overflow-hidden transition-all duration-200 ease-out cursor-pointer
    ${isHovered ? 'shadow-glow scale-[1.02] -translate-y-1' : 'shadow-card hover:shadow-lg'}
    ${isHighlighted ? 'ring-2 ring-primary shadow-glow scale-[1.02] -translate-y-1 bg-gradient-to-br from-primary/10 to-primary/5' : 'bg-gradient-to-br from-card/80 to-card/40'}
    ${getStageColor(deal.stage)}
    backdrop-blur-sm border
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
  const contactService = (deal.contact as any)?.service || (deal.contact?.custom_fields as any)?.procedure_id;
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
            {/* Probability Badge */}
            {deal.probability && (
              <Badge 
                variant="secondary" 
                className="text-xs"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {deal.probability}%
              </Badge>
            )}
            
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
          {deal.needs_follow_up && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-600 border-orange-500/20">
              <Clock className="w-3 h-3 mr-1" />
              Follow-up
            </Badge>
          )}
          {showOwnerBadge && deal.owner_profile && (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 bg-primary/5 border-primary/20 text-primary"
              title={`Responsável: ${ownerName}`}
            >
              {ownerInitials}
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{deal.contact.phone}</span>
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

        {/* Follow-up Action */}
        {onToggleFollowUp && (
          <div 
            className="pt-2 border-t border-border/50"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <FollowUpAction
              dealId={deal.id}
              dealTitle={deal.title}
              onToggleFollowUp={onToggleFollowUp}
              needsFollowUp={deal.needs_follow_up}
            />
          </div>
        )}

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
      
      {/* Subtle border glow on hover */}
      <div 
        className="absolute inset-0 rounded-lg border border-transparent transition-all duration-150 pointer-events-none"
        style={{
          borderColor: isHovered ? 'rgba(var(--primary), 0.4)' : 'transparent',
          boxShadow: isHovered ? '0 0 20px rgba(var(--primary), 0.2)' : 'none',
        }}
      />
    </Card>
  );
}
