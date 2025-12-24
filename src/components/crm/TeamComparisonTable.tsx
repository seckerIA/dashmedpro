import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TeamMetrics } from "@/hooks/useTeamMetrics";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TeamComparisonTableProps {
  teamMetrics: TeamMetrics[];
  isLoading?: boolean;
}

export function TeamComparisonTable({ teamMetrics, isLoading }: TeamComparisonTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (teamMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma métrica disponível para comparação.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular médias para comparação
  const avgPipeline = teamMetrics.reduce((sum, tm) => sum + tm.totalPipeline, 0) / teamMetrics.length;
  const avgRevenue = teamMetrics.reduce((sum, tm) => sum + tm.totalRevenue, 0) / teamMetrics.length;
  const avgConversion = teamMetrics.reduce((sum, tm) => sum + tm.conversionRate, 0) / teamMetrics.length;

  const getTrendIcon = (value: number, average: number) => {
    if (value > average * 1.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < average * 0.9) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Equipes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-right">Pipeline</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Contratos Ativos</TableHead>
                <TableHead className="text-right">Ganhos</TableHead>
                <TableHead className="text-right">Perdidos</TableHead>
                <TableHead className="text-right">Contatos</TableHead>
                <TableHead className="text-right">Leads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMetrics.map((metric) => (
                <TableRow key={metric.userId}>
                  <TableCell className="font-medium">{metric.userName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {formatCurrency(metric.totalPipeline)}
                      {getTrendIcon(metric.totalPipeline, avgPipeline)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {formatCurrency(metric.totalRevenue)}
                      {getTrendIcon(metric.totalRevenue, avgRevenue)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {metric.conversionRate.toFixed(2)}%
                      {getTrendIcon(metric.conversionRate, avgConversion)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{metric.activeDeals}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="bg-green-500">
                      {metric.wonDeals}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{metric.lostDeals}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{metric.totalContacts}</TableCell>
                  <TableCell className="text-right">{metric.totalLeads}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}






