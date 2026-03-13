import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Calendar, Users, TrendingUp, Target, BarChart3 } from "lucide-react";
import { useMarketingLeads } from "@/hooks/useMarketingLeads";
import { useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { ConversionFunnelChart } from "./ConversionFunnelChart";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { AD_PLATFORM_LABELS } from "@/types/adPlatforms";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type PeriodFilter, PERIOD_FILTER_OPTIONS, isWithinPeriod } from "@/lib/periodFilter";
import { cn } from "@/lib/utils";

export function MarketingLeadsConversions() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: allLeads, isLoading: leadsLoading } = useMarketingLeads();
  const { data: campaigns } = useAdCampaignsSync();

  // Aplicar TODOS os filtros client-side
  const filteredLeads = useMemo(() => {
    if (!allLeads) return [];

    return allLeads.filter(lead => {
      // Período
      if (!isWithinPeriod(lead.created_at, periodFilter)) return false;

      // Plataforma
      if (platformFilter !== 'all') {
        if (platformFilter === 'meta_ads' && lead.platform !== 'meta_ads' && lead.origin !== 'facebook' && lead.origin !== 'instagram') return false;
        if (platformFilter === 'google_ads' && lead.platform !== 'google_ads' && lead.origin !== 'google') return false;
      }

      // Campanha
      if (campaignFilter !== 'all' && lead.campaign_name !== campaignFilter) return false;

      // Formulário
      if (formFilter !== 'all' && lead.form_name !== formFilter) return false;

      // Status
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

      // Busca
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
    });
  }, [allLeads, periodFilter, platformFilter, campaignFilter, formFilter, statusFilter, searchQuery]);

  // Extrair opções únicas para os filtros
  const filterOptions = useMemo(() => {
    if (!allLeads) return { campaigns: [], forms: [] };

    // Filtrar pelo período para que as opções reflitam o período selecionado
    const periodLeads = allLeads.filter(l => isWithinPeriod(l.created_at, periodFilter));

    const campaignNames = [...new Set(periodLeads.map(l => l.campaign_name).filter(Boolean))] as string[];
    const formNames = [...new Set(periodLeads.map(l => l.form_name).filter(Boolean))] as string[];

    return {
      campaigns: campaignNames.sort(),
      forms: formNames.sort(),
    };
  }, [allLeads, periodFilter]);

  // Métricas calculadas dos leads filtrados
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const convertedLeads = filteredLeads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalRevenue = filteredLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);
    const avgValue = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    // Breakdown por plataforma
    const byPlatform: Record<string, number> = {};
    filteredLeads.forEach(l => {
      const p = l.platform === 'meta_ads' || l.origin === 'facebook' || l.origin === 'instagram'
        ? 'meta_ads' : l.platform === 'google_ads' || l.origin === 'google' ? 'google_ads' : l.origin;
      byPlatform[p] = (byPlatform[p] || 0) + 1;
    });

    return { totalLeads, convertedLeads, conversionRate, totalRevenue, avgValue, byPlatform };
  }, [filteredLeads]);

  // Breakdown por campanha
  const campaignBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; converted: number; revenue: number }>();
    filteredLeads.forEach(lead => {
      const key = lead.campaign_name || 'Sem campanha';
      const existing = map.get(key) || { name: key, count: 0, converted: 0, revenue: 0 };
      existing.count++;
      if (lead.status === 'converted') existing.converted++;
      existing.revenue += Number(lead.estimated_value) || 0;
      map.set(key, existing);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Breakdown por formulário
  const formBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; converted: number }>();
    filteredLeads.forEach(lead => {
      if (!lead.form_name) return;
      const existing = map.get(lead.form_name) || { name: lead.form_name, count: 0, converted: 0 };
      existing.count++;
      if (lead.status === 'converted') existing.converted++;
      map.set(lead.form_name, existing);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Breakdown por anúncio/criativo
  const adBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; campaign: string }>();
    filteredLeads.forEach(lead => {
      if (!lead.ad_name) return;
      const existing = map.get(lead.ad_name) || { name: lead.ad_name, count: 0, campaign: lead.campaign_name || '' };
      existing.count++;
      map.set(lead.ad_name, existing);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // Funil de conversão
  const funnelData = useMemo(() => {
    if (!campaigns) return [];

    // Filtrar campanhas pela plataforma selecionada
    let filteredCampaigns = campaigns;
    if (platformFilter !== 'all') {
      filteredCampaigns = campaigns.filter(c => c.platform === platformFilter);
    }

    const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
    const totalClicks = filteredCampaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    const totalLeads = filteredLeads.length;
    const totalConversions = filteredLeads.filter(l => l.status === 'converted').length;

    return [
      { stage: 'Impressões', value: totalImpressions, percentage: 100 },
      { stage: 'Cliques', value: totalClicks, percentage: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0 },
      { stage: 'Leads', value: totalLeads, percentage: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0 },
      { stage: 'Conversões', value: totalConversions, percentage: totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0 },
    ];
  }, [campaigns, filteredLeads, platformFilter]);

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filtros de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[170px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                <SelectItem value="meta_ads">Meta Ads (Facebook/Instagram)</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
              </SelectContent>
            </Select>

            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as campanhas</SelectItem>
                {filterOptions.campaigns.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filterOptions.forms.length > 0 && (
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Formulário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formulários</SelectItem>
                  {filterOptions.forms.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(COMMERCIAL_LEAD_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.entries(metrics.byPlatform).length > 0
                ? Object.entries(metrics.byPlatform)
                    .map(([p, count]) => `${p === 'meta_ads' ? 'Meta' : p === 'google_ads' ? 'Google' : p}: ${count}`)
                    .join(' | ')
                : 'Sem dados no período'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.conversionRate > 0 ? `${metrics.conversionRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalLeads} leads | {metrics.convertedLeads} convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio: {formatCurrency(metrics.avgValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Custo por Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const totalSpend = (campaigns || []).reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
              const cpl = metrics.totalLeads > 0 ? totalSpend / metrics.totalLeads : 0;
              return (
                <>
                  <div className="text-2xl font-bold">{cpl > 0 ? formatCurrency(cpl) : '-'}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gasto total: {formatCurrency(totalSpend)}
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <ConversionFunnelChart
        data={funnelData}
        title="Funil de Conversão"
        description="Impressões → Cliques → Leads → Conversões"
      />

      {/* Breakdown por Campanha */}
      {campaignBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Campanha</CardTitle>
            <CardDescription>Quantidade de leads gerados por cada campanha no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {campaignBreakdown.slice(0, 15).map((item) => {
                const pct = metrics.totalLeads > 0 ? (item.count / metrics.totalLeads) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <span className="text-sm font-semibold ml-2">{item.count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.converted} convertidos | {formatCurrency(item.revenue)} receita | {pct.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown por Formulário */}
      {formBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Formulário</CardTitle>
            <CardDescription>Formulários do Facebook Lead Ads e seus resultados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formBreakdown.slice(0, 10).map((item) => {
                const pct = metrics.totalLeads > 0 ? (item.count / metrics.totalLeads) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <span className="text-sm font-semibold ml-2">{item.count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.converted} convertidos | {pct.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown por Anúncio/Criativo */}
      {adBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads por Anúncio/Criativo</CardTitle>
            <CardDescription>Performance de cada anúncio individual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adBreakdown.slice(0, 15).map((item) => {
                const pct = metrics.totalLeads > 0 ? (item.count / metrics.totalLeads) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <span className="text-sm font-semibold ml-2">{item.count}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Campanha: {item.campaign} | {pct.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">
                Leads ({filteredLeads.length})
              </CardTitle>
              <CardDescription>Lista detalhada de leads no período selecionado</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum lead encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Formulário</TableHead>
                    <TableHead>Anúncio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.slice(0, 100).map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {lead.email && <div className="truncate max-w-[150px]">{lead.email}</div>}
                          {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[160px]">
                          {lead.campaign_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[120px]">
                          {lead.form_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[120px]">
                          {lead.ad_name || '-'}
                        </div>
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
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(lead.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
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
              {filteredLeads.length > 100 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Exibindo 100 de {filteredLeads.length} leads. Use os filtros para refinar.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
