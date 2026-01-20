/**
 * Script para resetar senha do admin
 * Uso: node reset-admin-password.mjs
 */
import { supabaseAdmin } from './config.mjs';

async function resetPassword() {
    try {
        const email = 'admin@dashmed.com';
        const newPassword = '123456789';

        console.log(`🔧 Resetando senha para ${email}...\n`);

        // 1. Buscar usuário para pegar o ID
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const user = users.find(u => u.email === email);

        if (!user) {
            console.error('❌ Usuário não encontrado:', email);
            process.exit(1);
        }

        console.log('✓ Usuário encontrado:', user.id);

        // 2. Atualizar senha
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) throw updateError;

        console.log('\n✅ Senha atualizada com sucesso!');
        console.log(`   Email: ${email}`);
        console.log(`   Nova Senha: ${newPassword}`);

    } catch (error) {
        console.error('\n❌ Erro ao resetar senha:', error.message);
        process.exit(1);
    }
}

resetPassword();
