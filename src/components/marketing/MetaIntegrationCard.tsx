/**
 * MetaIntegrationCard
 * Card para gerenciar OAuth centralizado da Meta Business Platform
 * Integrações: WhatsApp Business + Meta Ads
 *
 * Usa FB.login() com config_id para autenticação unificada
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Facebook,
  Phone,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Settings,
  FileText,
} from 'lucide-react';
import { useMetaOAuth } from '@/hooks/useMetaOAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WhatsAppAccountPicker } from './WhatsAppAccountPicker';

export function MetaIntegrationCard() {
  const {
    // Estado
    isConnecting,
    isOAuthConfigured,
    isSdkReady,
    integrationStatus,
    isLoadingStatus,
    isConnected,
    // Ações
    startOAuthFlow,
    disconnect,
    isDisconnecting,
    refetchStatus,
  } = useMetaOAuth();

  const [showWhatsAppPicker, setShowWhatsAppPicker] = useState(false);

  // Renderizar badge de status
  const renderStatusBadge = (connected: boolean, expiresAt?: Date) => {
    if (!connected) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" />
          Não conectado
        </Badge>
      );
    }

    const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

    if (isExpiringSoon) {
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          Expira em breve
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Conectado
      </Badge>
    );
  };

  // Renderizar item de integração
  const renderIntegrationItem = (
    icon: React.ReactNode,
    label: string,
    description: string,
    connected: boolean,
    expiresAt?: Date,
    extraInfo?: string
  ) => (
    <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            connected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted'
          )}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{label}</h4>
            {renderStatusBadge(connected, expiresAt)}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          {extraInfo && connected && (
            <p className="text-xs text-muted-foreground mt-1">{extraInfo}</p>
          )}
          {expiresAt && connected && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Expira em: {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Meta Business Platform</CardTitle>
              <CardDescription>
                Conecte WhatsApp Business e Meta Ads
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchStatus}
                  disabled={isLoadingStatus}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoadingStatus && "animate-spin")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnect()}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-2" />
                      Desconectar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={startOAuthFlow}
                disabled={!isOAuthConfigured || !isSdkReady || isConnecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : !isSdkReady ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Carregando SDK...
                  </>
                ) : (
                  <>
                    <Facebook className="h-4 w-4 mr-2" />
                    Conectar com Facebook
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* WhatsApp — with "Configurar" button */}
        <div className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                integrationStatus?.whatsapp?.connected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted'
              )}
            >
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">WhatsApp Business</h4>
                {renderStatusBadge(
                  integrationStatus?.whatsapp?.connected || false,
                  integrationStatus?.whatsapp?.expiresAt
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Envie e receba mensagens pelo WhatsApp</p>
              {integrationStatus?.whatsapp?.connected && integrationStatus?.whatsapp?.config?.display_phone_number && (
                <p className="text-xs text-muted-foreground mt-1">
                  {integrationStatus.whatsapp.config.display_phone_number}
                </p>
              )}
              {integrationStatus?.whatsapp?.connected && integrationStatus?.whatsapp?.expiresAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Expira em: {format(integrationStatus.whatsapp.expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          {/* Botão Configurar — só aparece quando Meta está conectado mas WhatsApp não */}
          {isConnected && !integrationStatus?.whatsapp?.connected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWhatsAppPicker(true)}
              className="flex-shrink-0"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configurar
            </Button>
          )}
        </div>

        {/* WhatsApp Account Picker Dialog */}
        <WhatsAppAccountPicker
          open={showWhatsAppPicker}
          onOpenChange={setShowWhatsAppPicker}
          onSuccess={() => {
            refetchStatus();
            setShowWhatsAppPicker(false);
          }}
        />

        {/* Meta Ads */}
        {renderIntegrationItem(
          <TrendingUp className="h-5 w-5" />,
          'Meta Ads',
          `Sincronize campanhas do Facebook e Instagram Ads`,
          integrationStatus?.ads?.connected || false,
          undefined,
          integrationStatus?.ads?.connections?.length
            ? `${integrationStatus.ads.connections.length} conta(s) de anúncios conectada(s)`
            : undefined
        )}

        {/* Lead Forms */}
        {renderIntegrationItem(
          <FileText className="h-5 w-5" />,
          'Lead Forms',
          'Receba leads dos formulários nativos do Facebook',
          (integrationStatus?.leadForms?.pagesConnected || 0) > 0,
          undefined,
          integrationStatus?.leadForms?.pagesConnected
            ? `${integrationStatus.leadForms.pagesConnected} página(s) conectada(s)${integrationStatus.leadForms.totalLeads > 0 ? ` · ${integrationStatus.leadForms.totalLeads} lead(s) recebido(s)` : ''}`
            : undefined
        )}

        {/* Token Refresh Banner */}
        {isConnected && integrationStatus?.whatsapp?.expiresAt && (
          integrationStatus.whatsapp.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
        ) && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Token expirando em breve
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                    Expira em {format(integrationStatus.whatsapp.expiresAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
                    Renove a conexão para evitar interrupções.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={startOAuthFlow}
                disabled={isConnecting || !isSdkReady}
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/30 flex-shrink-0"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", isConnecting && "animate-spin")} />
                Renovar
              </Button>
            </div>
          </div>
        )}

        {!isOAuthConfigured && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Configuração Pendente
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  O Facebook App ID não está configurado. Contate o administrador do sistema.
                </p>
              </div>
            </div>
          </div>
        )}

        {isOAuthConfigured && !isSdkReady && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Carregando Facebook SDK...
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
