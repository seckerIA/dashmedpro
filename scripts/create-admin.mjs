/**
 * Script para criar usuário admin
 * Uso: node create-admin.mjs
 */
import { supabaseAdmin } from './config.mjs';

async function createAdmin() {
    try {
        const email = 'filipesenna59@gmail.com';
        const password = '12345678';
        const fullName = 'Filipe Leddet';

        console.log('🔧 Criando usuário admin...\n');

        // 1. Criar usuário na auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        let userId;

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('ℹ️  Usuário já existe em auth.users');
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users.find(u => u.email === email);
                if (!existingUser) throw new Error('Usuário não encontrado');
                userId = existingUser.id;
                console.log('✓ Usuário encontrado:', userId);
            } else {
                throw authError;
            }
        } else {
            userId = authData.user.id;
            console.log('✓ Usuário criado em auth.users:', userId);
        }

        // 2. Criar/atualizar profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                role: 'admin',
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) throw profileError;
        console.log('✓ Profile atualizado com role: admin');

        // 3. Verificar
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        console.log('\n✅ Admin criado/atualizado com sucesso!');
        console.log('📋 Dados do perfil:');
        console.log('   ID:', profile.id);
        console.log('   Email:', profile.email);
        console.log('   Nome:', profile.full_name);
        console.log('   Role:', profile.role);

    } catch (error) {
        console.error('\n❌ Erro ao criar admin:', error.message);
        process.exit(1);
    }
}

createAdmin();
