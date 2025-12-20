import { DailyMetrics } from "@/types/prospecting";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Clock, Trophy, Star, CheckCircle, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDailyReport } from "@/hooks/useDailyReport";
import { useAuth } from "@/hooks/useAuth";
import { DailyReport } from "@/types/prospecting";

interface DailyReportSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyReport | null;
}

export function DailyReportSummaryModal({ 
  open, 
  onOpenChange, 
  report 
}: DailyReportSummaryModalProps) {
  const { user } = useAuth();
  const { finishReport, isFinishing } = useDailyReport();

  const handleFinish = async () => {
    try {
      await finishReport();
      onOpenChange(false);
    } catch (error) {
      console.error('Error finishing report:', error);
    }
  };

  // Calcular métricas derivadas do report
  const getCalculatedMetrics = () => {
    if (!report) return null;

    const goalCalls = report.goal_calls || 0;
    const goalContacts = report.goal_contacts || 0;
    const totalCalls = report.final_calls || 0;
    const totalContacts = report.final_contacts || 0;
    
    const callsProgress = goalCalls > 0 ? (totalCalls / goalCalls) * 100 : 0;
    const contactsProgress = goalContacts > 0 ? (totalContacts / goalContacts) * 100 : 0;
    const conversionRate = totalCalls > 0 ? (totalContacts / totalCalls) * 100 : 0;

    // Calcular tempo decorrido
    const startTime = new Date(report.started_at);
    const endTime = report.finished_at ? new Date(report.finished_at) : new Date();
    const elapsedMs = endTime.getTime() - startTime.getTime() - (report.total_paused_time || 0) * 1000;
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const elapsedTimeFormatted = `${hours}h ${minutes}m`;

    return {
      goalCalls,
      goalContacts,
      totalCalls,
      totalContacts,
      callsProgress,
      contactsProgress,
      conversionRate,
      elapsedTimeFormatted,
      isActive: report.status === 'active'
    };
  };

  const metrics = getCalculatedMetrics();

  // Determinar mensagem motivacional e nível
  const getPerformanceLevel = () => {
    if (!metrics) return null;

    const callsAchieved = metrics.callsProgress >= 100;
    const contactsAchieved = metrics.contactsProgress >= 100;
    const overallProgress = (metrics.callsProgress + metrics.contactsProgress) / 2;

    if (callsAchieved && contactsAchieved) {
      return {
        level: "champion",
        title: "🏆 Campeão Absoluto!",
        message: "Performance excepcional! Você atingiu todas as metas e superou as expectativas!",
        color: "from-yellow-400 to-orange-500",
        textColor: "text-yellow-700 dark:text-yellow-400",
        icon: Crown,
        stars: 5
      };
    } else if (overallProgress >= 90) {
      return {
        level: "excellent",
        title: "🚀 Performance Excelente!",
        message: "Trabalho incrível! Você está muito próximo da perfeição!",
        color: "from-blue-500 to-cyan-500",
        textColor: "text-blue-700 dark:text-blue-400",
        icon: Sparkles,
        stars: 4
      };
    } else if (overallProgress >= 70) {
      return {
        level: "good",
        title: "💪 Ótimo Trabalho!",
        message: "Boa performance! Continue assim e você alcançará grandes resultados!",
        color: "from-green-500 to-emerald-500",
        textColor: "text-green-700 dark:text-green-400",
        icon: Zap,
        stars: 3
      };
    } else if (overallProgress >= 50) {
      return {
        level: "fair",
        title: "📈 Bom Começo!",
        message: "Você está no caminho certo. Com mais foco, grandes resultados virão!",
        color: "from-purple-500 to-pink-500",
        textColor: "text-purple-700 dark:text-purple-400",
        icon: Target,
        stars: 2
      };
    } else {
      return {
        level: "needs_improvement",
        title: "💡 Continue Persistindo!",
        message: "Cada dia é uma nova oportunidade. Não desista, amanhã será melhor!",
        color: "from-gray-500 to-gray-600",
        textColor: "text-gray-700 dark:text-gray-400",
        icon: Star,
        stars: 1
      };
    }
  };

  const performance = getPerformanceLevel();
  if (!performance || !metrics) {
    return null;
  }
  const PerformanceIcon = performance.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={cn(
              "p-4 rounded-full bg-gradient-to-r",
              performance.color
            )}>
              <PerformanceIcon className="w-12 h-12 text-white animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold">
            Relatório Final do Dia
          </DialogTitle>
          <DialogDescription className="text-lg">
            Confira sua performance e conquistas de hoje
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Mensagem Motivacional */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/30">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            </div>
            <CardContent className="relative p-6 text-center space-y-4">
              <div className="flex justify-center gap-1">
                {Array.from({ length: performance.stars }).map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <h3 className={cn("text-2xl font-bold", performance.textColor)}>
                {performance.title}
              </h3>
              <p className="text-muted-foreground text-lg">
                {performance.message}
              </p>
            </CardContent>
          </Card>

          {/* Resumo das Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Atendimentos */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Target className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Atendimentos</h3>
                    </div>
                     {metrics.callsProgress >= 100 && (
                      <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Meta Atingida
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-lg font-bold px-3 py-1",
                           metrics.callsProgress >= 100 ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400" :
                           metrics.callsProgress >= 80 ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400" :
                          "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-400"
                        )}
                      >
                        {Math.round(metrics.callsProgress)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={metrics.callsProgress} 
                      className="h-4"
                      indicatorClassName={cn(
                        metrics.callsProgress >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                        metrics.callsProgress >= 80 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                        metrics.callsProgress >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                        "bg-gradient-to-r from-gray-400 to-gray-500"
                      )}
                    />
                    <p className="text-sm text-center text-muted-foreground">
                      <span className="font-bold text-2xl text-foreground">{metrics.totalCalls}</span> de{" "}
                      <span className="font-semibold">{metrics.goalCalls}</span> realizados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contatos */}
            <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold">Contatos CRM</h3>
                    </div>
                     {metrics.contactsProgress >= 100 && (
                      <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Meta Atingida
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-lg font-bold px-3 py-1",
                           metrics.contactsProgress >= 100 ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400" :
                           metrics.contactsProgress >= 80 ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400" :
                          "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-900/20 dark:border-gray-600 dark:text-gray-400"
                        )}
                      >
                        {Math.round(metrics.contactsProgress)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={metrics.contactsProgress} 
                      className="h-4"
                      indicatorClassName={cn(
                        metrics.contactsProgress >= 100 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                        metrics.contactsProgress >= 80 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                        metrics.contactsProgress >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                        "bg-gradient-to-r from-gray-400 to-gray-500"
                      )}
                    />
                    <p className="text-sm text-center text-muted-foreground">
                      <span className="font-bold text-2xl text-foreground">{metrics.totalContacts}</span> de{" "}
                      <span className="font-semibold">{metrics.goalContacts}</span> cadastrados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações Adicionais */}
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mx-auto">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Tempo Total</p>
                   <p className="text-2xl font-bold">{metrics.elapsedTimeFormatted}</p>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full w-fit mx-auto">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-purple-600">
                     {metrics.conversionRate.toFixed(2)}%
                  </p>
                </div>

                <div className="text-center space-y-2">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit mx-auto">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-primary">
                     {metrics.isActive ? "Expediente Finalizado" : "Concluído"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Finalizar */}
          <Button 
            onClick={handleFinish}
            disabled={isFinishing}
            className="w-full gap-3 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            {isFinishing ? (
              <>
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Finalizando...
              </>
            ) : (
              <>
                <Star className="w-6 h-6" />
                Finalizar Relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}