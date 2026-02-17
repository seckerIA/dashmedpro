/**
 * Edge Function: whatsapp-manage-templates
 * Gerencia templates de mensagens WhatsApp via Meta Graph API
 * Actions: sync, create, delete
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: { body_text?: string[][] };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const body = await req.json();
    const { action } = body;

    // Buscar config do WhatsApp
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('waba_id, business_account_id, access_token, phone_number_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!config || !config.access_token) {
      throw new Error('WhatsApp não configurado. Configure primeiro na aba Conexão.');
    }

    // WABA ID pode estar em waba_id ou business_account_id
    const wabaId = config.waba_id || config.business_account_id;
    if (!wabaId) {
      throw new Error('WABA ID não encontrado. Reconecte via Facebook OAuth.');
    }

    const token = config.access_token;

    // =========================================
    // ACTION: sync — Sincronizar templates da Meta
    // =========================================
    if (action === 'sync') {
      console.log(`[manage-templates] Syncing templates for WABA ${wabaId}`);

      const response = await fetch(
        `${GRAPH_API_BASE}/${wabaId}/message_templates?fields=id,name,language,status,category,components&limit=100`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[manage-templates] Meta API error:', errorData.error);
        throw new Error(errorData.error?.message || 'Failed to fetch templates from Meta');
      }

      const data = await response.json();
      const metaTemplates = data.data || [];

      console.log(`[manage-templates] Found ${metaTemplates.length} templates on Meta`);

      // Upsert cada template no banco
      let synced = 0;
      let errors = 0;

      for (const mt of metaTemplates) {
        // Mapear status da Meta para nosso enum
        let status = 'pending';
        if (mt.status === 'APPROVED') status = 'approved';
        else if (mt.status === 'REJECTED' || mt.status === 'DISABLED') status = 'rejected';

        // Mapear category
        let category = 'UTILITY';
        if (mt.category === 'MARKETING') category = 'MARKETING';
        else if (mt.category === 'AUTHENTICATION') category = 'AUTHENTICATION';

        const { error } = await supabaseAdmin
          .from('whatsapp_templates')
          .upsert(
            {
              user_id: user.id,
              template_id: mt.id,
              name: mt.name,
              language: mt.language || 'pt_BR',
              status,
              category,
              components: mt.components || [],
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,template_id' }
          );

        if (error) {
          console.error(`[manage-templates] Error upserting template ${mt.name}:`, error);
          errors++;
        } else {
          synced++;
        }
      }

      // Remover templates locais que não existem mais na Meta
      const metaTemplateIds = new Set(metaTemplates.map((mt: any) => String(mt.id)));
      const { data: localTemplates } = await supabaseAdmin
        .from('whatsapp_templates')
        .select('id, template_id')
        .eq('user_id', user.id);

      let removed = 0;
      if (localTemplates) {
        for (const lt of localTemplates) {
          if (!metaTemplateIds.has(lt.template_id)) {
            await supabaseAdmin
              .from('whatsapp_templates')
              .delete()
              .eq('id', lt.id);
            removed++;
            console.log(`[manage-templates] Removed orphan template ${lt.template_id}`);
          }
        }
      }

      // Atualizar last_synced_at na config
      await supabaseAdmin
        .from('whatsapp_config')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({
          success: true,
          synced,
          removed,
          errors,
          total: metaTemplates.length,
          message: `${synced} templates sincronizados, ${removed} removidos.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================
    // ACTION: create — Criar template na Meta
    // =========================================
    if (action === 'create') {
      const { name, language, category, components } = body;

      if (!name || !category || !components) {
        throw new Error('name, category e components são obrigatórios');
      }

      console.log(`[manage-templates] Creating template "${name}" on WABA ${wabaId}`);

      // Construir payload para a Meta API
      const metaPayload: Record<string, unknown> = {
        name: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        language: language || 'pt_BR',
        category: category.toUpperCase(),
        components: components.map((comp: TemplateComponent) => {
          const mapped: Record<string, unknown> = { type: comp.type };
          if (comp.format) mapped.format = comp.format;
          if (comp.text) mapped.text = comp.text;
          if (comp.buttons) mapped.buttons = comp.buttons;
          if (comp.example) mapped.example = comp.example;
          return mapped;
        }),
      };

      const response = await fetch(
        `${GRAPH_API_BASE}/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error('[manage-templates] Create error:', data.error);
        throw new Error(data.error?.message || 'Failed to create template on Meta');
      }

      console.log(`[manage-templates] Template created on Meta:`, JSON.stringify(data));

      // Salvar no banco local (upsert para evitar conflito se template já existe)
      const sanitizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const templateId = String(data.id); // Garantir que é string

      const { data: savedTemplate, error: dbError } = await supabaseAdmin
        .from('whatsapp_templates')
        .upsert(
          {
            user_id: user.id,
            template_id: templateId,
            name: sanitizedName,
            language: language || 'pt_BR',
            category: category.toUpperCase(),
            status: 'pending', // Sempre começa como pending até Meta aprovar
            components,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,template_id' }
        )
        .select()
        .single();

      if (dbError) {
        console.error('[manage-templates] DB save error:', JSON.stringify(dbError));
        // Template foi criado na Meta mas falhou no DB — retorna sucesso parcial
        return new Response(
          JSON.stringify({
            success: true,
            warning: `Template criado na Meta (ID: ${templateId}) mas erro ao salvar localmente: ${dbError.message}. Clique em Sincronizar.`,
            meta_template_id: templateId,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          template: savedTemplate,
          meta_template_id: templateId,
          message: 'Template criado e enviado para aprovação da Meta.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================
    // ACTION: delete — Deletar template na Meta
    // =========================================
    if (action === 'delete') {
      const { template_name, template_id } = body;

      if (!template_name) {
        throw new Error('template_name é obrigatório');
      }

      console.log(`[manage-templates] Deleting template "${template_name}" from WABA ${wabaId}`);

      const response = await fetch(
        `${GRAPH_API_BASE}/${wabaId}/message_templates?name=${encodeURIComponent(template_name)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        // Se o template já não existe na Meta, não é erro — só limpar local
        console.warn('[manage-templates] Meta delete warning (proceeding with local cleanup):', JSON.stringify(data.error));
      }

      // Remover do banco local (sempre, mesmo se Meta retornou erro)
      if (template_id) {
        await supabaseAdmin
          .from('whatsapp_templates')
          .delete()
          .eq('id', template_id)
          .eq('user_id', user.id);
      } else {
        await supabaseAdmin
          .from('whatsapp_templates')
          .delete()
          .eq('name', template_name)
          .eq('user_id', user.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Template deletado.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}. Use: sync, create, delete`);

  } catch (error: any) {
    console.error('[manage-templates] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
