/**
 * Script para CRIAR admin@dashmed.com
 * Uso: node create-platform-admin.mjs
 */
import { supabaseAdmin } from './config.mjs';

async function createAdmin() {
    try {
        const email = 'admin@dashmed.com';
        const password = '123456789';
        const fullName = 'Super Admin DashMed';
        const orgId = '4a8b3bb0-25ca-4a95-b524-d47a6401c06b'; // Clínica Padrão

        console.log(`🔧 Criando usuário ${email}...\n`);

        // 1. Criar usuário na auth com createUser (ignora se existir, mas lança erro)
        // Vamos checar e criar ou atualizar.
        let userId;

        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existing = users.find(u => u.email === email);

        if (existing) {
            console.log('ℹ️  Usuário já existe, atualizando senha...');
            userId = existing.id;
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: password }
            );
            if (updateError) throw updateError;
        } else {
            console.log('ℹ️  Usuário novo, criando...');
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: fullName }
            });
            if (createError) throw createError;
            userId = newUser.user.id;
        }

        console.log('✓ User ID:', userId);

        // 2. Criar/atualizar profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name: fullName,
                role: 'admin', // Super Admin role
                organization_id: null, // Super Admin desacoplado de organização
                is_super_admin: true,
                is_active: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) throw profileError;
        console.log('✓ Profile atualizado (Super Admin Global).');

        // 3. NÃO adicionar como membro de organização (Super Admin Global)
        // Se existir associação anterior, idealmente removeríamos, mas este script cria do zero.
        console.log('✓ Configuração de Super Admin concluída (sem vínculo com organização).');

        if (memberError) throw memberError;
        console.log('✓ Membro da organização atualizado.');

        console.log('\n✅ Admin configurado com sucesso!');
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);

    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

createAdmin();
