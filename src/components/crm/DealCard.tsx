import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CRMDealWithContact } from "@/types/crm";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, DollarSign, Edit, Trash2, Phone, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
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

interface DealCardProps {
  deal: CRMDealWithContact;
  onClick?: () => void;
  onEdit?: (deal: CRMDealWithContact) => void;
  onDelete?: (dealId: string) => void;
  onScheduleCall?: (deal: CRMDealWithContact) => void;
  isDeleting?: boolean;
  showOwnerBadge?: boolean;
}

export function DealCard({ deal, onClick, onEdit, onDelete, onScheduleCall, isDeleting, showOwnerBadge }: DealCardProps) {
  const { toast } = useToast();
  const { isSecretaria } = useUserProfile();

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    toast({
      title: "Telefone copiado!",
      description: `${phone} copiado para a área de transferência.`,
    });
  };

  const ownerName = deal.owner_profile?.full_name || deal.owner_profile?.email?.split('@')[0] || 'Desconhecido';
  const ownerInitials = ownerName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="p-4 hover:shadow-md transition-shadow bg-card">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={onClick}>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                  {deal.title}
                </h4>
                {deal.contact?.full_name && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {deal.contact.full_name}
                  </p>
                )}
              </div>
              {showOwnerBadge && deal.owner_profile && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5 shrink-0"
                  title={`Responsável: ${ownerName}`}
                >
                  {ownerInitials}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {deal.probability && (
              <Badge variant="secondary" className="text-xs">
                {deal.probability}%
              </Badge>
            )}
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
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
                      className="h-6 w-6 p-0"
                      disabled={isDeleting}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
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

        {/* Phone - Destacado com botão de copiar */}
        {deal.contact?.phone && (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/50 rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">{deal.contact.phone}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-blue-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPhone(deal.contact!.phone!);
                }}
              >
                <Copy className="w-3 h-3 text-blue-600" />
              </Button>
            </div>
          </div>
        )}

        {/* Botão Agendar Call */}
        {onScheduleCall && deal.contact && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onScheduleCall(deal);
            }}
          >
            <Calendar className="w-3 h-3 mr-2" />
            Agendar Call
          </Button>
        )}

        {/* Service Value - Destacado - oculto para secretária */}
        {!isSecretaria && deal.contact?.service_value && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200/50 rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Valor do Serviço</span>
              <div className="flex items-center gap-1 text-2xl font-bold text-green-700">
                <DollarSign className="w-5 h-5" />
                {formatCurrency(deal.contact.service_value)}
              </div>
            </div>
          </div>
        )}

        {/* Deal Value - oculto para secretária */}
        {!isSecretaria && deal.value && (
          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
            <DollarSign className="w-4 h-4" />
            {formatCurrency(deal.value)}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {deal.expected_close_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(deal.expected_close_date), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          )}
          {deal.assigned_to_profile && (
            <div className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                <AvatarFallback className="text-[8px]">
                  {deal.assigned_to_profile.full_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">
                {deal.assigned_to_profile.full_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
