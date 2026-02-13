import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, CheckCircle2, XCircle, Clock, Trash2, Edit } from "lucide-react";
import { useAdPlatformConnections } from "@/hooks/useAdPlatformConnections";
import { useSyncAdCampaigns, useAdCampaignsSync } from "@/hooks/useAdCampaignsSync";
import { useDeleteAdPlatformConnection } from "@/hooks/useAdPlatformConnections";
import { AdConnectionForm } from "./AdConnectionForm";
import { AD_PLATFORM_LABELS, SYNC_STATUS_LABELS } from "@/types/adPlatforms";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetaIntegrationCard } from "@/components/marketing/MetaIntegrationCard";

export function AdPlatformsIntegration() {
  const { data: connections, isLoading } = useAdPlatformConnections();
  const syncCampaigns = useSyncAdCampaigns();
  const deleteConnection = useDeleteAdPlatformConnection();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);

  const handleSync = async (connectionId: string) => {
    try {
      await syncCampaigns.mutateAsync(connectionId);
      toast({
        title: 'Sincronização iniciada',
        description: 'Os dados das campanhas estão sendo sincronizados.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao sincronizar campanhas.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conexão?')) {
      try {
        await deleteConnection.mutateAsync(id);
        toast({
          title: 'Conexão excluída',
          description: 'A conexão foi excluída com sucesso.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Erro ao excluir conexão.',
        });
      }
    }
  };

  const handleEdit = (connection: any) => {
    setEditingConnection(connection);
    setShowForm(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meta Business Platform OAuth Centralizado */}
      <MetaIntegrationCard />

      {/* Conexões Manuais (Google Ads, etc) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Outras Integrações</h2>
            <p className="text-sm text-muted-foreground">
              Adicione conexões manuais para Google Ads ou outras plataformas
            </p>
          </div>
          <Button onClick={() => {
            setEditingConnection(null);
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conexão
          </Button>
        </div>

      {connections && connections.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Nenhuma conexão configurada. Adicione uma conexão para começar.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Conexão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections?.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{connection.account_name}</CardTitle>
                    <CardDescription>
                      {AD_PLATFORM_LABELS[connection.platform]}
                    </CardDescription>
                  </div>
                  <Badge variant={connection.is_active ? 'default' : 'secondary'}>
                    {connection.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account ID:</span>
                    <span className="font-mono text-xs">{connection.account_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connection.sync_status)}
                      <span>{SYNC_STATUS_LABELS[connection.sync_status]}</span>
                    </div>
                  </div>
                  {connection.last_sync_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Última sincronização:</span>
                      <span>
                        {format(new Date(connection.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                  {connection.error_message && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {connection.error_message}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(connection.id)}
                    disabled={syncCampaigns.isPending}
                    className="flex-1"
                  >
                    {syncCampaigns.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(connection)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(connection.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        <AdConnectionForm
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setEditingConnection(null);
          }}
          connection={editingConnection}
        />
      </div>
    </div>
  );
}


