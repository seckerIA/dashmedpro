import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedDealCard } from "./AnimatedDealCard";
import { FollowUpSection } from "./FollowUpSection";
import { CRMDealWithContact, PIPELINE_STAGES } from "@/types/crm";
import { FollowUp } from "@/types/followUp";
import { Users, Trash2 } from "lucide-react";
import { ContactActionSelector } from "./ContactActionSelector";
import { formatCurrency } from "@/lib/currency";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  useDroppable,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useIsMobile } from "@/hooks/use-mobile";

// Componente SortableDealCard
interface SortableDealCardProps {
  deal: CRMDealWithContact;
  onClick?: () => void;
  onEdit?: (deal: CRMDealWithContact) => void;
  onDelete?: (dealId: string) => void;
  onScheduleCall?: (deal: CRMDealWithContact) => void;
  isDeleting?: boolean;
  isHighlighted?: boolean;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void;
  showOwnerBadge?: boolean;
  followUp?: any; // Informações do follow-up agendado
}

function SortableDealCard({
  deal,
  onClick,
  onEdit,
  onDelete,
  onScheduleCall,
  isDeleting,
  isHighlighted,
  onToggleFollowUp,
  showOwnerBadge,
  followUp,
}: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition || 'transform 80ms ease-out',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    willChange: isDragging ? 'transform' : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        minWidth: 0,
        touchAction: 'manipulation',
        margin: 0,
        position: 'relative',
        padding: '2px',
      }}
      {...attributes}
    >
      <AnimatedDealCard
        deal={deal}
        followUp={followUp}
        dragHandleListeners={listeners}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onScheduleCall={onScheduleCall}
        isDeleting={isDeleting}
        isHighlighted={isHighlighted}
        onToggleFollowUp={onToggleFollowUp}
        showOwnerBadge={showOwnerBadge}
      />
    </div>
  );
}

// Componente para coluna droppable movido para fora do escopo de renderização
const DroppableColumn = ({ stage, children }: { stage: typeof PIPELINE_STAGES[0], children: React.ReactNode }) => {
  if (!stage || !stage.value) return null;

  const { setNodeRef, isOver } = useDroppable({
    id: stage.value,
    data: {
      type: 'column',
      stage: stage.value,
    }
  });

  const isMobile = useIsMobile();
  const widthStyle = isMobile ? '85vw' : '320px';

  return (
    <Card
      ref={setNodeRef}
      className={`group/column flex h-full min-h-0 max-h-full shrink-0 flex-col overflow-hidden w-[85vw] md:w-80 bg-gradient-to-br from-card to-card/50 border-2 shadow-card transition-all duration-100 ease-out snap-center ${isOver
        ? 'border-primary shadow-glow ring-2 ring-primary/20 scale-[1.01]'
        : 'border-border hover:shadow-lg'
        }`}
      style={{
        width: widthStyle,
        maxWidth: widthStyle,
        minWidth: widthStyle,
        boxSizing: 'border-box',
        willChange: isOver ? 'transform, box-shadow' : 'auto',
      }}
    >
      {children}
    </Card>
  );
};

export interface PipelineBoardProps {
  deals: CRMDealWithContact[];
  followUps?: FollowUp[]; // Follow-ups agendados
  onDealClick?: (deal: CRMDealWithContact) => void;
  onStageClick?: (stage: string) => void;
  onUpdateDeal?: (dealId: string, stage: string, position?: number) => void;
  onReorderDealsInStage?: (stage: string, dealIds: string[]) => Promise<void>;
  onEditDeal?: (deal: CRMDealWithContact) => void;
  onDeleteDeal?: (dealId: string) => void;
  onScheduleCall?: (deal: CRMDealWithContact) => void;
  isDeletingDeal?: boolean;
  onCall?: (deal: CRMDealWithContact) => void;
  onEmail?: (deal: CRMDealWithContact) => void;
  onWhatsApp?: (deal: CRMDealWithContact) => void;
  onContactAdded?: (dealId: string) => void;
  highlightedDealId?: string | null;
  onToggleFollowUp?: (dealId: string, needsFollowUp: boolean) => void;
  onCompleteFollowUp?: (followUpId: string) => void;
  onEditFollowUp?: (followUp: FollowUp) => void;
  showOwnerBadge?: boolean;
  onDealMovedToAgendado?: (deal: CRMDealWithContact) => void;
  /** Ex.: limpar coluna “Lead Novo” (só o estágio lead_novo renderiza o botão) */
  onClearLeadNovoColumn?: () => void;
}

export function PipelineBoard({
  deals,
  followUps = [],
  onDealClick,
  onStageClick,
  onUpdateDeal,
  onReorderDealsInStage,
  onEditDeal,
  onDeleteDeal,
  onScheduleCall,
  isDeletingDeal,
  onCall,
  onEmail,
  onWhatsApp,
  onContactAdded,
  highlightedDealId,
  onToggleFollowUp,
  onCompleteFollowUp,
  onEditFollowUp,
  showOwnerBadge,
  onDealMovedToAgendado,
  onClearLeadNovoColumn,
}: PipelineBoardProps) {
  const { isSecretaria } = useUserProfile();
  const isMobile = useIsMobile();
  const [activeDeal, setActiveDeal] = useState<CRMDealWithContact | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Configuração de medição otimizada para fluidez
  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, CRMDealWithContact[]> = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.value] = [];
    });
    deals.forEach(deal => {
      if (grouped[deal.stage]) {
        grouped[deal.stage].push(deal);
      }
    });
    Object.keys(grouped).forEach(stage => {
      grouped[stage].sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    return grouped;
  }, [deals]);

  const followUpMap = useMemo(() => {
    const fuMap = new Map<string, FollowUp>();
    followUps.filter(fu => !fu.completed).forEach(fu => {
      fuMap.set(fu.deal_id, fu);
    });
    return fuMap;
  }, [followUps]);

  const totalsByStage = useMemo(() => {
    const totals: Record<string, string> = {};
    PIPELINE_STAGES.forEach(stage => {
      const stageDeals = dealsByStage[stage.value] || [];
      const total = stageDeals.reduce((sum, deal) => {
        const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
        return sum + (value || 0);
      }, 0);
      totals[stage.value] = formatCurrency(total);
    });
    return totals;
  }, [dealsByStage]);

  const uniqueContactsByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stage => {
      const stageDeals = dealsByStage[stage.value] || [];
      const uniqueContacts = new Set(stageDeals.map(deal => deal.contact_id).filter(Boolean));
      counts[stage.value] = uniqueContacts.size;
    });
    return counts;
  }, [dealsByStage]);

  const getDealsByStage = (stage: string) => {
    return dealsByStage[stage] || [];
  };

  const getTotalValueByStage = (stage: string) => {
    return totalsByStage[stage] || formatCurrency(0);
  };

  const getUniqueContactsByStage = (stage: string) => {
    return uniqueContactsByStage[stage] || 0;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Melhora o feedback visual durante o arrasto
    // O estado visual das colunas é gerenciado pelo isOver do useDroppable
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveDeal(null);

    if (!over || active.id === over.id || !onUpdateDeal) {
      return;
    }

    const activeId = active.id as string;
    const activeDeal = deals.find(d => d.id === activeId);
    if (!activeDeal) {
      return;
    }

    // Verificar se foi solto em uma coluna (stage)
    const overIsStage = PIPELINE_STAGES.some(s => s.value === over.id);

    let targetStage: string;

    if (overIsStage) {
      // Solto diretamente em uma coluna: usar o stage da coluna
      targetStage = over.id as string;
    } else {
      // Solto em um card: usar o stage do card destino
      const overDeal = deals.find(d => d.id === over.id);
      if (!overDeal) {
        return;
      }
      targetStage = overDeal.stage;
    }

    // Se não mudou de stage, reordenar dentro do mesmo stage
    if (activeDeal.stage === targetStage) {
      const stageDeals = getDealsByStage(targetStage);
      const oldIndex = stageDeals.findIndex(d => d.id === activeId);
      const newIndex = stageDeals.findIndex(d => d.id === over.id);

      if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
        // Reordenar usando arrayMove
        const reordered = arrayMove(stageDeals, oldIndex, newIndex) as CRMDealWithContact[];

        // Atualizar todas as posições
        if (onReorderDealsInStage) {
          const reorderedIds = reordered.map(d => d.id);
          await onReorderDealsInStage(targetStage, reorderedIds);
        }
      }
      return;
    }

    // Mudou de stage: atualizar apenas o stage (como FunnelBoard faz)
    // A posição será gerenciada automaticamente pela query
    try {
      await onUpdateDeal(activeId, targetStage);

      // Se mudou para "agendado", chamar callback
      if (targetStage === 'agendado' && activeDeal) {
        // Buscar deal atualizado da lista
        const updatedDeal = deals.find(d => d.id === activeId);
        if (updatedDeal) {
          onDealMovedToAgendado?.(updatedDeal);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar deal:', error);
    }
  };

  // Validação de dados para evitar crashes
  if (!deals || !Array.isArray(deals)) {
    console.warn('⚠️ [PipelineBoard] Deals não é um array válido:', deals);
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground bg-card/50 rounded-xl border border-dashed">
        Aguardando carregamento dos dados do pipeline...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={measuringConfig}
    >
      <div className="flex h-[min(calc(100dvh-6rem),1600px)] min-h-[560px] min-w-0 max-w-full items-stretch gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-4 snap-x snap-mandatory scrollbar-hide md:px-0">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.value);

          return (
            <DroppableColumn key={stage.value} stage={stage}>
              <CardHeader className="shrink-0 pb-2 bg-gradient-to-r from-transparent to-primary/5 rounded-t-lg space-y-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stage.bgColor} border border-border/50 shadow-sm shrink-0`}>
                      <stage.icon className={`w-6 h-6 ${stage.textColor}`} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold text-foreground min-h-10 flex items-center leading-tight truncate">
                        {stage.label}
                      </CardTitle>
                      {/* Valor total do estágio - oculto para secretária */}
                      {!isSecretaria && (
                        <p className="text-sm text-muted-foreground mt-0.5 font-medium truncate">
                          {getTotalValueByStage(stage.value)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{getUniqueContactsByStage(stage.value)} contatos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {stage.value === 'lead_novo' &&
                      onClearLeadNovoColumn &&
                      stageDeals.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="hidden md:inline-flex h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Excluir todos os negócios desta coluna"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClearLeadNovoColumn();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    <Badge
                      variant="secondary"
                      className={`text-sm ${stage.bgColor} ${stage.textColor} border-0 font-semibold px-3 py-1.5 rounded-lg shrink-0`}
                      title={stageDeals.length > 0 ? 'Todos os leads desta etapa — role a lista abaixo' : undefined}
                    >
                      {stageDeals.length}
                    </Badge>
                  </div>
                </div>
                {stage.value === 'lead_novo' &&
                  onClearLeadNovoColumn &&
                  stageDeals.length > 0 &&
                  isMobile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClearLeadNovoColumn();
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                      Excluir todos os negócios desta coluna
                    </Button>
                  )}
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-0">
                <div
                  className="relative min-h-0 w-full min-w-0 flex-1 basis-0 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch] rounded-md transition-shadow group-hover/column:ring-1 group-hover/column:ring-primary/20"
                  style={{ boxSizing: 'border-box' }}
                  title="Role para ver todos os cards desta etapa"
                >
                  <SortableContext items={stageDeals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
                    <div className="w-full min-w-0 space-y-3 px-0.5 pb-1" style={{ boxSizing: 'border-box' }}>
                      {stageDeals.map((deal) => (
                        <SortableDealCard
                          key={deal.id}
                          deal={deal}
                          followUp={followUpMap.get(deal.id)}
                          onClick={() => onDealClick?.(deal)}
                          onEdit={onEditDeal}
                          onDelete={onDeleteDeal}
                          onScheduleCall={onScheduleCall}
                          isDeleting={isDeletingDeal}
                          isHighlighted={highlightedDealId === deal.id}
                          onToggleFollowUp={onToggleFollowUp}
                          showOwnerBadge={showOwnerBadge}
                        />
                      ))}

                      {stageDeals.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          Nenhum contato nesta etapa
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>

                <ContactActionSelector
                  stage={stage.value}
                  stageConfig={{
                    bgColor: stage.bgColor,
                    textColor: stage.textColor,
                    label: stage.label
                  }}
                  onContactAdded={onContactAdded}
                  onExistingContactSelected={(contactId, selectedStage) => {
                    // Este callback será implementado no ContactActionSelector
                    console.log('Contato existente selecionado:', contactId, selectedStage);
                  }}
                />
              </CardContent>
            </DroppableColumn>
          );
        })}

        {/* Seção de Follow-ups */}
        <FollowUpSection
          deals={deals}
          followUps={followUps}
          onDealClick={onDealClick}
          onCompleteFollowUp={onCompleteFollowUp}
          onEditFollowUp={onEditFollowUp}
        />
      </div>

      <DragOverlay
        dropAnimation={{
          duration: 150,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
        style={{
          zIndex: 9999,
        }}
        wrapperElement="div"
      >
        {activeDeal ? (
          <div
            className="rotate-1"
            style={{
              transform: 'scale(1.03) translateZ(0)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.1)',
              cursor: 'grabbing',
              transition: 'box-shadow 100ms ease-out',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
          >
            <AnimatedDealCard
              deal={activeDeal}
              onClick={() => { }}
              onEdit={() => { }}
              onDelete={() => { }}
              isDeleting={false}
              isHighlighted={true}
              showOwnerBadge={showOwnerBadge}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
