import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, Target, DollarSign, Calculator, Lock, LockOpen, ChevronDown, ChevronUp, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
interface ROIInputs {
  // Investimento
  totalInvestment: number;
  detailedCosts: {
    adSpend: number;
    managementFee: number;
    toolsCost: number;
    productionCost: number;
  };
  showDetailedCosts: boolean;

  // Retorno
  leadsGenerated: number;
  conversionRateMin: number;
  conversionRateMax: number;
  averageTicket: number;
}
const CalculadoraROI = () => {
  const [currentStep, setCurrentStep] = useState<'investment' | 'returns'>('investment');
  const [isLocked, setIsLocked] = useState(false);
  const [inputs, setInputs] = useState<ROIInputs>({
    totalInvestment: 4500,
    detailedCosts: {
      adSpend: 1500,
      managementFee: 1500,
      toolsCost: 1500,
      productionCost: 0
    },
    showDetailedCosts: false,
    leadsGenerated: 70,
    conversionRateMin: 20,
    conversionRateMax: 40,
    averageTicket: 300
  });
  const updateInput = useCallback((field: keyof ROIInputs, value: any) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  const updateDetailedCost = useCallback((field: keyof ROIInputs['detailedCosts'], value: number) => {
    setInputs(prev => ({
      ...prev,
      detailedCosts: {
        ...prev.detailedCosts,
        [field]: value
      }
    }));
  }, []);

  // Auto-update total investment when detailed costs change
  const totalFromDetails = useMemo(() => {
    const {
      adSpend,
      managementFee,
      toolsCost,
      productionCost
    } = inputs.detailedCosts;
    return adSpend + managementFee + toolsCost + productionCost;
  }, [inputs.detailedCosts]);

  // Sync total investment with detailed costs when expanded
  useMemo(() => {
    if (inputs.showDetailedCosts) {
      setInputs(prev => ({
        ...prev,
        totalInvestment: totalFromDetails
      }));
    }
  }, [totalFromDetails, inputs.showDetailedCosts]);
  const scenarios = useMemo(() => {
    const {
      totalInvestment,
      leadsGenerated,
      conversionRateMin,
      conversionRateMax,
      averageTicket
    } = inputs;
    const pessimistic = {
      name: "Pessimista",
      conversionRate: conversionRateMin,
      sales: Math.round(leadsGenerated * (conversionRateMin / 100)),
      revenue: leadsGenerated * (conversionRateMin / 100) * averageTicket
    };
    const median = {
      name: "Mediano",
      conversionRate: (conversionRateMin + conversionRateMax) / 2,
      sales: Math.round(leadsGenerated * ((conversionRateMin + conversionRateMax) / 200)),
      revenue: leadsGenerated * ((conversionRateMin + conversionRateMax) / 200) * averageTicket
    };
    const optimistic = {
      name: "Otimista",
      conversionRate: conversionRateMax,
      sales: Math.round(leadsGenerated * (conversionRateMax / 100)),
      revenue: leadsGenerated * (conversionRateMax / 100) * averageTicket
    };
    return [pessimistic, median, optimistic].map(scenario => ({
      ...scenario,
      roas: scenario.revenue / totalInvestment,
      roi: (scenario.revenue - totalInvestment) / totalInvestment * 100
    }));
  }, [inputs]);
  const handleLockValue = useCallback(() => {
    const valueToLock = scenarios[1].revenue; // Use median scenario
    localStorage.setItem('lockedROIValue', valueToLock.toString());
    setIsLocked(true);
    toast({
      title: "Valor travado com sucesso!",
      description: `Receita estimada de R$ ${valueToLock.toLocaleString('pt-BR')} foi travada.`
    });
  }, [scenarios]);
  const handleUnlockValue = useCallback(() => {
    localStorage.removeItem('lockedROIValue');
    setIsLocked(false);
    toast({
      title: "Valor destravado",
      description: "O valor foi removido da calculadora de precificação."
    });
  }, []);
  const toggleDetailedCosts = () => {
    if (!inputs.showDetailedCosts) {
      // When expanding, set detailed costs to match current total
      const equalSplit = inputs.totalInvestment / 4;
      setInputs(prev => ({
        ...prev,
        showDetailedCosts: true,
        detailedCosts: {
          adSpend: equalSplit,
          managementFee: equalSplit,
          toolsCost: equalSplit,
          productionCost: equalSplit
        }
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        showDetailedCosts: false
      }));
    }
  };
  return <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <Target className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold mb-2">Calculadora de ROI</h1>
            <p className="text-white/90 text-lg">
              Retorno Sobre o Investimento para Meta Ads
            </p>
          </div>
        </div>
      </div>

      {currentStep === 'investment' && <div className="max-w-2xl mx-auto">
          {/* 1. Custos do Investimento */}
          <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                Custos do Investimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Total Investment Field */}
              <div className="space-y-3">
                <Label htmlFor="totalInvestment" className="text-base font-medium">
                  Custo Total do Investimento
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
                  <Input id="totalInvestment" type="number" value={inputs.totalInvestment} onChange={e => updateInput('totalInvestment', Number(e.target.value))} className="pl-10 rounded-2xl h-12 text-lg font-medium" disabled={inputs.showDetailedCosts} />
                </div>
              </div>

              {/* Expandable Details Button */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={toggleDetailedCosts} className="rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 h-12 px-6">
                  {inputs.showDetailedCosts ? <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Ocultar detalhes dos custos
                    </> : <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Prefiro detalhar os custos
                    </>}
                </Button>
              </div>

              {/* Detailed Costs - Expandable */}
              {inputs.showDetailedCosts && <div className="space-y-4 p-6 rounded-2xl bg-muted/50 border border-muted">
                  <h4 className="font-medium text-center mb-4">Detalhamento dos Custos</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adSpend" className="text-sm font-medium">Verba de Anúncios</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input id="adSpend" type="number" value={inputs.detailedCosts.adSpend} onChange={e => updateDetailedCost('adSpend', Number(e.target.value))} className="pl-10 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="managementFee" className="text-sm font-medium">Taxa de Serviço/Gestão</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input id="managementFee" type="number" value={inputs.detailedCosts.managementFee} onChange={e => updateDetailedCost('managementFee', Number(e.target.value))} className="pl-10 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="toolsCost" className="text-sm font-medium">Custo de Ferramentas</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input id="toolsCost" type="number" value={inputs.detailedCosts.toolsCost} onChange={e => updateDetailedCost('toolsCost', Number(e.target.value))} className="pl-10 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productionCost" className="text-sm font-medium">Custo de Produção</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input id="productionCost" type="number" value={inputs.detailedCosts.productionCost} onChange={e => updateDetailedCost('productionCost', Number(e.target.value))} className="pl-10 rounded-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-muted-foreground/20">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Total Calculado:</span>
                      <span className="font-bold text-lg">R$ {totalFromDetails.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>}

              {/* Next Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => setCurrentStep('returns')} className="rounded-2xl h-12 px-8 bg-primary hover:bg-primary/90">
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>}

      {currentStep === 'returns' && <div className="space-y-8">
          <div className="max-w-2xl mx-auto">
            {/* 2. Dados do Retorno */}
            <Card className="bg-card/95 backdrop-blur-sm border-0 shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                  Dados do Retorno (Receita)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Separator />

                {/* Return Data Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadsGenerated" className="text-base font-medium">
                      Nº de Leads Gerados
                    </Label>
                    <Input id="leadsGenerated" type="number" value={inputs.leadsGenerated} onChange={e => updateInput('leadsGenerated', Number(e.target.value))} className="rounded-2xl h-12 text-lg" placeholder="Ex: 70" />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Taxa de Conversão (%)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="conversionMin" className="text-sm text-muted-foreground">Mínima</Label>
                        <Input id="conversionMin" type="number" value={inputs.conversionRateMin} onChange={e => updateInput('conversionRateMin', Number(e.target.value))} className="rounded-xl" placeholder="Ex: 20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="conversionMax" className="text-sm text-muted-foreground">Máxima</Label>
                        <Input id="conversionMax" type="number" value={inputs.conversionRateMax} onChange={e => updateInput('conversionRateMax', Number(e.target.value))} className="rounded-xl" placeholder="Ex: 40" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="averageTicket" className="text-base font-medium">Ticket Médio</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input id="averageTicket" type="number" value={inputs.averageTicket} onChange={e => updateInput('averageTicket', Number(e.target.value))} className="pl-10 rounded-2xl h-12 text-lg" placeholder="Ex: 300" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('investment')} className="rounded-2xl h-12 px-6">
                    Voltar
                  </Button>
                  
                  <Button onClick={() => {}} // Results are shown below automatically
              className="rounded-2xl h-12 px-8 bg-green-600 hover:bg-green-700">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular ROI e Gerar Análise
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Results Section - 3 Scenarios */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Análise dos Cenários</h2>
              <p className="text-muted-foreground">Baseado nas taxas de conversão informadas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {scenarios.map((scenario, index) => {
                const isMedian = index === 1;
                const scenarioConfig = [
                  { icon: <ThumbsDown className="w-6 h-6 text-red-500" />, color: "red" },
                  { icon: <Target className="w-6 h-6 text-yellow-500" />, color: "yellow" },
                  { icon: <ThumbsUp className="w-6 h-6 text-green-500" />, color: "green" },
                ][index];

                return (
                  <Card 
                    key={scenario.name} 
                    className={`
                      rounded-3xl border-t-4 transition-all duration-300
                      ${isMedian ? 'shadow-lg scale-[1.02] bg-card' : 'shadow-md bg-card/80'}
                      border-${scenarioConfig.color}-500
                    `}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center items-center gap-3 mb-2">
                        {scenarioConfig.icon}
                        <CardTitle className={`text-xl font-bold text-${scenarioConfig.color}-500`}>
                          Cenário {scenario.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        Taxa de Conversão: {scenario.conversionRate}%
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-5 px-6 pb-6">
                      <div className="space-y-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Receita Estimada</p>
                          <p className="text-3xl font-bold text-foreground">
                            R$ {scenario.revenue.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center pt-2">
                          <div className="rounded-lg p-2 bg-muted/50">
                            <p className="text-xs text-muted-foreground">Vendas</p>
                            <p className="text-lg font-semibold text-foreground">{scenario.sales}</p>
                          </div>
                          <div className="rounded-lg p-2 bg-muted/50">
                            <p className="text-xs text-muted-foreground">ROAS</p>
                            <p className="text-lg font-semibold text-foreground">{scenario.roas.toFixed(2)}x</p>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />

                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Retorno Sobre Investimento</p>
                        <p className={`text-4xl font-extrabold ${scenario.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {scenario.roi.toFixed(1)}%
                        </p>
                      </div>

                      {isMedian && (
                        <div className="pt-4">
                          <Button 
                            onClick={isLocked ? handleUnlockValue : handleLockValue} 
                            variant={isLocked ? "outline" : "default"} 
                            size="lg" 
                            className={`w-full rounded-2xl h-14 text-base font-bold ${isLocked ? "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
                          >
                            {isLocked ? (
                              <>
                                <LockOpen className="w-5 h-5 mr-2" />
                                Destravar Valor
                              </>
                            ) : (
                              <>
                                <Lock className="w-5 h-5 mr-2" />
                                Travar na Proposta
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Performance Summary */}
            <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Resumo da Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Investimento Total</p>
                    <p className="text-xl font-bold">R$ {inputs.totalInvestment.toLocaleString('pt-BR')}</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Leads Esperados</p>
                    <p className="text-xl font-bold">{inputs.leadsGenerated}</p>
                  </div>
                  
                  <div className="text-center p-4 rounded-2xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Ticket Médio</p>
                    <p className="text-xl font-bold">R$ {inputs.averageTicket.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}
    </div>;
};
export default CalculadoraROI;