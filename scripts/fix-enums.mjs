/**
 * Corrige ENUMs no destino para aceitar valores do fonte
 */

const PROJECT_REF = 'puylqvsnooquefkingki';
const ACCESS_TOKEN = 'sbp_1769812f5c9bb9e2766386f188bcd42759ab85ae';

async function runSQL(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return await response.json();
}

const FIX_SQL = `
-- Adicionar valores faltantes ao ENUM crm_pipeline_stage
ALTER TYPE public.crm_pipeline_stage ADD VALUE IF NOT EXISTS 'finalizado';

-- Remover tipo antigo e criar novo com valores corretos para transaction_type
-- Primeiro, precisamos alterar as colunas para TEXT temporariamente

-- Alterar colunas para TEXT
ALTER TABLE public.financial_categories ALTER COLUMN type TYPE TEXT;
ALTER TABLE public.financial_transactions ALTER COLUMN type TYPE TEXT;

-- Dropar o tipo antigo
DROP TYPE IF EXISTS public.transaction_type CASCADE;

-- Criar novo tipo com todos os valores (português e inglês)
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'entrada', 'saida');

-- Reconverter colunas para o ENUM
ALTER TABLE public.financial_categories
  ALTER COLUMN type TYPE public.transaction_type
  USING type::public.transaction_type;

ALTER TABLE public.financial_transactions
  ALTER COLUMN type TYPE public.transaction_type
  USING type::public.transaction_type;

SELECT 'ENUMs corrigidos com sucesso!' as result;
`;

async function main() {
  console.log('🔧 Corrigindo ENUMs no destino...\n');

  try {
    const result = await runSQL(FIX_SQL);
    console.log('✅ ENUMs corrigidos!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

main();
