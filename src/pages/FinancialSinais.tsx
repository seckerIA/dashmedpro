import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, CircleDollarSign, AlertCircle } from "lucide-react";
import { SinalTab } from "@/components/financial/SinalTab";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FinancialSinais = () => {
  const navigate = useNavigate();
  const { isVendedor, isGestorTrafego } = useUserProfile();

  // Bloquear acesso para vendedores e gestores de tráfego
  if (isVendedor || isGestorTrafego) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-center text-base">
              Você não tem permissão para acessar o módulo financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Permissões Insuficientes</AlertTitle>
              <AlertDescription>
                Este módulo contém informações financeiras sensíveis e está disponível apenas para Administradores, Médicos e Secretárias.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => navigate('/')}
            >
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/financeiro')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-xl border border-yellow-500/20">
            <CircleDollarSign className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sinais de Consulta</h1>
            <p className="text-sm text-muted-foreground">Gerencie os sinais (entradas) de consultas médicas</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <SinalTab />
    </div>
  );
};

export default FinancialSinais;
