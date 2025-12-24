import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdCampaignMetrics } from "@/hooks/useAdCampaignsSync";
import { useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { formatCurrency } from "@/lib/currency";
import { Loader2, TrendingUp, MousePointerClick, Target, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PlatformComparisonChart } from "@/components/marketing/PlatformComparisonChart";

export function AdMetricsDashboard() {
  const { data: metrics, isLoading } = useAdCampaignMetrics();
  const { data: campaigns } = useAdCampaignsSync();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calcular comparativo por plataforma
  const googleCampaigns = campaigns?.filter(c => c.platform === 'google_ads') || [];
  const metaCampaigns = campaigns?.filter(c => c.platform === 'meta_ads') || [];
  
  const googleSpend = googleCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const metaSpend = metaCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
  const googleRevenue = googleCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);
  const metaRevenue = metaCampaigns.reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0);

  const platformData = [
    { name: 'Google Ads', spend: googleSpend, revenue: googleRevenue },
    { name: 'Meta Ads', spend: metaSpend, revenue: metaRevenue },
  ].filter(p => p.spend > 0 || p.revenue > 0);

  // Calcular tendências (comparar com período anterior - mockado por enquanto)
  const previousPeriodSpend = metrics.total_spend * 0.9; // Simulação
  const spendTrend = metrics.total_spend > previousPeriodSpend ? 'up' : 'down';
  const spendChange = Math.abs(((metrics.total_spend - previousPeriodSpend) / previousPeriodSpend) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_spend)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {spendTrend === 'up' ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={spendTrend === 'up' ? 'text-green-500' : 'text-red-500'}>
                {spendChange.toFixed(1)}% vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressões</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_impressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_clicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: {metrics.average_ctr.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_conversions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.average_cpa ? `CPA: ${formatCurrency(metrics.average_cpa)}` : 'CPA: -'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_conversion_value)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.average_roas ? `ROAS Médio: ${metrics.average_roas.toFixed(2)}x` : 'ROAS: -'}
            </p>
          </CardContent>
        </Card>

        {platformData.length > 0 && (
          <PlatformComparisonChart
            data={platformData}
            title="Comparativo de Plataformas"
            description="Gasto e receita por plataforma"
          />
        )}
      </div>
    </div>
  );
}

