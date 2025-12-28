import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ReportSelectorProps {
  selectedReport: string | null;
  onSelectReport: (report: string) => void;
}

const REPORTS = [
  { id: "leads-performance", label: "Performance de Leads" },
  { id: "revenue-by-procedure", label: "Receita por Procedimento" },
  { id: "patient-analysis", label: "Análise de Pacientes" },
  { id: "campaign-performance", label: "Performance de Campanhas" },
  { id: "revenue-forecast", label: "Previsão de Receita" },
  { id: "seasonality-analysis", label: "Análise de Sazonalidade" },
];

export function ReportSelector({ selectedReport, onSelectReport }: ReportSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Selecione um Relatório</Label>
      <Select value={selectedReport || ""} onValueChange={onSelectReport}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um relatório..." />
        </SelectTrigger>
        <SelectContent>
          {REPORTS.map(report => (
            <SelectItem key={report.id} value={report.id}>
              {report.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
















