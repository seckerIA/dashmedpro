import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { ProcedureCard } from "./ProcedureCard";
import { ProcedureForm } from "./ProcedureForm";
import { Loader2 } from "lucide-react";
import { CommercialProcedure } from "@/types/commercial";
import { useUserProfile } from "@/hooks/useUserProfile";
import { TeamMemberSelector } from "@/components/crm/TeamMemberSelector";
import { useAuth } from "@/hooks/useAuth";

export function ProceduresCatalog() {
  const { user } = useAuth();
  const { isSecretaria, isAdmin } = useUserProfile();

  // Admin/Dono inicia com viewAllMode=true por padrão
  const [viewAllMode, setViewAllMode] = useState(() => {
    const saved = localStorage.getItem('commercial_procedures_view_all_mode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return false;
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Carregar estado do localStorage detalhado
  useEffect(() => {
    const savedViewAllMode = localStorage.getItem('commercial_procedures_view_all_mode');
    const savedSelectedUserIds = localStorage.getItem('commercial_procedures_selected_user_ids');

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

  const viewAsUserIds = viewAllMode && selectedUserIds.length > 0 ? selectedUserIds : undefined;

  const { procedures, isLoading, deleteProcedure } = useCommercialProcedures(viewAsUserIds);
  const [showForm, setShowForm] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<CommercialProcedure | null>(null);

  const handleEdit = (procedure: CommercialProcedure) => {
    setEditingProcedure(procedure);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este procedimento?")) {
      await deleteProcedure.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Catálogo de Procedimentos</h3>
        <Button
          onClick={() => {
            setEditingProcedure(null);
            setShowForm(true);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
      </div>

      <TeamMemberSelector
        viewAllMode={viewAllMode}
        selectedUserIds={selectedUserIds}
        currentUserId={user?.id || ''}
        onViewAllModeChange={(enabled) => {
          setViewAllMode(enabled);
          localStorage.setItem('commercial_procedures_view_all_mode', JSON.stringify(enabled));
        }}
        onSelectedUserIdsChange={(ids) => {
          setSelectedUserIds(ids);
          if (ids.length > 0) {
            localStorage.setItem('commercial_procedures_selected_user_ids', JSON.stringify(ids));
          } else {
            localStorage.removeItem('commercial_procedures_selected_user_ids');
          }
        }}
      />

      {procedures.length === 0 ? (
        <Card className="bg-gradient-card shadow-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum procedimento cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedures.map(procedure => (
            <ProcedureCard
              key={procedure.id}
              procedure={procedure}
              onEdit={() => handleEdit(procedure)}
              onDelete={() => handleDelete(procedure.id)}
              showDoctor={isSecretaria || isAdmin}
            />
          ))}
        </div>
      )}

      <ProcedureForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingProcedure(null);
          }
        }}
        procedure={editingProcedure}
      />
    </div>
  );
}
















