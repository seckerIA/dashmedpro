import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useMedicalAppointments } from './useMedicalAppointments';
import { useGeneralMeetings } from './useGeneralMeetings';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export interface Conflict {
  type: 'appointment' | 'meeting';
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityCheck {
  available: boolean;
  conflicts: Conflict[];
}

/**
 * Hook para verificar disponibilidade de horários
 * Verifica conflitos entre consultas médicas e reuniões com is_busy = true
 */
export function useAvailability(startDate?: Date, endDate?: Date) {
  const { user } = useAuth();

  // Calcular range do mês se não fornecido
  const monthStart = startDate ? startOfMonth(startDate) : startOfMonth(new Date());
  const monthEnd = endDate ? endOfMonth(endDate) : endOfMonth(new Date());

  // Buscar consultas médicas do período
  const { appointments = [] } = useMedicalAppointments({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Buscar reuniões ocupadas do período
  const { busyPeriods = [] } = useGeneralMeetings({
    startDate: monthStart,
    endDate: monthEnd,
    isBusy: true,
    status: 'scheduled',
  });

  // Cache de períodos ocupados
  const busySlots = useMemo(() => {
    const slots: Array<{ start: Date; end: Date; type: 'appointment' | 'meeting'; id: string; title: string }> = [];

    // Adicionar consultas médicas (sempre ocupam o horário)
    (appointments || []).forEach((appt) => {
      if (appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'in_progress') {
        slots.push({
          start: parseISO(appt.start_time),
          end: parseISO(appt.end_time),
          type: 'appointment',
          id: appt.id,
          title: appt.title,
        });
      }
    });

    // Adicionar reuniões ocupadas (apenas as que têm is_busy = true)
    (busyPeriods || []).forEach((meeting) => {
      if (meeting.is_busy && (meeting.status === 'scheduled' || meeting.status === 'confirmed')) {
        slots.push({
          start: parseISO(meeting.start_time),
          end: parseISO(meeting.end_time),
          type: 'meeting',
          id: meeting.id,
          title: meeting.title,
        });
      }
    });

    return slots;
  }, [appointments, busyPeriods]);

  /**
   * Verifica se um horário está disponível
   */
  const checkAvailability = (startTime: Date, endTime: Date, excludeId?: string): AvailabilityCheck => {
    const conflicts: Conflict[] = [];

    busySlots.forEach((slot) => {
      // Ignorar o próprio evento se estiver editando
      if (excludeId && slot.id === excludeId) return;

      // Verificar sobreposição
      const overlaps =
        (startTime >= slot.start && startTime < slot.end) ||
        (endTime > slot.start && endTime <= slot.end) ||
        (startTime <= slot.start && endTime >= slot.end);

      if (overlaps) {
        conflicts.push({
          type: slot.type,
          id: slot.id,
          title: slot.title,
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
        });
      }
    });

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  };

  /**
   * Verifica se um horário está disponível (versão síncrona para uso em forms)
   */
  const isTimeSlotAvailable = (startTime: Date, endTime: Date, excludeId?: string): boolean => {
    return checkAvailability(startTime, endTime, excludeId).available;
  };

  /**
   * Retorna todos os períodos ocupados
   */
  const getBusyPeriods = () => {
    return busySlots;
  };

  /**
   * Verifica se há algum evento em um horário específico
   */
  const hasEventAt = (date: Date): boolean => {
    return busySlots.some((slot) => {
      return date >= slot.start && date < slot.end;
    });
  };

  return {
    checkAvailability,
    isTimeSlotAvailable,
    getBusyPeriods,
    hasEventAt,
    busySlots,
    isLoading: false, // Dados já vêm de hooks que gerenciam loading
  };
}

