/**
 * Edge Function: sync-lead-forms
 * Descobre formulários de Lead Ads (Instant Forms) de páginas Facebook conectadas
 * E sincroniza os leads históricos de cada formulário.
 *
 * Recebe: { page_ids?: string[], sync_leads?: boolean }
 *   - Se page_ids fornecido: sincroniza apenas essas páginas
 *   - Se vazio: sincroniza todas as páginas ativas do usuário
 *   - sync_leads: default true — também busca leads de cada formulário
 *
 * Graph API:
 *   GET /{page_id}/leadgen_forms?fields=id,name,status,leads_count,questions
 *   GET /{form_id}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name
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
    const syncLeads: boolean = body.sync_leads !== false; // default true

    // 1. Determinar quais BMs têm pelo menos 1 ad account ativo (is_active = true)
    //    Isso evita buscar formulários de BMs que o usuário não selecionou para sync.
    const { data: activeAdAccounts, error: adAccError } = await supabaseAdmin
      .from('ad_platform_connections')
      .select('parent_account_id, account_id')
      .eq('user_id', user.id)
      .eq('platform', 'meta_ads')
      .eq('account_category', 'other')
      .eq('is_active', true);

    if (adAccError) {
      console.error('[sync-lead-forms] Error fetching active ad accounts:', adAccError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar contas de anúncios ativas' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar os IDs das BMs com ad accounts ativos (ou account_id se órfão)
    const activeBmIds = new Set<string>();
    for (const acc of (activeAdAccounts || [])) {
      if (acc.parent_account_id) {
        activeBmIds.add(acc.parent_account_id);
      }
    }

    console.log(`[sync-lead-forms] Active BM IDs: ${[...activeBmIds].join(', ')}`);

    // 2. Buscar TODAS as páginas do usuário (is_active = true)
    const { data: pageConnections, error: connError } = await supabaseAdmin
      .from('ad_platform_connections')
      .select('account_id, account_name, api_key, parent_account_id')
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

    // 3. Filtrar páginas: manter apenas as que pertencem a BMs com ad accounts ativos
    //    Páginas órfãs (sem parent_account_id) passam se não houver nenhuma BM ativa (fallback).
    let filteredByBm = pageConnections.filter(p => {
      if (!p.parent_account_id) {
        // Página órfã: inclui apenas se NÃO existe nenhuma BM ativa (compatibilidade)
        return activeBmIds.size === 0;
      }
      return activeBmIds.has(p.parent_account_id);
    });

    // Se nenhuma BM ativa filtrou páginas, fallback para todas (evita tela em branco)
    if (filteredByBm.length === 0 && pageConnections.length > 0) {
      console.warn('[sync-lead-forms] No pages matched active BMs — falling back to all pages');
      filteredByBm = pageConnections;
    }

    console.log(`[sync-lead-forms] Pages after BM filter: ${filteredByBm.length} of ${pageConnections.length}`);

    // 4. Filtrar se page_ids específicos foram solicitados
    let pages = filteredByBm;
    if (requestedPageIds && requestedPageIds.length > 0) {
      const requestedSet = new Set(requestedPageIds);
      pages = filteredByBm.filter(p => {
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
            accessToken, // needed for fetching leads
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

    // 4. Sincronizar leads de cada formulário
    let totalLeadsSynced = 0;
    if (syncLeads && allForms.length > 0) {
      console.log(`[sync-lead-forms] Syncing leads for ${allForms.length} forms...`);

      for (const form of allForms) {
        try {
          const leadsSynced = await syncFormLeads(
            supabaseAdmin,
            user.id,
            form.meta_form_id,
            form.form_name,
            form.pageId,
            form.accessToken
          );
          totalLeadsSynced += leadsSynced;
        } catch (e: any) {
          console.error(`[sync-lead-forms] Error syncing leads for form ${form.meta_form_id}:`, e);
          errors.push(`Leads de ${form.form_name}: ${e.message}`);
        }
      }

      console.log(`[sync-lead-forms] Total leads synced: ${totalLeadsSynced}`);
    }

    console.log(`[sync-lead-forms] Done: ${upsertedCount} forms synced, ${totalLeadsSynced} leads synced, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        forms_found: allForms.length,
        forms_synced: upsertedCount,
        leads_synced: totalLeadsSynced,
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

/**
 * Sincroniza leads de um formulário específico via Graph API
 * GET /{form_id}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name
 * Paginação automática (até 500 leads por formulário)
 */
async function syncFormLeads(
  supabase: any,
  userId: string,
  formId: string,
  formName: string,
  pageId: string,
  accessToken: string
): Promise<number> {
  const MAX_LEADS = 500;
  const PER_PAGE = 100;
  let totalSynced = 0;
  let nextUrl: string | null = `https://graph.facebook.com/${GRAPH_API_VERSION}/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name&limit=${PER_PAGE}&access_token=${accessToken}`;

  while (nextUrl && totalSynced < MAX_LEADS) {
    const response = await fetch(nextUrl);
    const data = await response.json();

    if (data.error) {
      console.error(`[sync-lead-forms] Error fetching leads for form ${formId}:`, data.error);
      break;
    }

    const leads = data.data || [];
    if (leads.length === 0) break;

    console.log(`[sync-lead-forms] Fetched ${leads.length} leads for form ${formId} (${formName})`);

    // Obter IDs dos leads recebidos nesta página para verificar existência
    const leadIds = leads.map((l: any) => l.id);
    const { data: existingLeads } = await supabase
      .from('lead_form_submissions')
      .select('leadgen_id')
      .in('leadgen_id', leadIds);
    
    const existingSet = new Set(existingLeads?.map((e: any) => e.leadgen_id) || []);

    // Processar apenas novos leads
    for (const lead of leads) {
      if (existingSet.has(lead.id)) {
        continue;
      }

      const fieldData = lead.field_data || [];
      const extractedFields: Record<string, string> = {};
      for (const field of fieldData) {
        extractedFields[field.name] = Array.isArray(field.values) ? field.values[0] : field.values;
      }

      const email = extractedFields.email || null;
      const fullName = extractedFields.full_name || extractedFields.nome_completo || extractedFields.name || null;
      const phoneNumber = extractedFields.phone_number || extractedFields.telefone || extractedFields.phone || null;

      let contactId = null;
      let dealId = null;

      // Se temos pelo menos algum dado útil (nome, tel ou email), cadastramos no CRM
      if (fullName || phoneNumber || email) {
        // Tentar buscar contato existente na base do usuário
        let contact = null;

        if (phoneNumber) {
           const { data: byPhone } = await supabase
             .from('crm_contacts')
             .select('id')
             .eq('user_id', userId)
             .eq('phone', phoneNumber)
             .maybeSingle();
           contact = byPhone;
        }

        if (!contact && email) {
           const { data: byEmail } = await supabase
             .from('crm_contacts')
             .select('id')
             .eq('user_id', userId)
             .eq('email', email)
             .maybeSingle();
           contact = byEmail;
        }

        if (contact) {
           contactId = contact.id;
        } else {
           // Criar novo contato
           const { data: newContact, error: contactError } = await supabase
             .from('crm_contacts')
             .insert({
                user_id: userId,
                full_name: fullName || 'Lead Meta Ads',
                phone: phoneNumber,
                email: email,
                tags: ['meta_ads']
             })
             .select('id')
             .single();
           
           if (!contactError && newContact) {
              contactId = newContact.id;
           } else {
              console.error(`[sync-lead-forms] Error creating contact for lead ${lead.id}:`, contactError);
           }
        }

        // Criar Negócio/Deal
        if (contactId) {
          const { data: newDeal, error: dealError } = await supabase
             .from('crm_deals')
             .insert({
                user_id: userId,
                contact_id: contactId,
                title: `Lead: FB Form - ${formName}`,
                stage: 'lead_novo', // Estágio inicial
                value: 0
             })
             .select('id')
             .single();
             
          if (!dealError && newDeal) {
             dealId = newDeal.id;
          } else {
             console.error(`[sync-lead-forms] Error creating deal for lead ${lead.id}:`, dealError);
          }
        }
      }

      const { error: upsertError } = await supabase
        .from('lead_form_submissions')
        .upsert({
          user_id: userId,
          leadgen_id: lead.id,
          form_id: formId,
          form_name: formName,
          page_id: pageId,
          ad_id: lead.ad_id || null,
          ad_name: lead.ad_name || null,
          campaign_id: lead.campaign_id || null,
          campaign_name: lead.campaign_name || null,
          field_data: fieldData,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          is_processed: true, // Já processado (inserido no CRM)
          processed_at: new Date().toISOString(),
          crm_contact_id: contactId,
          crm_deal_id: dealId,
          created_at: lead.created_time || new Date().toISOString(),
        }, { onConflict: 'leadgen_id' });

      if (upsertError) {
        console.error(`[sync-lead-forms] Upsert lead error (${lead.id}):`, upsertError);
      } else {
        totalSynced++;
      }
    }

    // Próxima página da Graph API
    nextUrl = data.paging?.next || null;
  }

  console.log(`[sync-lead-forms] Synced ${totalSynced} leads for form ${formId}`);
  return totalSynced;
}
