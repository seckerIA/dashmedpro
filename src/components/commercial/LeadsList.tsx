import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LeadCard } from "./LeadCard";
import { useCommercialLeads } from "@/hooks/useCommercialLeads";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowUpDown } from "lucide-react";
import { COMMERCIAL_LEAD_STATUS_LABELS, COMMERCIAL_LEAD_ORIGIN_LABELS } from "@/types/commercial";
import { getScoreLevel } from "@/types/leadScoring";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSecretaryDoctors } from "@/hooks/useSecretaryDoctors";
import { useAuth } from "@/hooks/useAuth";

interface LeadsListProps {
  searchTerm: string;
  viewAsUserIds?: string[];
}

export function LeadsList({ searchTerm, viewAsUserIds }: LeadsListProps) {
  const { user } = useAuth();
  const { isSecretaria } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    origin: originFilter !== "all" ? originFilter : undefined,
  };

  const { leads, isLoading, error } = useCommercialLeads(filters, viewAsUserIds);

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesSearch = !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm);

      if (!matchesSearch) return false;

      // Filtro por origem/tags (Meta Ads e Indicação)
      if (tagFilter !== "all") {
        const leadTags = (lead as any).tags || [];
        const contactTags = (lead as any).contact?.tags || [];
        const hasMeta = leadTags.includes("meta_ads") || contactTags.includes("meta_ads") || leadTags.includes("trafego") || contactTags.includes("trafego");
        const hasIndicacao = leadTags.includes("indicacao") || contactTags.includes("indicacao") || leadTags.includes("indicação") || contactTags.includes("indicação");
        
        if (tagFilter === "meta_ads" && !hasMeta) return false;
        if (tagFilter === "indicacao" && !hasIndicacao) return false;
        if (tagFilter === "ambos" && (!hasMeta && !hasIndicacao)) return false;
      }

      // Filtro por score
      if (scoreFilter !== "all") {
        const score = (lead as any).conversion_score || 0;
        const level = getScoreLevel(score);
        if (scoreFilter === "high" && level !== "high") return false;
        if (scoreFilter === "medium" && level !== "medium") return false;
        if (scoreFilter === "low" && level !== "low") return false;
      }

      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === "score") {
        const scoreA = (a as any).conversion_score || 0;
        const scoreB = (b as any).conversion_score || 0;
        return scoreB - scoreA; // Maior score primeiro
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [leads, searchTerm, scoreFilter, sortBy]);

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
      <div className="flex flex-wrap gap-4 items-center">
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

        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Scores</SelectItem>
            <SelectItem value="high">🟢 Alta Probabilidade</SelectItem>
            <SelectItem value="medium">🟡 Média Probabilidade</SelectItem>
            <SelectItem value="low">🔴 Baixa Probabilidade</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[180px] bg-primary/5 border-primary/20">
            <SelectValue placeholder="Tags/Origem do Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens (Tags)</SelectItem>
            <SelectItem value="meta_ads">Apenas Tráfego Pago</SelectItem>
            <SelectItem value="indicacao">Apenas Indicações</SelectItem>
            <SelectItem value="ambos">Tráfego + Indicações</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}
          className="ml-auto"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Ordenar por {sortBy === "score" ? "Data" : "Score"}
        </Button>
      </div>

      {/* Leads Grid */}
      {
        filteredAndSortedLeads.length === 0 ? (
          <Card className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum lead encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )
      }
    </div >
  );
}















