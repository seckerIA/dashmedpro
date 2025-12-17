import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { LeadsList } from "./LeadsList";
import { LeadForm } from "./LeadForm";
import { FunnelBoard } from "./FunnelBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LeadsManagement() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action");
  const [showLeadForm, setShowLeadForm] = useState(action === "new");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "funnel">("list");
  
  useEffect(() => {
    if (action === "new") {
      setShowLeadForm(true);
    }
  }, [action]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          onClick={() => setShowLeadForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      {/* Tabs: List or Funnel */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "funnel")}>
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <LeadsList searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <FunnelBoard />
        </TabsContent>
      </Tabs>

      {/* Lead Form Modal */}
      <LeadForm
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
      />
    </div>
  );
}

