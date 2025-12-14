# 🚀 MIGRAÇÃO SUPER RÁPIDA - 3 PASSOS APENAS!

## ⚡ Passo 1: Abrir SQL Editor

Clique aqui e abra em uma nova aba:
**https://supabase.com/dashboard/project/rpcixpbmtpyrnzlsuuus/sql/new**

---

## ⚡ Passo 2: Copiar e Colar o Script

1. Abra o arquivo: **[MIGRACAO_RAPIDA.sql](MIGRACAO_RAPIDA.sql)**
2. Selecione **TUDO** (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor do Supabase (Ctrl+V)
5. Clique em **RUN** (ou pressione Ctrl+Enter)

⏱️ **Tempo estimado:** 10-30 segundos

---

## ⚡ Passo 3: Validar

Ainda no SQL Editor, execute esta query para validar:

```sql
-- Verificar se tudo foi criado
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace) as total_functions;

-- Verificar usuário admin
SELECT p.email, p.full_name, p.is_active, ur.role
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
WHERE p.email = 'filipesenna59@gmail.com';
```

**Resultado esperado:**
- `total_tabelas`: 20-25
- `total_policies`: 40-50
- `total_functions`: 3-5
- Usuário: `filipesenna59@gmail.com` com role `admin`

---

## ✅ Pronto! Agora teste a aplicação:

```bash
cd e:\dashmedpro-main\dashmedpro
npm run dev
```

Acesse: http://localhost:5173

### Checklist de Testes:
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar tarefa funciona
- [ ] Criar contato CRM funciona
- [ ] Team Management acessível
- [ ] Avatar e nome "Filipe" aparecem

---

## 🆘 Se der erro?

### Erro: "type already exists" ou "relation already exists"

**Solução:** Algumas estruturas já existiam. Execute este script de limpeza ANTES do Passo 2:

```sql
-- Limpar estruturas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop todas as tabelas do schema public
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || r.tablename || ' CASCADE';
    END LOOP;

    -- Drop todos os tipos ENUM
    FOR r IN (SELECT typname FROM pg_type WHERE typtype = 'e'
              AND typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || r.typname || ' CASCADE';
    END LOOP;

    -- Drop todas as functions
    FOR r IN (SELECT proname FROM pg_proc
              WHERE pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || r.proname || ' CASCADE';
    END LOOP;
END $$;
```

Depois execute o [MIGRACAO_RAPIDA.sql](MIGRACAO_RAPIDA.sql) normalmente.

---

## 📊 O que o script faz?

1. **Cria toda a estrutura do banco:**
   - Tabelas: profiles, user_roles, crm_contacts, deals, tasks, financial, etc.
   - RLS policies para segurança
   - Functions: has_role, get_user_role, handle_new_user
   - Triggers para updated_at
   - Enum: app_role (admin, dono, vendedor, gestor_trafego)

2. **Configura seu usuário como admin:**
   - Cria/atualiza perfil do filipesenna59@gmail.com
   - Define nome como "Filipe"
   - Atribui role "admin"

---

## 💡 Dica

Este script é **idempotente** - você pode executar múltiplas vezes sem problemas (usa CREATE OR REPLACE e IF NOT EXISTS onde possível).

Se precisar recomeçar do zero, execute o script de limpeza acima e depois o MIGRACAO_RAPIDA.sql novamente.

---

## 🎉 Migração feita!

Aproveite seu DashMed Pro totalmente configurado! 🚀
