# Instruções para Deploy Manual das Edge Functions

Como o Supabase CLI está linkado ao projeto antigo (`npcgtjrgxxrhvrptkzip`), você precisa fazer o deploy manual das edge functions no projeto novo (`rpcixpbmtpyrnzlsuuus`) pelo Dashboard.

## Edge Functions que precisam ser deployadas:

1. **create-team-user**
2. **delete-team-user**
3. **update-team-user**
4. **upload-to-google-drive**

## Passo a passo:

### 1. Acesse o Dashboard do Supabase
- Vá para: https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/functions

### 2. Para cada função:

#### create-team-user
1. Clique em "Create a new function" ou edite se já existir
2. Nome: `create-team-user`
3. Cole o conteúdo de: `supabase/functions/create-team-user/index.ts`
4. Clique em "Deploy"

#### delete-team-user
1. Clique em "Create a new function" ou edite se já existir
2. Nome: `delete-team-user`
3. Cole o conteúdo de: `supabase/functions/delete-team-user/index.ts`
4. Clique em "Deploy"

#### update-team-user
1. Clique em "Create a new function" ou edite se já existir
2. Nome: `update-team-user`
3. Cole o conteúdo de: `supabase/functions/update-team-user/index.ts`
4. Clique em "Deploy"

#### upload-to-google-drive
1. Clique em "Create a new function" ou edite se já existir
2. Nome: `upload-to-google-drive`
3. Cole o conteúdo de: `supabase/functions/upload-to-google-drive/index.ts`
4. Clique em "Deploy"

## Verificação

Após fazer o deploy de todas as funções, teste:
- ✅ Criar usuário (usa `create-team-user`)
- ✅ Editar usuário (usa `update-team-user`)
- ✅ Excluir usuário (usa `delete-team-user`)
- ✅ Upload de arquivo (usa `upload-to-google-drive`)









