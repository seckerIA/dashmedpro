import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedDealCard } from "./AnimatedDealCard";
import { FollowUpSection } from "./FollowUpSection";
import { CRMDealWithContact, PIPELINE_STAGES } from "@/types/crm";
import { FollowUp } from "@/types/followUp";
import { Plus, TrendingUp, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactActionSelector } from "./ContactActionSelector";
import { formatCurrency } from "@/lib/currency";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  showOwnerBadge
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
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : (transition || 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isDragging ? 1 : 'auto',
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
        touchAction: 'none', // Melhor suporte mobile para drag
        margin: 0,
        position: 'relative',
      }} 
      {...attributes}
      {...listeners}
    >
      <AnimatedDealCard 
        deal={deal} 
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
  showOwnerBadge
}: PipelineBoardProps) {
  const [activeDeal, setActiveDeal] = useState<CRMDealWithContact | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduzido para melhor responsividade
      },
    })
  );

  const getDealsByStage = (stage: string) => {
    return deals.filter(deal => deal.stage === stage).sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const getTotalValueByStage = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    const total = stageDeals.reduce((sum, deal) => {
      const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
      return sum + (value || 0);
    }, 0);
    return formatCurrency(total);
  };


  const getUniqueContactsByStage = (stage: string) => {
    const stageDeals = getDealsByStage(stage);
    const uniqueContacts = new Set(stageDeals.map(deal => deal.contact_id).filter(Boolean));
    return uniqueContacts.size;
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
        const reordered = arrayMove(stageDeals, oldIndex, newIndex);
        
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
    } catch (error) {
      console.error('Erro ao atualizar deal:', error);
    }
  };

  // Componente para coluna droppable
  function DroppableColumn({ stage, children }: { stage: typeof PIPELINE_STAGES[0], children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
      id: stage.value,
      data: {
        type: 'column',
        stage: stage.value,
      }
    });
    return (
      <Card 
        ref={setNodeRef}
        className={`flex-shrink-0 w-80 bg-gradient-to-br from-card to-card/50 border-2 shadow-card transition-all duration-150 ${
          isOver 
            ? 'border-primary shadow-glow ring-2 ring-primary/20 scale-[1.02]' 
            : 'border-border hover:shadow-lg'
        }`}
        style={{ 
          width: '320px',
          maxWidth: '320px',
          minWidth: '320px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {children}
      </Card>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = getDealsByStage(stage.value);
          
          return (
            <DroppableColumn key={stage.value} stage={stage}>
            <CardHeader className="pb-3 bg-gradient-to-r from-transparent to-primary/5 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stage.bgColor} border border-border/50 shadow-sm`}>
                    <stage.icon className={`w-6 h-6 ${stage.textColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      {stage.label}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                      {getTotalValueByStage(stage.value)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{getUniqueContactsByStage(stage.value)} contatos</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-sm ${stage.bgColor} ${stage.textColor} border-0 font-semibold px-3 py-1.5 rounded-lg`}
                >
                  {stageDeals.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
              <ScrollArea className="h-[calc(100vh-300px)] w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <SortableContext items={stageDeals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {stageDeals.map((deal) => (
                      <SortableDealCard
                        key={`${deal.id}-${deal.contact?.service_value || 0}-${deal.contact?.updated_at || ''}`}
                        deal={deal} 
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
              </ScrollArea>
              
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
          duration: 200,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        style={{
          zIndex: 9999,
        }}
      >
        {activeDeal ? (
          <div 
            className="rotate-2 opacity-100"
            style={{
              transform: 'scale(1.08) translateZ(0)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
              cursor: 'grabbing',
              transition: 'none',
              willChange: 'transform',
            }}
          >
            <AnimatedDealCard 
              deal={activeDeal} 
              onClick={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
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
