import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useCommercialProcedures } from "@/hooks/useCommercialProcedures";
import { ProcedureCard } from "./ProcedureCard";
import { ProcedureForm } from "./ProcedureForm";
import { Loader2 } from "lucide-react";
import { CommercialProcedure } from "@/types/commercial";

export function ProceduresCatalog() {
  const { procedures, isLoading, deleteProcedure } = useCommercialProcedures();
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












