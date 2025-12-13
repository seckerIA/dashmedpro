import { Card } from "@/components/ui/card";
import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import { useProspectingSessions } from "@/hooks/useProspectingSessions";

export function DailyStats() {
  const { todayStats, isLoading } = useProspectingSessions();

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed top-6 left-6 z-50">
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-2 p-4 min-w-[280px]">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm">Atendimentos Hoje</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Total
              </span>
              <span className="text-2xl font-bold text-primary">{todayStats.total}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Encerrados</span>
              <span className="font-medium">{todayStats.atendimentosEncerrados}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                Contatos Adquiridos
              </span>
              <span className="font-medium text-green-600">{todayStats.contatosDecisores}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}





