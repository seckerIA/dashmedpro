/**
 * AdAccountSyncSelector
 * Lista contas de anúncios Meta conectadas com toggle para ativar/desativar sync,
 * separadas por categoria (BM, WABA, Outras) em abas.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Building2,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';
import { useAdPlatformConnections, useUpdateAdPlatformConnection } from '@/hooks/useAdPlatformConnections';
import { useSyncAdCampaigns } from '@/hooks/useAdCampaignsSync';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AdAccountCategory } from '@/types/adPlatforms';
import { AD_ACCOUNT_CATEGORY_LABELS } from '@/types/adPlatforms';

interface SyncProgress {
  current: number;
  total: number;
  currentName: string;
  results: Array<{ id: string; name: string; success: boolean; message?: string }>;
}

const CATEGORY_ICONS: Record<AdAccountCategory, React.ReactNode> = {
  bm: <Building2 className="h-4 w-4" />,
  waba: <MessageSquare className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

export function AdAccountSyncSelector() {
  const { data: allConnections, isLoading } = useAdPlatformConnections();
  const updateConnection = useUpdateAdPlatformConnection();
  const syncCampaigns = useSyncAdCampaigns();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<AdAccountCategory>('other');

  const metaAdAccounts = useMemo(() => {
    if (!allConnections) return [];
    return allConnections.filter(
      (c) => c.platform === 'meta_ads' && c.account_id !== 'meta_oauth'
    );
  }, [allConnections]);

  const accountsByCategory = useMemo(() => {
    const grouped: Record<AdAccountCategory, typeof metaAdAccounts> = {
      bm: [],
      waba: [],
      other: [],
    };
    for (const account of metaAdAccounts) {
      const cat = (account.account_category as AdAccountCategory) || 'other';
      grouped[cat]?.push(account) ?? grouped.other.push(account);
    }
    return grouped;
  }, [metaAdAccounts]);

  const activeAccounts = useMemo(
    () => metaAdAccounts.filter((c) => c.is_active),
    [metaAdAccounts]
  );

  const selectedCount = activeAccounts.length;
  const totalCount = metaAdAccounts.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (metaAdAccounts.length === 0) {
    return null;
  }

  const handleToggle = async (connectionId: string, currentActive: boolean) => {
    try {
      await updateConnection.mutateAsync({
        id: connectionId,
        updates: { is_active: !currentActive } as any,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao atualizar conta.',
      });
    }
  };

  const handleCategoryChange = async (connectionId: string, newCategory: AdAccountCategory) => {
    try {
      await updateConnection.mutateAsync({
        id: connectionId,
        updates: { account_category: newCategory } as any,
      });
      toast({ title: 'Categoria atualizada' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao atualizar categoria.',
      });
    }
  };

  const handleSelectAll = async () => {
    const inactiveAccounts = metaAdAccounts.filter((c) => !c.is_active);
    for (const account of inactiveAccounts) {
      await updateConnection.mutateAsync({
        id: account.id,
        updates: { is_active: true } as any,
      });
    }
  };

  const handleDeselectAll = async () => {
    const ids = metaAdAccounts.filter((c) => c.is_active).map((c) => c.id);
    if (ids.length === 0) return;
    try {
      const { error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .update({ is_active: false })
        .in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao desmarcar contas.',
      });
    }
  };

  const handleSyncSelected = async () => {
    if (activeAccounts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma conta selecionada',
        description: 'Selecione pelo menos uma conta para sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress({
      current: 0,
      total: activeAccounts.length,
      currentName: activeAccounts[0].account_name,
      results: [],
    });

    const results: SyncProgress['results'] = [];

    for (let i = 0; i < activeAccounts.length; i++) {
      const account = activeAccounts[i];
      setSyncProgress((prev) => ({
        ...prev!,
        current: i,
        currentName: account.account_name,
      }));

      try {
        const result = await syncCampaigns.mutateAsync(account.id);
        results.push({
          id: account.id,
          name: account.account_name,
          success: true,
          message: result?.message || `${result?.campaigns_synced || 0} campanhas`,
        });
      } catch (error: any) {
        results.push({
          id: account.id,
          name: account.account_name,
          success: false,
          message: error.message || 'Erro desconhecido',
        });
      }

      setSyncProgress((prev) => ({
        ...prev!,
        current: i + 1,
        results: [...results],
      }));
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    toast({
      title: 'Sincronização concluída',
      description: `${successCount} conta(s) sincronizada(s)${errorCount > 0 ? `, ${errorCount} com erro` : ''}.`,
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    setIsSyncing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'error':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const progressPercent = syncProgress
    ? Math.round((syncProgress.current / syncProgress.total) * 100)
    : 0;

  const renderAccountList = (accounts: typeof metaAdAccounts) => {
    if (accounts.length === 0) {
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Nenhuma conta nesta categoria. Use o seletor de categoria em cada conta para movê-la.
        </div>
      );
    }

    return (
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {accounts.map((account) => (
          <label
            key={account.id}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
              'hover:bg-accent/50',
              account.is_active
                ? 'border-primary/30 bg-primary/5'
                : 'border-transparent bg-muted/30'
            )}
          >
            <Checkbox
              checked={account.is_active}
              onCheckedChange={() => handleToggle(account.id, account.is_active)}
              disabled={isSyncing}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{account.account_name}</span>
                {getStatusIcon(account.sync_status)}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{account.account_id}</span>
                {account.last_sync_at && (
                  <>
                    <span>-</span>
                    <span>
                      Sync: {format(new Date(account.last_sync_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </>
                )}
              </div>
              {account.error_message && (
                <p className="text-xs text-red-500 mt-0.5 truncate">{account.error_message}</p>
              )}
            </div>
            <Select
              value={(account.account_category as AdAccountCategory) || 'other'}
              onValueChange={(val) => {
                // Prevent label click from toggling checkbox
                handleCategoryChange(account.id, val as AdAccountCategory);
              }}
            >
              <SelectTrigger
                className="w-[110px] h-7 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bm">BM</SelectItem>
                <SelectItem value="waba">WABA</SelectItem>
                <SelectItem value="other">Outra</SelectItem>
              </SelectContent>
            </Select>
            <Badge
              variant={account.sync_status === 'success' ? 'default' : 'secondary'}
              className="text-xs flex-shrink-0"
            >
              {account.sync_status === 'success'
                ? 'OK'
                : account.sync_status === 'error'
                ? 'Erro'
                : 'Pendente'}
            </Badge>
          </label>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Contas de Anúncios Meta</CardTitle>
              <CardDescription>
                {selectedCount} de {totalCount} conta(s) selecionada(s) para sincronizar
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSyncSelected}
              disabled={isSyncing || selectedCount === 0}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar ({selectedCount})
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Sync Progress */}
        {isSyncing && syncProgress && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                Sincronizando: {syncProgress.currentName}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {syncProgress.current}/{syncProgress.total}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Sync Results Summary */}
        {!isSyncing && syncProgress && syncProgress.results.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resultado da sincronização</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setSyncProgress(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="space-y-1">
              {syncProgress.results.map((result) => (
                <div key={result.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate max-w-[200px]">{result.name}</span>
                  </div>
                  <span className={cn(
                    'text-xs',
                    result.success ? 'text-muted-foreground' : 'text-red-500'
                  )}>
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded: Tabs by category */}
        {expanded && (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedCount === totalCount || isSyncing}
                className="text-xs"
              >
                Selecionar todas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedCount === 0 || isSyncing}
                className="text-xs"
              >
                Desmarcar todas
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdAccountCategory)}>
              <TabsList className="w-full">
                {(['other', 'waba', 'bm'] as AdAccountCategory[]).map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="flex-1 gap-1.5 text-xs">
                    {CATEGORY_ICONS[cat]}
                    {AD_ACCOUNT_CATEGORY_LABELS[cat]}
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                      {accountsByCategory[cat].length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {(['other', 'waba', 'bm'] as AdAccountCategory[]).map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-2">
                  {renderAccountList(accountsByCategory[cat])}
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}

        {/* Collapsed Summary */}
        {!expanded && (
          <div
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpanded(true)}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{totalCount} conta(s) de anúncios</span>
              <span>-</span>
              <span className="text-primary font-medium">{selectedCount} ativa(s)</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
