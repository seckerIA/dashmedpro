import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, PlayCircle, Trophy, Sparkles } from "lucide-react";
import { useDailyReport } from "@/hooks/useDailyReport";
import { useDefaultGoals } from "@/hooks/useDefaultGoals";
import { cn } from "@/lib/utils";

export function StartDailyReportCard() {
  const [open, setOpen] = useState(false);
  const [goalCalls, setGoalCalls] = useState("20");
  const [goalContacts, setGoalContacts] = useState("5");
  const { startReport, updateGoals, isStarting, isReportActive, todayReport } = useDailyReport();
  const { getDefaultValues } = useDefaultGoals();

  // Carregar metas padrão quando abrir o modal
  useEffect(() => {
    if (!open) return;
    // Se houver relatório ativo hoje, pré-preencher com metas atuais
    if (isReportActive && todayReport) {
      setGoalCalls(String(todayReport.goal_calls || 0));
      setGoalContacts(String(todayReport.goal_contacts || 0));
      return;
    }
    // Caso contrário, usar metas padrão
    const defaults = getDefaultValues();
    setGoalCalls(String(defaults.goalCalls));
    setGoalContacts(String(defaults.goalContacts));
  }, [open, isReportActive, todayReport]);

  const handleStart = async () => {
    try {
      const goals = {
        goalCalls: parseInt(goalCalls),
        goalContacts: parseInt(goalContacts),
      };
      if (isReportActive) {
        // Apenas atualiza metas do expediente em andamento
        await updateGoals(goals);
      } else {
        // Inicia (ou reinicia) o expediente com metas
        await startReport(goals);
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Error starting report:', error);
    }
  };

  // Sempre exibir - permite editar metas e reiniciar expediente a qualquer momento

  return (
    <div className="w-full mb-6">
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/30 shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        </div>

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Performance Diária
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Defina suas metas e comece a jornada rumo ao sucesso
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  <Target className="w-3 h-3 mr-1" />
                  Atendimentos
                </Badge>
                <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Contatos CRM
                </Badge>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <PlayCircle className="w-5 h-5" />
                  {isReportActive ? 'Editar Metas' : 'Iniciar Expediente'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        {isReportActive ? 'Editar Metas do Expediente' : 'Definir Metas do Dia'}
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        {isReportActive 
                          ? 'Atualize suas metas e continue seu expediente'
                          : 'Configure suas metas e comece a superar seus limites'
                        }
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6 py-6">
                  {/* Meta de Atendimentos */}
                  <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <Label htmlFor="goalCalls" className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                      <Target className="w-5 h-5 text-blue-600" />
                      Meta de Atendimentos
                    </Label>
                    <Input
                      id="goalCalls"
                      type="number"
                      min="1"
                      value={goalCalls}
                      onChange={(e) => setGoalCalls(e.target.value)}
                      placeholder="Ex: 20"
                      className="text-lg h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Quantas ligações/atendimentos você pretende fazer hoje?
                    </p>
                  </div>

                  {/* Meta de Contatos */}
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                    <Label htmlFor="goalContacts" className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Meta de Contatos no CRM
                    </Label>
                    <Input
                      id="goalContacts"
                      type="number"
                      min="1"
                      value={goalContacts}
                      onChange={(e) => setGoalContacts(e.target.value)}
                      placeholder="Ex: 5"
                      className="text-lg h-12 border-green-300 focus:border-green-500 focus:ring-green-500/20 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                    />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Quantos novos contatos você quer cadastrar no CRM?
                    </p>
                  </div>


                  {/* Botão de Confirmar */}
                  <Button
                    onClick={handleStart}
                    disabled={isStarting || !goalCalls || !goalContacts}
                    className="w-full gap-2 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {isReportActive ? 'Atualizando...' : 'Iniciando...'}
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        {isReportActive ? 'Atualizar Metas' : 'Iniciar Expediente'}
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

