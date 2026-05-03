import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRMDealWithContact } from "@/types/crm";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, Phone, Stethoscope, AlertTriangle, GripVertical, MessageSquare, Copy } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AnimatedDealCardProps {
  deal: CRMDealWithContact;
  /** Somente no kanban: listeners do dnd-kit no ícone de arrastar (evita conflito com editar/excluir). */
  dragHandleListeners?: Record<string, unknown>;
  onClick?: () => void;
  onEdit?: (deal: CRMDealWithContact) => void;
  onDelete?: (dealId: string) => void;
  onScheduleCall?: (deal: CRMDealWithContact) => void;
  isDeleting?: boolean;
  isHighlighted?: boolean;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void;
  showOwnerBadge?: boolean;
  followUp?: unknown;
}

function stageAccentClass(stage: string): string {
  const map: Record<string, string> = {
    lead_novo: "border-l-primary/70",
    em_contato: "border-l-cyan-500/80",
    agendado: "border-l-blue-500/80",
    avaliacao: "border-l-indigo-500/80",
    em_tratamento: "border-l-emerald-500/80",
    aguardando_retorno: "border-l-amber-500/80",
    fechado_ganho: "border-l-green-600/80",
    fechado_perdido: "border-l-red-500/70",
    qualificado: "border-l-sky-500/80",
    apresentacao: "border-l-violet-500/80",
    proposta: "border-l-orange-500/80",
    negociacao: "border-l-yellow-500/80",
  };
  return map[stage] || "border-l-muted-foreground/40";
}

export function AnimatedDealCard({
  deal,
  dragHandleListeners,
  onClick,
  onEdit,
  onDelete,
  onScheduleCall: _onScheduleCall,
  isDeleting,
  isHighlighted,
  onToggleFollowUp: _onToggleFollowUp,
  showOwnerBadge,
  followUp,
}: AnimatedDealCardProps) {
  void _onScheduleCall;
  void _onToggleFollowUp;
  const { isSecretaria } = useUserProfile();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const displayName =
    deal.contact?.full_name?.trim() ||
    deal.title?.trim() ||
    "Sem nome";

  const createdRaw = deal.created_at;
  const createdDate =
    createdRaw != null
      ? typeof createdRaw === "string"
        ? parseISO(createdRaw)
        : new Date(createdRaw as Date)
      : null;
  const createdLabel =
    createdDate && !Number.isNaN(createdDate.getTime())
      ? format(createdDate, "dd/MM/yyyy HH:mm", { locale: ptBR })
      : null;

  const phoneRaw = deal.contact?.phone?.trim() || "";
  const phoneDigits = phoneRaw.replace(/\D/g, "");

  const contactServiceValue = (deal.contact as { service_value?: number } | null)?.service_value;
  const displayedServiceValue = contactServiceValue ?? deal.value ?? null;

  const ownerName =
    deal.owner_profile?.full_name ||
    deal.owner_profile?.email?.split("@")[0] ||
    null;
  const ownerShort =
    ownerName
      ?.split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || null;

  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phoneRaw) return;
    void navigator.clipboard.writeText(phoneRaw);
    toast({ title: "Telefone copiado", description: phoneRaw });
  };

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phoneDigits) return;
    navigate(`/whatsapp?phone=${phoneDigits}`);
  };

  return (
    <Card
      className={cn(
        "relative w-full max-w-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow duration-200",
        "border-l-[3px]",
        stageAccentClass(deal.stage || ""),
        dragHandleListeners ? "cursor-default" : "cursor-pointer",
        isHovered && "shadow-md ring-1 ring-border/60",
        isHighlighted && "ring-2 ring-primary/50 bg-primary/[0.04]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ boxSizing: "border-box" }}
    >
      <div className="px-3 py-2.5 space-y-2.5">
        {/* Top: arrastar + data + ações */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center min-w-0">
            {dragHandleListeners ? (
              <button
                type="button"
                className="touch-none shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-grab active:cursor-grabbing"
                aria-label="Arrastar card"
                {...dragHandleListeners}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-0.5 shrink-0 min-w-0">
            {createdLabel ? (
              <span
                className="text-[10px] sm:text-[11px] tabular-nums text-muted-foreground whitespace-nowrap mr-1"
                title="Data de criação do negócio"
              >
                {createdLabel}
              </span>
            ) : null}
            {onEdit ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deal);
                }}
                aria-label="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
            ) : null}
            {onDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={isDeleting}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
                    <AlertDialogDescription>
                      Excluir o negócio de <strong>{displayName}</strong>? Esta ação não pode ser desfeita.
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
            ) : null}
          </div>
        </div>

        {/* Nome (informação principal) */}
        <h3 className="font-semibold text-[15px] leading-snug text-foreground tracking-tight line-clamp-2 pr-0.5">
          {displayName}
        </h3>

        {/* Telefone */}
        {phoneRaw ? (
          <div className="flex items-center gap-2 min-w-0 rounded-lg bg-muted/50 px-2 py-1.5 border border-border/50">
            <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums tracking-wide text-foreground truncate flex-1 min-w-0">
              {phoneRaw}
            </span>
            <div
              className={cn(
                "flex items-center gap-0 shrink-0",
                isHovered ? "opacity-100" : "opacity-0 sm:opacity-100"
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Copiar telefone"
                onClick={copyPhone}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-500/10"
                aria-label="Abrir WhatsApp"
                onClick={openWhatsApp}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">Sem telefone cadastrado</p>
        )}

        {/* Badges compactos (só quando importa clinicamente) */}
        {(deal.is_in_treatment || deal.is_defaulting || followUp || (showOwnerBadge && ownerShort)) ? (
          <div className="flex flex-wrap items-center gap-1">
            {deal.is_in_treatment ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                <Stethoscope className="w-2.5 h-2.5 mr-0.5" />
                Tratamento
              </Badge>
            ) : null}
            {deal.is_defaulting ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-red-500/10 text-red-700 border-red-500/20">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                Inadimplente
              </Badge>
            ) : null}
            {followUp ? (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-normal border",
                  new Date((followUp as { scheduled_date: string }).scheduled_date) < new Date()
                    ? "bg-red-500/10 text-red-700 border-red-500/20"
                    : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                )}
              >
                Follow-up
              </Badge>
            ) : null}
            {showOwnerBadge && ownerShort ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground" title={ownerName || undefined}>
                {ownerShort}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {/* Valor (uma linha) */}
        {!isSecretaria && displayedServiceValue !== null && displayedServiceValue !== undefined ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="text-[10px] uppercase tracking-wider mr-1">Valor</span>
            <span className="font-semibold text-foreground">{formatCurrency(Number(displayedServiceValue))}</span>
          </p>
        ) : null}

        <div
          className="pt-0.5 border-t border-border/40"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <FollowUpAction dealId={deal.id} dealTitle={displayName} compact />
        </div>
      </div>
    </Card>
  );
}
