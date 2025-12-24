import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLeadScoring } from "@/hooks/useLeadScoring";
import { LeadScoreFactor, DEFAULT_SCORE_WEIGHTS } from "@/types/leadScoring";
import { Loader2, Save, RefreshCw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Charts removed for now - can be added later if needed
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function LeadScoringPanel() {
  const { factors, isLoadingFactors, updateScoreWeights, recalculateAllScores } = useLeadScoring();
  const { toast } = useToast();
  const [localFactors, setLocalFactors] = useState<Record<string, { weight: number; enabled: boolean }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (factors) {
      const initial: Record<string, { weight: number; enabled: boolean }> = {};
      factors.forEach((factor) => {
        initial[factor.factor_name] = {
          weight: factor.weight,
          enabled: factor.enabled,
        };
      });
      setLocalFactors(initial);
    }
  }, [factors]);

  const handleWeightChange = (factorName: string, value: number[]) => {
    setLocalFactors((prev) => ({
      ...prev,
      [factorName]: {
        ...prev[factorName],
        weight: value[0],
      },
    }));
    setHasChanges(true);
  };

  const handleEnabledChange = (factorName: string, enabled: boolean) => {
    setLocalFactors((prev) => ({
      ...prev,
      [factorName]: {
        ...prev[factorName],
        enabled,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!factors) return;

    const updates = factors
      .filter((f) => localFactors[f.factor_name])
      .map((f) => ({
        id: f.id,
        weight: localFactors[f.factor_name].weight,
        enabled: localFactors[f.factor_name].enabled,
      }));

    try {
      await updateScoreWeights.mutateAsync(updates);
      setHasChanges(false);
      toast({
        title: "Pesos atualizados",
        description: "Os pesos dos fatores foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar os pesos.",
      });
    }
  };

  const handleRecalculateAll = async () => {
    try {
      await recalculateAllScores.mutateAsync();
      toast({
        title: "Scores recalculados",
        description: "Todos os leads tiveram seus scores recalculados.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível recalcular os scores.",
      });
    }
  };

  const factorLabels: Record<string, string> = {
    response_time: "Tempo de Resposta",
    urgency_keywords: "Keywords de Urgência",
    optimal_hour: "Horário Ótimo",
    origin: "Origem do Lead",
    estimated_value: "Valor Estimado",
  };

  const factorDescriptions: Record<string, string> = {
    response_time: "Quanto mais rápido a resposta, maior o score (0-30 pts)",
    urgency_keywords: "Keywords como 'urgente', 'primeira vez', 'agora' aumentam o score (0-25 pts)",
    optimal_hour: "Horários comerciais (9h-11h, 14h-16h) têm maior score (0-20 pts)",
    origin: "Google/Instagram têm maior score que outras origens (0-15 pts)",
    estimated_value: "Valores maiores aumentam o score (0-10 pts)",
  };

  if (isLoadingFactors) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuração de Scoring</CardTitle>
              <CardDescription>
                Ajuste os pesos dos fatores que determinam o score de conversão dos leads
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRecalculateAll}
                disabled={recalculateAllScores.isPending}
              >
                {recalculateAllScores.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Recalcular Todos
              </Button>
              {hasChanges && (
                <Button onClick={handleSave} disabled={updateScoreWeights.isPending}>
                  {updateScoreWeights.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {factors && factors.length > 0 ? (
            factors.map((factor) => {
              const localFactor = localFactors[factor.factor_name];
              if (!localFactor) return null;

              return (
                <div key={factor.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Label className="text-base font-semibold">
                          {factorLabels[factor.factor_name] || factor.factor_name}
                        </Label>
                        <Switch
                          checked={localFactor.enabled}
                          onCheckedChange={(checked) => handleEnabledChange(factor.factor_name, checked)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {factorDescriptions[factor.factor_name]}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{localFactor.weight.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">peso</div>
                    </div>
                  </div>
                  <Slider
                    value={[localFactor.weight]}
                    onValueChange={(value) => handleWeightChange(factor.factor_name, value)}
                    min={0}
                    max={10}
                    step={0.1}
                    disabled={!localFactor.enabled}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum fator configurado. Os pesos padrão serão usados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Preview de Score
          </CardTitle>
          <CardDescription>
            Exemplo de como os pesos afetam o cálculo do score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">85</div>
                <div className="text-sm text-muted-foreground">Alta Probabilidade</div>
                <div className="text-xs text-muted-foreground mt-1">Lead ideal</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">55</div>
                <div className="text-sm text-muted-foreground">Média Probabilidade</div>
                <div className="text-xs text-muted-foreground mt-1">Lead normal</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">25</div>
                <div className="text-sm text-muted-foreground">Baixa Probabilidade</div>
                <div className="text-xs text-muted-foreground mt-1">Lead frio</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Verde (70-100):</strong> Responda ESTE agora - alta chance de conversão
              </p>
              <p>
                <strong>Amarelo (40-69):</strong> Lead com potencial médio - acompanhar
              </p>
              <p>
                <strong>Vermelho (0-39):</strong> Lead frio - baixa prioridade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

