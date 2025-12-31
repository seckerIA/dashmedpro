/**
 * Guia de configuração do WhatsApp Business API
 * Passo-a-passo para obter credenciais da Meta
 */

import { useState } from 'react';
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SetupGuideProps {
  webhookUrl?: string;
  webhookVerifyToken?: string;
}

const SETUP_STEPS = [
  {
    id: 'step-1',
    title: '1. Criar conta Meta Business',
    description: 'Crie uma conta no Meta Business Suite se ainda não tiver.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Você precisará de uma conta Meta Business para acessar a API do WhatsApp Business.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Acesse o Meta Business Suite</li>
          <li>Clique em "Criar conta" se não tiver uma</li>
          <li>Preencha as informações da sua empresa</li>
          <li>Verifique seu email</li>
        </ol>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://business.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Acessar Meta Business Suite
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    ),
  },
  {
    id: 'step-2',
    title: '2. Criar App no Meta Developers',
    description: 'Crie um aplicativo para acessar a API.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Um App é necessário para gerar as credenciais de acesso à API.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Acesse o Meta for Developers</li>
          <li>Clique em "Meus Apps" {">"} "Criar App"</li>
          <li>Selecione "Business" como tipo</li>
          <li>Dê um nome ao app (ex: "Minha Clínica WhatsApp")</li>
          <li>Vincule à sua conta Business</li>
        </ol>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Criar App no Meta Developers
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    ),
  },
  {
    id: 'step-3',
    title: '3. Adicionar WhatsApp ao App',
    description: 'Configure o produto WhatsApp Business no seu app.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Adicione o WhatsApp como produto do seu aplicativo.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>No painel do app, vá em "Adicionar produtos"</li>
          <li>Encontre "WhatsApp" e clique em "Configurar"</li>
          <li>Siga o wizard de configuração</li>
          <li>Você pode usar um número de teste grátis para começar</li>
        </ol>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Número de teste</AlertTitle>
          <AlertDescription>
            A Meta oferece um número de teste gratuito para desenvolvimento.
            Para produção, você precisará de um número próprio verificado.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: 'step-4',
    title: '4. Obter Phone Number ID',
    description: 'Copie o ID do número de telefone.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          O Phone Number ID identifica seu número no WhatsApp Business.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>No painel do WhatsApp, vá em "Configuração da API"</li>
          <li>Encontre "Phone Number ID" na seção de credenciais</li>
          <li>Copie o ID (formato: números longos, ex: 123456789012345)</li>
          <li>Cole no campo correspondente abaixo</li>
        </ol>
        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Exemplo de Phone Number ID:</p>
          <code className="text-sm">123456789012345</code>
        </div>
      </div>
    ),
  },
  {
    id: 'step-5',
    title: '5. Gerar Access Token',
    description: 'Crie um token de acesso permanente.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          O Access Token é necessário para autenticar as chamadas à API.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>No Meta Business Suite, vá em Configurações {">"} Usuários {">"} Usuários do sistema</li>
          <li>Crie um novo usuário do sistema (se não existir)</li>
          <li>Atribua acesso ao App do WhatsApp</li>
          <li>Gere um token com as permissões: whatsapp_business_messaging, whatsapp_business_management</li>
          <li>Copie o token e guarde em local seguro</li>
        </ol>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante: Segurança</AlertTitle>
          <AlertDescription>
            O Access Token é como uma senha. Nunca compartilhe publicamente.
            Armazenamos de forma criptografada no servidor.
          </AlertDescription>
        </Alert>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://business.facebook.com/settings/system-users"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Gerenciar Usuários do Sistema
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    ),
  },
  {
    id: 'step-6',
    title: '6. Configurar Webhook',
    description: 'Configure o webhook para receber mensagens.',
    content: null, // Será renderizado dinamicamente
  },
];

export function SetupGuide({ webhookUrl, webhookVerifyToken }: SetupGuideProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderStep6Content = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Configure o webhook no Meta para receber mensagens em tempo real.
      </p>

      {webhookUrl && webhookVerifyToken ? (
        <>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Callback URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm flex-1 break-all">{webhookUrl}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(webhookUrl, 'url')}
                >
                  {copiedField === 'url' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Verify Token:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm flex-1 break-all">{webhookVerifyToken}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(webhookVerifyToken, 'token')}
                >
                  {copiedField === 'token' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>No painel do WhatsApp, vá em "Configuração" {">"} "Webhooks"</li>
            <li>Cole a Callback URL acima</li>
            <li>Cole o Verify Token acima</li>
            <li>Clique em "Verificar e salvar"</li>
            <li>Inscreva-se nos campos: <code>messages</code>, <code>message_status</code></li>
          </ol>
        </>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configure as credenciais primeiro</AlertTitle>
          <AlertDescription>
            Preencha o formulário ao lado com suas credenciais para obter
            a URL do webhook e o token de verificação.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Guia de Configuração
        </CardTitle>
        <CardDescription>
          Siga os passos abaixo para configurar o WhatsApp Business API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {SETUP_STEPS.map((step, index) => (
            <AccordionItem key={step.id} value={step.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-8">
                {step.id === 'step-6' ? renderStep6Content() : step.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Recursos adicionais */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Recursos úteis</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Documentação oficial
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://developers.facebook.com/docs/whatsapp/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Preços da API
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Custos estimados */}
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sobre custos</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              A API do WhatsApp Business tem custos por mensagem enviada:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Mensagens de serviço (24h após contato do cliente): ~R$0,25</li>
              <li>Mensagens de marketing (templates): ~R$0,50-1,00</li>
              <li>Primeiras 1.000 conversas/mês: gratuitas</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
