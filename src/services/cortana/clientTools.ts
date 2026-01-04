// Client Tools - Funções que a Cortana pode chamar
// Estes tools são registrados no ElevenLabs e executados no cliente

import { supabase } from '@/integrations/supabase/client';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  GetAgendaParams,
  GetPatientInfoParams,
  CreateAppointmentParams,
  CancelAppointmentParams,
  CreatePatientParams,
  SearchDealsParams,
  NavigateToParams,
  CreateTaskParams,
  SendWhatsAppMessageParams,
  CreateDealParams,
  MoveDealParams,
  CreateMedicalRecordParams,
  MarkAppointmentCompletedParams,
  RescheduleAppointmentParams,
  ToolResult,
  AgendaItem,
  PatientInfo,
  DashboardMetrics,
  DealInfo,
} from '@/types/cortana';
import { CortanaContext } from '@/types/cortana';

// Tipo para ações que precisam de execução visual
export interface PendingAction {
  type: 'navigate' | 'openModal' | 'toast' | 'highlight';
  payload: unknown;
}

// Callback para ações visuais
type ActionCallback = (action: PendingAction) => void;

let actionCallback: ActionCallback | null = null;

export function setActionCallback(callback: ActionCallback) {
  actionCallback = callback;
}

function emitAction(action: PendingAction) {
  if (actionCallback) {
    actionCallback(action);
  }
}

/**
 * Cria os client tools registrados no ElevenLabs
 * Estes são chamados automaticamente pelo agente de voz
 */
export function createClientTools(context: CortanaContext) {
  const userId = context.userId;
  const doctorIds = context.doctorIds || [];
  const targetUserIds = [userId, ...doctorIds];

  return {
    // ==================== CONSULTAS (Read-Only) ====================

    /**
     * Busca a agenda de consultas
     */
    getAgenda: async (params: GetAgendaParams): Promise<ToolResult> => {
      try {
        let startDate: Date;
        let endDate: Date;

        if (params.date) {
          startDate = startOfDay(new Date(params.date));
          endDate = endOfDay(new Date(params.date));
        } else if (params.period === 'tomorrow') {
          const tomorrow = addDays(new Date(), 1);
          startDate = startOfDay(tomorrow);
          endDate = endOfDay(tomorrow);
        } else if (params.period === 'week') {
          startDate = startOfWeek(new Date(), { locale: ptBR });
          endDate = endOfWeek(new Date(), { locale: ptBR });
        } else {
          // Default: today
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
        }

        const query = supabase
          .from('medical_appointments')
          .select(`
            id,
            title,
            start_time,
            end_time,
            appointment_type,
            status,
            contact:crm_contacts!medical_appointments_contact_id_fkey(id, full_name, phone)
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString())
          .order('start_time', { ascending: true });

        // Filtrar por médicos (se secretária)
        if (doctorIds.length > 0) {
          (query as any).in('doctor_id', targetUserIds);
        } else {
          (query as any).or(`user_id.eq.${userId},doctor_id.eq.${userId}`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            success: true,
            message: 'Não há consultas agendadas para este período.',
            data: [],
          };
        }

        const agenda: AgendaItem[] = data.map((apt: any) => ({
          id: apt.id,
          patientName: apt.contact?.full_name || 'Paciente não identificado',
          time: format(new Date(apt.start_time), 'HH:mm'),
          type: translateAppointmentType(apt.appointment_type),
          status: translateAppointmentStatus(apt.status),
        }));

        const message = `Você tem ${data.length} consulta${data.length > 1 ? 's' : ''} agendada${data.length > 1 ? 's' : ''}. ` +
          agenda.slice(0, 3).map(a =>
            `${a.time} com ${a.patientName}, ${a.type}`
          ).join('. ');

        return {
          success: true,
          message,
          data: agenda,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao buscar agenda: ${error.message}`,
        };
      }
    },

    /**
     * Busca informações de um paciente
     */
    getPatientInfo: async (params: GetPatientInfoParams): Promise<ToolResult> => {
      try {
        if (!params.name && !params.phone) {
          return {
            success: false,
            message: 'Por favor, informe o nome ou telefone do paciente.',
          };
        }

        let query = supabase
          .from('crm_contacts')
          .select('id, full_name, phone, email, birth_date, created_at');

        if (params.name) {
          (query as any).ilike('full_name', `%${params.name}%`);
        }

        if (params.phone) {
          const cleanPhone = params.phone.replace(/\D/g, '');
          (query as any).ilike('phone', `%${cleanPhone}%`);
        }

        // Filtrar por usuário/médicos
        (query as any).in('user_id', targetUserIds);

        const { data, error } = await (query as any).limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            success: false,
            message: `Não encontrei nenhum paciente com ${params.name ? `nome "${params.name}"` : `telefone "${params.phone}"`}.`,
          };
        }

        if (data.length === 1) {
          const patient = data[0];
          const info: PatientInfo = {
            id: patient.id,
            name: patient.full_name,
            phone: patient.phone || 'Não informado',
            email: patient.email || undefined,
            birthDate: patient.birth_date || undefined,
          };

          return {
            success: true,
            message: `Encontrei ${patient.full_name}. Telefone: ${patient.phone || 'não informado'}. Email: ${patient.email || 'não informado'}.`,
            data: info,
          };
        }

        // Múltiplos resultados
        const names = data.map((p: any) => p.full_name).join(', ');
        return {
          success: true,
          message: `Encontrei ${data.length} pacientes: ${names}. Qual você gostaria de ver?`,
          data: data.map((p: any) => ({
            id: p.id,
            name: p.full_name,
            phone: p.phone || 'Não informado',
          })),
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao buscar paciente: ${error.message}`,
        };
      }
    },

    /**
     * Retorna métricas do dashboard
     */
    getDashboardMetrics: async (): Promise<ToolResult> => {
      try {
        // Buscar dados em paralelo
        const [dealsResult, appointmentsResult, tasksResult] = await Promise.all([
          supabase
            .from('crm_deals')
            .select('id, value, stage')
            .in('user_id', targetUserIds),
          supabase
            .from('medical_appointments')
            .select('id, status')
            .gte('start_time', startOfDay(new Date()).toISOString())
            .lte('start_time', endOfDay(new Date()).toISOString())
            .or(`user_id.eq.${userId},doctor_id.eq.${userId}`),
          supabase
            .from('tasks')
            .select('id, status')
            .eq('assigned_to', userId)
            .eq('status', 'pending'),
        ]);

        const deals = dealsResult.data || [];
        const appointments = appointmentsResult.data || [];
        const tasks = tasksResult.data || [];

        const activeDeals = deals.filter((d: any) =>
          !['fechado_ganho', 'fechado_perdido'].includes(d.stage)
        );
        const totalValue = activeDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

        const metrics: DashboardMetrics = {
          totalPipelineValue: totalValue,
          activeDeals: activeDeals.length,
          todayAppointments: appointments.length,
          pendingTasks: tasks.length,
          conversionRate: deals.length > 0
            ? Math.round((deals.filter((d: any) => d.stage === 'fechado_ganho').length / deals.length) * 100)
            : 0,
        };

        const formattedValue = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(totalValue);

        return {
          success: true,
          message: `Você tem ${activeDeals.length} deals ativos totalizando ${formattedValue}. Hoje tem ${appointments.length} consultas e ${tasks.length} tarefas pendentes.`,
          data: metrics,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao buscar métricas: ${error.message}`,
        };
      }
    },

    /**
     * Busca deals por critério
     */
    searchDeals: async (params: SearchDealsParams): Promise<ToolResult> => {
      try {
        let query = supabase
          .from('crm_deals')
          .select(`
            id,
            title,
            value,
            stage,
            contact:crm_contacts!crm_deals_contact_id_fkey(id, full_name)
          `)
          .in('user_id', targetUserIds);

        if (params.stage) {
          (query as any).eq('stage', params.stage);
        }

        if (params.query) {
          (query as any).ilike('title', `%${params.query}%`);
        }

        const { data, error } = await (query as any).order('created_at', { ascending: false }).limit(10);

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            success: true,
            message: 'Não encontrei nenhum deal com esses critérios.',
            data: [],
          };
        }

        const deals: DealInfo[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          patientName: d.contact?.full_name || 'Não identificado',
          stage: translateStage(d.stage),
          value: d.value || 0,
        }));

        return {
          success: true,
          message: `Encontrei ${data.length} deal${data.length > 1 ? 's' : ''}. ${deals.slice(0, 3).map(d => `${d.patientName}: ${d.stage}`).join('. ')}.`,
          data: deals,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao buscar deals: ${error.message}`,
        };
      }
    },

    /**
     * Busca tarefas do dia
     */
    getTodayTasks: async (): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, priority, status, due_date')
          .eq('assigned_to', userId)
          .gte('due_date', startOfDay(new Date()).toISOString())
          .lte('due_date', endOfDay(new Date()).toISOString())
          .order('priority', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          return {
            success: true,
            message: 'Você não tem tarefas para hoje.',
            data: [],
          };
        }

        const pendingTasks = data.filter((t: any) => t.status !== 'completed');

        return {
          success: true,
          message: `Você tem ${pendingTasks.length} tarefa${pendingTasks.length > 1 ? 's' : ''} pendente${pendingTasks.length > 1 ? 's' : ''} para hoje. ${pendingTasks.slice(0, 3).map((t: any) => t.title).join(', ')}.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao buscar tarefas: ${error.message}`,
        };
      }
    },

    // ==================== AÇÕES (Write) ====================

    /**
     * Cria um novo agendamento
     */
    createAppointment: async (params: CreateAppointmentParams): Promise<ToolResult> => {
      try {
        // Primeiro, buscar o paciente
        const { data: contacts, error: contactError } = await supabase
          .from('crm_contacts')
          .select('id, full_name')
          .ilike('full_name', `%${params.patientName}%`)
          .in('user_id', targetUserIds)
          .limit(1);

        if (contactError) throw contactError;

        if (!contacts || contacts.length === 0) {
          return {
            success: false,
            message: `Não encontrei paciente com nome "${params.patientName}". Deseja que eu cadastre um novo paciente?`,
          };
        }

        const contact = contacts[0];
        const startTime = new Date(`${params.date}T${params.time}:00`);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hora

        const { data, error } = await supabase
          .from('medical_appointments')
          .insert({
            user_id: userId,
            doctor_id: doctorIds[0] || userId,
            contact_id: contact.id,
            title: `Consulta - ${contact.full_name}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: 60,
            appointment_type: params.type || 'first_visit',
            status: 'scheduled',
            payment_status: 'pending',
            notes: params.notes,
          })
          .select()
          .single();

        if (error) throw error;

        const formattedDate = format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR });
        const formattedTime = format(startTime, 'HH:mm');

        // Emitir ação de toast
        emitAction({
          type: 'toast',
          payload: {
            title: 'Consulta agendada!',
            description: `${contact.full_name} - ${formattedDate} às ${formattedTime}`,
          },
        });

        return {
          success: true,
          message: `Consulta agendada com sucesso para ${contact.full_name} no dia ${formattedDate} às ${formattedTime}.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao agendar consulta: ${error.message}`,
        };
      }
    },

    /**
     * Cancela uma consulta
     */
    cancelAppointment: async (params: CancelAppointmentParams): Promise<ToolResult> => {
      try {
        // Buscar a consulta pelo nome do paciente e data
        const startDate = startOfDay(new Date(params.date));
        const endDate = endOfDay(new Date(params.date));

        const { data: appointments, error: findError } = await supabase
          .from('medical_appointments')
          .select(`
            id,
            start_time,
            contact:crm_contacts!medical_appointments_contact_id_fkey(full_name)
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString())
          .or(`user_id.eq.${userId},doctor_id.eq.${userId}`);

        if (findError) throw findError;

        const appointment = appointments?.find((apt: any) =>
          apt.contact?.full_name?.toLowerCase().includes(params.patientName.toLowerCase())
        );

        if (!appointment) {
          return {
            success: false,
            message: `Não encontrei consulta de ${params.patientName} para o dia ${params.date}.`,
          };
        }

        const { error: updateError } = await supabase
          .from('medical_appointments')
          .update({
            status: 'cancelled',
            cancellation_reason: params.reason || 'Cancelado via assistente de voz',
          })
          .eq('id', appointment.id);

        if (updateError) throw updateError;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Consulta cancelada',
            description: `Consulta de ${(appointment as any).contact?.full_name} foi cancelada.`,
          },
        });

        return {
          success: true,
          message: `Consulta de ${(appointment as any).contact?.full_name} cancelada com sucesso.`,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao cancelar consulta: ${error.message}`,
        };
      }
    },

    /**
     * Cadastra um novo paciente
     */
    createPatient: async (params: CreatePatientParams): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase
          .from('crm_contacts')
          .insert({
            user_id: userId,
            full_name: params.name,
            phone: params.phone.replace(/\D/g, ''),
            email: params.email,
            birth_date: params.birthDate,
          })
          .select()
          .single();

        if (error) throw error;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Paciente cadastrado!',
            description: `${params.name} foi cadastrado com sucesso.`,
          },
        });

        return {
          success: true,
          message: `${params.name} foi cadastrado com sucesso no sistema.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao cadastrar paciente: ${error.message}`,
        };
      }
    },

    /**
     * Cria uma nova tarefa
     */
    createTask: async (params: CreateTaskParams): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            assigned_to: userId,
            title: params.title,
            due_date: params.dueDate || format(new Date(), 'yyyy-MM-dd'),
            priority: params.priority || 'media',
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Tarefa criada!',
            description: params.title,
          },
        });

        return {
          success: true,
          message: `Tarefa "${params.title}" criada com sucesso.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao criar tarefa: ${error.message}`,
        };
      }
    },

    /**
     * Navega para uma página
     */
    navigateTo: async (params: NavigateToParams): Promise<ToolResult> => {
      const routes: Record<string, string> = {
        dashboard: '/',
        calendar: '/calendar',
        crm: '/crm',
        pipeline: '/pipeline',
        whatsapp: '/whatsapp',
        financial: '/financial',
        'medical-records': '/medical-records',
        team: '/team',
        settings: '/settings',
      };

      const route = routes[params.page];

      if (!route) {
        return {
          success: false,
          message: `Página "${params.page}" não encontrada.`,
        };
      }

      emitAction({
        type: 'navigate',
        payload: { path: route },
      });

      const pageNames: Record<string, string> = {
        dashboard: 'Dashboard',
        calendar: 'Calendário',
        crm: 'CRM',
        pipeline: 'Pipeline de Vendas',
        whatsapp: 'WhatsApp',
        financial: 'Financeiro',
        'medical-records': 'Prontuários',
        team: 'Equipe',
        settings: 'Configurações',
      };

      return {
        success: true,
        message: `Abrindo ${pageNames[params.page]}.`,
      };
    },

    /**
     * Envia mensagem WhatsApp
     */
    sendWhatsAppMessage: async (params: SendWhatsAppMessageParams): Promise<ToolResult> => {
      try {
        // Buscar contato
        const { data: contacts, error: contactError } = await supabase
          .from('crm_contacts')
          .select('id, full_name, phone')
          .ilike('full_name', `%${params.contactName}%`)
          .in('user_id', targetUserIds)
          .limit(1);

        if (contactError) throw contactError;

        if (!contacts || contacts.length === 0) {
          return {
            success: false,
            message: `Não encontrei contato com nome "${params.contactName}".`,
          };
        }

        const contact = contacts[0];

        if (!contact.phone) {
          return {
            success: false,
            message: `${contact.full_name} não tem telefone cadastrado.`,
          };
        }

        // Buscar conversa existente ou criar nova
        const { data: conversation, error: convError } = await supabase
          .from('whatsapp_conversations')
          .select('id')
          .eq('phone_number', contact.phone)
          .eq('user_id', userId)
          .single();

        let conversationId = conversation?.id;

        if (!conversationId) {
          // Criar nova conversa
          const { data: newConv, error: newConvError } = await supabase
            .from('whatsapp_conversations')
            .insert({
              user_id: userId,
              phone_number: contact.phone,
              contact_name: contact.full_name,
            })
            .select()
            .single();

          if (newConvError) throw newConvError;
          conversationId = newConv.id;
        }

        // Enviar mensagem via Edge Function
        const { error: sendError } = await supabase.functions.invoke('whatsapp-send-message', {
          body: {
            to: contact.phone,
            message: params.message,
            conversationId,
          },
        });

        if (sendError) throw sendError;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Mensagem enviada!',
            description: `Mensagem enviada para ${contact.full_name}.`,
          },
        });

        return {
          success: true,
          message: `Mensagem enviada para ${contact.full_name} com sucesso.`,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao enviar mensagem: ${error.message}`,
        };
      }
    },

    /**
     * Cria um novo deal
     */
    createDeal: async (params: CreateDealParams): Promise<ToolResult> => {
      try {
        // Buscar paciente
        const { data: contacts, error: contactError } = await supabase
          .from('crm_contacts')
          .select('id, full_name')
          .ilike('full_name', `%${params.patientName}%`)
          .in('user_id', targetUserIds)
          .limit(1);

        if (contactError) throw contactError;

        if (!contacts || contacts.length === 0) {
          return {
            success: false,
            message: `Não encontrei paciente com nome "${params.patientName}".`,
          };
        }

        const contact = contacts[0];

        const { data, error } = await supabase
          .from('crm_deals')
          .insert({
            user_id: userId,
            contact_id: contact.id,
            title: params.procedure || `Oportunidade - ${contact.full_name}`,
            value: params.value || 0,
            stage: 'lead_novo',
          })
          .select()
          .single();

        if (error) throw error;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Deal criado!',
            description: `Deal para ${contact.full_name} criado com sucesso.`,
          },
        });

        return {
          success: true,
          message: `Deal para ${contact.full_name} criado com sucesso no pipeline.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao criar deal: ${error.message}`,
        };
      }
    },

    /**
     * Move deal para outro estágio
     */
    moveDealToStage: async (params: MoveDealParams): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase
          .from('crm_deals')
          .update({ stage: params.newStage })
          .eq('id', params.dealId)
          .select(`
            id,
            title,
            contact:crm_contacts!crm_deals_contact_id_fkey(full_name)
          `)
          .single();

        if (error) throw error;

        const stageName = translateStage(params.newStage);

        return {
          success: true,
          message: `Deal movido para ${stageName} com sucesso.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao mover deal: ${error.message}`,
        };
      }
    },

    /**
     * Marca consulta como concluída
     */
    markAppointmentCompleted: async (params: MarkAppointmentCompletedParams): Promise<ToolResult> => {
      try {
        const { data, error } = await supabase
          .from('medical_appointments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            payment_status: params.paymentConfirmed ? 'paid' : 'pending',
          })
          .eq('id', params.appointmentId)
          .select(`
            id,
            contact:crm_contacts!medical_appointments_contact_id_fkey(full_name)
          `)
          .single();

        if (error) throw error;

        emitAction({
          type: 'toast',
          payload: {
            title: 'Consulta concluída!',
            description: `Consulta de ${(data as any).contact?.full_name} marcada como concluída.`,
          },
        });

        return {
          success: true,
          message: `Consulta marcada como concluída com sucesso.`,
          data: data,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Erro ao concluir consulta: ${error.message}`,
        };
      }
    },
  };
}

// ==================== Helpers ====================

function translateAppointmentType(type: string): string {
  const types: Record<string, string> = {
    first_visit: 'primeira consulta',
    return: 'retorno',
    procedure: 'procedimento',
    exam: 'exame',
    follow_up: 'acompanhamento',
  };
  return types[type] || type;
}

function translateAppointmentStatus(status: string): string {
  const statuses: Record<string, string> = {
    scheduled: 'agendada',
    confirmed: 'confirmada',
    in_progress: 'em andamento',
    completed: 'concluída',
    cancelled: 'cancelada',
    no_show: 'não compareceu',
  };
  return statuses[status] || status;
}

function translateStage(stage: string): string {
  const stages: Record<string, string> = {
    lead_novo: 'Lead Novo',
    agendado: 'Agendado',
    em_tratamento: 'Em Tratamento',
    inadimplente: 'Inadimplente',
    aguardando_retorno: 'Aguardando Retorno',
    follow_up: 'Follow-up',
    fechado_ganho: 'Fechado Ganho',
    fechado_perdido: 'Fechado Perdido',
    qualificado: 'Qualificado',
    apresentacao: 'Apresentação',
    proposta: 'Proposta',
    negociacao: 'Negociação',
  };
  return stages[stage] || stage;
}
