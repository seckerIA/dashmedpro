# 🔍 RELATÓRIO DE PROBLEMAS - DASHMED PRO
## Análise Completa: Funções Não Funcionais, Configurações Faltantes e Problemas de Conexão

**Data:** 2025-01-14  
**Analisado por:** Sistema de Análise Automática

---

## 📋 SUMÁRIO EXECUTIVO

Este relatório identifica problemas encontrados no sistema DashMed Pro, incluindo:
- ✅ **Funções que não estão funcionando**
- ✅ **Falta de configuração**
- ✅ **Conexões incorretas com banco de dados**
- ✅ **Problemas de integração**

---

## 🔴 PROBLEMAS CRÍTICOS

### 0. **PROBLEMAS DE SEGURANÇA IDENTIFICADOS PELO SUPABASE**

#### 0.1. Função com Search Path Mutável
**Problema:** `public.update_updated_at_column` não tem `SET search_path` definido
**Risco:** Vulnerabilidade de segurança (SQL injection via search_path)
**Solução:** Adicionar `SET search_path = public` na função

#### 0.2. Proteção de Senhas Vazadas Desabilitada
**Problema:** Supabase Auth não está verificando senhas comprometidas (HaveIBeenPwned)
**Risco:** Usuários podem usar senhas já vazadas em vazamentos de dados
**Solução:** Habilitar "Leaked Password Protection" nas configurações do Supabase Auth

---

### 1. **SISTEMA DE PERMISSÕES DUPLICADO**

**Problema:** O sistema usa duas tabelas diferentes para armazenar roles:
- `profiles.role` (campo TEXT)
- `user_roles.role` (campo ENUM)

**Impacto:** 
- Inconsistência de dados
- Verificações de permissão podem falhar
- Usuários podem ter roles diferentes nas duas tabelas

**Localização:**
- `src/hooks/useUserProfile.tsx` (linhas 45-61) - Tenta buscar de ambas as tabelas
- `supabase/migrations/20250924074837_*.sql` - Cria `profiles.role`
- `supabase/migrations/20251213221208_*.sql` - Cria `user_roles.role`

**Solução Recomendada:**
1. Decidir qual tabela usar (recomendado: `user_roles` para segurança)
2. Migrar dados de `profiles.role` para `user_roles`
3. Remover campo `role` de `profiles` ou torná-lo deprecated
4. Atualizar todos os hooks para usar apenas `user_roles`

---

### 2. **TABELAS REFERENCIADAS NO CÓDIGO MAS NÃO VERIFICADAS**

**Problema:** O código referencia tabelas que podem não existir ou ter estrutura diferente:

#### 2.1. Tabela `BDR_PROSPECÇÃO`
- **Referenciada em:** Migrations antigas, código pode estar usando
- **Status:** Existe no banco (168 linhas)
- **Problema:** Nome com caracteres especiais pode causar problemas em queries
- **Verificar:** Se está sendo usada atualmente

#### 2.2. Tabela `contacts` (diferente de `crm_contacts`)
- **Status:** Existe no banco (0 linhas - vazia)
- **Problema:** Pode estar sendo confundida com `crm_contacts`
- **Verificar:** Se código está usando a tabela correta

#### 2.3. Tabela `messages`
- **Status:** Existe no banco (0 linhas - vazia)
- **Problema:** Não há código que use esta tabela atualmente
- **Ação:** Remover ou implementar funcionalidade

---

### 3. **PROBLEMAS DE RLS (ROW LEVEL SECURITY)**

#### 3.1. Políticas RLS Muito Permissivas
**Localização:** `supabase/migrations/20250924071317_*.sql`

```sql
CREATE POLICY "BDR_PROSPECÇÃO authenticated access" 
ON public."BDR_PROSPECÇÃO"
FOR ALL USING (auth.role() = 'authenticated');
```

**Problema:** Qualquer usuário autenticado pode ver/modificar TODOS os dados
**Impacto:** Falta de segurança, dados de um usuário podem ser acessados por outro

#### 3.2. Múltiplas Políticas Permissivas (Performance)
**Problema CRÍTICO:** Quase TODAS as tabelas têm múltiplas políticas permissivas para a mesma ação
**Exemplos:**
- `profiles` - 3 políticas para SELECT (authenticated)
- `crm_contacts`, `crm_deals`, `financial_transactions` - 2 políticas cada
- E muitas outras...

**Impacto:** 
- Performance degradada (cada política é executada para cada query)
- Manutenção difícil
- Possível inconsistência de segurança

**Solução:** Consolidar políticas em uma única política por ação/role

#### 3.3. Políticas RLS Re-avaliando auth.uid() para Cada Linha
**Problema:** Muitas políticas usam `auth.uid()` diretamente, que é re-avaliado para cada linha
**Tabelas afetadas:**
- `profiles` (4 políticas)
- `user_roles` (3 políticas)
- `notifications` (2 políticas)
- `user_daily_goals` (2 políticas)

**Impacto:** Performance muito ruim em tabelas grandes
**Solução:** Usar `(select auth.uid())` ao invés de `auth.uid()` nas políticas

#### 3.4. Falta de RLS em Algumas Tabelas
Verificar se todas as tabelas têm RLS habilitado e políticas adequadas.

---

### 4. **QUERIES COM JOINS QUE PODEM FALHAR**

#### 4.1. `useFinancialTransactions.tsx`
**Problema:** Query complexa com múltiplos joins:
```typescript
.select(`
  *,
  account:financial_accounts(id, name, type, bank_name),
  category:financial_categories(id, name, type, color, icon),
  deal:crm_deals(id, title, value),
  contact:crm_contacts(id, full_name, company)
`)
```

**Riscos:**
- Se `account_id` for NULL, join pode falhar
- Se `category_id` não existir, pode retornar erro
- Se relacionamentos não estiverem configurados corretamente no banco

**Verificar:**
- Foreign keys estão criadas?
- Dados órfãos (transações sem account/category)?

#### 4.2. `useSalesCalls.tsx`
**Problema:** Join com `crm_contacts` e `crm_deals`:
```typescript
.select(`
  *,
  contact:crm_contacts(id, full_name, email, phone, company),
  deal:crm_deals(id, title, value, stage),
  crm_deal:crm_deals(id, title, value, stage)
`)
```

**Riscos:**
- `contact_id` pode ser NULL mas query espera relacionamento
- `deal_id` e `crm_deal_id` - dois campos diferentes podem causar confusão

---

### 5. **CAMPOS OBRIGATÓRIOS SEM VALIDAÇÃO**

#### 5.1. `financial_transactions.date` vs `transaction_date`
**Problema:** Tabela tem DOIS campos de data:
- `date` (NOT NULL)
- `transaction_date` (NULLABLE)

**Impacto:** 
- Código pode estar usando campo errado
- Dados podem estar inconsistentes

**Verificar em:**
- `src/hooks/useFinancialTransactions.tsx`
- `src/components/financial/TransactionForm.tsx`

#### 5.2. `sales_calls.contact_id` (NOT NULL no código, mas NULLABLE no banco)
**Problema:** Migration define como NOT NULL, mas banco mostra como nullable
**Impacto:** Pode permitir criar calls sem contato

---

## ⚠️ PROBLEMAS DE MÉDIA PRIORIDADE

### 6. **FUNCIONALIDADES NÃO IMPLEMENTADAS (Placeholder Pages)**

#### 6.1. Páginas que são apenas placeholders:
- `/marketing` - `PlaceholderPage`
- `/comercial` - `PlaceholderPage` (exceto `/comercial/guia-prospeccao`)
- `/email-marketing` - `PlaceholderPage`
- `/funil-vendas` - `PlaceholderPage`
- `/landing-pages` - `PlaceholderPage`
- `/relatorios` - `PlaceholderPage` (mas protegida por role)
- `/configuracoes` - `PlaceholderPage`

**Impacto:** Usuários clicam em links que não fazem nada

---

### 7. **HOOKS QUE PODEM FALHAR SILENCIOSAMENTE**

#### 7.1. `useUserProfile.tsx`
**Problema:** Múltiplos fallbacks e tratamento de erro complexo:
- Tenta buscar de `profiles`
- Se falhar, tenta buscar colunas básicas
- Se não tiver role, tenta buscar de `user_roles`
- Muitos `console.log` e `console.warn` (código de debug em produção)

**Risco:** Erros podem ser mascarados, usuário pode não ter role sem saber

#### 7.2. `useDashboardMetrics.tsx`
**Problema:** Não verificado completamente, mas faz queries complexas
**Verificar:** Se todas as queries estão funcionando corretamente

---

### 8. **PROBLEMAS DE INTEGRAÇÃO COM STORAGE**

#### 8.1. `useFileUpload.tsx`
**Problema:** 
- Tenta fazer upload para Supabase Storage
- Depois tenta fazer upload para Google Drive
- Se Google Drive falhar, arquivo fica apenas no Supabase

**Riscos:**
- Bucket `task-images` pode não existir
- Permissões do bucket podem estar incorretas
- Google Drive integration pode não estar configurada

**Verificar:**
- Buckets criados no Supabase Storage?
- Políticas de acesso configuradas?
- Variáveis de ambiente do Google Drive?

---

### 9. **PROBLEMAS DE TIPOS/TYPESCRIPT**

#### 9.1. Tipos podem estar desatualizados
**Problema:** `src/integrations/supabase/types.ts` pode não refletir estrutura atual do banco

**Verificar:**
- Executar `supabase gen types typescript` para atualizar
- Comparar com estrutura real do banco

---

## 🟡 PROBLEMAS DE BAIXA PRIORIDADE / MELHORIAS

### 10. **CÓDIGO DE DEBUG EM PRODUÇÃO**

**Localização:** Vários arquivos
- `src/pages/Tasks.tsx` - console.log em useEffect
- `src/components/layout/AppSidebar.tsx` - console.log de debug
- `src/hooks/useUserProfile.tsx` - múltiplos console.log/warn

**Ação:** Remover ou substituir por sistema de logging adequado

---

### 11. **FALTA DE TRATAMENTO DE ERRO EM ALGUNS COMPONENTES**

**Exemplos:**
- Alguns hooks não têm tratamento de erro adequado
- Algumas páginas não mostram mensagens de erro amigáveis

---

### 12. **QUERIES SEM OTIMIZAÇÃO**

**Problema:** Algumas queries podem estar buscando dados desnecessários
- `useCRM.tsx` - Busca todos os contatos sem paginação
- `useFinancialTransactions.tsx` - Pode buscar muitas transações de uma vez

**Melhoria:** Implementar paginação

---

### 13. **ÍNDICES FALTANTES EM FOREIGN KEYS (PERFORMANCE)**

**Problema CRÍTICO:** TODAS as foreign keys no banco NÃO têm índices
**Impacto:** 
- Queries com JOINs são MUITO lentas
- Deletes/Updates em tabelas relacionadas são lentos
- Performance geral do banco degradada

**Tabelas afetadas (exemplos):**
- `financial_transactions` - 5 foreign keys sem índice
- `tasks` - 5 foreign keys sem índice
- `crm_deals` - 3 foreign keys sem índice
- `sales_calls` - 3 foreign keys sem índice
- E muitas outras...

**Total:** Mais de 40 foreign keys sem índices!

**Solução URGENTE:** Criar índices para TODAS as foreign keys:
```sql
CREATE INDEX idx_financial_transactions_account_id ON financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_category_id ON financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_user_id ON financial_transactions(user_id);
-- ... e assim por diante para TODAS as FKs
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### Banco de Dados
- [ ] Verificar se todas as foreign keys estão criadas
- [ ] Verificar se RLS está habilitado em todas as tabelas
- [ ] Verificar se políticas RLS estão corretas (não muito permissivas)
- [ ] Verificar dados órfãos (registros sem relacionamentos válidos)
- [ ] Consolidar sistema de roles (escolher uma tabela)
- [ ] Verificar se índices estão criados para performance

### Código
- [ ] Atualizar tipos TypeScript do Supabase
- [ ] Remover código de debug (console.log)
- [ ] Implementar tratamento de erro consistente
- [ ] Verificar se todas as queries têm tratamento de erro
- [ ] Implementar paginação onde necessário

### Funcionalidades
- [ ] Implementar páginas placeholder ou remover do menu
- [ ] Verificar se todas as integrações estão configuradas (Google Drive, etc)
- [ ] Verificar se buckets do Storage estão criados
- [ ] Testar fluxo completo de cada funcionalidade

### Segurança
- [ ] Revisar todas as políticas RLS
- [ ] Verificar se validações estão no frontend E backend
- [ ] Verificar se dados sensíveis não estão sendo expostos

---

## 🔧 AÇÕES RECOMENDADAS (PRIORIDADE)

### URGENTE (Fazer Imediatamente)
1. ✅ **CRIAR ÍNDICES PARA TODAS AS FOREIGN KEYS** (Performance crítica)
2. ✅ **Corrigir função `update_updated_at_column`** (Segurança)
3. ✅ **Habilitar Leaked Password Protection** (Segurança)
4. ✅ **Consolidar políticas RLS** (Remover múltiplas políticas, usar `(select auth.uid())`)
5. ✅ Consolidar sistema de roles (escolher `user_roles` ou `profiles.role`)
6. ✅ Revisar e corrigir políticas RLS (muito permissivas)
7. ✅ Verificar e corrigir foreign keys no banco
8. ✅ Atualizar tipos TypeScript do Supabase

### IMPORTANTE (Fazer em Breve)
5. ✅ Implementar tratamento de erro adequado
6. ✅ Remover código de debug
7. ✅ Verificar integrações (Storage, Google Drive)
8. ✅ Testar todas as queries complexas

### MELHORIAS (Fazer Quando Possível)
9. ✅ Implementar paginação
10. ✅ Implementar ou remover páginas placeholder
11. ✅ Otimizar queries
12. ✅ Adicionar testes automatizados

---

## 📝 NOTAS ADICIONAIS

### Tabelas no Banco vs Código
- ✅ Tabelas principais estão sendo usadas: `tasks`, `crm_contacts`, `crm_deals`, `financial_transactions`
- ⚠️ Tabelas não usadas: `contacts`, `messages` (considerar remover ou implementar)
- ⚠️ Tabela com nome problemático: `BDR_PROSPECÇÃO` (caracteres especiais)

### Hooks Principais
- ✅ `useUserProfile` - Funciona mas tem lógica complexa de fallback
- ✅ `useCRM` - Parece funcionar, mas verificar queries
- ✅ `useFinancialTransactions` - Queries complexas, verificar joins
- ✅ `useSalesCalls` - Verificar relacionamentos
- ✅ `useTasks` - Parece funcionar

### Páginas Principais
- ✅ Dashboard - Funciona, mas depende de vários hooks
- ✅ CRM - Funciona, mas verificar queries
- ✅ Tasks - Funciona
- ✅ Calendar - Funciona, mas depende de `sales_calls`
- ✅ Financial - Protegida por role, verificar queries
- ⚠️ Várias páginas são apenas placeholders

---

## 🎯 CONCLUSÃO

O sistema tem uma base sólida, mas precisa de:
1. **Consolidação do sistema de permissões**
2. **Revisão de segurança (RLS)**
3. **Tratamento de erro mais robusto**
4. **Limpeza de código de debug**
5. **Implementação ou remoção de funcionalidades placeholder**

**Prioridade:** Focar primeiro nos problemas críticos de segurança e consistência de dados.

---

**Próximos Passos Sugeridos:**
1. Criar migration para consolidar roles
2. Revisar e corrigir políticas RLS
3. Atualizar tipos TypeScript
4. Testar cada funcionalidade end-to-end
5. Documentar decisões arquiteturais

