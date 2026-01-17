# Scripts de Manutenção - DashMedPro

## ⚠️ SEGURANÇA

Os scripts nesta pasta requerem a `SERVICE_ROLE_KEY` do Supabase.
**NUNCA** commite chaves diretamente no código.

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o `.env` e preencha suas credenciais:
   ```
   SUPABASE_URL=https://adzaqkduxnpckbcuqpmg.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
   ```

3. O arquivo `.env` está no `.gitignore` e **nunca será commitado**.

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `create-admin.mjs` | Cria usuário admin |
| `populate-database.mjs` | Popula banco com dados de teste |
| `run-migration.mjs` | Executa migrations manuais |
| `check-rls.mjs` | Verifica políticas RLS |

## Uso

```bash
cd scripts
node create-admin.mjs
```
