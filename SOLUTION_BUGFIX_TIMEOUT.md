# Relatório de Correção: Erros de Timeout e Aborto de Consultas (Janeiro 2026)

## Problema Identificado
O sistema apresentava lentidão extrema e erros de timeout (`400 Bad Request` ou `Abortado externamente`) após aproximadamente 2 minutos de navegação no dashboard comercial.

### Causa Raiz
1.  **Chaves de Consulta Instáveis**: As chaves do React Query para leads e métricas continham dependências que eram recriadas a cada renderização (arrays e objetos de data), forçando o sistema a ignorar o cache.
2.  **Explosão Cíclica de Requisições**: O `staleTime` padrão era de 2 minutos. Quando o cache vencia, todos os hooks disparavam consultas pesadas (com RLS de médico/secretária) simultaneamente, sobrecarregando o limite de conexões do Supabase.
3.  **Watchdog Agressivo**: O `StuckQueryDetector` cancelava consultas que demorassem mais de 100s, impossibilitando o banco de terminar consultas legítimas mas lentas devido ao RLS complexo.

## Soluções Implementadas

### 1. Estabilização de Memória (useMemo)
-   Implementada a memoização de `targetUserIds` em `useCommercialLeads.tsx` e `useCommercialMetrics.tsx`.
-   As chaves de consulta agora usam `toDateString()` em vez de `toISOString()` para evitar que mudanças em milissegundos disparem novos refetches.

### 2. Gestão de Tráfego e Cache
-   **staleTime**: Aumentado de 2 para 10 minutos (redução drástica na frequência de recarregamento em background).
-   **gcTime**: Aumentado para 15 minutos para manter os dados em memória por mais tempo.

### 3. Mecanismos de Fallback
-   **Fallback de Leads**: Se a consulta de leads com join (profiles) falhar ou demorar mais de 90s, o sistema agora tenta uma consulta simplificada sem o join, garantindo a exibição básica dos dados.
-   **Extended Timeouts**: Aumentados para 90s em consultas críticas para acomodar a latência natural do RLS de secretária.

### 4. Ajuste do Watchdog (`App.tsx`)
-   O limite para cancelamento de consultas travadas foi relaxado para **180 segundos** (3 minutos), dando margem de segurança para o banco de dados processar métricas anuais ou mensais pesadas.

## Como manter esta estabilidade
-   Evite usar objetos literais ou arrays diretamente na `queryKey` sem `useMemo`.
-   Sempre que adicionar uma nova métrica pesada no dashboard, prefira carregar de forma independente ou garantir um `staleTime` longo.
