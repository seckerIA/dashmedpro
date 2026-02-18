/**
 * Edge Function: sync-lead-forms
 * Descobre formulários de Lead Ads (Instant Forms) de páginas Facebook conectadas.
 *
 * Recebe: { page_ids?: string[] }
 *   - Se page_ids fornecido: sincroniza apenas essas páginas
 *   - Se vazio: sincroniza todas as páginas ativas do usuário
 *
 * Graph API: GET /{page_id}/leadgen_forms?fields=id,name,status,leads_count,questions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPH_API_VERSION = 'v22.0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Auth: extrair user do JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedPageIds: string[] | undefined = body.page_ids;

    // 1. Buscar páginas conectadas do usuário
    const { data: pageConnections, error: connError } = await supabaseAdmin
      .from('ad_platform_connections')
      .select('account_id, account_name, api_key')
      .eq('user_id', user.id)
      .eq('platform', 'meta_ads')
      .eq('account_category', 'page')
      .eq('is_active', true);

    if (connError) {
      console.error('[sync-lead-forms] Error fetching page connections:', connError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar páginas conectadas' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pageConnections || pageConnections.length === 0) {
      return new Response(
        JSON.stringify({ success: true, forms: [], message: 'Nenhuma página conectada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrar se page_ids específicos foram solicitados
    let pages = pageConnections;
    if (requestedPageIds && requestedPageIds.length > 0) {
      const requestedSet = new Set(requestedPageIds);
      pages = pageConnections.filter(p => {
        const rawId = p.account_id.replace('page_', '');
        return requestedSet.has(rawId) || requestedSet.has(p.account_id);
      });
    }

    console.log(`[sync-lead-forms] Syncing forms for ${pages.length} pages`);

    const allForms: any[] = [];
    const errors: string[] = [];

    // 2. Para cada página, buscar formulários via Graph API
    for (const page of pages) {
      const pageId = page.account_id.replace('page_', '');
      const accessToken = page.api_key;

      if (!accessToken) {
        errors.push(`Página ${page.account_name || pageId}: sem token de acesso`);
        continue;
      }

      try {
        const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/leadgen_forms?fields=id,name,status,leads_count,questions&access_token=${accessToken}`;
        console.log(`[sync-lead-forms] Fetching forms for page ${pageId} (${page.account_name})`);

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          console.error(`[sync-lead-forms] Graph API error for page ${pageId}:`, data.error);
          errors.push(`Página ${page.account_name || pageId}: ${data.error.message}`);

          // Se token expirou, tentar com token do usuário (meta_oauth)
          if (data.error.code === 190) {
            const retryForms = await retryWithUserToken(supabaseAdmin, user.id, pageId, page.account_name);
            if (retryForms) {
              for (const form of retryForms) {
                allForms.push({ ...form, pageId, pageName: page.account_name });
              }
              // Limpar o erro se retry funcionou
              errors.pop();
            }
          }
          continue;
        }

        const forms = data.data || [];
        console.log(`[sync-lead-forms] Found ${forms.length} forms for page ${pageId}`);

        for (const form of forms) {
          allForms.push({
            meta_form_id: form.id,
            form_name: form.name || 'Formulário sem nome',
            status: (form.status || 'ACTIVE').toLowerCase(),
            leads_count: form.leads_count || 0,
            questions: form.questions || [],
            pageId,
            pageName: page.account_name,
          });
        }
      } catch (fetchError: any) {
        console.error(`[sync-lead-forms] Network error for page ${pageId}:`, fetchError);
        errors.push(`Página ${page.account_name || pageId}: erro de rede`);
      }
    }

    // 3. Upsert formulários no banco
    let upsertedCount = 0;
    for (const form of allForms) {
      const { error: upsertError } = await supabaseAdmin
        .from('meta_lead_forms')
        .upsert({
          user_id: user.id,
          meta_form_id: form.meta_form_id,
          form_name: form.form_name,
          page_id: form.pageId,
          page_name: form.pageName,
          status: form.status,
          leads_count: form.leads_count,
          questions: form.questions,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'user_id,meta_form_id' });

      if (upsertError) {
        console.error(`[sync-lead-forms] Upsert error for form ${form.meta_form_id}:`, upsertError);
        errors.push(`Formulário ${form.form_name}: ${upsertError.message}`);
      } else {
        upsertedCount++;
      }
    }

    console.log(`[sync-lead-forms] Done: ${upsertedCount} forms synced, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        forms_found: allForms.length,
        forms_synced: upsertedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[sync-lead-forms] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Retry com token do usuário quando page token expirou
 */
async function retryWithUserToken(
  supabase: any,
  userId: string,
  pageId: string,
  pageName: string | null
): Promise<any[] | null> {
  try {
    const { data: oauthConn } = await supabase
      .from('ad_platform_connections')
      .select('api_key')
      .eq('user_id', userId)
      .eq('account_id', 'meta_oauth')
      .eq('is_active', true)
      .maybeSingle();

    if (!oauthConn?.api_key) return null;

    // Buscar page token atualizado via user token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?fields=id,access_token&access_token=${oauthConn.api_key}`
    );
    if (!pagesResponse.ok) return null;

    const pagesData = await pagesResponse.json();
    const matchingPage = (pagesData.data || []).find((p: any) => p.id === pageId);
    if (!matchingPage?.access_token) return null;

    // Atualizar token armazenado
    await supabase
      .from('ad_platform_connections')
      .update({ api_key: matchingPage.access_token })
      .eq('account_id', `page_${pageId}`)
      .eq('user_id', userId);

    // Retry com novo token
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/leadgen_forms?fields=id,name,status,leads_count,questions&access_token=${matchingPage.access_token}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) return null;

    return (data.data || []).map((form: any) => ({
      meta_form_id: form.id,
      form_name: form.name || 'Formulário sem nome',
      status: (form.status || 'ACTIVE').toLowerCase(),
      leads_count: form.leads_count || 0,
      questions: form.questions || [],
    }));

  } catch (e) {
    console.error(`[sync-lead-forms] Retry error for page ${pageId}:`, e);
    return null;
  }
}
