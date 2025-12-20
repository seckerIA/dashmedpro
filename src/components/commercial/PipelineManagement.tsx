import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/crm/PipelineBoard";
import { ContactForm } from "@/components/crm/ContactForm";
import { DealForm } from "@/components/crm/DealForm";
import { GlobalSearch } from "@/components/crm/GlobalSearch";
import { CRMLoadingSkeleton } from "@/components/crm/CRMLoadingSkeleton";
import { DealWonModal } from "@/components/crm/DealWonModal";
import { FollowUpScheduleModal } from "@/components/crm/FollowUpScheduleModal";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { SalesCallForm } from "@/components/calendar/SalesCallForm";
import { useCRM } from "@/hooks/useCRM";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useAuth } from "@/hooks/useAuth";
import { FollowUp } from "@/types/followUp";
import { Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CRMDealWithContact } from "@/types/crm";

export function PipelineManagement() {
  const { user } = useAuth();
  const [viewAllMode, setViewAllMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('commercial_pipeline_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('commercial_pipeline_selected_user_ids');
    
    if (savedViewAllMode) {
      setViewAllMode(JSON.parse(savedViewAllMode));
    }
    if (savedSelectedUserIds) {
      try {
        setSelectedUserIds(JSON.parse(savedSelectedUserIds));
      } catch {
        setSelectedUserIds([]);
      }
    }
  }, []);

  const { 
    deals, 
    isLoading,
    updateDeal,
    updateDealsPositions,
    deleteDeal,
    isDeletingDeal
  } = useCRM(viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined);
  const { 
    followUps, 
    updateFollowUp, 
    isLoading: isLoadingFollowUps 
  } = useFollowUps();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [editingDeal, setEditingDeal] = useState<CRMDealWithContact | null>(null);
  const [highlightedDealId, setHighlightedDealId] = useState<string | null>(null);
  const [showDealWonModal, setShowDealWonModal] = useState(false);
  const [wonDeal, setWonDeal] = useState<CRMDealWithContact | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [showFollowUpEditModal, setShowFollowUpEditModal] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [dealForCall, setDealForCall] = useState<CRMDealWithContact | null>(null);

  const handleReorderDealsInStage = async (stage: string, dealIds: string[]) => {
    try {
      const updates = dealIds.map((dealId, index) => ({
        id: dealId,
        position: index,
      }));
      
      await updateDealsPositions(updates);
      
      toast({
        title: "Ordem atualizada",
        description: "Os contatos foram reordenados com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reordenar os contatos.",
      });
    }
  };

  const handleUpdateDealStage = async (dealId: string, newStage: string, position?: number) => {
    try {
      if (newStage === 'fechado_ganho') {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
          setWonDeal(deal);
          setShowDealWonModal(true);
          return;
        }
      }

      const updateData: Partial<CRMDealWithContact> = { stage: newStage as any };
      
      if (position !== undefined && position !== null) {
        updateData.position = position;
      }

      await updateDeal({ 
        dealId, 
        data: updateData
      });
    } catch (error) {
      console.error('Erro ao atualizar deal:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o contato.",
      });
      throw error;
    }
  };

  const handleDealConversion = async (data: { appointmentValue: number; paymentTiming: 'advance' | 'at_appointment' }) => {
    if (!wonDeal) return;

    try {
      await updateDeal({ 
        dealId: wonDeal.id, 
        data: { stage: 'fechado_ganho' as any }
      });

      const params = new URLSearchParams({
        contactId: wonDeal.contact_id || '',
        convertedFromDeal: wonDeal.id,
        appointmentValue: data.appointmentValue.toString(),
        paidInAdvance: (data.paymentTiming === 'advance').toString(),
      });
      
      navigate(`/calendario-medico?${params.toString()}`);
      
      setShowDealWonModal(false);
      setWonDeal(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível converter o negócio.",
      });
    }
  };

  const handleDealWonCancel = () => {
    toast({
      title: "Conversão cancelada",
      description: "O negócio não foi convertido. Você pode tentar novamente depois.",
    });
    setShowDealWonModal(false);
    setWonDeal(null);
  };

  const handleToggleFollowUp = async (dealId: string, needsFollowUp: boolean) => {
    try {
      await updateDeal({ 
        dealId, 
        data: { needs_follow_up: needsFollowUp }
      });
      toast({
        title: "Status de Follow-up Atualizado",
        description: `O contato foi ${needsFollowUp ? 'marcado para' : 'removido do'} acompanhamento.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status de follow-up.",
      });
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      await updateFollowUp({ 
        id: followUpId, 
        data: { 
          status: 'concluido',
          completed_notes: 'Concluído manualmente' 
        }
      });
      toast({
        title: "Follow-up Concluído",
        description: "O follow-up foi marcado como concluído.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível concluir o follow-up.",
      });
    }
  };

  const handleEditFollowUp = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setShowFollowUpEditModal(true);
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDeal(dealId);
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o contrato.",
      });
    }
  };

  const handleContactAdded = (dealId: string) => {
    setHighlightedDealId(dealId);
    
    setTimeout(() => {
      const dealElement = document.querySelector(`[data-deal-id="${dealId}"]`);
      if (dealElement) {
        dealElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedDealId(null);
    }, 5000);
  };

  const handleScheduleCall = (deal: CRMDealWithContact) => {
    setDealForCall(deal);
    setShowCallForm(true);
  };

  if (isLoading || isLoadingFollowUps) {
    return <CRMLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <ContactForm />
          <DealForm />
        </div>
      </div>

      {/* Global Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <GlobalSearch 
            onSelectDeal={(deal) => {
              console.log('Selected deal:', deal);
            }}
            onSelectContact={(contact) => {
              console.log('Selected contact:', contact);
            }}
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Team Member Selector - Apenas para Admin/Dono */}
      <TeamMemberSelector
        viewAllMode={viewAllMode}
        selectedUserIds={selectedUserIds}
        currentUserId={user?.id || ''}
        onViewAllModeChange={(enabled) => {
          setViewAllMode(enabled);
          localStorage.setItem('commercial_pipeline_view_all_mode', JSON.stringify(enabled));
        }}
        onSelectedUserIdsChange={(ids) => {
          setSelectedUserIds(ids);
          if (ids.length > 0) {
            localStorage.setItem('commercial_pipeline_selected_user_ids', JSON.stringify(ids));
          } else {
            localStorage.removeItem('commercial_pipeline_selected_user_ids');
          }
        }}
      />

      {/* Pipeline Board */}
      <PipelineBoard 
        deals={deals}
        followUps={followUps}
        onUpdateDeal={handleUpdateDealStage}
        onReorderDealsInStage={handleReorderDealsInStage}
        onEditDeal={(deal) => setEditingDeal(deal)}
        onDeleteDeal={handleDeleteDeal}
        onScheduleCall={handleScheduleCall}
        isDeletingDeal={isDeletingDeal}
        onContactAdded={handleContactAdded}
        highlightedDealId={highlightedDealId}
        onToggleFollowUp={handleToggleFollowUp}
        onCompleteFollowUp={handleCompleteFollowUp}
        onEditFollowUp={handleEditFollowUp}
        showOwnerBadge={viewAllMode && selectedUserIds.length > 1}
        onDealClick={(deal) => {
          console.log('Deal clicked:', deal);
        }}
        onCall={(deal) => {
          toast({
            title: "Ligação iniciada",
            description: `Ligando para ${deal.contact?.full_name}...`,
          });
        }}
        onEmail={(deal) => {
          if (deal.contact?.email) {
            window.open(`mailto:${deal.contact.email}?subject=Follow-up: ${deal.title}`);
          } else {
            toast({
              variant: "destructive",
              title: "Email não disponível",
              description: "Este contato não possui email cadastrado.",
            });
          }
        }}
        onWhatsApp={(deal) => {
          if (deal.contact?.phone) {
            const phone = deal.contact.phone.replace(/\D/g, '');
            const contactName = deal.contact?.full_name || 'cliente';
            const message = encodeURIComponent(`Olá ${contactName}, tudo bem? Gostaria de fazer um follow-up sobre ${deal.title}.`);
            window.open(`https://wa.me/55${phone}?text=${message}`);
          } else {
            toast({
              variant: "destructive",
              title: "WhatsApp não disponível",
              description: "Este contato não possui telefone cadastrado.",
            });
          }
        }}
      />

      {/* Modal de Edição de Deal */}
      <DealForm
        deal={editingDeal || undefined}
        trigger={<div style={{ display: 'none' }} />}
        onSuccess={() => setEditingDeal(null)}
        onClose={() => setEditingDeal(null)}
        key={editingDeal?.id || 'new'}
      />

      {/* Modal de Negócio Ganho */}
      <DealWonModal
        open={showDealWonModal}
        deal={wonDeal}
        onConfirm={handleDealConversion}
        onCancel={handleDealWonCancel}
      />

      {/* Modal de Edição de Follow-up */}
      {editingFollowUp && (
        <FollowUpScheduleModal
          dealId={editingFollowUp.deal_id}
          dealTitle={deals.find(d => d.id === editingFollowUp.deal_id)?.title || 'Follow-up'}
          open={showFollowUpEditModal}
          onOpenChange={(open) => {
            setShowFollowUpEditModal(open);
            if (!open) {
              setEditingFollowUp(null);
            }
          }}
          followUp={editingFollowUp}
        />
      )}

      {/* Sales Call Form */}
      <SalesCallForm
        open={showCallForm}
        onOpenChange={(open) => {
          setShowCallForm(open);
          if (!open) {
            setDealForCall(null);
          }
        }}
        preSelectedContactId={dealForCall?.contact_id}
        preSelectedDealId={dealForCall?.id}
      />
    </div>
  );
}

