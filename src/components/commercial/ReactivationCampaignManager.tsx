import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useReactivation } from "@/hooks/useReactivation";
import { ReactivationCampaign, DEFAULT_REACTIVATION_TEMPLATE, DEFAULT_REACTIVATION_TEMPLATE_B } from "@/types/reactivation";
import { ReactivationTemplateEditor } from "./ReactivationTemplateEditor";
import { Loader2, Plus, Play, Pause, BarChart3, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function ReactivationCampaignManager() {
  const { campaigns, isLoadingCampaigns, upsertCampaign, processCampaign } = useReactivation();
  const { toast } = useToast();
  const [editingCampaign, setEditingCampaign] = useState<ReactivationCampaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCampaign = () => {
    setEditingCampaign({
      id: '',
      user_id: '',
      name: '',
      inactive_period_months: 6,
      enabled: true,
      message_templates: [DEFAULT_REACTIVATION_TEMPLATE, DEFAULT_REACTIVATION_TEMPLATE_B],
      schedule_config: {
        preferred_hours: [9, 10, 14, 15],
        timezone: 'America/Sao_Paulo',
      },
    });
    setIsDialogOpen(true);
  };

  const handleEditCampaign = (campaign: ReactivationCampaign) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (!editingCampaign) return;

    try {
      await upsertCampaign.mutateAsync(editingCampaign);
      
      toast({
        title: "Campanha salva",
        description: "A campanha de reativação foi salva com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingCampaign(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error?.message || "Não foi possível salvar a campanha.",
      });
    }
  };

  const handleProcessCampaign = async (campaignId: string) => {
    try {
      await processCampaign.mutateAsync(campaignId);
      toast({
        title: "Campanha processada",
        description: "A campanha foi processada e as mensagens foram enviadas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível processar a campanha.",
      });
    }
  };

  if (isLoadingCampaigns) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas de Reativação</h2>
          <p className="text-muted-foreground">
            Configure campanhas automáticas para reativar pacientes inativos
          </p>
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>
                      Pacientes inativos há {campaign.inactive_period_months} meses
                    </CardDescription>
                  </div>
                  <Badge variant={campaign.enabled ? "default" : "secondary"}>
                    {campaign.enabled ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Templates:</span>
                  <span className="font-medium">{campaign.message_templates.length} variantes</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCampaign(campaign)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleProcessCampaign(campaign.id)}
                    disabled={processCampaign.isPending}
                  >
                    {processCampaign.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Processar Agora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Estatísticas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma campanha configurada ainda.
            </p>
            <Button onClick={handleCreateCampaign}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição/Criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign?.id ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
          </DialogHeader>
          
          {editingCampaign && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  value={editingCampaign.name}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, name: e.target.value })
                  }
                  placeholder="Ex: Reativação de Pacientes Inativos"
                />
              </div>

              <div className="space-y-2">
                <Label>Período de Inatividade (meses)</Label>
                <Input
                  type="number"
                  value={editingCampaign.inactive_period_months}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      inactive_period_months: parseInt(e.target.value) || 6,
                    })
                  }
                  min={1}
                  max={24}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Campanha Ativa</Label>
                <Switch
                  checked={editingCampaign.enabled}
                  onCheckedChange={(checked) =>
                    setEditingCampaign({ ...editingCampaign, enabled: checked })
                  }
                />
              </div>

              <ReactivationTemplateEditor
                templates={editingCampaign.message_templates}
                onChange={(templates) =>
                  setEditingCampaign({ ...editingCampaign, message_templates: templates })
                }
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingCampaign(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveCampaign} disabled={upsertCampaign.isPending}>
                  {upsertCampaign.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

