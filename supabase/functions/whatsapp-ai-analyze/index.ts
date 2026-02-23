/**
 * Edge Function: whatsapp-ai-analyze
 * DEPRECATED — Substituída por whatsapp-ai-agent
 * Esta função agora é um NO-OP que apenas loga e retorna.
 * Mantida para evitar erros 404 caso algum trigger/webhook antigo ainda a chame.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[whatsapp-ai-analyze] DEPRECATED — This function is a no-op. Use whatsapp-ai-agent instead.');

  return new Response(
    JSON.stringify({ status: 'deprecated', message: 'Use whatsapp-ai-agent instead' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
