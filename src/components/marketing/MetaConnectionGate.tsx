/**
 * MetaConnectionGate
 * Bloqueia acesso ao módulo de Marketing até que o usuário
 * conecte sua conta Meta Business (WhatsApp + Ads)
 *
 * Usa Facebook SDK com FB.login() para autenticação
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Facebook,
  Phone,
  TrendingUp,
  Loader2,
  Lock,
  BarChart3,
  Target,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useMetaOAuth } from '@/hooks/useMetaOAuth';

interface MetaConnectionGateProps {
  children: React.ReactNode;
}

export function MetaConnectionGate({ children }: MetaConnectionGateProps) {
  const {
    isConnecting,
    isOAuthConfigured,
    isSdkReady,
    integrationStatus,
    isLoadingStatus,
    isConnected,
    startOAuthFlow,
  } = useMetaOAuth();

  // Se está carregando o status, mostrar loading
  if (isLoadingStatus) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando conexões...</p>
        </div>
      </div>
    );
  }

  // Se já está conectado, renderizar o conteúdo normal
  if (isConnected) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit">
              <Lock className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">
              Conecte sua conta Meta Business
            </CardTitle>
            <CardDescription className="text-base max-w-md mx-auto">
              Para acessar o módulo de Marketing, você precisa conectar sua conta do Facebook Business Manager.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">WhatsApp Business</h4>
                  <p className="text-xs text-muted-foreground">
                    Gerencie conversas e automações
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Meta Ads</h4>
                  <p className="text-xs text-muted-foreground">
                    Sincronize campanhas automaticamente
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Relatórios Unificados</h4>
                  <p className="text-xs text-muted-foreground">
                    Métricas de todas as plataformas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Tracking de Leads</h4>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe conversões em tempo real
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status do SDK */}
            {isOAuthConfigured && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {isSdkReady ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Facebook SDK carregado</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Carregando Facebook SDK...</span>
                  </>
                )}
              </div>
            )}

            {/* Botão de Conexão */}
            <div className="text-center space-y-4">
              <Button
                size="lg"
                onClick={startOAuthFlow}
                disabled={!isOAuthConfigured || !isSdkReady || isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Facebook className="h-5 w-5 mr-2" />
                    Conectar com Facebook
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ao conectar, você autoriza o DashMedPro a acessar suas contas de WhatsApp Business e Meta Ads para sincronização de dados.
              </p>
            </div>

            {!isOAuthConfigured && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Integração Meta ainda não configurada. Contate o suporte.
                </p>
              </div>
            )}

            {/* Info sobre o que será acessado */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm mb-2">O que será conectado:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Contas de anúncios (Ad Accounts)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Contas WhatsApp Business (WABAs)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Catálogos de produtos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Pixels de conversão
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
