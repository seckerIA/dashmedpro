# Resumo da Migração para rpcixpbmtpyrnzlsuuus

## ✅ Concluído

1. **URL hardcoded corrigida**
   - `src/hooks/useFileUpload.tsx` - Agora usa `rpcixpbmtpyrnzlsuuus.supabase.co`

2. **Configurações atualizadas**
   - `supabase/config.toml` - Atualizado para `rpcixpbmtpyrnzlsuuus`
   - `supabase/.temp/project-ref` - Atualizado para `rpcixpbmtpyrnzlsuuus`
   - `.cursor/mcp.json` - Já estava correto (você atualizou)

3. **Documentação atualizada**
   - `MCP_SETUP_INSTRUCTIONS.md` - Referências atualizadas

## ⚠️ Ações Manuais Necessárias

### 1. Deploy das Edge Functions
O Supabase CLI está linkado ao projeto antigo, então você precisa fazer deploy manual:

**Siga as instruções em:** `DEPLOY_EDGE_FUNCTIONS.md`

**Edge Functions para deployar:**
- `create-team-user`
- `delete-team-user`
- `update-team-user`
- `upload-to-google-drive`

**URL do Dashboard:** https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/functions

### 2. Verificar Migrações do Banco
O banco remoto tem migrações que não estão no diretório local (normal ao clonar de outra conta).

**Opções:**

**Opção A - Se o banco já está configurado:**
- Verifique se todas as tabelas e estruturas necessárias existem
- Se sim, não precisa fazer nada

**Opção B - Se precisa aplicar migrações locais:**
```bash
# Primeiro, sincronize o histórico de migrações
npx supabase db pull

# Depois, aplique as migrações pendentes
npx supabase db push
```

**Opção C - Aplicar migrações manualmente:**
- Acesse o SQL Editor no dashboard: https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/sql
- Execute as migrações em ordem cronológica (pela data no nome do arquivo)

## 📋 Checklist Final

- [x] URLs hardcoded corrigidas
- [x] Configurações atualizadas
- [x] Documentação atualizada
- [ ] Edge functions deployadas (manual via dashboard)
- [ ] Migrações verificadas/aplicadas (se necessário)

## 🧪 Testes Após Migração

Após completar as ações manuais, teste:

1. **Criar usuário** - Deve usar `create-team-user`
2. **Editar usuário** - Deve usar `update-team-user` (já corrigido CORS)
3. **Excluir usuário** - Deve usar `delete-team-user`
4. **Upload de arquivo** - Deve usar `upload-to-google-drive`
5. **Verificar que todas as requisições vão para `rpcixpbmtpyrnzlsuuus.supabase.co`**









