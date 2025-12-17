import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommercialMetrics } from "@/types/metrics";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";

interface MetricsTablesProps {
  metrics: CommercialMetrics;
  isLoading?: boolean;
}

export function MetricsTables({ metrics, isLoading }: MetricsTablesProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-6">
              <div className="text-muted-foreground">Carregando tabela...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Tabela de Custos por Consulta
  const appointmentCosts = metrics.financial.costPerAppointment.individual
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
    .slice(0, 20); // Mostrar apenas as 20 mais recentes

  // Tabela de ROI por Campanha
  const campaignROI = metrics.marketing.campaignROI
    .sort((a, b) => b.roi - a.roi);

  // Tabela de Eficiência por Procedimento
  const procedureEfficiency = metrics.operational.procedureEfficiency
    .sort((a, b) => b.revenuePerMinute - a.revenuePerMinute);

  // Tabela de Pacientes LTV
  const patientLTV = metrics.customer.ltv.byPatient
    .sort((a, b) => b.netValue - a.netValue)
    .slice(0, 20); // Top 20 pacientes

  return (
    <div className="space-y-6">
      {/* Tabela de Custos por Consulta */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Custos por Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Consulta</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custos</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointmentCosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma consulta encontrada no período
                    </TableCell>
                  </TableRow>
                ) : (
                  appointmentCosts.map((item) => (
                    <TableRow key={item.appointmentId}>
                      <TableCell>
                        {format(parseISO(item.appointmentDate), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{item.appointmentTitle}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {formatCurrency(item.costs)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {formatCurrency(item.netProfit)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.margin >= 0 ? "default" : "destructive"}>
                          {item.margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de ROI por Campanha */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>ROI por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignROI.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhuma campanha encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  campaignROI.map((campaign) => (
                    <TableRow key={campaign.campaignId}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.campaignType}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(campaign.investment)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(campaign.revenue)}
                      </TableCell>
                      <TableCell className="text-right">{campaign.leads}</TableCell>
                      <TableCell className="text-right">{campaign.conversions}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={campaign.roi >= 0 ? "default" : "destructive"}>
                          {campaign.roi.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Eficiência por Procedimento */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Eficiência por Tipo de Procedimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Duração Média (min)</TableHead>
                  <TableHead className="text-right">Receita Média</TableHead>
                  <TableHead className="text-right">Receita/Minuto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedureEfficiency.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum procedimento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  procedureEfficiency.map((procedure, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{procedure.procedureType}</TableCell>
                      <TableCell className="text-right">{procedure.count}</TableCell>
                      <TableCell className="text-right">
                        {procedure.averageDuration.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(procedure.averageRevenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {formatCurrency(procedure.revenuePerMinute)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes LTV */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle>Lifetime Value (LTV) dos Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="text-right">Consultas</TableHead>
                  <TableHead className="text-right">Receita Total</TableHead>
                  <TableHead className="text-right">Custos Total</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientLTV.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhum paciente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  patientLTV.map((patient) => (
                    <TableRow key={patient.patientId}>
                      <TableCell className="font-medium">{patient.patientName}</TableCell>
                      <TableCell className="text-right">{patient.appointments}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {formatCurrency(patient.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {formatCurrency(patient.totalCosts)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={patient.netValue >= 0 ? "default" : "destructive"}>
                          {formatCurrency(patient.netValue)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

