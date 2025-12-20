import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMedicalAppointments } from "@/hooks/useMedicalAppointments";
import { format, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function AttendanceMetricsCard() {
  const { appointments } = useMedicalAppointments({});
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const metrics = useMemo(() => {
    if (!appointments) return null;

    const currentMonthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= currentMonthStart && aptDate <= currentMonthEnd;
    });

    const prevMonthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= prevMonthStart && aptDate <= prevMonthEnd;
    });

    const currentTotal = currentMonthAppointments.length;
    const currentCompleted = currentMonthAppointments.filter(a => a.status === "completed").length;
    const currentNoShow = currentMonthAppointments.filter(a => a.status === "no_show").length;
    const currentScheduled = currentMonthAppointments.filter(
      a => a.status === "scheduled" || a.status === "confirmed"
    ).length;

    const prevTotal = prevMonthAppointments.length;
    const prevCompleted = prevMonthAppointments.filter(a => a.status === "completed").length;
    const prevNoShow = prevMonthAppointments.filter(a => a.status === "no_show").length;

    // Taxa de comparecimento: (total - faltas) / total * 100
    const currentAttendanceRate = currentTotal > 0 
      ? Math.round(((currentTotal - currentNoShow) / currentTotal) * 100 * 10) / 10
      : 0;
    
    const prevAttendanceRate = prevTotal > 0 
      ? Math.round(((prevTotal - prevNoShow) / prevTotal) * 100 * 10) / 10
      : 0;

    // Mudança percentual: (atual - anterior) / anterior * 100
    const attendanceChange = prevAttendanceRate > 0
      ? Math.round(((currentAttendanceRate - prevAttendanceRate) / prevAttendanceRate) * 100 * 10) / 10
      : 0;

    // Taxa de faltas: faltas / total * 100
    const noShowRate = currentTotal > 0 
      ? Math.round((currentNoShow / currentTotal) * 100 * 10) / 10
      : 0;

    return {
      currentTotal,
      currentCompleted,
      currentNoShow,
      currentScheduled,
      currentAttendanceRate,
      prevAttendanceRate,
      attendanceChange,
      noShowRate,
    };
  }, [appointments, currentMonthStart, currentMonthEnd, prevMonthStart, prevMonthEnd]);

  if (!metrics || metrics.currentTotal === 0) {
    return null;
  }

  const hasAlert = metrics.noShowRate > 20;
  const severity = metrics.noShowRate > 30 ? "high" : "medium";

  return (
    <Card className={cn(
      "border-2",
      hasAlert && severity === "high" && "bg-red-500/10 border-red-500/30",
      hasAlert && severity === "medium" && "bg-yellow-500/10 border-yellow-500/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-lg",
              hasAlert && severity === "high" && "bg-red-500/20",
              hasAlert && severity === "medium" && "bg-yellow-500/20",
              !hasAlert && "bg-green-500/20"
            )}>
              {hasAlert ? (
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  severity === "high" && "text-red-600 dark:text-red-400",
                  severity === "medium" && "text-yellow-600 dark:text-yellow-400"
                )} />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold text-foreground mb-1">
                Métricas de Comparecimento
              </CardTitle>
              {hasAlert && (
                <Badge 
                  variant={severity === "high" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {severity === "high" ? "Alta Taxa de Faltas" : "Atenção"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasAlert && (
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <div className="text-sm font-semibold text-foreground mb-1">
              ⚠️ Taxa de Faltas Elevada
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.noShowRate.toFixed(1)}% das consultas estão resultando em faltas. 
              Considere implementar lembretes automáticos.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Comparecimento</div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-lg font-bold text-foreground">
                  {metrics.currentCompleted}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metrics.currentAttendanceRate.toFixed(1)}% taxa
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Faltas</div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {metrics.currentNoShow}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metrics.noShowRate.toFixed(1)}% taxa
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total de consultas:</span>
            <span className="font-bold text-foreground">{metrics.currentTotal}</span>
          </div>
          {metrics.currentScheduled > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Agendadas:</span>
              <span className="font-semibold text-foreground">{metrics.currentScheduled}</span>
            </div>
          )}
        </div>

        {Math.abs(metrics.attendanceChange) > 1 && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Comparado ao mês anterior:</span>
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                metrics.attendanceChange > 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {metrics.attendanceChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(metrics.attendanceChange).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {hasAlert && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Sugestões:</div>
            <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
              <li>Envie lembretes por WhatsApp/SMS 24h antes</li>
              <li>Confirme a consulta no dia anterior</li>
              <li>Considere política de cancelamento com antecedência</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


