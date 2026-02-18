import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pause, Play, Eye, RefreshCw, Search, Filter } from "lucide-react";
import { useAdCampaignsSync, usePauseAdCampaign, useActivateAdCampaign } from "@/hooks/useAdCampaignsSync";
import { useAdPlatformConnections } from "@/hooks/useAdPlatformConnections";
import { AdCampaignDetails } from "./AdCampaignDetails";
import { AD_PLATFORM_LABELS, AD_CAMPAIGN_STATUS_LABELS } from "@/types/adPlatforms";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdCampaignsList() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const filters: any = {};
  if (platformFilter !== 'all') filters.platform = platformFilter;
  if (statusFilter !== 'all') filters.status = statusFilter;

  const { data: campaigns, isLoading } = useAdCampaignsSync(filters);
  const { data: connections } = useAdPlatformConnections();
  const pauseCampaign = usePauseAdCampaign();
  const activateCampaign = useActivateAdCampaign();
  const { toast } = useToast();

  // Filtrar campanhas apenas de ad accounts ativas (category 'other')
  const activeAdAccountIds = useMemo(() => {
    return new Set(
      (connections || [])
        .filter(c => c.is_active && c.account_category === 'other')
        .map(c => c.id)
    );
  }, [connections]);

  const filteredCampaigns = useMemo(() => {
    let result = campaigns || [];

    // Filtrar por ad accounts ativas
    if (activeAdAccountIds.size > 0) {
      result = result.filter(c => activeAdAccountIds.has(c.connection_id));
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(campaign =>
        campaign.platform_campaign_name.toLowerCase().includes(query) ||
        campaign.platform_campaign_id.toLowerCase().includes(query)
      );
    }

    return result;
  }, [campaigns, activeAdAccountIds, searchQuery]);

  const handlePause = async (campaignId: string) => {
    try {
      await pauseCampaign.mutateAsync(campaignId);
      toast({
        title: 'Campanha pausada',
        description: 'A campanha foi pausada com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao pausar campanha.',
      });
    }
  };

  const handleActivate = async (campaignId: string) => {
    try {
      await activateCampaign.mutateAsync(campaignId);
      toast({
        title: 'Campanha ativada',
        description: 'A campanha foi ativada com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao ativar campanha.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as plataformas</SelectItem>
            <SelectItem value="google_ads">{AD_PLATFORM_LABELS.google_ads}</SelectItem>
            <SelectItem value="meta_ads">{AD_PLATFORM_LABELS.meta_ads}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="paused">Pausada</SelectItem>
            <SelectItem value="ended">Finalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {campaigns && campaigns.length === 0
                ? 'Nenhuma campanha sincronizada. Sincronize suas conexões para ver campanhas.'
                : 'Nenhuma campanha encontrada com os filtros selecionados.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gasto</TableHead>
                  <TableHead>Impressões</TableHead>
                  <TableHead>Cliques</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Conversões</TableHead>
                  <TableHead>ROAS</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.platform_campaign_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {AD_PLATFORM_LABELS[campaign.platform]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === 'active' ? 'default' :
                          campaign.status === 'paused' ? 'secondary' : 'outline'
                        }
                      >
                        {AD_CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                    <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                    <TableCell>{campaign.ctr.toFixed(2)}%</TableCell>
                    <TableCell>{campaign.conversions}</TableCell>
                    <TableCell>
                      {campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCampaign(campaign.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePause(campaign.id)}
                            disabled={pauseCampaign.isPending}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : campaign.status === 'paused' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(campaign.id)}
                            disabled={activateCampaign.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedCampaign && (
        <AdCampaignDetails
          campaignId={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}


