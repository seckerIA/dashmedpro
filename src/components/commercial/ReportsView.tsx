import { Card, CardContent } from "@/components/ui/card";
import { RevenueChart } from "./RevenueChart";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { Loader2 } from "lucide-react";

interface ReportsViewProps {
  reportType: string;
  title?: string;
}

export function ReportsView({ reportType, title }: ReportsViewProps) {
  const { metrics, isLoading } = useCommercialMetrics();

  if (isLoading) {
    return (
      <Card className="bg-gradient-card shadow-card border-border h-[400px]">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card border-border h-full">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        {reportType === "revenue-by-procedure" && (
          <RevenueChart data={metrics?.revenueByProcedure || []} type="pie" />
        )}

        {reportType === "leads-performance" && (
          <RevenueChart data={metrics?.leadsTrend || []} type="line" />
        )}

        {reportType === "revenue-forecast" && (
          <RevenueChart data={metrics?.monthlyComparison || []} type="bar" />
        )}

        {reportType === "patient-analysis" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">LTV Médio</p>
                <p className="text-2xl font-bold">R$ {metrics?.customer?.ltv?.average?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Novos Pacientes</p>
                <p className="text-2xl font-bold">{metrics?.newPatients || 0}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">CAC Médio</p>
                <p className="text-2xl font-bold">R$ {metrics?.customer?.cac?.average?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            {/* Poderíamos adicionar uma tabela de top pacientes aqui se desejado */}
          </div>
        )}

        {reportType === "campaign-performance" && (
          <div className="space-y-2">
            {metrics?.financial?.roi?.byCampaign?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma campanha encontrada</p>
            ) : (
              <div className="space-y-3">
                {metrics?.financial?.roi?.byCampaign?.map((campaign: any) => (
                  <div key={campaign.campaignId} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">{campaign.campaignName}</p>
                      <p className="text-xs text-muted-foreground">Investimento: R$ {campaign.costs?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">{campaign.roi?.toFixed(1)}% ROI</p>
                      <p className="text-xs text-muted-foreground">Receita: R$ {campaign.revenue?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportType === "seasonality-analysis" && (
          <div className="h-[300px] w-full">
            {/* Usando RevenueChart reutilizável mas passando dados formatados se necessário, ou criando estrutura customizada */}
            <RevenueChart
              data={metrics?.financial?.revenuePerHour?.byHour?.map((h: any) => ({
                name: `${h.hour}h`,
                value: h.revenue
              })) || []}
              type="bar"
            />
            <p className="text-xs text-center text-muted-foreground mt-2">Receita média por hora do dia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
















