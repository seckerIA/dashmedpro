import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdCampaignSync } from "@/hooks/useAdCampaignsSync";
import { AD_PLATFORM_LABELS, AD_CAMPAIGN_STATUS_LABELS } from "@/types/adPlatforms";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdCampaignDetailsProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdCampaignDetails({ campaignId, open, onOpenChange }: AdCampaignDetailsProps) {
  const { data: campaign, isLoading } = useAdCampaignSync(campaignId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign.platform_campaign_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{AD_PLATFORM_LABELS[campaign.platform]}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                  {AD_CAMPAIGN_STATUS_LABELS[campaign.status]}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(campaign.budget || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gasto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(campaign.spend)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Impressões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.impressions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cliques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.ctr.toFixed(2)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.conversions}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Valor de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(campaign.conversion_value)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">CPA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.cpa ? formatCurrency(campaign.cpa) : '-'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROAS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID da Campanha:</span>
              <span className="font-mono">{campaign.platform_campaign_id}</span>
            </div>
            {campaign.start_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Início:</span>
                <span>{format(new Date(campaign.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}
            {campaign.end_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Término:</span>
                <span>{format(new Date(campaign.end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Sincronização:</span>
              <span>{format(new Date(campaign.synced_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

