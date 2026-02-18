import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Megaphone,
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  X,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ONBOARDING_STORAGE_KEY = 'marketing-onboarding-completed';

export function MarketingOnboarding() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se já completou o onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      // Mostrar após um pequeno delay para melhor UX
      setTimeout(() => setShowWelcome(true), 500);
    }
  }, []);

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
    setShowWelcome(false);
  };

  const features = [
    {
      icon: Settings,
      title: "Integrações",
      description: "Conecte suas contas do Google Ads e Meta Ads para sincronizar campanhas automaticamente",
      tab: "integrations",
    },
    {
      icon: Megaphone,
      title: "Campanhas",
      description: "Visualize e gerencie todas as suas campanhas de anúncios em um só lugar",
      tab: "campaigns",
    },
    {
      icon: FileText,
      title: "Formulários",
      description: "Gerencie formulários de captação do Meta e veja os leads recebidos",
      tab: "forms",
    },
    {
      icon: Users,
      title: "Leads",
      description: "Acompanhe leads originados de anúncios e calcule ROI por campanha",
      tab: "leads",
    },
    {
      icon: BarChart3,
      title: "Relatórios",
      description: "Relatórios detalhados com gráficos e exportação de dados",
      tab: "reports",
    },
  ];

  return (
    <>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Bem-vindo ao Marketing! 🎉</DialogTitle>
            <DialogDescription className="text-base">
              Gerencie todas as suas campanhas de anúncios e estratégias de marketing digital em um só lugar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    handleComplete();
                    navigate(`/marketing?tab=${feature.tab}`);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <Label htmlFor="dont-show" className="text-sm cursor-pointer">
                Não mostrar esta mensagem novamente
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleComplete}>
              Pular
            </Button>
            <Button onClick={handleComplete}>
              Começar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Componente de Card de Ajuda
export function MarketingHelpCard() {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Primeira vez aqui?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure suas integrações com Google Ads e Meta Ads para começar a acompanhar suas campanhas.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate('/marketing?tab=integrations')}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Integrações
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowHelp(!showHelp)}
              >
                Ver Guia Rápido
              </Button>
            </div>
            {showHelp && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>1. Configure suas conexões nas Integrações</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>2. Sincronize suas campanhas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>3. Sincronize formulários de captação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>4. Acompanhe leads e conversões</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


