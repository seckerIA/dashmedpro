import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Calendar, MessageSquare, Settings } from 'lucide-react';
import { useAutomatedFollowUps } from '@/hooks/useAutomatedFollowUps';
import { NPSMetricsCard } from '@/components/followup/NPSMetricsCard';
import { FollowUpsList } from '@/components/followup/FollowUpsList';
import { ResponsesList } from '@/components/followup/ResponsesList';
import { TemplatesList } from '@/components/followup/TemplatesList';
import { TemplateFormDialog } from '@/components/followup/TemplateFormDialog';

export default function FollowUpPage() {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const {
    templates,
    scheduled,
    responses,
    dashboardMetrics,
    metricsLoading,
    createDefaultTemplates,
  } = useAutomatedFollowUps();

  const handleCreateDefaultTemplates = async () => {
    try {
      await createDefaultTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Follow-Up Automático</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhamento de pacientes com NPS e satisfação
          </p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={handleCreateDefaultTemplates}>
              <Settings className="h-4 w-4 mr-2" />
              Criar Templates Padrão
            </Button>
          )}
          <Button onClick={() => setIsTemplateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NPSMetricsCard
            nps={dashboardMetrics.nps}
            loading={metricsLoading}
          />

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa de Resposta</span>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {dashboardMetrics.response_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardMetrics.total_responded} de {dashboardMetrics.total_sent} enviados
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">CSAT Médio</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {dashboardMetrics.csat_average.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de 5.0 estrelas
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pendentes</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">
              {dashboardMetrics.pending_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              agendados para envio
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">
            Agendados ({scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="responses">
            Respostas ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          <FollowUpsList followups={scheduled} />
        </TabsContent>

        <TabsContent value="responses" className="mt-6">
          <ResponsesList responses={responses} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesList templates={templates} />
        </TabsContent>
      </Tabs>

      {/* Template Form Dialog */}
      <TemplateFormDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      />
    </div>
  );
}
