import { useQuery } from '@tanstack/react-query';
import { useAdCampaignsSync } from './useAdCampaignsSync';
import { useAdPlatformConnections } from './useAdPlatformConnections';
import { subDays } from 'date-fns';

export type AlertType = 'low_roas' | 'no_conversions' | 'budget_limit' | 'optimization' | 'sync_error';

export interface MarketingAlert {
  type: AlertType;
  severity: 'info' | 'warning' | 'error';
  message: string;
  campaignId?: string;
  campaignName?: string;
  connectionId?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export function useMarketingAlerts() {
  const { data: campaigns } = useAdCampaignsSync();
  const { data: connections } = useAdPlatformConnections();

  return useQuery({
    queryKey: ['marketing-alerts', campaigns, connections],
    queryFn: async (): Promise<MarketingAlert[]> => {
      const alerts: MarketingAlert[] = [];
      const campaignsData = campaigns || [];
      const connectionsData = connections || [];
      const sevenDaysAgo = subDays(new Date(), 7);

      // Alertas de campanhas com baixo ROAS
      campaignsData.forEach(campaign => {
        if (campaign.status === 'active' && campaign.roas) {
          if (campaign.roas < 1.5) {
            alerts.push({
              type: 'low_roas',
              severity: 'error',
              message: `Campanha "${campaign.platform_campaign_name}" tem ROAS muito baixo (${campaign.roas.toFixed(2)}x). Considere pausar ou otimizar.`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
              actionLabel: 'Ver campanha',
              actionUrl: `/marketing?tab=campaigns&campaign=${campaign.id}`,
            });
          } else if (campaign.roas < 2) {
            alerts.push({
              type: 'low_roas',
              severity: 'warning',
              message: `Campanha "${campaign.platform_campaign_name}" tem ROAS abaixo do ideal (${campaign.roas.toFixed(2)}x).`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
              actionLabel: 'Ver campanha',
              actionUrl: `/marketing?tab=campaigns&campaign=${campaign.id}`,
            });
          }
        }
      });

      // Alertas de campanhas sem conversões
      campaignsData.forEach(campaign => {
        if (campaign.status === 'active' && campaign.conversions === 0) {
          const lastSync = new Date(campaign.synced_at);
          if (lastSync < sevenDaysAgo) {
            alerts.push({
              type: 'no_conversions',
              severity: 'warning',
              message: `Campanha "${campaign.platform_campaign_name}" não tem conversões há mais de 7 dias.`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
              actionLabel: 'Ver campanha',
              actionUrl: `/marketing?tab=campaigns&campaign=${campaign.id}`,
            });
          }
        }
      });

      // Alertas de orçamento próximo do limite
      campaignsData.forEach(campaign => {
        if (campaign.budget && campaign.status === 'active') {
          const budget = Number(campaign.budget);
          const spend = Number(campaign.spend) || 0;
          const usagePercentage = (spend / budget) * 100;
          
          if (usagePercentage >= 90) {
            alerts.push({
              type: 'budget_limit',
              severity: 'warning',
              message: `Campanha "${campaign.platform_campaign_name}" está com ${usagePercentage.toFixed(0)}% do orçamento utilizado.`,
              campaignId: campaign.id,
              campaignName: campaign.platform_campaign_name,
              actionLabel: 'Ver campanha',
              actionUrl: `/marketing?tab=campaigns&campaign=${campaign.id}`,
            });
          }
        }
      });

      // Alertas de erros de sincronização
      connectionsData.forEach(connection => {
        if (connection.sync_status === 'error' && connection.is_active) {
          alerts.push({
            type: 'sync_error',
            severity: 'error',
            message: `Erro ao sincronizar conexão "${connection.account_name}". ${connection.error_message || 'Verifique as configurações.'}`,
            connectionId: connection.id,
            actionLabel: 'Configurar',
            actionUrl: `/marketing?tab=integrations`,
          });
        }
      });

      // Sugestões de otimização
      campaignsData.forEach(campaign => {
        if (campaign.status === 'active' && campaign.ctr && campaign.ctr < 1) {
          alerts.push({
            type: 'optimization',
            severity: 'info',
            message: `Campanha "${campaign.platform_campaign_name}" tem CTR baixo (${campaign.ctr.toFixed(2)}%). Considere melhorar os anúncios.`,
            campaignId: campaign.id,
            campaignName: campaign.platform_campaign_name,
            actionLabel: 'Ver campanha',
            actionUrl: `/marketing?tab=campaigns&campaign=${campaign.id}`,
          });
        }
      });

      // Ordenar por severidade (error > warning > info)
      const severityOrder = { error: 3, warning: 2, info: 1 };
      alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

      return alerts.slice(0, 10); // Limitar a 10 alertas
    },
    enabled: true,
  });
}

