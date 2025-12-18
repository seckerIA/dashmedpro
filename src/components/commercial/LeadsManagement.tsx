import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LeadsList } from "./LeadsList";
import { LeadForm } from "./LeadForm";

export function LeadsManagement() {
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action");
  const [showLeadForm, setShowLeadForm] = useState(action === "new");
  const [searchTerm, setSearchTerm] = useState("");
  
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
      </div>

      {/* Leads List */}
      <LeadsList searchTerm={searchTerm} />

      {/* Lead Form Modal */}
      <LeadForm
        open={showLeadForm}
        onOpenChange={setShowLeadForm}
      />
    </div>
  );
}
