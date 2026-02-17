/**
 * Página de configurações do WhatsApp Business API
 * Com suporte a OAuth do Facebook para conexão automática
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Settings, ArrowLeft, Loader2, Users, Phone, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SetupGuide } from '@/components/whatsapp/settings/SetupGuide';
import { CredentialsForm } from '@/components/whatsapp/settings/CredentialsForm';
import { FacebookConnectButton } from '@/components/whatsapp/settings/FacebookConnectButton';
// PhoneNumberSelector removido: fluxo OAuth agora usa FB.login() popup via useMetaOAuth
import { useWhatsAppConfig, useTeamWhatsAppConfigs } from '@/hooks/useWhatsAppConfig';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function WhatsAppSettings() {
  const { config, isLoading, isConfigured, isActive } = useWhatsAppConfig();
  const { isAdmin } = useUserProfile();
  const { teamConfigs, isLoading: isLoadingTeam } = useTeamWhatsAppConfigs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState<string>('');

  // Sincronizar tab com URL
  const activeTab = searchParams.get('tab') || (isAdmin ? 'team' : (isConfigured ? 'credentials' : 'connect'));

  const handleCredentialsSuccess = (url: string, token: string) => {
    setWebhookUrl(url);
    setWebhookVerifyToken(token);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/whatsapp">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="p-3 rounded-xl bg-green-500/10">
            <MessageCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Configurações WhatsApp</h1>
            <p className="text-muted-foreground">
              Configure a integração com WhatsApp Business API
            </p>
          </div>
        </div>

        {isConfigured && (
          <Button asChild>
            <Link to="/whatsapp">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ir para o Chat
            </Link>
          </Button>
        )}
      </div>

      {/* Status Badge */}
      {isConfigured && (
        <div
          className={`p-4 rounded-lg border ${isActive
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-yellow-500/10 border-yellow-500/20'
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                }`}
            />
            <div>
              <p className="font-medium">
                {isActive
                  ? `WhatsApp conectado: ${config?.verified_name}`
                  : 'WhatsApp configurado mas inativo'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `Número: ${config?.display_phone_number}`
                  : 'Ative a integração para começar a usar o chat'}
              </p>
            </div>
            {config?.oauth_connected && (
              <Badge variant="outline" className="ml-auto">
                <Sparkles className="h-3 w-3 mr-1" />
                Conectado via Facebook
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tabs de configuração */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="space-y-6"
      >
        <TabsList>
          {isAdmin && (
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              WhatsApps da Equipe
            </TabsTrigger>
          )}
          <TabsTrigger value="connect">
            <Sparkles className="h-4 w-4 mr-2" />
            Conexão Rápida
          </TabsTrigger>
          <TabsTrigger value="guide">
            Guia de Configuração
          </TabsTrigger>
          <TabsTrigger value="credentials">
            Credenciais
          </TabsTrigger>
        </TabsList>

        {/* Tab: Team WhatsApps (Admin only) */}
        {isAdmin && (
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  WhatsApps Configurados na Equipe
                </CardTitle>
                <CardDescription>
                  Visualize todos os números de WhatsApp configurados pelos membros da sua equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : teamConfigs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum WhatsApp configurado na equipe ainda.</p>
                    <p className="text-sm">Peça para os membros da equipe configurarem suas contas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamConfigs.map((teamConfig) => (
                      <div
                        key={teamConfig.id}
                        className={`p-4 rounded-lg border ${teamConfig.is_active
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-muted/50 border-muted'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${teamConfig.is_active ? 'bg-green-500/10' : 'bg-muted'
                              }`}>
                              <Phone className={`h-5 w-5 ${teamConfig.is_active ? 'text-green-500' : 'text-muted-foreground'
                                }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{teamConfig.verified_name || 'Não verificado'}</p>
                                {teamConfig.is_active ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {teamConfig.display_phone_number || 'Número não configurado'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{teamConfig.user_name}</p>
                            <p className="text-xs text-muted-foreground">{teamConfig.user_email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Conexão Rápida (OAuth) */}
        <TabsContent value="connect" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Botão Facebook OAuth */}
            <FacebookConnectButton />

            {/* Ou usar credenciais manuais */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Settings className="h-5 w-5" />
                  Configuração Manual
                </CardTitle>
                <CardDescription>
                  Prefere configurar manualmente? Use a aba "Credenciais" para inserir
                  Phone Number ID e Access Token do Meta Developers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="?tab=credentials">
                    Ir para Configuração Manual
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Dica */}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 h-fit">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Primeira vez configurando?</p>
                  <p className="text-sm text-muted-foreground">
                    Você precisa de uma conta no WhatsApp Business e acesso ao Meta Business Suite.
                    Ao clicar em "Conectar com Facebook", você será guiado pelo processo de autorização.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <SetupGuide
              webhookUrl={webhookUrl || (config ? `https://rpcixpbmtpyrnzlsuuus.supabase.co/functions/v1/whatsapp-webhook` : undefined)}
              webhookVerifyToken={webhookVerifyToken || config?.webhook_verify_token || undefined}
            />
            <CredentialsForm
              config={config}
              onSuccess={handleCredentialsSuccess}
            />
          </div>
        </TabsContent>

        <TabsContent value="credentials">
          <div className="max-w-2xl">
            <CredentialsForm
              config={config}
              onSuccess={handleCredentialsSuccess}
            />

            {/* Webhook info (se configurado) */}
            {(webhookUrl || config?.webhook_verify_token) && (
              <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                <h3 className="font-medium">Configuração do Webhook</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Callback URL:</p>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {webhookUrl || `https://rpcixpbmtpyrnzlsuuus.supabase.co/functions/v1/whatsapp-webhook`}
                    </code>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Verify Token:</p>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {webhookVerifyToken || config?.webhook_verify_token}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
