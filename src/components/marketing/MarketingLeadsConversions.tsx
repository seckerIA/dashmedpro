import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, ExternalLink, Search, Filter } from "lucide-react";
import { useMarketingLeads, useMarketingLeadMetrics } from "@/hooks/useMarketingLeads";
import { useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { ConversionFunnelChart } from "./ConversionFunnelChart";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { AD_PLATFORM_LABELS } from "@/types/adPlatforms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function MarketingLeadsConversions() {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filters: any = {};
  if (platformFilter !== 'all') {
    filters.platform = platformFilter;
  }
  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  const { data: leads, isLoading: leadsLoading } = useMarketingLeads(filters);
  const { data: metrics, isLoading: metricsLoading } = useMarketingLeadMetrics(filters);
  const { data: campaigns } = useAdCampaignsSync();

  const filteredLeads = leads?.filter(lead => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.campaign_name?.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  // Calcular funil de conversão
  const funnelData = campaigns ? (() => {
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalLeads = filteredLeads.length;
    const totalConversions = filteredLeads.filter(l => l.status === 'converted').length;

    const clickToLeadRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const leadToConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

    return [
      {
        stage: 'Impressões',
        value: totalImpressions,
        percentage: 100,
      },
      {
        stage: 'Cliques',
        value: totalClicks,
        percentage: totalClicks > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      },
      {
        stage: 'Leads',
        value: totalLeads,
        percentage: clickToLeadRate,
      },
      {
        stage: 'Conversões',
        value: totalConversions,
        percentage: leadToConversionRate,
      },
    ];
  })() : [];

  // Calcular ROI por campanha
  const campaignROI = campaigns?.map(campaign => {
    const campaignLeads = filteredLeads.filter(l => l.ad_campaign_sync_id === campaign.id);
    const campaignRevenue = campaignLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const campaignSpend = Number(campaign.spend) || 0;
    const roi = campaignSpend > 0 ? ((campaignRevenue - campaignSpend) / campaignSpend) * 100 : 0;

    return {
      campaign_id: campaign.id,
      campaign_name: campaign.platform_campaign_name,
      platform: campaign.platform,
      spend: campaignSpend,
      revenue: campaignRevenue,
      leads: campaignLeads.length,
      conversions: campaignLeads.filter(l => l.status === 'converted').length,
      roi,
    };
  }).filter(c => c.spend > 0 || c.revenue > 0)
    .sort((a, b) => b.roi - a.roi) || [];

  if (leadsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.leadsByPlatform && Object.keys(metrics.leadsByPlatform).length > 0
                ? Object.entries(metrics.leadsByPlatform)
                    .map(([platform, count]) => `${platform}: ${count}`)
                    .join(', ')
                : 'Sem dados'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.conversionRate ? `${metrics.conversionRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.totalLeads || 0} leads • {filteredLeads.filter(l => l.status === 'converted').length} convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio: {formatCurrency(metrics?.averageLeadValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaignROI.length > 0
                ? `${(campaignROI.reduce((sum, c) => sum + c.roi, 0) / campaignROI.length).toFixed(1)}%`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaignROI.length} campanhas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <ConversionFunnelChart
        data={funnelData}
        title="Funil de Conversão"
        description="Jornada completa do cliente: Impressões → Cliques → Leads → Conversões"
      />

      {/* ROI por Campanha */}
      {campaignROI.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">ROI por Campanha</CardTitle>
            <CardDescription>Ranking de campanhas por retorno sobre investimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaignROI.slice(0, 10).map((campaign, index) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{campaign.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {AD_PLATFORM_LABELS[campaign.platform as 'google_ads' | 'meta_ads']} • 
                        {campaign.leads} leads • {campaign.conversions} conversões
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {campaign.roi > 0 ? '+' : ''}{campaign.roi.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(campaign.revenue - campaign.spend)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/marketing?tab=campaigns&campaign=${campaign.campaign_id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Leads Originados de Anúncios</CardTitle>
              <CardDescription>Leads que chegaram através de campanhas de anúncios</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as plataformas</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(COMMERCIAL_LEAD_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {leads && leads.length === 0
                  ? 'Nenhum lead originado de anúncios encontrado.'
                  : 'Nenhum lead encontrado com os filtros selecionados.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.email && <div>{lead.email}</div>}
                        {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {COMMERCIAL_LEAD_ORIGIN_LABELS[lead.origin as keyof typeof COMMERCIAL_LEAD_ORIGIN_LABELS] || lead.origin}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.campaign_name ? (
                        <div className="text-sm">
                          <div className="font-medium">{lead.campaign_name}</div>
                          {lead.platform && (
                            <div className="text-xs text-muted-foreground">
                              {AD_PLATFORM_LABELS[lead.platform as 'google_ads' | 'meta_ads']}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === 'converted' ? 'default' :
                          lead.status === 'qualified' ? 'secondary' :
                          'outline'
                        }
                      >
                        {COMMERCIAL_LEAD_STATUS_LABELS[lead.status as keyof typeof COMMERCIAL_LEAD_STATUS_LABELS] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.estimated_value ? formatCurrency(lead.estimated_value) : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/comercial?tab=leads&lead=${lead.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


