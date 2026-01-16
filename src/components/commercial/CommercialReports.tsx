import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportSelector } from "./ReportSelector";
import { ReportsView } from "./ReportsView";

export function CommercialReports() {
  const REPORTS = [
    { id: "leads-performance", label: "Performance de Leads" },
    { id: "revenue-by-procedure", label: "Receita por Procedimento" },
    { id: "patient-analysis", label: "Análise de Pacientes", fullWidth: true },
    { id: "campaign-performance", label: "Performance de Campanhas" },
    { id: "revenue-forecast", label: "Previsão de Receita" },
    { id: "seasonality-analysis", label: "Análise de Sazonalidade" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {REPORTS.map((report) => (
          <div key={report.id} className={report.fullWidth ? "lg:col-span-2" : ""}>
            <ReportsView reportType={report.id} title={report.label} />
          </div>
        ))}
      </div>
    </div>
  );
}
















