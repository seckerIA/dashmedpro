import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Download, CalendarIcon, BarChart3, TrendingUp, PieChart, LineChart as LineChartIcon } from "lucide-react";
import { useMarketingReports, type ReportPeriod } from "@/hooks/useMarketingReports";
import { useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { formatCurrency } from "@/lib/currency";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { AD_PLATFORM_LABELS } from "@/types/adPlatforms";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MarketingReports() {
  const [period, setPeriod] = useState<ReportPeriod>('30d');
  const [platform, setPlatform] = useState<'google_ads' | 'meta_ads' | 'all'>('all');
  const [campaignId, setCampaignId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [reportType, setReportType] = useState<'general' | 'campaign' | 'platform' | 'roi' | 'leads'>('general');

  const { data: campaigns } = useAdCampaignsSync();
  
  const filters = {
    period: period === 'custom' ? 'custom' : period,
    start_date: period === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
    end_date: period === 'custom' && customEndDate ? customEndDate.toISOString() : undefined,
    platform,
    campaign_id: campaignId !== 'all' ? campaignId : undefined,
  };

  const { data: reportData, isLoading } = useMarketingReports(filters as any);

  const handleExportCSV = () => {
    if (!reportData) return;

    // Criar CSV com resumo + dados por campanha
    const { metrics } = reportData;
    const summaryRows = [
      `# Período: ${reportData.period.label}`,
      `# Gasto Total,${metrics.total_spend.toFixed(2)}`,
      `# Receita Total,${metrics.total_revenue.toFixed(2)}`,
      `# ROI,${metrics.roi.toFixed(1)}%`,
      `# ROAS,${metrics.average_roas.toFixed(2)}x`,
      `# Leads,${reportData.leadMetrics.totalLeads}`,
      '',
    ];
    const headers = ['Campanha', 'Plataforma', 'Gasto', 'Receita', 'Conversões', 'ROAS'];
    const rows = reportData.byCampaign.map(c => [
      `"${c.campaign_name}"`,
      c.platform,
      c.spend.toFixed(2),
      c.revenue.toFixed(2),
      c.conversions.toString(),
      c.roas.toFixed(2),
    ]);

    const csvContent = [
      ...summaryRows,
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-marketing-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando dados do relatório...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtros do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="custom">Período customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="google_ads">{AD_PLATFORM_LABELS.google_ads}</SelectItem>
                  <SelectItem value="meta_ads">{AD_PLATFORM_LABELS.meta_ads}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Campanha</label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.platform_campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Período: {reportData.period.label}
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.metrics.total_spend)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.metrics.total_revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROAS Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.metrics.average_roas > 0 
                ? `${reportData.metrics.average_roas.toFixed(2)}x` 
                : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.metrics.total_revenue === 0 && reportData.metrics.total_spend > 0
                ? '-'
                : `${reportData.metrics.roi > 0 ? '+' : ''}${reportData.metrics.roi.toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gasto ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução diária do investimento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Gasto"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Receita"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Comparativo de Plataformas</CardTitle>
            <CardDescription>Gasto e receita por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.byPlatform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="spend" fill="#ef4444" name="Gasto" />
                <Bar dataKey="revenue" fill="#10b981" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Gastos por Campanha */}
      {reportData.byCampaign.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribuição de Gastos por Campanha</CardTitle>
            <CardDescription>Percentual do gasto total por campanha</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={reportData.byCampaign.slice(0, 5).map(c => ({
                    name: c.campaign_name,
                    value: c.spend,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.byCampaign.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Métricas por Campanha</CardTitle>
          <CardDescription>Dados detalhados de cada campanha no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Conversões</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.byCampaign.length > 0 ? (
                reportData.byCampaign.map((campaign) => {
                  const roi = campaign.spend > 0 
                    ? ((campaign.revenue - campaign.spend) / campaign.spend) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={campaign.campaign_id}>
                      <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.platform}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                      <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                      <TableCell>{campaign.conversions}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.roas >= 2 ? 'default' : 'secondary'}>
                          {campaign.roas.toFixed(2)}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-semibold",
                          roi > 0 ? "text-green-500" : roi < 0 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma campanha encontrada no período selecionado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


