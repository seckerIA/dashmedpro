import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, TrendingUp, Save } from "lucide-react";
import { useDailyReport } from "@/hooks/useDailyReport";
import { DailyMetrics } from "@/types/prospecting";

interface EditGoalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMetrics: DailyMetrics;
}

export function EditGoalsModal({ 
  open, 
  onOpenChange,
  currentMetrics 
}: EditGoalsModalProps) {
  const [goalCalls, setGoalCalls] = useState(currentMetrics.goalCalls.toString());
  const [goalContacts, setGoalContacts] = useState(currentMetrics.goalContacts.toString());
  const { updateGoals, isUpdatingGoals } = useDailyReport();

  // Atualizar valores quando as métricas mudarem
  useEffect(() => {
    setGoalCalls(currentMetrics.goalCalls.toString());
    setGoalContacts(currentMetrics.goalContacts.toString());
  }, [currentMetrics]);

  const handleSave = async () => {
    try {
      await updateGoals({
        goalCalls: parseInt(goalCalls),
        goalContacts: parseInt(goalContacts),
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating goals:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl">Editar Metas do Dia</DialogTitle>
          <DialogDescription className="text-base">
            Ajuste suas metas de acordo com seu progresso e necessidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Meta de Atendimentos */}
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
            <Label htmlFor="editGoalCalls" className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
              <Target className="w-5 h-5 text-blue-600" />
              Meta de Atendimentos
            </Label>
            <Input
              id="editGoalCalls"
              type="number"
              min="1"
              value={goalCalls}
              onChange={(e) => setGoalCalls(e.target.value)}
              placeholder="Ex: 20"
              className="text-lg h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Progresso atual: {currentMetrics.totalCalls} / {currentMetrics.goalCalls}
              </span>
              <span className="font-semibold text-blue-600">
                {Math.round(currentMetrics.callsProgress)}%
              </span>
            </div>
          </div>

          {/* Meta de Contatos */}
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
            <Label htmlFor="editGoalContacts" className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Meta de Contatos no CRM
            </Label>
            <Input
              id="editGoalContacts"
              type="number"
              min="1"
              value={goalContacts}
              onChange={(e) => setGoalContacts(e.target.value)}
              placeholder="Ex: 5"
              className="text-lg h-12 border-green-300 focus:border-green-500 focus:ring-green-500/20 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Progresso atual: {currentMetrics.totalContacts} / {currentMetrics.goalContacts}
              </span>
              <span className="font-semibold text-green-600">
                {Math.round(currentMetrics.contactsProgress)}%
              </span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isUpdatingGoals}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdatingGoals || !goalCalls || !goalContacts}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isUpdatingGoals ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Metas
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

