import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportSelector } from "./ReportSelector";
import { ReportsView } from "./ReportsView";

export function CommercialReports() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card border-border">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Relatórios Comerciais</h2>
          <ReportSelector
            selectedReport={selectedReport}
            onSelectReport={setSelectedReport}
          />
        </CardContent>
      </Card>

      {selectedReport && (
        <ReportsView reportType={selectedReport} />
      )}
    </div>
  );
}
















