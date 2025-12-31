/**
 * Página de configurações do WhatsApp Business API
 */

import { useState } from 'react';
import { MessageCircle, Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SetupGuide } from '@/components/whatsapp/settings/SetupGuide';
import { CredentialsForm } from '@/components/whatsapp/settings/CredentialsForm';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';

export default function WhatsAppSettings() {
  const { config, isLoading, isConfigured, isActive } = useWhatsAppConfig();
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState<string>('');

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
          className={`p-4 rounded-lg border ${
            isActive
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
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
          </div>
        </div>
      )}

      {/* Tabs de configuração */}
      <Tabs defaultValue={isConfigured ? 'credentials' : 'guide'} className="space-y-6">
        <TabsList>
          <TabsTrigger value="guide">
            Guia de Configuração
          </TabsTrigger>
          <TabsTrigger value="credentials">
            Credenciais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <SetupGuide
              webhookUrl={webhookUrl || (config ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook` : undefined)}
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
                      {webhookUrl || `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
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
