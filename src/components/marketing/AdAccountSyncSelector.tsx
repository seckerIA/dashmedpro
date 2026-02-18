/**
 * AdAccountSyncSelector
 * BM-centric accordion layout for Meta ad account sync.
 * BMs are expandable sections. Under each BM: ad accounts (syncable), WABAs/Pages (informational).
 * Only ad accounts (category 'other') can be synced.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Building2,
  MessageSquare,
  FileText,
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
import type { AdPlatformConnection } from '@/types/adPlatforms';

interface SyncProgress {
  current: number;
  total: number;
  currentName: string;
  results: Array<{ id: string; name: string; success: boolean; message?: string }>;
}

interface BMGroup {
  bm: AdPlatformConnection;
  adAccounts: AdPlatformConnection[];
  wabas: AdPlatformConnection[];
  pages: AdPlatformConnection[];
}

export function AdAccountSyncSelector() {
  const { data: allConnections, isLoading } = useAdPlatformConnections();
  const updateConnection = useUpdateAdPlatformConnection();
  const syncCampaigns = useSyncAdCampaigns();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedBMs, setExpandedBMs] = useState<Set<string>>(new Set());

  // Filter only meta_ads connections (exclude meta_oauth)
  const metaConnections = useMemo(() => {
    if (!allConnections) return [];
    return allConnections.filter(
      (c) => c.platform === 'meta_ads' && c.account_id !== 'meta_oauth'
    );
  }, [allConnections]);

  // Group connections by BM hierarchy
  const { bmGroups, orphanAdAccounts, orphanPages } = useMemo(() => {
    const bms = metaConnections.filter((c) => c.account_category === 'bm');
    const groups: BMGroup[] = bms.map((bm) => {
      const children = metaConnections.filter((c) => c.parent_account_id === bm.account_id);
      return {
        bm,
        adAccounts: children.filter((c) => c.account_category === 'other'),
        wabas: children.filter((c) => c.account_category === 'waba'),
        pages: children.filter((c) => c.account_category === 'page'),
      };
    });

    // Orphan ad accounts (no parent BM)
    const orphanAds = metaConnections.filter(
      (c) => c.account_category === 'other' && !c.parent_account_id
    );

    // Orphan pages (no parent BM)
    const orphanPgs = metaConnections.filter(
      (c) => c.account_category === 'page' && !c.parent_account_id
    );

    return { bmGroups: groups, orphanAdAccounts: orphanAds, orphanPages: orphanPgs };
  }, [metaConnections]);

  // All syncable ad accounts (only category 'other')
  const allAdAccounts = useMemo(() => {
    const fromBMs = bmGroups.flatMap((g) => g.adAccounts);
    return [...fromBMs, ...orphanAdAccounts];
  }, [bmGroups, orphanAdAccounts]);

  const activeAdAccounts = useMemo(
    () => allAdAccounts.filter((c) => c.is_active),
    [allAdAccounts]
  );

  const selectedCount = activeAdAccounts.length;
  const totalAdCount = allAdAccounts.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (bmGroups.length === 0 && orphanAdAccounts.length === 0) {
    return null;
  }

  const toggleBMExpanded = (bmId: string) => {
    setExpandedBMs((prev) => {
      const next = new Set(prev);
      if (next.has(bmId)) {
        next.delete(bmId);
      } else {
        next.add(bmId);
      }
      return next;
    });
  };

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

  const handleSelectAllInBM = async (group: BMGroup, select: boolean) => {
    const targets = group.adAccounts.filter((c) => c.is_active !== select);
    if (targets.length === 0) return;

    try {
      const ids = targets.map((c) => c.id);
      const { error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .update({ is_active: select })
        .in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao atualizar contas.',
      });
    }
  };

  const handleDeselectAll = async () => {
    const ids = allAdAccounts.filter((c) => c.is_active).map((c) => c.id);
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

  const handleSelectAll = async () => {
    const ids = allAdAccounts.filter((c) => !c.is_active).map((c) => c.id);
    if (ids.length === 0) return;
    try {
      const { error } = await (supabase
        .from('ad_platform_connections' as any) as any)
        .update({ is_active: true })
        .in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ad-platform-connections'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao selecionar contas.',
      });
    }
  };

  const handleSyncSelected = async () => {
    if (activeAdAccounts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhuma conta selecionada',
        description: 'Selecione pelo menos uma conta de anúncios para sincronizar.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncProgress({
      current: 0,
      total: activeAdAccounts.length,
      currentName: activeAdAccounts[0].account_name,
      results: [],
    });

    const results: SyncProgress['results'] = [];

    for (let i = 0; i < activeAdAccounts.length; i++) {
      const account = activeAdAccounts[i];
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

  // Render a single ad account row (with checkbox)
  const renderAdAccountRow = (account: AdPlatformConnection) => (
    <label
      key={account.id}
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
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
      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{account.account_name}</span>
          {getStatusIcon(account.sync_status)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{account.account_id}</span>
          {account.last_sync_at && (
            <>
              <span>·</span>
              <span>
                Sync: {format(new Date(account.last_sync_at), 'dd/MM HH:mm', { locale: ptBR })}
              </span>
            </>
          )}
        </div>
        {account.error_message && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{account.error_message}</p>
        )}
      </div>
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
  );

  // Render informational asset (WABA or Page — no checkbox)
  const renderInfoAsset = (asset: AdPlatformConnection, icon: React.ReactNode, label: string) => (
    <div
      key={asset.id}
      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 text-muted-foreground"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{asset.account_name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {label}
          </Badge>
        </div>
      </div>
    </div>
  );

  // Render a BM group as collapsible section
  const renderBMGroup = (group: BMGroup) => {
    const bmId = group.bm.account_id;
    const isOpen = expandedBMs.has(bmId);
    const adCount = group.adAccounts.length;
    const activeInBM = group.adAccounts.filter((c) => c.is_active).length;
    const allSelectedInBM = adCount > 0 && activeInBM === adCount;
    const someSelectedInBM = activeInBM > 0 && activeInBM < adCount;

    return (
      <Collapsible
        key={group.bm.id}
        open={isOpen}
        onOpenChange={() => toggleBMExpanded(bmId)}
      >
        <div className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full p-3 text-left transition-colors',
                'hover:bg-accent/50',
                isOpen ? 'bg-accent/30' : ''
              )}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{group.bm.account_name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {adCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {activeInBM}/{adCount} ads
                  </Badge>
                )}
                {group.wabas.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {group.wabas.length} WABA
                  </Badge>
                )}
                {group.pages.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    {group.pages.length} page
                  </Badge>
                )}
                {adCount === 0 && group.wabas.length === 0 && group.pages.length === 0 && (
                  <span className="text-xs text-muted-foreground">sem assets</span>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-2 border-t bg-muted/10">
              {/* BM-level select all for ad accounts */}
              {adCount > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    checked={allSelectedInBM}
                    // @ts-ignore — indeterminate supported by radix
                    indeterminate={someSelectedInBM}
                    onCheckedChange={(checked) =>
                      handleSelectAllInBM(group, checked === true)
                    }
                    disabled={isSyncing}
                  />
                  <span className="text-xs text-muted-foreground">
                    {allSelectedInBM
                      ? 'Desmarcar todas as contas'
                      : 'Selecionar todas as contas de anúncio'}
                  </span>
                </div>
              )}

              {/* Ad Accounts (syncable) */}
              {group.adAccounts.map(renderAdAccountRow)}

              {/* WABAs (informational) */}
              {group.wabas.map((waba) =>
                renderInfoAsset(
                  waba,
                  <MessageSquare className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />,
                  'WABA'
                )
              )}

              {/* Pages (informational) */}
              {group.pages.map((page) =>
                renderInfoAsset(
                  page,
                  <FileText className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />,
                  'Page'
                )
              )}

              {adCount === 0 && group.wabas.length === 0 && group.pages.length === 0 && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Nenhum asset encontrado neste Business Manager.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
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
              <CardTitle className="text-lg">Contas Meta Ads</CardTitle>
              <CardDescription>
                {selectedCount} de {totalAdCount} conta(s) de anúncio selecionada(s)
                {bmGroups.length > 0 && ` · ${bmGroups.length} Business Manager(s)`}
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
                  <span
                    className={cn(
                      'text-xs',
                      result.success ? 'text-muted-foreground' : 'text-red-500'
                    )}
                  >
                    {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded: BM groups accordion */}
        {expanded && (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedCount === totalAdCount || isSyncing}
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

            {/* BM Groups */}
            <div className="space-y-2">
              {bmGroups.map(renderBMGroup)}
            </div>

            {/* Orphan Ad Accounts (no BM parent) */}
            {(orphanAdAccounts.length > 0 || orphanPages.length > 0) && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                  Contas sem Business Manager
                </div>
                {orphanAdAccounts.map(renderAdAccountRow)}
                {orphanPages.map((page) =>
                  renderInfoAsset(
                    page,
                    <FileText className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />,
                    'Page'
                  )
                )}
              </div>
            )}
          </>
        )}

        {/* Collapsed Summary */}
        {!expanded && (
          <div
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpanded(true)}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                {bmGroups.length} BM(s) · {totalAdCount} conta(s) de anúncio
              </span>
              <span>·</span>
              <span className="text-primary font-medium">{selectedCount} ativa(s)</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
