import { createClient } from '@supabase/supabase-js';

// Credenciais extraídas de src/integrations/supabase/client.ts
const SUPABASE_URL = "https://adzaqkduxnpckbcuqpmg.supabase.co";
// Usando a chave pública (anon)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemFxa2R1eG5wY2tiY3VxcG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMDksImV4cCI6MjA4MTU2NDIwOX0.WO9-vzv_Vuh86TQWgNWuQ45cXa-L4GoGQfpSbvQiVMc";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listUsers() {
  console.log('🔍 Buscando usuários na tabela "profiles"...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar perfis:', error.message);
      
      if (error.code === 'PGRST116') {
        console.log('Dica: A política RLS pode estar impedindo a listagem completa se não houver um usuário logado com permissões de admin.');
      }
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Nenhum perfil encontrado. Isso pode ser devido a:')
      console.log('1. Tabela vazia');
      console.log('2. RLS (Row Level Security) impedindo leitura anônima');
      return;
    }

    console.log(`\n✅ Encontrados ${profiles.length} usuários:\n`);
    
    // Formatar para exibição
    const formattedData = profiles.map(p => ({
      ID: p.id,
      'Nome Completo': p.full_name || '(sem nome)',
      'E-mail': p.email,
      'Cargo (Role)': p.role || '(sem cargo)',
      'Status': p.is_active ? '✅ Ativo' : '❌ Inativo'
    }));

    console.table(formattedData);

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

listUsers();
