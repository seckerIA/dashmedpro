import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar } from "lucide-react";
import { useCommercialCampaigns } from "@/hooks/useCommercialCampaigns";
import { CommercialCampaign } from "@/types/commercial";
import { COMMERCIAL_CAMPAIGN_TYPE_LABELS } from "@/types/commercial";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { CampaignForm } from "./CampaignForm";

export function CampaignsList() {
  const { campaigns, isLoading, deleteCampaign } = useCommercialCampaigns();
  const [editingCampaign, setEditingCampaign] = useState<CommercialCampaign | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (campaign: CommercialCampaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta campanha?")) {
      await deleteCampaign.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma campanha encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map(campaign => (
          <Card key={campaign.id} className="bg-gradient-card shadow-card border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground truncate">{campaign.name}</h3>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {COMMERCIAL_CAMPAIGN_TYPE_LABELS[campaign.type]}
                  </Badge>
                </div>
                {!campaign.is_active && (
                  <Badge variant="outline" className="text-xs">Inativa</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {campaign.promo_code && (
                  <div>
                    <span className="font-medium">Código: </span>
                    <span className="font-mono">{campaign.promo_code}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Leads gerados: </span>
                  <span>{campaign.leads_generated}</span>
                </div>
                <div>
                  <span className="font-medium">Conversões: </span>
                  <span>{campaign.conversions}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(campaign)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(campaign.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CampaignForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingCampaign(null);
          }
        }}
        campaign={editingCampaign}
      />
    </>
  );
}














