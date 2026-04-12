/**
 * Edge Function: facebook-leadgen-webhook
 * Recebe leads de formulários nativos do Facebook (Lead Ads)
 *
 * GET: Verificação do webhook (challenge do Meta)
 * POST: Receber eventos de leadgen e salvar em lead_form_submissions
 *
 * Configuração:
 * 1. Setar LEADGEN_VERIFY_TOKEN no Supabase Secrets
 * 2. No Facebook App Dashboard → Webhooks → Page → leadgen:
 *    Callback URL: https://adzaqkduxnpckbcuqpmg.supabase.co/functions/v1/facebook-leadgen-webhook
 *    Verify Token: (mesmo valor de LEADGEN_VERIFY_TOKEN)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPH_API_VERSION = 'v22.0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const LEADGEN_VERIFY_TOKEN = Deno.env.get('LEADGEN_VERIFY_TOKEN') || '';

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    SUPABASE_URL,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // =========================================
  // GET - Verificação do webhook (challenge)
  // =========================================
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('[Leadgen Webhook] Verification request:', { mode, token: token?.substring(0, 10) + '...' });

    if (mode === 'subscribe' && token && challenge) {
      if (token === LEADGEN_VERIFY_TOKEN) {
        console.log('[Leadgen Webhook] Verification successful');
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      } else {
        console.error('[Leadgen Webhook] Invalid verify token');
        return new Response('Invalid verify token', { status: 403 });
      }
    }

    return new Response('Missing parameters', { status: 400 });
  }

  // =========================================
  // POST - Receber eventos de leadgen
  // =========================================
  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      console.log('[Leadgen Webhook] Received payload:', JSON.stringify(payload).substring(0, 500));

      // Meta Page webhook format:
      // { object: "page", entry: [{ id: page_id, time: ts, changes: [{ field: "leadgen", value: { leadgen_id, page_id, form_id, ... } }] }] }
      if (payload.object !== 'page') {
        console.log('[Leadgen Webhook] Not a page event, ignoring. object:', payload.object);
        return new Response('OK', { status: 200 });
      }

      for (const entry of payload.entry || []) {
        const pageId = entry.id;

        for (const change of entry.changes || []) {
          if (change.field !== 'leadgen') continue;

          const leadgenId = change.value?.leadgen_id;
          if (!leadgenId) {
            console.warn('[Leadgen Webhook] Missing leadgen_id in change value');
            continue;
          }

          console.log(`[Leadgen Webhook] Processing lead ${leadgenId} from page ${pageId}`);

          await processLeadgenEvent(supabaseAdmin, {
            leadgenId,
            pageId,
            formId: change.value?.form_id,
            adId: change.value?.ad_id,
            adgroupId: change.value?.adgroup_id,
            createdTime: change.value?.created_time,
          });
        }
      }

      // Sempre retornar 200 para o Meta (evitar retentativas)
      return new Response('OK', { status: 200, headers: corsHeaders });

    } catch (error: any) {
      console.error('[Leadgen Webhook] Error:', error);
      // Retornar 200 mesmo em erro para evitar retentativas infinitas
      return new Response('OK', { status: 200, headers: corsHeaders });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});

// =========================================
// Processar evento de leadgen
// =========================================
async function processLeadgenEvent(
  supabase: any,
  event: {
    leadgenId: string;
    pageId: string;
    formId?: string;
    adId?: string;
    adgroupId?: string;
    createdTime?: number;
  }
) {
  const { leadgenId, pageId, formId, adId } = event;

  // 1. Buscar page → user_id mapping e token (pages salvas como page_{id} no meta-token-exchange)
  const { data: pageConn } = await supabase
    .from('ad_platform_connections')
    .select('user_id, api_key, parent_account_id')
    .eq('account_id', `page_${pageId}`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!pageConn) {
    console.error(`[Leadgen Webhook] No page connection found for page_id: ${pageId}`);
    return;
  }

  const userId = pageConn.user_id;
  let accessToken = pageConn.api_key;
  const pageBmId = pageConn.parent_account_id;

  // 1b. Verificar se esta página pertence a uma BM com contas de anúncios ativas
  //     Só processamos leads de BMs que o usuário efetivamente sincronizou.
  if (pageBmId) {
    const { data: activeAdAccounts } = await supabase
      .from('ad_platform_connections')
      .select('parent_account_id')
      .eq('user_id', userId)
      .eq('platform', 'meta_ads')
      .eq('is_active', true)
      .neq('account_id', 'meta_oauth')
      .not('account_category', 'in', '("bm","page","waba")');

    const syncedBmIds = new Set(
      (activeAdAccounts || []).map((a: any) => a.parent_account_id).filter(Boolean)
    );

    if (!syncedBmIds.has(pageBmId)) {
      console.log(`[Leadgen Webhook] Ignoring lead from page ${pageId} — BM ${pageBmId} has no active ad accounts`);
      return;
    }
  }

  // 2. Buscar dados completos do lead via Graph API
  let leadData: any = null;
  try {
    const leadResponse = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?access_token=${accessToken}`
    );

    if (!leadResponse.ok) {
      const errorData = await leadResponse.json();
      console.error(`[Leadgen Webhook] Error fetching lead ${leadgenId}:`, errorData);

      // Token expirado: tentar renovar via user token
      if (errorData.error?.code === 190) {
        console.log('[Leadgen Webhook] Page token expired, trying user token...');
        accessToken = await refreshPageToken(supabase, userId, pageId);
        if (accessToken) {
          const retryResponse = await fetch(
            `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}?access_token=${accessToken}`
          );
          if (retryResponse.ok) {
            leadData = await retryResponse.json();
          }
        }
      }

      if (!leadData) return;
    } else {
      leadData = await leadResponse.json();
    }
  } catch (e) {
    console.error(`[Leadgen Webhook] Network error fetching lead ${leadgenId}:`, e);
    return;
  }

  console.log(`[Leadgen Webhook] Lead data for ${leadgenId}:`, JSON.stringify(leadData).substring(0, 500));

  // 3. Extrair dados do formulário
  const fieldData = leadData.field_data || [];
  const extractedFields: Record<string, string> = {};
  for (const field of fieldData) {
    extractedFields[field.name] = Array.isArray(field.values) ? field.values[0] : field.values;
  }

  const email = extractedFields.email || null;
  const fullName = extractedFields.full_name || extractedFields.nome_completo || extractedFields.name || null;
  const phoneNumber = extractedFields.phone_number || extractedFields.telefone || extractedFields.phone || null;

  // 4. Buscar info da campanha/ad (se disponível)
  let campaignName: string | null = null;
  let adName: string | null = null;
  let campaignId: string | null = null;
  let adsetId: string | null = null;
  let adsetName: string | null = null;

  if (adId) {
    try {
      const adResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${adId}?fields=name,campaign_id,campaign{name},adset_id,adset{name}&access_token=${accessToken}`
      );
      if (adResponse.ok) {
        const adData = await adResponse.json();
        adName = adData.name || null;
        campaignId = adData.campaign_id || null;
        campaignName = adData.campaign?.name || null;
        adsetId = adData.adset_id || null;
        adsetName = adData.adset?.name || null;
      }
    } catch (e) {
      console.warn(`[Leadgen Webhook] Could not fetch ad info for ${adId}:`, e);
    }
  }

  // 5. Buscar form name
  let formName: string | null = null;
  const resolvedFormId = formId || leadData.form_id;
  if (resolvedFormId) {
    try {
      const formResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${resolvedFormId}?fields=name&access_token=${accessToken}`
      );
      if (formResponse.ok) {
        const formData = await formResponse.json();
        formName = formData.name || null;
      }
    } catch (e) {
      console.warn(`[Leadgen Webhook] Could not fetch form name:`, e);
    }
  }

  // 6. Inserir na tabela lead_form_submissions
  const { data: submission, error: insertError } = await supabase
    .from('lead_form_submissions')
    .upsert({
      user_id: userId,
      leadgen_id: leadgenId,
      form_id: resolvedFormId || 'unknown',
      form_name: formName,
      page_id: pageId,
      ad_id: adId || null,
      ad_name: adName,
      campaign_id: campaignId,
      campaign_name: campaignName,
      adset_id: adsetId,
      adset_name: adsetName,
      field_data: fieldData,
      email,
      full_name: fullName,
      phone_number: phoneNumber,
      is_processed: false,
    }, { onConflict: 'leadgen_id' })
    .select('id')
    .single();

  if (insertError) {
    console.error('[Leadgen Webhook] Error inserting lead submission:', insertError);
    return;
  }

  console.log(`[Leadgen Webhook] Lead saved: ${submission.id}`);

  // 7. Auto-criar contato e deal no CRM
  await autoCreateLeadContact(supabase, userId, submission.id, {
    fullName,
    email,
    phoneNumber,
    campaignName,
    formName,
  });
}

// =========================================
// Renovar page access token via user token
// =========================================
async function refreshPageToken(
  supabase: any,
  userId: string,
  pageId: string
): Promise<string | null> {
  try {
    const { data: oauthConn } = await supabase
      .from('ad_platform_connections')
      .select('api_key')
      .eq('user_id', userId)
      .eq('account_id', 'meta_oauth')
      .eq('is_active', true)
      .maybeSingle();

    if (!oauthConn?.api_key) return null;

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

    console.log(`[Leadgen Webhook] Refreshed page token for page ${pageId}`);
    return matchingPage.access_token;
  } catch (e) {
    console.error('[Leadgen Webhook] Error refreshing page token:', e);
    return null;
  }
}

// =========================================
// Auto-criar contato e deal no CRM
// =========================================
async function autoCreateLeadContact(
  supabase: any,
  userId: string,
  submissionId: string,
  data: {
    fullName: string | null;
    email: string | null;
    phoneNumber: string | null;
    campaignName: string | null;
    formName: string | null;
  }
) {
  let { fullName, email, phoneNumber, campaignName, formName } = data;

  // Normalizar telefone: apenas dígitos
  if (phoneNumber) {
    phoneNumber = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.slice(1);
  }

  // Buscar contato existente (dedup robusto: email → phone → nome)
  let contactId: string | null = null;

  if (email) {
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    if (existing) contactId = existing.id;
  }

  if (!contactId && phoneNumber) {
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .or(`phone.eq.${phoneNumber},phone.eq.+${phoneNumber}`)
      .limit(1)
      .maybeSingle();
    if (existing) contactId = existing.id;
  }

  // Busca por nome completo (só se tem 2+ palavras para evitar falso positivo)
  if (!contactId && fullName && fullName.trim().split(/\s+/).length >= 2) {
    const { data: existing } = await supabase
      .from('crm_contacts')
      .select('id')
      .eq('user_id', userId)
      .ilike('full_name', fullName.trim())
      .limit(1)
      .maybeSingle();
    if (existing) contactId = existing.id;
  }

  // Se não encontrou, criar novo contato
  if (!contactId) {
    const contactName = fullName || email || phoneNumber || 'Lead Facebook';

    const { data: newContact, error: contactError } = await supabase
      .from('crm_contacts')
      .insert({
        user_id: userId,
        full_name: contactName,
        email: email,
        phone: phoneNumber,
        tags: ['facebook_lead', 'lead_form'],
        lead_score: 30,
      })
      .select('id')
      .single();

    if (contactError) {
      console.error('[Leadgen Webhook] Error creating contact:', contactError);
    } else {
      contactId = newContact.id;
      console.log(`[Leadgen Webhook] Created contact: ${contactId}`);
    }
  } else {
    console.log(`[Leadgen Webhook] Found existing contact: ${contactId}`);
  }

  // Criar deal APENAS se não existe um deal ativo para este contato
  let dealId: string | null = null;
  if (contactId) {
    // Verificar deal existente
    const { data: existingDeal } = await supabase
      .from('crm_deals')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .in('stage', ['lead_novo', 'agendado', 'em_tratamento'])
      .limit(1)
      .maybeSingle();

    if (existingDeal) {
      dealId = existingDeal.id;
      console.log(`[Leadgen Webhook] Reusing existing deal: ${dealId}`);
    } else {
      const dealTitle = formName
        ? `Lead Form: ${formName}`
        : campaignName
        ? `Lead Ads: ${campaignName}`
        : `Lead Facebook: ${fullName || 'Novo'}`;

      const { data: newDeal, error: dealError } = await supabase
        .from('crm_deals')
        .insert({
          user_id: userId,
          contact_id: contactId,
          title: dealTitle,
          stage: 'lead_novo',
          value: 0,
          description: `Lead capturado via formulário Facebook${formName ? ` (${formName})` : ''}${campaignName ? ` - Campanha: ${campaignName}` : ''}`,
        })
        .select('id')
        .single();

      if (dealError) {
        console.error('[Leadgen Webhook] Error creating deal:', dealError);
      } else {
        dealId = newDeal.id;
        console.log(`[Leadgen Webhook] Created deal: ${dealId}`);
      }
    }
  }

  // Atualizar submission com vínculo CRM
  if (contactId || dealId) {
    await supabase
      .from('lead_form_submissions')
      .update({
        crm_contact_id: contactId,
        crm_deal_id: dealId,
        is_processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    console.log(`[Leadgen Webhook] Submission ${submissionId} linked to CRM (contact: ${contactId}, deal: ${dealId})`);
  }

  // Notificar usuário sobre novo lead
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'new_lead_form',
      title: 'Novo Lead via Formulário',
      message: `${fullName || 'Novo lead'} preencheu o formulário${formName ? ` "${formName}"` : ''}${campaignName ? ` (Campanha: ${campaignName})` : ''}`,
      read: false,
      metadata: { submission_id: submissionId, contact_id: contactId, deal_id: dealId },
    });
    console.log(`[Leadgen Webhook] Notification created for user ${userId}`);
  } catch (e) {
    console.warn('[Leadgen Webhook] Could not create notification:', e);
  }
}
