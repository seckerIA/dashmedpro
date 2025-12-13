import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CRMDealWithContact } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, DollarSign, Edit, Trash2, TrendingUp, Clock } from "lucide-react";
import { FollowUpScheduleModal } from "./FollowUpScheduleModal";
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
import * as React from "react";
import { getServiceConfig } from "@/constants/services";
import { formatCurrency } from "@/lib/currency";

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
  const [isHovered, setIsHovered] = useState(false);
  
  // Função helper movida para cima para evitar erro de inicialização
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
  
  // Otimização de performance com useMemo
  const cardClasses = React.useMemo(() => {
    return `
      relative overflow-hidden transition-all duration-150 ease-out cursor-pointer
      ${isHovered ? 'shadow-glow scale-[1.02] -translate-y-1' : 'shadow-card hover:shadow-lg'}
      ${isHighlighted ? 'ring-2 ring-primary shadow-glow scale-[1.02] -translate-y-1 bg-gradient-to-br from-primary/10 to-primary/5' : 'bg-gradient-to-br from-card/80 to-card/40'}
      ${getStageColor(deal.stage)}
      backdrop-blur-sm border
      group
      will-change-transform
    `.trim();
  }, [isHovered, isHighlighted, deal.stage]);

  const displayedServiceValue = deal.contact?.service_value ?? deal.value ?? null;
  
  const ownerName = deal.owner_profile?.full_name || deal.owner_profile?.email?.split('@')[0] || 'Desconhecido';
  const ownerInitials = ownerName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card 
      className={cardClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: 'translateZ(0)', // GPU acceleration
        backfaceVisibility: 'hidden' as const,
        WebkitFontSmoothing: 'antialiased' as const,
      }}
    >
      {/* Animated background gradient - Otimizado */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent transform -skew-x-12 -z-10"
        style={{
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          willChange: 'transform',
        }}
      />
      
      {/* Glass effect overlay - Simplificado */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 -z-10" />
      
      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={onClick}>
            <div className="flex items-center gap-2 mb-1">
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
            <h4 className="font-semibold text-sm text-foreground line-clamp-1 transition-colors duration-150 group-hover:text-primary">
              {deal.title}
            </h4>
            {deal.contact && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1 transition-all duration-150">
                  <User className="w-3 h-3" />
                  <span className="group-hover:text-foreground transition-colors duration-150">
                    {deal.contact.full_name}
                  </span>
                </p>
                {deal.contact.service && (
                  <div className="flex items-center gap-1">
                    {(() => {
                      const serviceConfig = getServiceConfig(deal.contact.service);
                      if (!serviceConfig) return null;
                      return (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-0.5 ${serviceConfig.bgColor} ${serviceConfig.textColor} border-0 font-medium`}
                        >
                          {serviceConfig.label}
                        </Badge>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {deal.probability && (
              <Badge 
                variant="secondary" 
                className={`
                  text-xs transition-all duration-150 
                  ${isHovered ? 'scale-110 bg-primary/20 text-primary' : ''}
                `}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {deal.probability}%
              </Badge>
            )}
            
            {/* Action buttons with stagger animation */}
            <div 
              className="flex gap-1 transition-all duration-150 relative z-10 opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary transition-all duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(deal);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive transition-all duration-150"
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
        </div>

        {/* Service Value - Destacado */}
        {displayedServiceValue !== null && (
          <div 
            className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 rounded-xl p-3 mb-2 transition-all duration-150"
            style={{
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isHovered ? '0 4px 12px rgba(34, 197, 94, 0.2)' : 'none',
              willChange: 'transform',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Valor do Serviço</span>
              <div className="flex items-center gap-1 text-xl font-bold text-green-700">
                <DollarSign className="w-4 h-4" />
                <span className="tabular-nums">
                  {formatCurrency(displayedServiceValue)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deal Value with animated counter effect */}
        {deal.value != null && deal.value !== displayedServiceValue && (
          <div 
            className="flex items-center gap-1 text-sm font-semibold text-primary transition-all duration-150"
            style={{
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              willChange: 'transform',
            }}
          >
            <DollarSign className="w-4 h-4" />
            <span className="tabular-nums">
              {formatCurrency(deal.value)}
            </span>
          </div>
        )}

        {/* Follow-up Action */}
        {onToggleFollowUp && (
          <div 
            className="pt-3 mt-3 border-t border-border/50"
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

        {/* Footer with slide-in animation */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          {deal.expected_close_date && (
            <div className="flex items-center gap-1 transition-colors duration-150 group-hover:text-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(deal.expected_close_date), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
          )}
        </div>
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
