import { useMedicalAppointments } from './useMedicalAppointments';
import { useMemo } from 'react';

/**
 * Hook to detect appointments that are overdue (>12 hours after start time)
 * and still pending payment confirmation
 */
export function useOverdueAppointments() {
  const { appointments, isLoading } = useMedicalAppointments({});

  const overdueAppointments = useMemo(() => {
    if (!appointments) return [];

    const now = new Date();

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      const hoursDiff = (now.getTime() - aptDate.getTime()) / (1000 * 60 * 60);

      return (
        hoursDiff > 12 &&
        apt.payment_status === 'pending' &&
        apt.status !== 'completed' &&
        apt.status !== 'no_show' &&
        apt.status !== 'cancelled'
      );
    });
  }, [appointments]);

  return {
    overdueAppointments,
    overdueCount: overdueAppointments.length,
    hasOverdue: overdueAppointments.length > 0,
    isLoading,
  };
}
