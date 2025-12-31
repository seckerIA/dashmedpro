/**
 * Formulário de credenciais do WhatsApp Business API
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import type { WhatsAppConfig } from '@/types/whatsapp';

// Schema de validação
const credentialsSchema = z.object({
  phone_number_id: z
    .string()
    .min(10, 'Phone Number ID deve ter pelo menos 10 caracteres')
    .regex(/^\d+$/, 'Phone Number ID deve conter apenas números'),
  access_token: z
    .string()
    .min(50, 'Access Token parece inválido (muito curto)')
    .max(500, 'Access Token parece inválido (muito longo)'),
  business_account_id: z.string().optional(),
  waba_id: z.string().optional(),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface CredentialsFormProps {
  config: WhatsAppConfig | null;
  onSuccess?: (webhookUrl: string, verifyToken: string) => void;
}

export function CredentialsForm({ config, onSuccess }: CredentialsFormProps) {
  const [showToken, setShowToken] = useState(false);
  const {
    validateCredentials,
    isValidating,
    deactivate,
    isDeactivating,
    reactivate,
    isReactivating,
    deleteConfig,
    isDeleting,
  } = useWhatsAppConfig();

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      phone_number_id: config?.phone_number_id || '',
      access_token: '',
      business_account_id: config?.business_account_id || '',
      waba_id: config?.waba_id || '',
    },
  });

  const onSubmit = async (data: CredentialsFormData) => {
    try {
      const result = await validateCredentials({
        phone_number_id: data.phone_number_id,
        access_token: data.access_token,
        business_account_id: data.business_account_id || undefined,
        waba_id: data.waba_id || undefined,
      });

      // Limpar o campo de token após sucesso (segurança)
      form.setValue('access_token', '');

      // Callback com dados do webhook
      if (onSuccess && result.webhook_url && result.config.webhook_verify_token) {
        onSuccess(result.webhook_url, result.config.webhook_verify_token);
      }
    } catch (error) {
      // Erro já é tratado pelo hook
    }
  };

  const handleDeactivate = async () => {
    await deactivate();
  };

  const handleReactivate = async () => {
    await reactivate();
  };

  const handleDelete = async () => {
    await deleteConfig();
    form.reset();
  };

  const isConfigured = !!config?.phone_number_id;
  const isActive = config?.is_active ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Credenciais da API</CardTitle>
            <CardDescription>
              {isConfigured
                ? 'Sua integração está configurada. Atualize as credenciais se necessário.'
                : 'Insira suas credenciais do WhatsApp Business API.'}
            </CardDescription>
          </div>
          {isConfigured && (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ativo
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Status atual (se configurado) */}
            {isConfigured && config && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Configuração atual:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nome verificado:</span>
                  <span>{config.verified_name || '-'}</span>
                  <span className="text-muted-foreground">Número:</span>
                  <span>{config.display_phone_number || '-'}</span>
                  <span className="text-muted-foreground">Última sincronização:</span>
                  <span>
                    {config.last_synced_at
                      ? new Date(config.last_synced_at).toLocaleString('pt-BR')
                      : '-'}
                  </span>
                </div>
              </div>
            )}

            {/* Phone Number ID */}
            <FormField
              control={form.control}
              name="phone_number_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number ID *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789012345"
                      {...field}
                      disabled={isValidating}
                    />
                  </FormControl>
                  <FormDescription>
                    Encontre no Meta Developers {">"} WhatsApp {">"} Configuração da API
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Token */}
            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showToken ? 'text' : 'password'}
                        placeholder="EAAxxxxxxx..."
                        {...field}
                        disabled={isValidating}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Token permanente do usuário do sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WABA ID - Necessário para configuração automática */}
            <FormField
              control={form.control}
              name="waba_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WABA ID (WhatsApp Business Account ID)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 123456789012345"
                      {...field}
                      disabled={isValidating}
                    />
                  </FormControl>
                  <FormDescription>
                    Necessário para configurar webhook automaticamente. Encontre em Meta Developers {">"} WhatsApp {">"} Configuração
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Account ID - Opcional */}
            <FormField
              control={form.control}
              name="business_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Account ID (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opcional"
                      {...field}
                      disabled={isValidating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {isConfigured && (
                <>
                  {/* Botão Ativar/Desativar */}
                  {isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeactivate}
                      disabled={isDeactivating}
                    >
                      {isDeactivating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PowerOff className="h-4 w-4 mr-2" />
                      )}
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReactivate}
                      disabled={isReactivating}
                    >
                      {isReactivating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      Reativar
                    </Button>
                  )}

                  {/* Botão Remover */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover integração?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso irá remover todas as configurações do WhatsApp.
                          Você precisará configurar novamente para usar o chat.
                          As conversas existentes serão mantidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Sim, remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            <Button type="submit" disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : isConfigured ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar credenciais
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Validar e salvar
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
