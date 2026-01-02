import { Card, CardContent } from "@/components/ui/card";
import { useCommercialSales } from "@/hooks/useCommercialSales";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COMMERCIAL_SALE_STATUS_LABELS } from "@/types/commercial";
import { Badge } from "@/components/ui/badge";

export function SalesList() {
  const { sales, isLoading } = useCommercialSales();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card border-border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {sales.map(sale => (
          <Card key={sale.id} className="bg-gradient-card shadow-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-card-foreground">
                      {formatCurrency(sale.value)}
                    </h3>
                    <Badge variant="secondary">
                      {COMMERCIAL_SALE_STATUS_LABELS[sale.status]}
                    </Badge>
                    {(sale as any).doctor?.full_name && (
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                        Dr(a). {(sale as any).doctor.full_name}
                      </Badge>
                    )}
                  </div>
                  {sale.sale_date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                  {sale.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{sale.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
















