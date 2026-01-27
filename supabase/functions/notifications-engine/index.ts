
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const notifications = []
        const now = new Date()

        // 1. VERIFICAÇÃO CLÍNICA: Paciente Esquecido (Appointment Forgotten)
        // Buscando consultas agendadas que passaram há mais de 4 horas
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

        const { data: forgottenAppointments, error: apptError } = await supabaseClient
            .from('medical_appointments')
            .select('id, title, start_time, doctor_id, user_id, organization_id, contact:contact_id(full_name)')
            .in('status', ['scheduled', 'confirmed', 'in_progress'])
            .lt('start_time', fourHoursAgo)
            .gt('start_time', twentyFourHoursAgo)

        if (apptError) throw apptError

        if (forgottenAppointments && forgottenAppointments.length > 0) {
            console.log(`Found ${forgottenAppointments.length} forgotten appointments`)

            for (const appt of forgottenAppointments) {
                // Verificar se já notificou
                const { count } = await supabaseClient
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .contains('metadata', { appointment_id: appt.id, type: 'appointment_forgotten' })

                if (count === 0) {
                    const targetUser = appt.doctor_id || appt.user_id
                    const patientName = appt.contact?.full_name || 'Paciente'

                    notifications.push({
                        user_id: targetUser,
                        organization_id: appt.organization_id,
                        type: 'appointment_forgotten', // Tipo mapeado no frontend
                        title: 'Paciente Esquecido?',
                        message: `A consulta de ${patientName} (${new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}) ainda está aberta. Finalize o prontuário.`,
                        read: false,
                        metadata: { appointment_id: appt.id, type: 'appointment_forgotten' },
                        created_at: new Date().toISOString()
                    })
                }
            }
        }

        // 2. VERIFICAÇÃO COMERCIAL: Lead Estagnado
        // Leads em aberto sem atualização há 3 dias
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

        const { data: stagnantDeals, error: dealsError } = await supabaseClient
            .from('crm_deals')
            .select('id, title, user_id, organization_id, updated_at, contact:contact_id(full_name)')
            .not('stage', 'in', '("fechado_ganho","fechado_perdido","completed","lost","won")') // Ajustar conforme seus stages reais
            .lt('updated_at', threeDaysAgo)
            .limit(50) // Limite para não estourar memória na primeira execução

        if (!dealsError && stagnantDeals && stagnantDeals.length > 0) {
            console.log(`Found ${stagnantDeals.length} stagnant deals`)

            for (const deal of stagnantDeals) {
                // Verificar se já notificou RECENTEMENTE (nos últimos 3 dias para não floodar)
                // Aqui verificamos se existe ALGUMA notificação desse tipo para esse deal, se sim, pulamos por enquanto para simplificar
                const { count } = await supabaseClient
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .contains('metadata', { deal_id: deal.id, type: 'lead_stagnant' })

                if (count === 0) {
                    notifications.push({
                        user_id: deal.user_id,
                        organization_id: deal.organization_id,
                        type: 'lead_stagnant',
                        title: 'Lead Esfriando ❄️',
                        message: `O lead ${deal.contact?.full_name || deal.title} não tem interação há 3 dias. Mande uma mensagem!`,
                        read: false,
                        metadata: { deal_id: deal.id, type: 'lead_stagnant' },
                        created_at: new Date().toISOString()
                    })
                }
            }
        }

        // 3. INSERIR NOTIFICAÇÕES EM BATCH
        if (notifications.length > 0) {
            const { error: insertError } = await supabaseClient
                .from('notifications')
                .insert(notifications)

            if (insertError) {
                console.error('Error inserting notifications:', insertError)
                throw insertError
            }
            console.log(`Inserted ${notifications.length} new notifications`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: {
                    forgotten_appointments: forgottenAppointments?.length || 0,
                    stagnant_deals: stagnantDeals?.length || 0,
                    notifications_created: notifications.length
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Error processing notifications:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
