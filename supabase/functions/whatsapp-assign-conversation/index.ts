/**
 * Edge Function: whatsapp-assign-conversation
 * Atribui ou transfere uma conversa WhatsApp para uma secretária
 *
 * @endpoint POST /functions/v1/whatsapp-assign-conversation
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-requested-with',
};

interface AssignRequest {
    conversation_id: string;
    secretary_id: string;
    notes?: string;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://adzaqkduxnpckbcuqpmg.supabase.co';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Cliente autenticado (para verificar permissões)
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // Cliente admin (para operações privilegiadas)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Verificar autenticação
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            console.error('[Assign] Auth error:', authError);
            throw new Error('Not authenticated');
        }

        const body: AssignRequest = await req.json();
        const { conversation_id, secretary_id, notes } = body;

        if (!conversation_id || !secretary_id) {
            throw new Error('conversation_id and secretary_id are required');
        }

        console.log('[Assign] Request:', { conversation_id, secretary_id, by: user.id });

        // Buscar conversa
        const { data: conversation, error: convError } = await supabaseAdmin
            .from('whatsapp_conversations')
            .select('user_id, assigned_to')
            .eq('id', conversation_id)
            .single();

        if (convError || !conversation) {
            console.error('[Assign] Conversation not found:', convError);
            throw new Error('Conversation not found');
        }

        // Verificar permissão: deve ser o dono, admin, ou secretária vinculada
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isOwner = conversation.user_id === user.id;
        const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';

        // Verificar se é secretária vinculada ao dono da conversa
        const { data: link } = await supabaseAdmin
            .from('secretary_doctor_links')
            .select('id')
            .eq('secretary_id', user.id)
            .eq('doctor_id', conversation.user_id)
            .single();

        const isLinkedSecretary = !!link;

        if (!isOwner && !isAdmin && !isLinkedSecretary) {
            console.error('[Assign] Permission denied for user:', user.id);
            throw new Error('Permission denied');
        }

        // Verificar se secretary_id é uma secretária válida vinculada ao dono
        const { data: targetLink } = await supabaseAdmin
            .from('secretary_doctor_links')
            .select('id')
            .eq('secretary_id', secretary_id)
            .eq('doctor_id', conversation.user_id)
            .single();

        if (!targetLink) {
            // Permitir atribuir ao próprio dono da conversa
            if (secretary_id !== conversation.user_id) {
                console.error('[Assign] Target secretary not linked:', secretary_id);
                throw new Error('Target secretary is not linked to conversation owner');
            }
        }

        // Determinar tipo de atribuição
        const assignmentType = conversation.assigned_to ? 'transfer' : 'manual';

        // Executar atribuição via função SQL
        const { data: result, error: assignError } = await supabaseAdmin.rpc(
            'assign_conversation_to_secretary',
            {
                p_conversation_id: conversation_id,
                p_secretary_id: secretary_id,
                p_assigned_by: user.id,
                p_assignment_type: assignmentType,
                p_notes: notes || null,
            }
        );

        if (assignError) {
            console.error('[Assign] Error:', assignError);
            throw assignError;
        }

        console.log('[Assign] Success:', { conversation_id, secretary_id, type: assignmentType });

        // TODO: Enviar notificação para secretária (push notification, realtime, etc)

        return new Response(
            JSON.stringify({
                success: true,
                message: assignmentType === 'transfer'
                    ? 'Conversa transferida com sucesso'
                    : 'Conversa atribuída com sucesso',
                assignment_type: assignmentType,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error: any) {
        console.error('[Assign] Error:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
