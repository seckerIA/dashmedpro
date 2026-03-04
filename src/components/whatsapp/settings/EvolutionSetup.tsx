import { useState, useEffect, useRef } from 'react';
import { QrCode, Loader2, CheckCircle, XCircle, Wifi, WifiOff, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWhatsAppConfig } from '@/hooks/useWhatsAppConfig';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

type SetupStep = 'configure' | 'qrcode' | 'connected';

export function EvolutionSetup() {
  const { config, refetch } = useWhatsAppConfig();

  const isEvolution = config?.provider === 'evolution';
  const isConnected = isEvolution && config?.evolution_instance_status === 'open' && config?.is_active;

  const initialStep: SetupStep = isConnected ? 'connected' : (isEvolution && config?.evolution_instance_name ? 'qrcode' : 'configure');

  const [step, setStep] = useState<SetupStep>(initialStep);
  const [apiUrl, setApiUrl] = useState(config?.evolution_api_url || '');
  const [instanceName, setInstanceName] = useState(config?.evolution_instance_name || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>(config?.evolution_instance_status || 'disconnected');
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (step === 'qrcode') {
      startPolling();
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [step]);

  const callEvolutionInstance = async (action: string, body?: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Nao autenticado');

    const res = await supabase.functions.invoke('evolution-instance', {
      body: { action, ...body },
    });

    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error + (res.data.details ? `: ${res.data.details}` : ''));
    return res.data;
  };

  const handleCreate = async () => {
    if (!apiUrl.trim() || !instanceName.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const safeName = instanceName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const result = await callEvolutionInstance('create', {
        instance_name: safeName,
        api_url: apiUrl.trim().replace(/\/+$/, ''),
      });

      setInstanceName(result.instance_name || safeName);

      if (result.qr_code) {
        setQrCodeData(result.qr_code);
      }

      setStep('qrcode');
      refetch();

      toast({
        title: 'Instancia criada',
        description: 'Escaneie o QR Code com seu WhatsApp',
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao criar instancia');
    } finally {
      setIsCreating(false);
    }
  };

  const fetchQrCode = async () => {
    try {
      const name = instanceName || config?.evolution_instance_name;
      if (!name) return;
      const result = await callEvolutionInstance('connect', { instance_name: name });
      if (result.qr_code) {
        setQrCodeData(result.qr_code);
      }
    } catch (_e) {
      // ignore — QR code may not be available yet
    }
  };

  const checkStatus = async () => {
    try {
      const name = instanceName || config?.evolution_instance_name;
      if (!name) return;
      const result = await callEvolutionInstance('status', { instance_name: name });
      const state = result.state || 'disconnected';
      setConnectionStatus(state);

      if (state === 'open') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setStep('connected');
        refetch();
        toast({
          title: 'WhatsApp conectado!',
          description: 'Seu WhatsApp esta pronto para uso.',
        });
      }
    } catch (_e) {
      // ignore
    }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    fetchQrCode();
    pollingRef.current = setInterval(() => {
      checkStatus();
      fetchQrCode();
    }, 4000);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const name = instanceName || config?.evolution_instance_name;
      await callEvolutionInstance('delete', { instance_name: name });
      if (pollingRef.current) clearInterval(pollingRef.current);
      setStep('configure');
      setQrCodeData(null);
      setConnectionStatus('disconnected');
      setInstanceName('');
      refetch();
      toast({
        title: 'Instancia removida',
        description: 'A conexao Evolution foi desconectada.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ---- STEP: CONFIGURE ----
  if (step === 'configure') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" />
            Configurar Evolution API
          </CardTitle>
          <CardDescription>
            Conecte seu servidor Evolution API para usar WhatsApp via QR Code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">URL do Servidor Evolution</Label>
            <Input
              id="api-url"
              placeholder="https://evo.seudominio.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              URL completa do seu servidor Evolution API (com HTTPS)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instance-name">Nome da Instancia</Label>
            <Input
              id="instance-name"
              placeholder="minha-clinica"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Identificador unico para esta conexao (letras minusculas, numeros, hifens)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCreate}
            disabled={isCreating || !apiUrl.trim() || !instanceName.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Instancia...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Criar Instancia e Gerar QR Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- STEP: QR CODE ----
  if (step === 'qrcode') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" />
            Escaneie o QR Code
          </CardTitle>
          <CardDescription>
            Abra o WhatsApp no celular &gt; Menu &gt; Aparelhos conectados &gt; Conectar aparelho
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {qrCodeData ? (
              <div className="p-4 bg-white rounded-xl shadow-md">
                <img
                  src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Aguardando conexao...
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchQrCode}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Atualizar QR Code
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                Cancelar
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              O QR Code expira a cada ~45 segundos. Ele sera renovado automaticamente.
              Se nao conseguir escanear, clique em "Atualizar QR Code".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ---- STEP: CONNECTED ----
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Evolution API Conectada
        </CardTitle>
        <CardDescription>
          Seu WhatsApp esta conectado via Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-green-700 dark:text-green-400">Conectado</span>
            <Badge variant="outline" className="ml-auto">Evolution API</Badge>
          </div>

          {config?.display_phone_number && (
            <p className="text-sm text-muted-foreground">
              Numero: {config.display_phone_number}
            </p>
          )}
          {config?.evolution_instance_name && (
            <p className="text-sm text-muted-foreground">
              Instancia: {config.evolution_instance_name}
            </p>
          )}
        </div>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Desconectando...
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              Desconectar Evolution
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
