# Criar Usuário Admin - DashMed Pro

Este guia explica como criar o usuário admin `gustavosantosbbs@gmail.com`.

## Método 1: Via Supabase Dashboard (Recomendado)

### Passo 1: Criar o Usuário

1. Acesse o Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/[project-ref]/auth/users
   ```

2. Clique em **"Add User"** ou **"Invite User"**

3. Preencha os dados:
   - **Email**: `gustavosantosbbs@gmail.com`
   - **Password**: `123456789`
   - **Auto Confirm User**: ✅ (marcar para confirmar automaticamente)

4. Clique em **"Create User"**

### Passo 2: Atualizar o Perfil para Admin

Após criar o usuário, execute o script SQL:

1. Acesse o SQL Editor:
   ```
   https://supabase.com/dashboard/project/[project-ref]/sql/new
   ```

2. Execute o arquivo:
   ```
   supabase/migrations/20250120000001_create_admin_user.sql
   ```

3. Ou execute diretamente:
   ```sql
   DO $$
   DECLARE
       v_user_id UUID;
   BEGIN
       SELECT id INTO v_user_id
       FROM auth.users
       WHERE email = 'gustavosantosbbs@gmail.com';

       IF v_user_id IS NOT NULL THEN
           INSERT INTO public.profiles (
               id, email, full_name, role, is_active, created_at, updated_at
           )
           VALUES (
               v_user_id,
               'gustavosantosbbs@gmail.com',
               'gustavo',
               'admin'::user_role,
               true,
               NOW(),
               NOW()
           )
           ON CONFLICT (id) DO UPDATE
           SET
               role = 'admin'::user_role,
               full_name = 'gustavo',
               is_active = true,
               updated_at = NOW();
       END IF;
   END $$;
   ```

## Método 2: Via Supabase CLI

```bash
# Criar usuário via CLI
supabase auth admin create-user \
  --email gustavosantosbbs@gmail.com \
  --password 123456789 \
  --email-confirm true

# Depois execute o script SQL para atualizar o perfil
supabase db push
```

## Método 3: Via API (Programático)

```javascript
// Usando o Supabase Admin API
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://[project-ref].supabase.co',
  'SUPABASE_SERVICE_ROLE_KEY' // Use a Service Role Key
)

// Criar usuário
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: 'gustavosantosbbs@gmail.com',
  password: '123456789',
  email_confirm: true,
  user_metadata: {
    full_name: 'gustavo'
  }
})

// Atualizar perfil para admin
if (data.user) {
  await supabaseAdmin
    .from('profiles')
    .upsert({
      id: data.user.id,
      email: 'gustavosantosbbs@gmail.com',
      full_name: 'gustavo',
      role: 'admin',
      is_active: true
    })
}
```

## Verificação

Após criar o usuário e executar o script, verifique:

```sql
-- Verificar usuário
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'gustavosantosbbs@gmail.com';

-- Verificar perfil
SELECT id, email, full_name, role, is_active
FROM public.profiles
WHERE email = 'gustavosantosbbs@gmail.com';
```

Você deve ver:
- `role` = `'admin'`
- `is_active` = `true`
- `full_name` = `'gustavo'`

## Login

Após criar o usuário, você pode fazer login com:

- **Email**: `gustavosantosbbs@gmail.com`
- **Senha**: `123456789`

## Notas Importantes

- ⚠️ **Segurança**: Altere a senha após o primeiro login
- ⚠️ **Service Role Key**: Use apenas em ambiente seguro (nunca exponha no frontend)
- ⚠️ **Confirmação**: Certifique-se de que `email_confirmed_at` não é NULL para permitir login

---

**Criado em**: 2025-01-20











