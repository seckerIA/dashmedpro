import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useEffect } from 'react';
import { addDays, isAfter, isBefore, format } from 'date-fns';
import {
  MedicalAppointment,
  MedicalAppointmentWithRelations,
  MedicalAppointmentInsert,
  MedicalAppointmentUpdate,
  AppointmentType,
  AppointmentStatus,
  PaymentStatus,
} from '@/types/medicalAppointments';
import { FinancialTransactionInsert } from '@/types/financial';

/**
 * Cria uma transação financeira para uma consulta
 * Usada quando payment_status = 'paid' no momento de criar/atualizar consulta
 * OU quando a consulta é marcada como concluída com pagamento confirmado
 */
const createFinancialTransactionForAppointment = async (
  appointment: {
    id: string;
    user_id: string;
    organization_id?: string;
    contact_id: string;
    title: string;
    start_time: string;
    estimated_value?: number | null;
    appointment_type: string;
    payment_status?: string;
    amount_override?: number;
    description_override?: string;
    is_sinal?: boolean;
  },
  profileOrgId?: string
): Promise<string | null> => {
  try {
    const finalAmount = appointment.amount_override !== undefined
      ? appointment.amount_override
      : Number(appointment.estimated_value || 0);

    // Validar se tem valor para criar transação
    if (finalAmount <= 0) {
      console.log('[Financial] Valor zero ou negativo, não criando transação');
      return null;
    }

    const finalDescription = appointment.description_override
      || `Consulta: ${appointment.title}${appointment.is_sinal ? ' (Sinal)' : ''}`;

    // Buscar categoria padrão de entrada
    let { data: categories } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('type', 'entrada')
      .limit(1);

    // Se não existir categoria de entrada, criar uma automaticamente
    if (!categories || categories.length === 0) {
      const orgId = appointment.organization_id || profileOrgId;
      if (!orgId) {
        console.error('[Financial] Não foi possível criar categoria: organization_id não encontrado');
        return null;
      }
      console.log('[Financial] Nenhuma categoria de entrada encontrada, criando categoria padrão "Receitas"');
      const { data: newCategory, error: categoryError } = await supabase
        .from('financial_categories')
        .insert({
          name: 'Receitas',
          type: 'entrada',
          color: '#10b981', // Verde
          is_system: false,
          organization_id: orgId,
        })
        .select('id')
        .single();

      if (!categoryError && newCategory) {
        categories = [newCategory];
        console.log('[Financial] ✅ Categoria "Receitas" criada automaticamente');
      } else {
        console.error('[Financial] Erro ao criar categoria padrão:', categoryError);
      }
    }

    // Buscar conta ativa
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1);

    const categoryId = categories?.[0]?.id;
    const accountId = accounts?.[0]?.id;

    if (!accountId || !categoryId) {
      const missingItems = [];
      if (!accountId) missingItems.push('conta bancária ativa');
      if (!categoryId) missingItems.push('categoria de entrada (erro ao criar automaticamente)');

      const errorMessage = `Consulta marcada como PAGA, mas a transação financeira NÃO foi criada porque não há ${missingItems.join(' e ')}. Cadastre uma conta bancária no módulo Financeiro para que os pagamentos sejam registrados automaticamente.`;
      console.warn('[Financial] ' + errorMessage);

      // Importar toast dinamicamente e notificar usuário
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: '⚠️ Pagamento NÃO Registrado no Financeiro',
          description: errorMessage,
          variant: 'destructive',
          duration: 8000,
        });
      });

      return null;
    }

    const orgId = appointment.organization_id || profileOrgId;

    const transactionData: any = {
      user_id: appointment.user_id,
      organization_id: orgId,
      account_id: accountId,
      category_id: categoryId,
      type: 'entrada',
      amount: finalAmount,
      description: finalDescription,
      date: format(new Date(), 'yyyy-MM-dd'), // Usar data local (sem conversão UTC que causa D-1)
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      contact_id: appointment.contact_id,
      payment_method: 'pix',
      status: 'concluida',
      notes: `Consulta médica - ${appointment.appointment_type}${appointment.is_sinal ? ' (Sinal)' : ''}`,
      tags: ['consulta-medica'],
      has_costs: false,
      total_costs: 0,
      metadata: {
        appointment_id: appointment.id,
        appointment_type: appointment.appointment_type,
        is_sinal: !!appointment.is_sinal,
      },
    };

    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select('id')
      .single();

    if (error) {
      console.error('[Financial] Erro ao criar transação:', error);
      return null;
    }

    if (transaction) {
      // Atualizar saldo da conta (entrada aumenta, saída diminui)
      const { data: account } = await supabase
        .from('financial_accounts')
        .select('current_balance')
        .eq('id', accountId)
        .single();

      if (account) {
        const currentBalance = account.current_balance || 0;
        const newBalance = currentBalance + finalAmount; // Entrada sempre soma

        await supabase
          .from('financial_accounts')
          .update({ current_balance: newBalance })
          .eq('id', accountId);

        console.log(`[Financial] ✅ Saldo atualizado: R$ ${currentBalance.toFixed(2)} → R$ ${newBalance.toFixed(2)} (+R$ ${finalAmount.toFixed(2)}${appointment.is_sinal ? ' sinal' : ''})`);
      }

      return transaction.id;
    }

    return null;
  } catch (error) {
    console.error('[Financial] Erro inesperado:', error);
    return null;
  }
};

/**
 * Deduz os itens de estoque vinculados a uma consulta
 * Usa método FEFO (First Expire First Out) para selecionar os lotes
 */
const deductStockForAppointment = async (
  appointmentId: string,
  userId: string,
  organizationId?: string
): Promise<{ success: boolean; deductedItems: number }> => {
  try {
    // 1. Buscar itens de estoque vinculados que ainda não foram deduzidos
    const { data: stockUsage, error: fetchError } = await (supabase.from('appointment_stock_usage' as any) as any)
      .select(`
        id,
        inventory_item_id,
        quantity,
        deducted
      `)
      .eq('appointment_id', appointmentId)
      .eq('deducted', false);

    if (fetchError) {
      console.error('[Stock] Erro ao buscar itens de estoque:', fetchError);
      return { success: false, deductedItems: 0 };
    }

    if (!stockUsage || stockUsage.length === 0) {
      console.log('[Stock] Nenhum item de estoque para deduzir');
      return { success: true, deductedItems: 0 };
    }

    console.log(`[Stock] ${stockUsage.length} item(ns) de estoque para deduzir`);

    let deductedCount = 0;

    // 2. Para cada item, deduzir usando FEFO
    for (const usage of stockUsage) {
      let remainingQuantity = usage.quantity;

      // Buscar batches ativos ordenados por data de validade (FEFO)
      const { data: batches, error: batchError } = await (supabase.from('inventory_batches' as any) as any)
        .select('id, quantity, expiration_date')
        .eq('item_id', usage.inventory_item_id)
        .eq('is_active', true)
        .gt('quantity', 0)
        .order('expiration_date', { ascending: true, nullsFirst: false });

      if (batchError) {
        console.error('[Stock] Erro ao buscar batches:', batchError);
        continue;
      }

      if (!batches || batches.length === 0) {
        console.warn(`[Stock] Nenhum batch disponível para item ${usage.inventory_item_id}`);
        continue;
      }

      // Deduzir de cada batch até cobrir a quantidade total
      for (const batch of batches) {
        if (remainingQuantity <= 0) break;

        const deductQuantity = Math.min(remainingQuantity, batch.quantity);

        // Criar movimento de saída (OUT) - o trigger do banco atualiza o saldo
        // quantity DEVE ser negativo para OUT (trigger faz: batch.quantity + movement.quantity)
        // organization_id removido pois não existe na tabela inventory_movements
        const { error: movementError } = await (supabase.from('inventory_movements' as any) as any)
          .insert({
            batch_id: batch.id,
            type: 'OUT',
            quantity: -deductQuantity,
            created_by: userId,
            description: `Dedução automática - Consulta concluída (ID: ${appointmentId})`
          });

        if (movementError) {
          console.error('[Stock] Erro ao criar movimento:', movementError);
          continue;
        }

        remainingQuantity -= deductQuantity;
        console.log(`[Stock] Deduzido ${deductQuantity} do batch ${batch.id}`);
      }

      // Marcar como deduzido se conseguiu deduzir tudo
      if (remainingQuantity <= 0) {
        const { error: updateError } = await (supabase.from('appointment_stock_usage' as any) as any)
          .update({ deducted: true })
          .eq('id', usage.id);

        if (updateError) {
          console.error('[Stock] Erro ao marcar como deduzido:', updateError);
        } else {
          deductedCount++;
        }
      } else {
        console.warn(`[Stock] Estoque insuficiente para item ${usage.inventory_item_id}. Faltam ${remainingQuantity} unidades.`);
      }
    }

    console.log(`[Stock] ✅ ${deductedCount} item(ns) deduzido(s) com sucesso`);
    return { success: true, deductedItems: deductedCount };
  } catch (error) {
    console.error('[Stock] Erro inesperado:', error);
    return { success: false, deductedItems: 0 };
  }
};

/**
 * Verifica se existe conta bancária ativa
 */
const checkHasActiveAccount = async (): Promise<boolean> => {
  const { count } = await supabase
    .from('financial_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  return (count || 0) > 0;
};

interface UseMedicalAppointmentsFilters {
  startDate?: Date;
  endDate?: Date;
  appointmentType?: AppointmentType | 'all';
  status?: AppointmentStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  contactId?: string;
  isSecretaria?: boolean; // Se true, busca TODOS os agendamentos (de todos os médicos)
  doctorIds?: string[]; // IDs dos médicos para filtrar explicitamente
}

// Tipos de estágio do pipeline para clínica médica
type MedicalPipelineStage = 'lead_novo' | 'agendado' | 'em_tratamento' | 'inadimplente' | 'follow_up' | 'fechado_ganho' | 'fechado_perdido';

/**
 * Função auxiliar para atualizar o pipeline automaticamente
 * Regras:
 * - Consulta criada COM sinal pago -> agendado
 * - Consulta criada SEM sinal pago (ou sinal pendente) -> inadimplente
 * - Consulta concluída sem pendências -> follow_up
 * - Consulta com pagamento pendente -> inadimplente
 */
const updateDealPipeline = async (
  contactId: string,
  doctorId: string,
  appointmentData: {
    title: string;
    estimated_value?: number | null;
    sinal_amount?: number | null;
    sinal_paid?: boolean;
    status?: AppointmentStatus;
    payment_status?: PaymentStatus;
  }
): Promise<void> => {
  try {
    // Determinar o estágio do pipeline baseado nos dados
    let pipelineStage: MedicalPipelineStage;
    let isDefaulting = false;

    // Lógica de determinação do estágio
    if (appointmentData.status === 'completed') {
      // Consulta concluída
      if (appointmentData.payment_status === 'pending' || appointmentData.payment_status === 'partial') {
        // Ainda tem pagamento pendente -> inadimplente
        pipelineStage = 'inadimplente';
        isDefaulting = true;
      } else {
        // Tudo pago -> follow_up (para acompanhamento)
        pipelineStage = 'follow_up';
        isDefaulting = false;
      }
    } else if (appointmentData.status === 'cancelled' || appointmentData.status === 'no_show') {
      // Consulta cancelada ou não compareceu - manter deal mas não mover
      return;
    } else {
      // Consulta agendada/confirmada/em andamento
      if (appointmentData.sinal_amount && appointmentData.sinal_amount > 0) {
        // Tem sinal definido
        if (appointmentData.sinal_paid) {
          // Sinal pago -> agendado
          pipelineStage = 'agendado';
          isDefaulting = false;
        } else {
          // Sinal não pago -> inadimplente
          pipelineStage = 'inadimplente';
          isDefaulting = true;
        }
      } else {
        // Sem sinal definido -> apenas agendado
        pipelineStage = 'agendado';
        isDefaulting = false;
      }
    }

    // Buscar deal existente para este contato
    // Primeiro, tentar encontrar deal no stage "agendado" (caso já tenha sido movido para lá)
    // Depois, tentar qualquer deal ativo para o contato
    let existingDeal = null;

    // Buscar deal no stage "agendado" primeiro (mais específico)
    const { data: dealInAgendado } = await (supabase.from('crm_deals') as any)
      .select('id, stage, user_id')
      .eq('contact_id', contactId)
      .eq('stage', 'agendado')
      .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
      .maybeSingle();

    if (dealInAgendado) {
      existingDeal = dealInAgendado;
    } else {
      // Se não encontrou no stage "agendado", buscar qualquer deal ativo para o contato
      // Não usar user_id como filtro para evitar criar duplicados quando o médico é diferente
      const { data: anyActiveDeal } = await (supabase.from('crm_deals') as any)
        .select('id, stage, user_id')
        .eq('contact_id', contactId)
        .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyActiveDeal) {
        existingDeal = anyActiveDeal;
      }
    }

    const dealValue = appointmentData.estimated_value || appointmentData.sinal_amount || 0;

    if (existingDeal) {
      // Atualizar deal existente
      await supabase
        .from('crm_deals')
        .update({
          stage: pipelineStage,
          is_defaulting: isDefaulting,
          value: dealValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDeal.id);

      console.log(`[Pipeline] Deal ${existingDeal.id} atualizado para ${pipelineStage}`);
    } else {
      // Só criar novo deal se realmente não existir nenhum para este contato
      // Isso evita duplicação quando o deal já foi movido para "agendado" manualmente
      await supabase
        .from('crm_deals')
        .insert({
          user_id: doctorId,
          contact_id: contactId,
          title: appointmentData.title,
          value: dealValue,
          stage: pipelineStage,
          is_defaulting: isDefaulting,
        });

      console.log(`[Pipeline] Novo deal criado com stage ${pipelineStage}`);
    }
  } catch (error) {
    console.error('[Pipeline] Erro ao atualizar pipeline:', error);
    // Não propagar erro - pipeline é secundário
  }
};

/**
 * Verifica se paciente deve ir para "Aguardando Retorno" e move o deal se necessário
 * Critérios:
 * 1. Exatamente 1 consulta completa (status='completed')
 * 2. Pagamento da consulta está OK (payment_status='paid')
 * 3. Não há próxima consulta agendada (start_time > now())
 * 4. Paciente não está em tratamento (is_in_treatment = false)
 */
export const checkAndMoveToAguardandoRetorno = async (contactId: string): Promise<void> => {
  try {
    // 1. Buscar consultas completadas do contato
    const { data: completedAppointments, error: appointmentsError } = await supabase
      .from('medical_appointments')
      .select('id, status, payment_status, start_time')
      .eq('contact_id', contactId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    if (appointmentsError) {
      console.error('[Aguardando Retorno] Erro ao buscar consultas:', appointmentsError);
      return;
    }

    // 2. Verificar se tem exatamente 1 consulta completa
    if (!completedAppointments || completedAppointments.length !== 1) {
      return; // Não atende critério
    }

    const lastAppointment = completedAppointments[0];

    // 3. Verificar se pagamento está OK
    if (lastAppointment.payment_status !== 'paid') {
      return; // Pagamento não está OK
    }

    // 4. Verificar se há consultas futuras agendadas
    const now = new Date().toISOString();
    const { data: futureAppointments, error: futureError } = await supabase
      .from('medical_appointments')
      .select('id')
      .eq('contact_id', contactId)
      .gt('start_time', now)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .limit(1);

    if (futureError) {
      console.error('[Aguardando Retorno] Erro ao buscar consultas futuras:', futureError);
      return;
    }

    // Se há consulta futura, não deve ir para aguardando retorno
    if (futureAppointments && futureAppointments.length > 0) {
      return;
    }

    // 5. Buscar deal do contato e verificar is_in_treatment
    const { data: deal, error: dealError } = await (supabase.from('crm_deals') as any)
      .select('id, is_in_treatment, stage')
      .eq('contact_id', contactId)
      .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dealError) {
      console.error('[Aguardando Retorno] Erro ao buscar deal:', dealError);
      return;
    }

    if (!deal) {
      return; // Sem deal para atualizar
    }

    // 6. Verificar se não está em tratamento
    if (deal.is_in_treatment === true) {
      return; // Está em tratamento, não deve ir para aguardando retorno
    }

    // 7. Se já está em aguardando_retorno, não precisa atualizar
    if (deal.stage === 'aguardando_retorno') {
      return;
    }

    // 8. Mover deal para aguardando_retorno
    const { error: updateError } = await supabase
      .from('crm_deals')
      .update({
        stage: 'aguardando_retorno' as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deal.id);

    if (updateError) {
      console.error('[Aguardando Retorno] Erro ao atualizar deal:', updateError);
      return;
    }

    console.log(`[Aguardando Retorno] Deal ${deal.id} movido para aguardando_retorno`);
  } catch (error) {
    console.error('[Aguardando Retorno] Erro ao verificar critérios:', error);
    // Não propagar erro - pipeline é secundário
  }
};

/**
 * Atualiza deal do contato para estágio "em_tratamento" e marca is_in_treatment = true
 */
export const updateDealToTreatment = async (contactId: string, doctorId: string): Promise<void> => {
  try {
    // Buscar deal ativo do contato
    const { data: deal, error: dealError } = await (supabase.from('crm_deals') as any)
      .select('id')
      .eq('contact_id', contactId)
      .not('stage', 'in', '("fechado_ganho","fechado_perdido")')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dealError) {
      console.error('[Em Tratamento] Erro ao buscar deal:', dealError);
      return;
    }

    if (deal) {
      // Atualizar deal existente
      const { error: updateError } = await supabase
        .from('crm_deals')
        .update({
          stage: 'em_tratamento' as any,
          is_in_treatment: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (updateError) {
        console.error('[Em Tratamento] Erro ao atualizar deal:', updateError);
        return;
      }

      console.log(`[Em Tratamento] Deal ${deal.id} atualizado para em_tratamento`);
    } else {
      // Se não existe deal, criar um novo
      const { error: insertError } = await supabase
        .from('crm_deals')
        .insert({
          user_id: doctorId,
          contact_id: contactId,
          title: 'Paciente em tratamento',
          stage: 'em_tratamento' as any,
          is_in_treatment: true,
        });

      if (insertError) {
        console.error('[Em Tratamento] Erro ao criar deal:', insertError);
        return;
      }

      console.log('[Em Tratamento] Novo deal criado para em_tratamento');
    }
  } catch (error) {
    console.error('[Em Tratamento] Erro ao atualizar deal:', error);
    // Não propagar erro - pipeline é secundário
  }
};

// Fetch appointments with relations
const fetchAppointments = async (
  userId: string,
  filters?: UseMedicalAppointmentsFilters,
  signal?: AbortSignal,
  doctorIds?: string[], // Agora aceita array de IDs de médicos
  canViewAll: boolean = false // Nova flag para indicar se pode ver tudo
): Promise<MedicalAppointmentWithRelations[]> => {
  // REMOVED: ensureValidSession() - causes timeout hangs with extensions
  // Global auth handling will catch 401 errors and refresh token

  // INÍCIO DA QUERY
  let query = (supabase.from('medical_appointments') as any)
    .select(`
      *,
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type),
      doctor:profiles!medical_appointments_doctor_id_profiles_fk(id, full_name, email)
    `);

  // Lógica de Filtragem:
  // 1. Se passarmos doctorIds (filtro manual ou secretaria vinculada), filtramos.
  // 2. Se NÃO passarmos doctorIds, mas for user privilegiado (canViewAll), NÃO filtramos por user/doctor (vê tudo da organização).
  // 3. Se usuário comum, vê apenas suas próprias.

  if (doctorIds && doctorIds.length > 0) {
    query = query.in('doctor_id', doctorIds);
  } else if (!canViewAll && userId) {
    // Usuário Comum: Só vê o que é seu (owner) ou onde é médico (doctor)
    query = query.or(`user_id.eq.${userId},doctor_id.eq.${userId}`);
  }
  // Se canViewAll=true e !doctorIds, não aplica filtro => Vê TUDO.

  query = query.order('start_time', { ascending: true });

  // Apply filters
  if (filters?.startDate) {
    query = query.gte('start_time', filters.startDate.toISOString());
  }

  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate.toISOString());
  }

  if (filters?.appointmentType && filters.appointmentType !== 'all') {
    query = query.eq('appointment_type', filters.appointmentType);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus);
  }

  if (filters?.contactId) {
    query = query.eq('contact_id', filters.contactId);
  }

  // Usar wrapper com timeout
  const { supabaseQueryWithTimeout } = await import('@/utils/supabaseQuery');
  const { data, error } = await supabaseQueryWithTimeout(query, 30000, signal);

  if (error) throw new Error(`Erro ao buscar consultas: ${error.message}`);
  return (data as MedicalAppointmentWithRelations[]) || [];
};

// Create appointment
const createAppointment = async (
  appointmentData: MedicalAppointmentInsert
): Promise<MedicalAppointmentWithRelations> => {
  // Validate required fields
  if (!appointmentData.user_id) {
    throw new Error('user_id é obrigatório');
  }
  if (!appointmentData.contact_id) {
    throw new Error('contact_id é obrigatório');
  }
  if (!appointmentData.title) {
    throw new Error('title é obrigatório');
  }
  if (!appointmentData.start_time) {
    throw new Error('start_time é obrigatório');
  }
  if (!appointmentData.end_time) {
    throw new Error('end_time é obrigatório');
  }
  if (!appointmentData.duration_minutes) {
    throw new Error('duration_minutes é obrigatório');
  }

  const { data, error } = await supabase
    .from('medical_appointments')
    .insert({
      ...appointmentData,
      doctor_id: appointmentData.doctor_id || appointmentData.user_id,
      paid_in_advance: appointmentData.paid_in_advance ?? false,
    })
    .select(`
      *,
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
    .single();

  if (error) {
    console.error('Erro ao criar consulta:', error);
    console.error('Dados enviados:', appointmentData);
    throw new Error(`Erro ao criar consulta: ${error.message}`);
  }

  // Se payment_status = 'paid', criar transação financeira IMEDIATAMENTE
  if (appointmentData.payment_status === 'paid' && appointmentData.estimated_value && appointmentData.estimated_value > 0) {
    console.log('[Create] Consulta marcada como PAGA - criando transação financeira imediatamente');

    const transactionId = await createFinancialTransactionForAppointment({
      id: data.id,
      user_id: appointmentData.user_id,
      organization_id: (data as any).organization_id,
      contact_id: appointmentData.contact_id,
      title: appointmentData.title,
      start_time: appointmentData.start_time,
      estimated_value: appointmentData.estimated_value,
      appointment_type: appointmentData.appointment_type || 'consultation',
      payment_status: appointmentData.payment_status,
    });

    // Vincular transação à consulta
    if (transactionId) {
      await supabase
        .from('medical_appointments')
        .update({ financial_transaction_id: transactionId })
        .eq('id', data.id);

      console.log('[Create] ✅ Transação financeira criada e vinculada:', transactionId);

      // Notificar sucesso
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: '✅ Pagamento Registrado no Financeiro',
          description: `Receita de R$ ${appointmentData.estimated_value?.toFixed(2)} registrada automaticamente.`,
          duration: 4000,
        });
      });
    }
  }

  // Se sinal foi pago na criação, criar transação do sinal
  if (appointmentData.sinal_paid === true && appointmentData.sinal_amount && appointmentData.sinal_amount > 0) {
    // Verificar se já existe transação de sinal para evitar duplicatas
    const { data: existingSinalTransaction } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('metadata->>appointment_id', data.id)
      .eq('metadata->>is_sinal', 'true')
      .maybeSingle();

    if (!existingSinalTransaction) {
      console.log('[Create] Sinal pago na criação - criando transação financeira do sinal');

      await createFinancialTransactionForAppointment({
        id: data.id,
        user_id: appointmentData.user_id,
        organization_id: (data as any).organization_id,
        contact_id: appointmentData.contact_id,
        title: appointmentData.title,
        start_time: appointmentData.start_time,
        estimated_value: appointmentData.estimated_value,
        appointment_type: appointmentData.appointment_type || 'consultation',
        amount_override: appointmentData.sinal_amount,
        description_override: `Sinal: ${appointmentData.title}`,
        is_sinal: true,
      });

      // Notificar sucesso
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: '✅ Sinal Registrado no Financeiro',
          description: `Valor de R$ ${appointmentData.sinal_amount?.toFixed(2)} registrado como entrada.`,
          duration: 4000,
        });
      });
    } else {
      console.log('[Create] Transação de sinal já existe, pulando criação');
    }
  }

  // Atualizar pipeline automaticamente ao criar consulta
  await updateDealPipeline(
    appointmentData.contact_id,
    appointmentData.doctor_id || appointmentData.user_id,
    {
      title: appointmentData.title,
      estimated_value: appointmentData.estimated_value,
      sinal_amount: appointmentData.sinal_amount,
      sinal_paid: appointmentData.sinal_paid,
      status: appointmentData.status || 'scheduled',
      payment_status: appointmentData.payment_status || 'pending',
    }
  );

  return data as MedicalAppointmentWithRelations;
};

// Update appointment
const updateAppointment = async ({
  id,
  updates,
}: {
  id: string;
  updates: MedicalAppointmentUpdate;
}): Promise<MedicalAppointmentWithRelations> => {
  const updateData = {
    ...updates,
    paid_in_advance: updates.paid_in_advance !== undefined ? updates.paid_in_advance : undefined,
  };

  // Buscar dados atuais para verificar mudanças sensíveis
  const { data: oldAppointment } = await (supabase.from('medical_appointments') as any)
    .select('sinal_paid, sinal_amount, payment_status, estimated_value, financial_transaction_id')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('medical_appointments')
    .update({
      ...updateData,
      // Se sinal_paid está vindo como true, garantir que status de pagamento seja pelo menos 'parcial'
      ...(updates.sinal_paid === true && (!oldAppointment || oldAppointment.payment_status === 'pending')
        ? { payment_status: 'partial' as PaymentStatus }
        : {})
    })
    .eq('id', id)
    .select(`
      *,
      contact:crm_contacts!medical_appointments_contact_id_fkey(*),
      financial_transaction:financial_transactions(id, description, amount, type)
    `)
    .single();

  if (error) throw new Error(`Erro ao atualizar consulta: ${error.message}`);

  const appointment = data as MedicalAppointmentWithRelations;

  // 1. Se sinal_paid mudou para 'true', criar transação do sinal
  if (updates.sinal_paid === true && (!oldAppointment || !oldAppointment.sinal_paid)) {
    const sinalAmount = updates.sinal_amount || appointment.sinal_amount || 0;

    if (sinalAmount > 0) {
      // Verificar se já existe transação de sinal para evitar duplicatas
      const { data: existingSinalTransaction } = await supabase
        .from('financial_transactions')
        .select('id')
        .eq('metadata->>appointment_id', appointment.id)
        .eq('metadata->>is_sinal', 'true')
        .maybeSingle();

      if (!existingSinalTransaction) {
        await createFinancialTransactionForAppointment({
          id: appointment.id,
          user_id: appointment.user_id,
          organization_id: (appointment as any).organization_id,
          contact_id: appointment.contact_id,
          title: appointment.title,
          start_time: appointment.start_time,
          estimated_value: appointment.estimated_value,
          appointment_type: appointment.appointment_type || 'consultation',
          amount_override: sinalAmount,
          description_override: `Sinal: ${appointment.title}`,
          is_sinal: true,
        });

        // Notificar sucesso do sinal
        import('@/hooks/use-toast').then(({ toast }) => {
          toast({
            title: '✅ Sinal Registrado no Financeiro',
            description: `Valor de R$ ${sinalAmount.toFixed(2)} registrado como entrada.`,
            duration: 4000,
          });
        });
      } else {
        console.log('[Update] Transação de sinal já existe, pulando criação');
      }
    }
  }

  // 2. Se payment_status mudou para 'paid' e não tem transação principal, criar
  if (
    updates.payment_status === 'paid' &&
    (!oldAppointment || oldAppointment.payment_status !== 'paid') &&
    !appointment.financial_transaction_id &&
    appointment.estimated_value &&
    appointment.estimated_value > 0
  ) {
    console.log('[Update] Status mudou para PAGO - criando transação financeira principal');

    // Calcular o que resta pagar (subtrair sinal se já foi pago)
    const alreadyPaidSinal = updates.sinal_paid === true || appointment.sinal_paid;
    const sinalAmount = (alreadyPaidSinal ? (appointment.sinal_amount || 0) : 0);
    const remainingAmount = Number(appointment.estimated_value) - sinalAmount;

    if (remainingAmount > 0) {
      const transactionId = await createFinancialTransactionForAppointment({
        id: appointment.id,
        user_id: appointment.user_id,
        organization_id: (appointment as any).organization_id,
        contact_id: appointment.contact_id,
        title: appointment.title,
        start_time: appointment.start_time,
        estimated_value: appointment.estimated_value,
        appointment_type: appointment.appointment_type || 'consultation',
        payment_status: 'paid',
        amount_override: remainingAmount,
        description_override: `Consulta: ${appointment.title}${appointment.sinal_paid ? ' (Restante)' : ''}`,
        is_sinal: false,
      });

      // Vincular transação à consulta
      if (transactionId) {
        await supabase
          .from('medical_appointments')
          .update({ financial_transaction_id: transactionId })
          .eq('id', appointment.id);

        console.log('[Update] ✅ Transação principal criada e vinculada:', transactionId);

        // Notificar sucesso
        import('@/hooks/use-toast').then(({ toast }) => {
          toast({
            title: '✅ Pagamento Registrado no Financeiro',
            description: `Receita de R$ ${remainingAmount.toFixed(2)} registrada automaticamente.`,
            duration: 4000,
          });
        });
      }
    }
  }

  // Atualizar pipeline automaticamente quando houver mudança de status ou pagamento
  if (appointment.contact_id && (appointment.doctor_id || appointment.user_id)) {
    const shouldUpdatePipeline =
      updates.status !== undefined ||
      updates.payment_status !== undefined ||
      updates.sinal_paid !== undefined ||
      updates.sinal_amount !== undefined;

    if (shouldUpdatePipeline) {
      await updateDealPipeline(
        appointment.contact_id,
        appointment.doctor_id || appointment.user_id,
        {
          title: appointment.title,
          estimated_value: appointment.estimated_value,
          sinal_amount: appointment.sinal_amount,
          sinal_paid: appointment.sinal_paid,
          status: appointment.status as AppointmentStatus,
          payment_status: appointment.payment_status as PaymentStatus,
        }
      );

      // Se a consulta foi marcada como completed, verificar se deve ir para aguardando retorno
      if (updates.status === 'completed' && appointment.contact_id) {
        // Executar de forma assíncrona sem bloquear
        checkAndMoveToAguardandoRetorno(appointment.contact_id).catch((error) => {
          console.error('[updateAppointment] Erro ao verificar aguardando retorno:', error);
        });
      }
    }
  }

  return appointment;
};

// Delete appointment
const deleteAppointment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('medical_appointments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao excluir consulta: ${error.message}`);
};

// Helper para serializar filtros em uma query key estável
const serializeFilters = (filters?: UseMedicalAppointmentsFilters): string => {
  if (!filters) return 'no-filters';

  const parts: string[] = [];
  if (filters.startDate) parts.push(`start:${filters.startDate.toISOString()}`);
  if (filters.endDate) parts.push(`end:${filters.endDate.toISOString()}`);
  if (filters.appointmentType && filters.appointmentType !== 'all') parts.push(`type:${filters.appointmentType}`);
  if (filters.status && filters.status !== 'all') parts.push(`status:${filters.status}`);
  if (filters.paymentStatus && filters.paymentStatus !== 'all') parts.push(`payment:${filters.paymentStatus}`);
  if (filters.contactId) parts.push(`contact:${filters.contactId}`);
  if (filters.isSecretaria) parts.push('secretaria:true');
  if (filters.doctorIds && filters.doctorIds.length > 0) parts.push(`doctors:${filters.doctorIds.join(',')}`);

  return parts.length > 0 ? parts.join('|') : 'no-filters';
};

// Hook principal
export function useMedicalAppointments(filters?: UseMedicalAppointmentsFilters) {
  const { user, loading: authLoading } = useAuth();
  const { profile, isSecretaria, isLoading: isLoadingProfile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Secretária usa lista de médicos vinculados se não houver filtro explícito
  const doctorIdsToUse = filters?.doctorIds && filters.doctorIds.length > 0
    ? filters.doctorIds
    : (isSecretaria ? doctorIds : []);

  const queryKey = ['medical-appointments', user?.id, doctorIdsToUse, serializeFilters(filters)];

  // Invalidar cache quando o usuário mudar para evitar dados de outros usuários
  useEffect(() => {
    if (user?.id) {
      // Invalidar todas as queries de medical-appointments para garantir dados corretos
      queryClient.invalidateQueries({
        queryKey: ['medical-appointments'],
        exact: false
      });
    }
  }, [user?.id, queryClient]);

  // Verificar permissão para ver tudo
  const canViewAll = isSecretaria || profile?.role === 'admin' || profile?.role === 'dono';

  // Query: List appointments with relations
  const {
    data: appointments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchAppointments(
      user?.id || '',
      filters,
      signal,
      doctorIdsToUse.length > 0 ? doctorIdsToUse : undefined,
      canViewAll // Passando a flag correta
    ),
    enabled: !!user?.id && !!profile && !authLoading && !isLoadingProfile && (!isSecretaria || !isLoadingDoctors),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });

  // Mutation: Create appointment
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      // Invalidar queries do CRM/pipeline para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
      // Invalidar queries financeiras (caso tenha criado transação para consulta paga)
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
      toast({
        title: 'Consulta agendada com sucesso!',
        description: 'A consulta foi adicionada à agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao agendar consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update appointment (with optimistic updates for drag-and-drop)
  const updateMutation = useMutation({
    mutationFn: updateAppointment,
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: MedicalAppointmentWithRelations[] | undefined) => {
        if (!old) return old;
        return old.map((appt) => (appt.id === id ? { ...appt, ...updates } : appt));
      });

      return { previousData };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: 'Erro ao atualizar consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      // Invalidar queries do CRM/pipeline para refletir mudanças
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
      // Invalidar métricas de sinais para secretárias
      queryClient.invalidateQueries({ queryKey: ['secretary-sinal-metrics'] });
      // Invalidar status de transações financeiras e métricas
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-monthly-data'] });
      queryClient.invalidateQueries({ queryKey: ['financial-expenses-by-category'] });
      // Invalidar histórico de uso de estoque
      queryClient.invalidateQueries({ queryKey: ['stock-usage-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-reports'] });
    },
  });

  // Mutation: Delete appointment
  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      toast({
        title: 'Consulta excluída',
        description: 'A consulta foi removida da agenda.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Mark as completed
  const markAsCompleted = useMutation({
    mutationFn: async (params: string | { id: string; confirmedPayment?: boolean }) => {
      // Suportar tanto string (compatibilidade) quanto objeto com confirmação
      const id = typeof params === 'string' ? params : params.id;
      const confirmedPayment = typeof params === 'object' ? params.confirmedPayment : undefined;

      // Buscar a consulta completa antes de atualizar
      const { data: appointment, error: fetchError } = await supabase
        .from('medical_appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error(`Erro ao buscar consulta: ${fetchError.message}`);
      if (!appointment) throw new Error('Consulta não encontrada');

      // Verificar se já existe transação financeira vinculada
      let financialTransactionId = appointment.financial_transaction_id;

      // Verificar se deve criar transação financeira
      const paymentStatus = appointment.payment_status;
      const alreadyPaid = paymentStatus === 'paid' || paymentStatus === 'partial';

      // Só criar transação se:
      // 1. Não existe transação ainda
      // 2. Tem valor estimado
      // 3. E (pagamento já está confirmado OU confirmação explícita de que pagou)
      const shouldCreateTransaction = !financialTransactionId
        && appointment.estimated_value
        && appointment.estimated_value > 0
        && (alreadyPaid || confirmedPayment === true);

      // Se não existe transação e tem valor estimado e confirmação de pagamento, criar uma transação financeira
      if (shouldCreateTransaction) {
        // VALIDAÇÃO PRÉVIA: Verificar se account e category existem antes de tentar criar transação
        // Buscar categoria padrão de entrada (consultas médicas)
        let { data: categories, error: categoriesError } = await supabase
          .from('financial_categories')
          .select('id, name')
          .eq('type', 'entrada')
          .limit(1);

        if (categoriesError) {
          console.error('Erro ao buscar categorias:', categoriesError);
          throw new Error(`Erro ao verificar categorias financeiras: ${categoriesError.message}`);
        }

        // Se não existir categoria de entrada, criar uma automaticamente
        if (!categories || categories.length === 0) {
          const orgId = (appointment as any).organization_id || (profile as any)?.organization_id;
          if (!orgId) {
            console.error('[Financial] Não foi possível criar categoria: organization_id não encontrado');
            throw new Error('Organization ID não encontrado para criar categoria');
          }
          console.log('[Financial] Nenhuma categoria de entrada encontrada, criando categoria padrão "Receitas"');
          const { data: newCategory, error: categoryError } = await supabase
            .from('financial_categories')
            .insert({
              name: 'Receitas',
              type: 'entrada',
              color: '#10b981', // Verde
              is_system: false,
              organization_id: orgId,
            })
            .select('id, name')
            .single();

          if (!categoryError && newCategory) {
            categories = [newCategory];
            console.log('[Financial] ✅ Categoria "Receitas" criada automaticamente');
          } else {
            console.error('[Financial] Erro ao criar categoria padrão:', categoryError);
          }
        }

        // Buscar primeira conta disponível (sempre precisa ter uma conta)
        const { data: accounts, error: accountsError } = await supabase
          .from('financial_accounts')
          .select('id, name')
          .eq('is_active', true)
          .order('is_default', { ascending: false }) // Priorizar conta padrão
          .limit(1);

        if (accountsError) {
          console.error('Erro ao buscar contas:', accountsError);
          throw new Error(`Erro ao verificar contas financeiras: ${accountsError.message}`);
        }

        const categoryId = categories && categories.length > 0 ? categories[0].id : null;
        const accountId = accounts && accounts.length > 0 ? accounts[0].id : null;

        // Validar ANTES de tentar criar transação
        if (!accountId || !categoryId) {
          const missingItems = [];
          if (!accountId) missingItems.push('conta financeira ativa');
          if (!categoryId) missingItems.push('categoria de entrada (erro ao criar automaticamente)');

          const errorMessage = `Não foi possível criar a transação financeira: ${missingItems.join(' e ')} não encontrada(s). Por favor, configure uma conta financeira ativa no módulo Financeiro antes de finalizar consultas.`;

          console.warn(errorMessage);

          // Não criar a transação, mas não falhar a operação principal
          // A consulta será marcada como concluída mesmo sem transação
          toast({
            title: 'Aviso - Configuração Financeira',
            description: errorMessage,
            variant: 'default',
          });
        } else {
          // Removido o insert manual duplicado aqui. 
          // O updateMutation.mutateAsync abaixo alterará o status para 'paid', 
          // o que disparará a criação da transação no hook updateAppointment.
          console.log('[markAsCompleted] Pulando criação manual de transação para evitar duplicidade. updateAppointment cuidará disso.');

          // Opcional: apenas sinalizar que o pagamento deve ser registrado
          financialTransactionId = null;
        }
      }

      // Atualizar a consulta com status concluído e vincular transação se criada
      // Se o usuário confirmou o pagamento, também atualizar payment_status para 'paid'
      const shouldMarkAsPaid = confirmedPayment === true || appointment.payment_status === 'paid';

      return updateMutation.mutateAsync({
        id,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
          ...(shouldMarkAsPaid ? { payment_status: 'paid' as PaymentStatus } : {}),
          ...(financialTransactionId && !appointment.financial_transaction_id
            ? { financial_transaction_id: financialTransactionId }
            : {}),
        },
      });
    },
    onSuccess: async (data, variables) => {
      // Invalidar queries de appointments e financial primeiro
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['financial-accounts'] });

      // Verificar se uma transação foi criada
      const hasTransaction = data?.financial_transaction_id;

      // Deduzir estoque vinculado à consulta
      let stockDeducted = false;
      if (data?.id && user?.id) {
        try {
          const result = await deductStockForAppointment(data.id, user.id, profile?.organization_id);
          stockDeducted = result.success && result.deductedItems > 0;

          // Invalidar queries de inventário para refletir as mudanças
          if (stockDeducted) {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            queryClient.invalidateQueries({ queryKey: ['stock-usage-history'] });
          }
        } catch (error) {
          console.error('[markAsCompleted] Erro ao deduzir estoque:', error);
        }
      }

      // Montar mensagem de sucesso
      let successMessage = 'A consulta foi marcada como concluída.';
      if (hasTransaction && stockDeducted) {
        successMessage = 'Consulta concluída! Transação financeira criada e estoque deduzido automaticamente.';
      } else if (hasTransaction) {
        successMessage = 'Consulta concluída! Transação financeira criada automaticamente.';
      } else if (stockDeducted) {
        successMessage = 'Consulta concluída! Estoque deduzido automaticamente.';
      }

      toast({
        title: 'Consulta concluída',
        description: successMessage,
      });

      // Verificar se paciente deve ir para "Aguardando Retorno"
      // Isso só acontece se não estiver em tratamento (verificação feita dentro da função)
      if (data?.contact_id) {
        try {
          await checkAndMoveToAguardandoRetorno(data.contact_id);
        } catch (error) {
          console.error('[markAsCompleted] Erro ao verificar aguardando retorno:', error);
          // Não mostrar erro ao usuário - é uma operação secundária
        }
      }

      // Invalidar queries do CRM/pipeline APÓS mover o deal para refletir mudanças em tempo real
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao concluir consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Mark as no-show
  const markAsNoShow = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({
        id,
        updates: {
          status: 'no_show',
          completed_at: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-appointments'] });
      toast({
        title: 'Falta registrada',
        description: 'O paciente foi marcado como não compareceu.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar consulta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Cancel appointment
  const cancelAppointment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return updateMutation.mutateAsync({
        id,
        updates: {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Consulta cancelada',
        description: 'A consulta foi cancelada com sucesso.',
      });
    },
  });

  // Computed: Today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.start_time);
      return apptDate >= today && apptDate < tomorrow;
    });
  }, [appointments]);

  // Computed: Upcoming appointments (next 24 hours)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const tomorrow = addDays(now, 1);

    return appointments.filter((appt) => {
      const apptDate = new Date(appt.start_time);
      return isAfter(apptDate, now) && isBefore(apptDate, tomorrow);
    });
  }, [appointments]);

  // Computed: Pending payments count
  const pendingPaymentsCount = useMemo(() => {
    return appointments.filter((appt) => appt.payment_status === 'pending').length;
  }, [appointments]);

  return {
    appointments,
    todayAppointments,
    upcomingAppointments,
    pendingPaymentsCount,
    isLoading,
    error,
    refetch,
    createAppointment: createMutation,
    updateAppointment: updateMutation,
    deleteAppointment: deleteMutation,
    markAsCompleted,
    markAsNoShow,
    cancelAppointment,
  };
}
