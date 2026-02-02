const { createClient } = require('@supabase/supabase-js');

// Production Supabase
const SUPABASE_URL = 'https://adzaqkduxnpckbcuqpmg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const RAFAEL_USER_ID = '8ce20d10-5c49-4bb1-b086-9c2e1ede286d';

async function checkRafael() {
  console.log('=== Verificando dados do Dr. Rafael ===\n');
  console.log('User ID:', RAFAEL_USER_ID);
  console.log('');

  // 1. Check profile (sem .single() para ver todos)
  console.log('1. Verificando profile...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id, onboarding_completed')
    .eq('id', RAFAEL_USER_ID);

  const profile = profiles && profiles.length > 0 ? profiles[0] : null;
  console.log('   Profiles encontrados:', profiles?.length || 0);

  if (profileError) {
    console.log('   ❌ Erro ao buscar profile:', profileError.message);
  } else if (profile) {
    console.log('   ✅ Profile encontrado:');
    console.log('      - email:', profile.email);
    console.log('      - full_name:', profile.full_name);
    console.log('      - role:', profile.role);
    console.log('      - organization_id:', profile.organization_id);
    console.log('      - onboarding_completed:', profile.onboarding_completed);
  } else {
    console.log('   ⚠️ Profile não encontrado');
  }
  console.log('');

  // 2. Check organization_members
  console.log('2. Verificando organization_members...');
  const { data: member, error: memberError } = await supabase
    .from('organization_members')
    .select('id, organization_id, user_id, role')
    .eq('user_id', RAFAEL_USER_ID);

  if (memberError) {
    console.log('   ❌ Erro ao buscar organization_members:', memberError.message);
  } else if (member && member.length > 0) {
    console.log('   ✅ Organization member encontrado:');
    member.forEach(m => {
      console.log('      - organization_id:', m.organization_id);
      console.log('      - role:', m.role);
    });
  } else {
    console.log('   ⚠️ Nenhum organization_member encontrado - ESTE É O PROBLEMA!');
  }
  console.log('');

  // 3. Check organizations owned by Rafael
  console.log('3. Verificando organizations criadas por Rafael...');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug, owner_id')
    .eq('owner_id', RAFAEL_USER_ID);

  // 3b. Check the org that Rafael is a member of
  if (member && member.length > 0) {
    console.log('');
    console.log('3b. Verificando organização vinculada (via organization_members)...');
    const { data: linkedOrgs, error: linkedOrgError } = await supabase
      .from('organizations')
      .select('id, name, slug, owner_id')
      .eq('id', member[0].organization_id);

    const linkedOrg = linkedOrgs && linkedOrgs.length > 0 ? linkedOrgs[0] : null;
    console.log('   Orgs encontradas:', linkedOrgs?.length || 0);

    if (linkedOrgError) {
      console.log('   ❌ Erro ao buscar org vinculada:', linkedOrgError.message);
    } else if (linkedOrg) {
      console.log('   ✅ Organização vinculada encontrada:');
      console.log('      - id:', linkedOrg.id);
      console.log('      - name:', linkedOrg.name);
      console.log('      - slug:', linkedOrg.slug);
      console.log('      - owner_id:', linkedOrg.owner_id);
    }
  }

  if (orgsError) {
    console.log('   ❌ Erro ao buscar organizations:', orgsError.message);
  } else if (orgs && orgs.length > 0) {
    console.log('   ✅ Organization encontrada:');
    orgs.forEach(o => {
      console.log('      - id:', o.id);
      console.log('      - name:', o.name);
      console.log('      - slug:', o.slug);
    });
  } else {
    console.log('   ⚠️ Nenhuma organization encontrada como owner');
  }
  console.log('');

  // Summary
  console.log('=== RESUMO ===');
  if (profile && (!member || member.length === 0) && orgs && orgs.length > 0) {
    console.log('PROBLEMA: Profile e Organization existem, mas organization_members está faltando!');
    console.log('');
    console.log('SOLUÇÃO: Executar o seguinte SQL no Supabase Dashboard:');
    console.log('');
    console.log(`INSERT INTO organization_members (organization_id, user_id, role)`);
    console.log(`VALUES ('${orgs[0].id}', '${RAFAEL_USER_ID}', 'owner');`);
  } else if (profile && (!member || member.length === 0) && (!orgs || orgs.length === 0)) {
    console.log('PROBLEMA: Profile existe, mas Organization e organization_members estão faltando!');
    console.log('');
    console.log('SOLUÇÃO: Fazer o onboarding novamente ou criar manualmente via SQL.');
  } else if (profile && member && member.length > 0) {
    console.log('Tudo parece correto. O problema pode ser outro.');
  }
}

checkRafael().catch(console.error);
