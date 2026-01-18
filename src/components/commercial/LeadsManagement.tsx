import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LeadsList } from "./LeadsList";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export function LeadsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();

  // Admin/Dono inicia com viewAllMode=true por padrão
  const [viewAllMode, setViewAllMode] = useState(() => {
    const saved = localStorage.getItem('commercial_leads_view_all_mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage e ajustar para admin
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('commercial_leads_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('commercial_leads_selected_user_ids');

    if (isAdmin && savedViewAllMode === null) {
      setViewAllMode(true);
    } else if (savedViewAllMode !== null) {
      setViewAllMode(JSON.parse(savedViewAllMode));
    }

    if (savedSelectedUserIds) {
      try {
        setSelectedUserIds(JSON.parse(savedSelectedUserIds));
      } catch {
        setSelectedUserIds([]);
      }
    }
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pacientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <TeamMemberSelector
            viewAllMode={viewAllMode}
            selectedUserIds={selectedUserIds}
            currentUserId={user?.id || ''}
            onViewAllModeChange={(enabled) => {
              setViewAllMode(enabled);
              localStorage.setItem('commercial_leads_view_all_mode', JSON.stringify(enabled));
            }}
            onSelectedUserIdsChange={(ids) => {
              setSelectedUserIds(ids);
              if (ids.length > 0) {
                localStorage.setItem('commercial_leads_selected_user_ids', JSON.stringify(ids));
              } else {
                localStorage.removeItem('commercial_leads_selected_user_ids');
              }
            }}
          />
        </div>
      </div>

      {/* Leads List */}
      <LeadsList
        searchTerm={searchTerm}
        viewAsUserIds={viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined}
      />
    </div>
  );
}
