import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, Copy, CheckCircle2, AlertTriangle, Loader2, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getEdgeFunctionInvokeHeaders } from '@/lib/supabaseFunctionHeaders';
import { useToast } from '@/hooks/use-toast';

interface Credential {
  user_id: string;
  full_name: string | null;
  email: string;
  password: string;
}

export function ResetSecretaryPasswordsDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);

    setConfirmStep(true);
    setIsLoading(false);
    setCredentials([]);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const headers = await getEdgeFunctionInvokeHeaders();
      const { data, error } = await supabase.functions.invoke('reset-secretary-passwords', {
        body: {},
        headers,
      });
      if (error) throw error;
      const list = (data?.credentials as Credential[]) || [];
      setCredentials(list);
      setConfirmStep(false);
      toast({
        title: list.length > 0 ? 'Senhas resetadas com sucesso' : 'Nenhuma secretária ativa',
        description: list.length > 0
          ? `${list.length} senha(s) gerada(s). Anote ou imprima antes de fechar.`
          : 'Não há secretárias ativas vinculadas para resetar.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao resetar senhas',
        description: err?.message || 'Tente novamente em instantes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = async () => {
    if (credentials.length === 0) return;
    const text = credentials
      .map((c) => `${c.full_name || c.email}\n  Email: ${c.email}\n  Senha: ${c.password}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Credenciais copiadas para a área de transferência' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' });
    }
  };

  const copyOne = async (c: Credential) => {
    try {
      await navigator.clipboard.writeText(`Email: ${c.email}\nSenha: ${c.password}`);
      toast({ title: `Credencial de ${c.full_name || c.email} copiada` });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível copiar' });
    }
  };

  const printCredentials = () => {
    if (credentials.length === 0) return;
    const w = window.open('', '_blank', 'width=720,height=600');
    if (!w) return;
    const rows = credentials
      .map(
        (c) => `<tr>
        <td>${(c.full_name || '').replace(/</g, '&lt;')}</td>
        <td>${c.email}</td>
        <td><strong>${c.password}</strong></td>
      </tr>`,
      )
      .join('');
    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" /><title>Credenciais — Equipe</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:32px;color:#111}
  h1{font-size:18px;margin-bottom:4px}
  p.meta{color:#666;font-size:12px;margin-top:0}
  table{border-collapse:collapse;width:100%;margin-top:16px;font-size:13px}
  th,td{border:1px solid #ccc;padding:8px 10px;text-align:left}
  th{background:#f3f3f3}
  .note{margin-top:24px;font-size:11px;color:#666;border-top:1px dashed #ccc;padding-top:8px}
</style></head>
<body>
  <h1>Credenciais temporárias da equipe</h1>
  <p class="meta">Geradas em ${new Date().toLocaleString('pt-BR')} — entregue cada linha à respectiva secretária e oriente a troca de senha no primeiro acesso.</p>
  <table>
    <thead><tr><th>Nome</th><th>Email</th><th>Senha temporária</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note">Documento sensível. Após entregar, descarte com segurança.</p>
  <script>window.print();</script>
</body></html>`);
    w.document.close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound className="h-4 w-4 mr-2" />
          Resetar senhas das secretárias
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset de senhas em massa
          </DialogTitle>
          <DialogDescription>
            {confirmStep
              ? 'Gera uma senha temporária para cada secretária ativa vinculada a você.'
              : `${credentials.length} senha(s) geradas. Copie ou imprima agora — não exibimos novamente.`}
          </DialogDescription>
        </DialogHeader>

        {confirmStep ? (
          <>
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirme a operação</AlertTitle>
              <AlertDescription>
                Todas as secretárias ativas{' '}
                <span className="font-semibold">vinculadas a você (ou sua organização, se for admin/dono)</span>{' '}
                terão a senha redefinida automaticamente. Cada uma receberá uma senha aleatória de 10 caracteres.
                As atuais deixam de funcionar imediatamente.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando senhas…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Gerar senhas e exibir
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertTitle>Senhas geradas</AlertTitle>
              <AlertDescription>
                Anote, copie ou imprima as credenciais agora. Por segurança, elas não ficam armazenadas em
                lugar nenhum — só você vê esta tela uma vez.
              </AlertDescription>
            </Alert>

            <div className="max-h-72 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/40">
              {credentials.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Nenhuma secretária encontrada para resetar.
                </div>
              ) : (
                credentials.map((c) => (
                  <div key={c.user_id} className="p-3 flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.full_name || c.email}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      <p className="font-mono text-xs mt-1">
                        Senha: <span className="font-semibold tabular-nums">{c.password}</span>
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyOne(c)} title="Copiar credencial">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={copyAll} disabled={credentials.length === 0}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar todas
              </Button>
              <Button variant="outline" onClick={printCredentials} disabled={credentials.length === 0}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
