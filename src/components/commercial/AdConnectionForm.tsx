import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateAdPlatformConnection, useUpdateAdPlatformConnection, useTestAdPlatformConnection } from "@/hooks/useAdPlatformConnections";
import { useAuth } from "@/hooks/useAuth";
import { AdPlatformConnection } from "@/types/adPlatforms";
import { AD_PLATFORM_LABELS } from "@/types/adPlatforms";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const connectionSchema = z.object({
  platform: z.enum(['google_ads', 'meta_ads']),
  account_id: z.string().min(1, "Account ID é obrigatório"),
  account_name: z.string().min(1, "Nome da conta é obrigatório"),
  api_key: z.string().min(1, "API Key é obrigatória"),
  is_active: z.boolean(),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface AdConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: AdPlatformConnection | null;
}

export function AdConnectionForm({ open, onOpenChange, connection }: AdConnectionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const createConnection = useCreateAdPlatformConnection();
  const updateConnection = useUpdateAdPlatformConnection();
  const testConnection = useTestAdPlatformConnection();
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const isEditing = !!connection;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      platform: 'google_ads',
      account_id: "",
      account_name: "",
      api_key: "",
      is_active: true,
    },
  });

  const platform = watch('platform');
  const apiKey = watch('api_key');
  const accountId = watch('account_id');

  useEffect(() => {
    if (connection && open) {
      reset({
        platform: connection.platform,
        account_id: connection.account_id,
        account_name: connection.account_name,
        api_key: connection.api_key, // Em produção, isso não deveria ser exibido
        is_active: connection.is_active,
      });
    } else if (!connection && open) {
      reset({
        platform: 'google_ads',
        account_id: "",
        account_name: "",
        api_key: "",
        is_active: true,
      });
    }
    setTestResult(null);
  }, [connection, open, reset]);

  const handleTest = async () => {
    if (!apiKey || !accountId || !platform) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Preencha API Key, Account ID e selecione a plataforma antes de testar.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection.mutateAsync({
        platform,
        api_key: apiKey,
        account_id: accountId,
      });

      setTestResult(result);
      if (result.success) {
        toast({
          title: 'Conexão testada',
          description: result.message || 'Conexão válida!',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na conexão',
          description: result.error || 'Não foi possível conectar.',
        });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao testar conexão.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: ConnectionFormData) => {
    if (!user) return;

    try {
      if (isEditing && connection) {
        await updateConnection.mutateAsync({
          id: connection.id,
          updates: {
            account_name: data.account_name,
            api_key: data.api_key,
            is_active: data.is_active,
          },
        });
        toast({
          title: 'Conexão atualizada',
          description: 'A conexão foi atualizada com sucesso.',
        });
      } else {
        await createConnection.mutateAsync({
          user_id: user.id,
          platform: data.platform,
          account_id: data.account_id,
          account_name: data.account_name,
          api_key: data.api_key,
          is_active: data.is_active,
        });
        toast({
          title: 'Conexão criada',
          description: 'A conexão foi criada com sucesso.',
        });
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao salvar conexão.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Conexão' : 'Nova Conexão de Anúncios'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <Select
              value={platform}
              onValueChange={(value) => setValue('platform', value as 'google_ads' | 'meta_ads')}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_ads">{AD_PLATFORM_LABELS.google_ads}</SelectItem>
                <SelectItem value="meta_ads">{AD_PLATFORM_LABELS.meta_ads}</SelectItem>
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-destructive">{errors.platform.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_id">
              Account ID {platform === 'google_ads' && '(10 dígitos)'}
              {platform === 'meta_ads' && '(formato: act_123456789)'}
            </Label>
            <Input
              id="account_id"
              {...register('account_id')}
              placeholder={platform === 'google_ads' ? '1234567890' : 'act_123456789'}
              disabled={isEditing}
            />
            {errors.account_id && (
              <p className="text-sm text-destructive">{errors.account_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">Nome da Conta</Label>
            <Input
              id="account_name"
              {...register('account_name')}
              placeholder="Ex: Minha Conta Google Ads"
            />
            {errors.account_name && (
              <p className="text-sm text-destructive">{errors.account_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">
              {platform === 'google_ads' ? 'API Key' : 'Access Token'}
            </Label>
            <Input
              id="api_key"
              type="password"
              {...register('api_key')}
              placeholder={platform === 'google_ads' ? 'Sua API Key do Google Ads' : 'Seu Access Token do Meta'}
            />
            {errors.api_key && (
              <p className="text-sm text-destructive">{errors.api_key.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {platform === 'google_ads' 
                ? 'A API Key será armazenada de forma segura.'
                : 'O Access Token será armazenado de forma segura.'}
            </p>
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !apiKey || !accountId}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testando...
                  </>
                ) : (
                  'Testar Conexão'
                )}
              </Button>
              {testResult && (
                <div className="flex items-center gap-2 text-sm">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Conexão válida</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-500">{testResult.message || 'Erro na conexão'}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Conexão ativa
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar' : 'Criar Conexão'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

