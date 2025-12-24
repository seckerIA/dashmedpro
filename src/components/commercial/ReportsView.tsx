import { Card, CardContent } from "@/components/ui/card";
import { RevenueChart } from "./RevenueChart";
import { useCommercialMetrics } from "@/hooks/useCommercialMetrics";
import { Loader2 } from "lucide-react";

interface ReportsViewProps {
  reportType: string;
}

export function ReportsView({ reportType }: ReportsViewProps) {
  const { metrics, isLoading } = useCommercialMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card border-border">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {reportType === "leads-performance" && "Performance de Leads"}
          {reportType === "revenue-by-procedure" && "Receita por Procedimento"}
          {reportType === "patient-analysis" && "Análise de Pacientes"}
          {reportType === "campaign-performance" && "Performance de Campanhas"}
          {reportType === "revenue-forecast" && "Previsão de Receita"}
          {reportType === "seasonality-analysis" && "Análise de Sazonalidade"}
        </h3>
        
        {reportType === "revenue-by-procedure" && (
          <RevenueChart data={metrics?.revenueByProcedure || []} type="pie" />
        )}
        
        {reportType === "leads-performance" && (
          <RevenueChart data={metrics?.leadsTrend || []} type="line" />
        )}
        
        {reportType === "revenue-forecast" && (
          <RevenueChart data={metrics?.monthlyComparison || []} type="bar" />
        )}
      </CardContent>
    </Card>
  );
}















