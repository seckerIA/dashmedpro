import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { CommercialProcedure } from "@/types/commercial";
import { COMMERCIAL_PROCEDURE_CATEGORY_LABELS } from "@/types/commercial";
import { formatCurrency } from "@/lib/currency";

interface ProcedureCardProps {
  procedure: CommercialProcedure;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProcedureCard({ procedure, onEdit, onDelete }: ProcedureCardProps) {
  return (
    <Card className="bg-gradient-card shadow-card border-border hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">{procedure.name}</h3>
            <Badge variant="secondary" className="mt-1 text-xs">
              {COMMERCIAL_PROCEDURE_CATEGORY_LABELS[procedure.category]}
            </Badge>
          </div>
          {!procedure.is_active && (
            <Badge variant="outline" className="text-xs">Inativo</Badge>
          )}
        </div>

        {procedure.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {procedure.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Preço</p>
            <p className="text-lg font-bold text-card-foreground">
              {formatCurrency(procedure.price)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duração</p>
            <p className="text-sm font-medium text-card-foreground">
              {procedure.duration_minutes} min
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
















