import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUserJoao() {
  try {
    console.log('🔧 Criando usuário joao@gmail.com...\n');

    const email = 'joao@gmail.com';
    const password = '123456789';
    const fullName = 'João';
    const role = 'admin';

    // 1. Criar usuário na auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        console.log('ℹ️  Usuário já existe em auth.users');
        // Buscar usuário existente
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw new Error(`Erro ao listar usuários: ${listError.message}`);
        }

        const existingUser = users.find(u => u.email === email);

        if (!existingUser) {
          throw new Error('Usuário não encontrado na lista de usuários');
        }

        console.log('✓ Usuário encontrado:', existingUser.id);

        // Atualizar profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email,
            full_name: fullName,
            role,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('❌ Erro ao atualizar profile:', profileError);
          throw profileError;
        }
        console.log('✓ Profile atualizado com role: admin');

        // Verificar
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (fetchError) {
          console.error('❌ Erro ao buscar profile:', fetchError);
          throw fetchError;
        }

        console.log('\n✅ Usuário atualizado com sucesso!');
        console.log('📋 Dados do perfil:');
        console.log('   ID:', profile.id);
        console.log('   Email:', profile.email);
        console.log('   Nome:', profile.full_name);
        console.log('   Role:', profile.role);
        console.log('   Ativo:', profile.is_active);
        console.log('\n🔐 Credenciais de acesso:');
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);
        console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

        return;
      }
      throw authError;
    }

    console.log('✓ Usuário criado em auth.users:', authData.user.id);

    // 2. Criar/atualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('❌ Erro ao criar profile:', profileError);
      throw profileError;
    }
    console.log('✓ Profile criado com role: admin');

    // 3. Verificar
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar profile:', fetchError);
      throw fetchError;
    }

    console.log('\n✅ Usuário criado com sucesso!');
    console.log('📋 Dados do perfil:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nome:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Ativo:', profile.is_active);
    console.log('\n🔐 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    if (error.details) console.error('Detalhes:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

createUserJoao();




