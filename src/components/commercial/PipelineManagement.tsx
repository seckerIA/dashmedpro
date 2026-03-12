import { useState, useEffect, useMemo } from "react";
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
import { AppointmentForm } from "@/components/medical-calendar/AppointmentForm";
import { useCRM } from "@/hooks/useCRM";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { FollowUp } from "@/types/followUp";
import { Filter, Calendar } from "lucide-react";
import { type PeriodFilter, PERIOD_FILTER_OPTIONS, isWithinPeriod } from "@/lib/periodFilter";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CRMDealWithContact } from "@/types/crm";
import { format } from "date-fns";
import { PipelineHelp } from "@/components/crm/PipelineHelp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PipelineManagement() {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  // Admin/Dono inicia com viewAllMode=true por padrão
  const [viewAllMode, setViewAllMode] = useState(() => {
    const saved = localStorage.getItem('commercial_pipeline_view_all_mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Se nunca foi definido, admin começa com true
    return false; // Será ajustado pelo useEffect abaixo
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage ao montar e ajustar para admin
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('commercial_pipeline_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('commercial_pipeline_selected_user_ids');

    // Se admin e nunca definiu preferência, ativar viewAllMode automaticamente
    if (isAdmin && savedViewAllMode === null) {
      setViewAllMode(true);
    } else if (savedViewAllMode !== null) {
      setViewAllMode(JSON.parse(savedViewAllMode));
    }

    if (savedSelectedUserIds) {
      try {
        setSelectedUserIds(JSON.parse(savedSelectedUserIds));
      } catch {
        setSelectedUserIds([]);
      }
    }
  }, [isAdmin]);

  const {
    deals,
    isLoading,
    updateDeal,
    deleteDeal
  } = useCRM(viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined);
  const {
    followUps,
    updateFollowUp,
    isLoading: isLoadingFollowUps
  } = useFollowUps(viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined);
  const { createAppointment } = useMedicalAppointments();
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
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [dealForAppointment, setDealForAppointment] = useState<CRMDealWithContact | null>(null);
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("30d");

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Filtro por período
      if (!isWithinPeriod(deal.created_at, periodFilter)) return false;

      // Filtro por tags
      if (tagFilter === "all") return true;
      const leadTags = deal.tags || [];
      const contactTags = deal.contact?.tags || [];
      const hasMeta = leadTags.includes("meta_ads") || contactTags.includes("meta_ads") || leadTags.includes("trafego") || contactTags.includes("trafego");
      const hasIndicacao = leadTags.includes("indicacao") || contactTags.includes("indicacao") || leadTags.includes("indicação") || contactTags.includes("indicação");
      
      if (tagFilter === "meta_ads") return hasMeta;
      if (tagFilter === "indicacao") return hasIndicacao;
      if (tagFilter === "ambos") return hasMeta || hasIndicacao;
      return true;
    });
  }, [deals, tagFilter, periodFilter]);

  const handleReorderDealsInStage = async (stage: string, dealIds: string[]) => {
    try {
      const updates = dealIds.map((dealId, index) => ({
        id: dealId,
        position: index,
      }));

      for (const u of updates) {
        await updateDeal({ dealId: u.id, data: { position: u.position } as any });
      }

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

      navigate(`/calendar?${params.toString()}`);

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
    // Função removida - o sistema de follow-up agora usa a tabela crm_follow_ups
    // através do componente FollowUpScheduleModal
    toast({
      title: "Use o botão 'Agendar Follow-up'",
      description: "Para configurar um follow-up, use o botão específico que abrirá o modal de agendamento.",
    });
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      await updateFollowUp({
        id: followUpId,
        data: {
          completed: true
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

  const handleDealMovedToAgendado = (deal: CRMDealWithContact) => {
    // Garantir que temos contact_id antes de abrir o formulário
    if (!deal.contact_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não é possível agendar: o contato não está associado a este deal.",
      });
      return;
    }
    setDealForAppointment(deal);
    setShowAppointmentForm(true);
  };

  const handleAppointmentSubmit = async (data: any) => {
    if (!dealForAppointment?.contact_id || !user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Dados incompletos para criar agendamento.",
      });
      return;
    }

    try {
      // O AppointmentForm já calcula end_time e formata os dados corretamente
      // Garantir que o contact_id está correto e vem do deal (não criar novo contato)
      const appointmentData = {
        ...data,
        contact_id: dealForAppointment.contact_id, // Usar sempre o contact_id do deal existente
        user_id: user.id,
      };

      console.log('📅 Criando agendamento para deal existente:', {
        dealId: dealForAppointment.id,
        contactId: dealForAppointment.contact_id,
        appointmentData
      });

      await createAppointment.mutateAsync(appointmentData);

      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });

      setShowAppointmentForm(false);
      setDealForAppointment(null);
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar agendamento",
      });
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!dealId) {
      console.error('❌ handleDeleteDeal: dealId não fornecido');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do contrato não fornecido.",
      });
      return;
    }

    try {
      console.log('🗑️ handleDeleteDeal: Iniciando exclusão do deal:', dealId);
      await deleteDeal(dealId);
      toast({
        title: "Contrato excluído",
        description: "O contrato foi excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('❌ handleDeleteDeal: Erro ao deletar deal:', error);
      const errorMessage = error?.message || "Não foi possível excluir o contrato. Verifique se você tem permissão.";
      toast({
        variant: "destructive",
        title: "Erro ao excluir contrato",
        description: errorMessage,
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
        <PipelineHelp />
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
          <SelectTrigger className="w-[170px]">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[180px] bg-primary/5 border-primary/20">
            <SelectValue placeholder="Tags/Origem do Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens</SelectItem>
            <SelectItem value="meta_ads">Apenas Tráfego Pago</SelectItem>
            <SelectItem value="indicacao">Apenas Indicações</SelectItem>
            <SelectItem value="ambos">Tráfego + Indicações</SelectItem>
          </SelectContent>
        </Select>
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
        deals={filteredDeals}
        followUps={followUps}
        onUpdateDeal={handleUpdateDealStage}
        onReorderDealsInStage={handleReorderDealsInStage}
        onEditDeal={(deal) => setEditingDeal(deal)}
        onDeleteDeal={handleDeleteDeal}
        onScheduleCall={handleScheduleCall}
        isDeletingDeal={false}
        onContactAdded={handleContactAdded}
        highlightedDealId={highlightedDealId}
        onToggleFollowUp={handleToggleFollowUp}
        onCompleteFollowUp={handleCompleteFollowUp}
        onEditFollowUp={handleEditFollowUp}
        showOwnerBadge={viewAllMode && selectedUserIds.length > 1}
        onDealMovedToAgendado={handleDealMovedToAgendado}
        onDealClick={(deal) => {
          console.log('Deal clicked:', deal);
        }}
        onCall={(deal) => {
          if (deal.contact?.phone) {
            const cleanPhone = deal.contact.phone.replace(/\D/g, '');
            navigate(`/whatsapp?phone=${cleanPhone}`);
          } else {
            toast({
              variant: "destructive",
              title: "Telefone não disponível",
              description: "Este contato não possui telefone cadastrado.",
            });
          }
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
            const cleanPhone = deal.contact.phone.replace(/\D/g, '');
            navigate(`/whatsapp?phone=${cleanPhone}`);
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
        deal={(editingDeal as any) || undefined}
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

      {/* Appointment Form - Abre quando lead é arrastado para agendado */}
      {dealForAppointment && (
        <AppointmentForm
          open={showAppointmentForm}
          onOpenChange={(open) => {
            setShowAppointmentForm(open);
            if (!open) {
              setDealForAppointment(null);
            }
          }}
          onSubmit={handleAppointmentSubmit}
          conversionData={{
            contactId: dealForAppointment.contact_id || undefined,
            appointmentValue: dealForAppointment.value || undefined,
            paidInAdvance: false,
          }}
          onAppointmentCreated={() => {
            setShowAppointmentForm(false);
            setDealForAppointment(null);
          }}
        />
      )}
    </div>
  );
}

