import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineBoard, PipelineBoardProps } from "@/components/crm/PipelineBoard";
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
import { 
  Plus, 
  Search, 
  Filter,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  UserPlus,
  HandCoins,
  Edit,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { CRMDealWithContact } from "@/types/crm";
import { formatCurrency } from "@/lib/currency";
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

const CRM = () => {
  const { user } = useAuth();
  const [viewAllMode, setViewAllMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('crm_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('crm_selected_user_ids');
    
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
    contacts, 
    isLoading,
    updateDeal,
    deleteContact,
    deleteDeal,
    isDeletingContact,
    isDeletingDeal
  } = useCRM(viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined);
  const { 
    followUps, 
    updateFollowUp, 
    isLoading: isLoadingFollowUps 
  } = useFollowUps();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDeal, setEditingDeal] = useState<CRMDealWithContact | null>(null);
  const [highlightedDealId, setHighlightedDealId] = useState<string | null>(null);
  const [showDealWonModal, setShowDealWonModal] = useState(false);
  const [wonDeal, setWonDeal] = useState<CRMDealWithContact | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [showFollowUpEditModal, setShowFollowUpEditModal] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [dealForCall, setDealForCall] = useState<CRMDealWithContact | null>(null);

  const handleUpdateDealStage = async (dealId: string, newStage: string) => {
    try {
      // Se o deal foi movido para "fechado_ganho", mostrar modal
      if (newStage === 'fechado_ganho') {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
          setWonDeal(deal);
          setShowDealWonModal(true);
          
          // Atualizar o stage mesmo assim
          await updateDeal({ 
            dealId, 
            data: { stage: newStage as any }
          });
          return;
        }
      }

      await updateDeal({ 
        dealId, 
        data: { stage: newStage as any }
      });
      toast({
        title: "Contato atualizado",
        description: "O contato foi movido com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o contato.",
      });
    }
  };

  const handleDealWonConfirm = () => {
    if (wonDeal) {
      // Criar URL com query params para pré-preencher o formulário
      const params = new URLSearchParams({
        dealId: wonDeal.id,
        title: wonDeal.title,
        value: wonDeal.value?.toString() || '',
        contactId: wonDeal.contact_id || '',
        contactName: wonDeal.contact?.full_name || '',
      });
      
      navigate(`/financeiro/nova-transacao?${params.toString()}`);
    }
    setShowDealWonModal(false);
    setWonDeal(null);
  };

  const handleDealWonCancel = () => {
    toast({
      title: "Negócio fechado!",
      description: "Você pode registrar a receita depois na página financeira.",
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

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o contato.",
      });
    }
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
    // Highlight o deal recém-criado
    setHighlightedDealId(dealId);
    
    // Scroll para o deal após um pequeno delay para garantir que foi renderizado
    setTimeout(() => {
      const dealElement = document.querySelector(`[data-deal-id="${dealId}"]`);
      if (dealElement) {
        dealElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);

    // Remover highlight após 5 segundos
    setTimeout(() => {
      setHighlightedDealId(null);
    }, 5000);
  };

  // Calculate metrics
  const totalDealsValue = deals.reduce((sum, deal) => {
    const value = typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value;
    return sum + (value || 0);
  }, 0);

  const activeDeals = deals.filter(d => 
    !d.stage.includes('fechado')
  ).length;

  const wonDeals = deals.filter(d => 
    d.stage === 'fechado_ganho'
  ).length;

  const conversionRate = deals.length > 0 
    ? ((wonDeals / deals.length) * 100).toFixed(1)
    : '0';

  const handleScheduleCall = (deal: CRMDealWithContact) => {
    setDealForCall(deal);
    setShowCallForm(true);
  };

  if (isLoading || isLoadingFollowUps) {
    return <CRMLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Header - iOS Inspired */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 backdrop-blur-sm border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">CRM</h1>
              <p className="text-muted-foreground text-sm font-medium">
                Gestão completa de relacionamento com clientes
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <ContactForm />
          <DealForm />
        </div>
      </div>

      {/* Metrics Cards - iOS Inspired */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent border-2 border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-blue-600 transition-colors duration-200">
                  Pipeline Total
                </p>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums group-hover:scale-105 transition-transform duration-200">
                  {formatCurrency(totalDealsValue)}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-2xl backdrop-blur-sm border border-blue-300/30 group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent border-2 border-green-200/50 hover:border-green-300/70 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-green-600 transition-colors duration-200">
                  Contratos Ativos
                </p>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums group-hover:scale-105 transition-transform duration-200">
                  {activeDeals}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative p-4 bg-gradient-to-br from-green-500/20 to-green-600/30 rounded-2xl backdrop-blur-sm border border-green-300/30 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-transparent border-2 border-purple-200/50 hover:border-purple-300/70 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-purple-600 transition-colors duration-200">
                  Taxa de Conversão
                </p>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums group-hover:scale-105 transition-transform duration-200">
                  {conversionRate}%
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-2xl backdrop-blur-sm border border-purple-300/30 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-transparent border-2 border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground group-hover:text-orange-600 transition-colors duration-200">
                  Total Contatos
                </p>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums group-hover:scale-105 transition-transform duration-200">
                  {contacts.length}
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                <div className="relative p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/30 rounded-2xl backdrop-blur-sm border border-orange-300/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <GlobalSearch 
            onSelectDeal={(deal) => {
              // Scroll to deal or highlight it
              console.log('Selected deal:', deal);
            }}
            onSelectContact={(contact) => {
              // Navigate to contact or show details
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
        onViewAllModeChange={setViewAllMode}
        onSelectedUserIdsChange={setSelectedUserIds}
      />

      {/* Tabs - iOS Inspired */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-2xl p-1 h-12">
          <TabsTrigger 
            value="pipeline" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger 
            value="contacts"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            Contatos
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">
              {contacts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="activities"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 font-medium"
          >
            <Target className="w-4 h-4 mr-2" />
            Atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard 
            deals={deals}
            followUps={followUps}
            onUpdateDeal={handleUpdateDealStage}
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
              // Aqui você pode implementar a navegação para detalhes do deal
            }}
            onCall={(deal) => {
              toast({
                title: "Ligação iniciada",
                description: `Ligando para ${deal.contact?.full_name}...`,
              });
              // Aqui você pode implementar a integração com sistema de telefonia
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
                const message = encodeURIComponent(`Olá ${deal.contact.full_name}, tudo bem? Gostaria de fazer um follow-up sobre ${deal.title}.`);
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
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">
                    Nenhum contato cadastrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece adicionando seu primeiro contato
                  </p>
                  <ContactForm 
                    trigger={
                      <Button className="mt-4">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar Contato
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map(contact => (
                    <Card key={contact.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{contact.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.email || contact.phone}
                          </p>
                          {contact.company && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {contact.company}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.company && (
                            <Badge variant="outline">{contact.company}</Badge>
                          )}
                          <div className="flex gap-1">
                            <ContactForm 
                              contact={contact}
                              trigger={
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isDeletingContact}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o contato "{contact.full_name}"? 
                                    Esta ação não pode ser desfeita e todos os deals relacionados serão afetados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteContact(contact.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Nenhuma atividade registrada
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  As atividades aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
        onConfirm={handleDealWonConfirm}
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
};

export default CRM;
