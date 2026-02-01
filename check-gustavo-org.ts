import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not found in environment');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGustavoOrg() {
  // Primeiro verificar se o usuário está autenticado
  console.log('\n=== VERIFICANDO AUTENTICAÇÃO ===\n');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Sessão ativa:', session ? 'SIM (user: ' + session.user.email + ')' : 'NÃO');

  console.log('\n=== BUSCANDO TODOS OS PERFIS RECENTES ===\n');

  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (profilesError) {
    console.error('Erro ao buscar perfis:', profilesError);
  } else {
    console.log('Perfis encontrados (últimos 10):', JSON.stringify(allProfiles, null, 2));
  }

  console.log('\n=== BUSCANDO TODAS AS ORGANIZAÇÕES RECENTES ===\n');

  const { data: allOrgs, error: allOrgError } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allOrgError) {
    console.error('Erro ao buscar todas organizações:', allOrgError);
  } else {
    console.log('Todas organizações (últimas 10):', JSON.stringify(allOrgs, null, 2));
  }

  console.log('\n=== BUSCANDO ORGANIZAÇÕES COM GUSTAVO/TESTE ===\n');

  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .or('name.ilike.%gustavo%,name.ilike.%teste%')
    .order('created_at', { ascending: false })
    .limit(5);

  if (orgError) {
    console.error('Erro ao buscar organizações:', orgError);
  } else {
    console.log('Organizações encontradas:', JSON.stringify(orgs, null, 2));
  }

  if (!orgs || orgs.length === 0) {
    console.log('\nNenhuma organização específica encontrada. Verificando se há perfis recentes...');
    if (allProfiles && allProfiles.length > 0) {
      console.log('\nPerfis mais recentes sugerem possível organização criada.');
    }
    return;
  }

  const orgIds = orgs.map(o => o.id);

  console.log('\n=== BUSCANDO PERFIS ===\n');

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('organization_id', orgIds)
    .order('created_at', { ascending: false });

  if (profileError) {
    console.error('Erro ao buscar perfis:', profileError);
  } else {
    console.log('Perfis encontrados:', JSON.stringify(profiles, null, 2));
  }

  console.log('\n=== BUSCANDO TEAM_USERS ===\n');

  const { data: teamUsers, error: teamError } = await supabase
    .from('team_users')
    .select('*')
    .in('organization_id', orgIds)
    .order('created_at', { ascending: false });

  if (teamError) {
    console.error('Erro ao buscar team_users:', teamError);
  } else {
    console.log('Team Users encontrados:', JSON.stringify(teamUsers, null, 2));
  }

  // Buscar owner details
  if (orgs.length > 0 && orgs[0].owner_id) {
    console.log('\n=== DETALHES DO OWNER ===\n');

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(orgs[0].owner_id);

    if (authError) {
      console.error('Erro ao buscar owner (auth):', authError);
    } else {
      console.log('Owner (auth.users):', JSON.stringify(authUser, null, 2));
    }
  }
}

checkGustavoOrg().catch(console.error);
