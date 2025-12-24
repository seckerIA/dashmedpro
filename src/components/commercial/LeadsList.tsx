import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCard } from "./LeadCard";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";

interface LeadsListProps {
  searchTerm: string;
}

export function LeadsList({ searchTerm }: LeadsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    origin: originFilter !== "all" ? originFilter : undefined,
  };

  const { leads, isLoading } = useCommercialLeads(filters);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(COMMERCIAL_LEAD_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens</SelectItem>
            {Object.entries(COMMERCIAL_LEAD_ORIGIN_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {filteredLeads.length === 0 ? (
        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum lead encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}












