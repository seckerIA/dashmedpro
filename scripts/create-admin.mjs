import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4ODIwOSwiZXhwIjoyMDgxNTY0MjA5fQ.S3WAA-ZP85pXHaGe8m4eRirT9bEl7nEsUPik0WpgBxk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  try {
    console.log('🔧 Criando usuário admin...\n');

    // 1. Criar usuário na auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'filipesenna59@gmail.com',
      password: '12345678',
      email_confirm: true,
      user_metadata: {
        full_name: 'Filipe Leddet'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Usuário já existe em auth.users');
        // Buscar usuário existente
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === 'filipesenna59@gmail.com');

        if (!existingUser) {
          throw new Error('Usuário não encontrado');
        }

        console.log('✓ Usuário encontrado:', existingUser.id);

        // Atualizar profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: 'filipesenna59@gmail.com',
            full_name: 'Filipe Leddet',
            role: 'admin',
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (profileError) throw profileError;
        console.log('✓ Profile atualizado com role: admin');

        // Verificar
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'filipesenna59@gmail.com')
          .single();

        console.log('\n✅ Admin atualizado com sucesso!');
        console.log('📋 Dados do perfil:');
        console.log('   ID:', profile.id);
        console.log('   Email:', profile.email);
        console.log('   Nome:', profile.full_name);
        console.log('   Role:', profile.role);
        console.log('   Ativo:', profile.is_active);

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
        email: 'filipesenna59@gmail.com',
        full_name: 'Filipe Leddet',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) throw profileError;
    console.log('✓ Profile criado com role: admin');

    // 3. Verificar
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'filipesenna59@gmail.com')
      .single();

    console.log('\n✅ Admin criado com sucesso!');
    console.log('📋 Dados do perfil:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nome:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Ativo:', profile.is_active);
    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Email: filipesenna59@gmail.com');
    console.log('   Senha: 12345678');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('\n❌ Erro ao criar admin:', error.message);
    if (error.details) console.error('Detalhes:', error.details);
    process.exit(1);
  }
}

createAdmin();
