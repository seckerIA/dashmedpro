import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useSecretaryDoctors } from './useSecretaryDoctors';
import { differenceInMinutes, startOfDay, endOfDay, format } from 'date-fns';
import { MedicalAppointmentWithRelations } from '@/types/medicalAppointments';
import { useNavigate } from 'react-router-dom';

// LocalStorage key for dismissed alerts
const DISMISSED_ALERTS_KEY = 'dashmed_dismissed_appointment_alerts';

// Alert time window in minutes (show alert when appointment is within this many minutes)
const ALERT_WINDOW_MINUTES = 10;

// Polling interval in milliseconds
const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

interface DismissedAlert {
  appointmentId: string;
  dismissedAt: string; // ISO string
}

/**
 * Hook that monitors upcoming appointments and triggers alerts
 * 10 minutes before each scheduled consultation.
 *
 * Features:
 * - Respects user's enable_agenda_alerts preference
 * - Polls every 60 seconds for upcoming appointments
 * - Tracks dismissed alerts in localStorage
 * - Supports secretary viewing doctor appointments
 */
export function useAppointmentAlerts() {
  const { user } = useAuth();
  const { profile, isSecretaria, isMedico, isAdmin } = useUserProfile();
  const { doctorIds } = useSecretaryDoctors();
  const navigate = useNavigate();

  // State for the current alert to display
  const [currentAlert, setCurrentAlert] = useState<MedicalAppointmentWithRelations | null>(null);

  // Check if alerts are enabled for this user
  const alertsEnabled = profile?.enable_agenda_alerts ?? true;

  // Only doctors should see appointment alerts (not secretaries viewing others' appointments)
  const shouldMonitorAlerts = alertsEnabled && (isMedico || isAdmin);

  // Get dismissed alerts from localStorage
  const getDismissedAlerts = useCallback((): DismissedAlert[] => {
    try {
      const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
      if (!stored) return [];
      const alerts: DismissedAlert[] = JSON.parse(stored);

      // Clean up old dismissals (older than 24 hours)
      const now = new Date();
      const validAlerts = alerts.filter(alert => {
        const dismissedAt = new Date(alert.dismissedAt);
        const hoursSinceDismissal = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceDismissal < 24;
      });

      // Update storage if we cleaned any
      if (validAlerts.length !== alerts.length) {
        localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(validAlerts));
      }

      return validAlerts;
    } catch {
      return [];
    }
  }, []);

  // Check if an appointment has been dismissed
  const isAlertDismissed = useCallback((appointmentId: string): boolean => {
    const dismissed = getDismissedAlerts();
    return dismissed.some(alert => alert.appointmentId === appointmentId);
  }, [getDismissedAlerts]);

  // Dismiss an alert
  const dismissAlert = useCallback((appointmentId?: string) => {
    const idToDismiss = appointmentId || currentAlert?.id;
    if (!idToDismiss) return;

    const dismissed = getDismissedAlerts();
    dismissed.push({
      appointmentId: idToDismiss,
      dismissedAt: new Date().toISOString(),
    });
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));

    // Clear current alert if it's the one being dismissed
    if (currentAlert?.id === idToDismiss) {
      setCurrentAlert(null);
    }
  }, [currentAlert, getDismissedAlerts]);

  // Navigate to patient's medical record
  const openMedicalRecord = useCallback((appointment?: MedicalAppointmentWithRelations) => {
    const apt = appointment || currentAlert;
    if (!apt?.contact_id) return;

    // Dismiss the alert first
    dismissAlert(apt.id);

    // Navigate to medical records with the contact pre-selected
    navigate(`/prontuarios?contactId=${apt.contact_id}`);
  }, [currentAlert, navigate, dismissAlert]);

  // Query to fetch today's appointments
  const { data: todayAppointments } = useQuery({
    queryKey: ['appointment-alerts', user?.id, format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date();
      const dayStart = startOfDay(today).toISOString();
      const dayEnd = endOfDay(today).toISOString();

      // Build query for appointments
      let query = supabase
        .from('medical_appointments')
        .select(`
          id,
          title,
          appointment_type,
          status,
          start_time,
          end_time,
          duration_minutes,
          notes,
          contact_id,
          user_id,
          doctor_id,
          contact:crm_contacts!medical_appointments_contact_id_fkey(
            id,
            full_name,
            phone,
            email
          )
        `)
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd)
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true });

      // Filter by user_id or doctor_id
      if (isSecretaria && doctorIds && doctorIds.length > 0) {
        // Secretary sees their linked doctors' appointments
        query = query.or(`user_id.in.(${doctorIds.join(',')}),doctor_id.in.(${doctorIds.join(',')})`);
      } else {
        // Regular user sees their own appointments
        query = query.or(`user_id.eq.${user.id},doctor_id.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useAppointmentAlerts] Error fetching appointments:', error);
        return [];
      }

      return (data || []) as MedicalAppointmentWithRelations[];
    },
    enabled: shouldMonitorAlerts && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: POLL_INTERVAL_MS, // Poll every 60 seconds
    refetchIntervalInBackground: false, // Don't poll when tab is hidden
  });

  // Check for upcoming appointments and set alert
  useEffect(() => {
    if (!shouldMonitorAlerts || !todayAppointments || todayAppointments.length === 0) {
      return;
    }

    const checkUpcoming = () => {
      const now = new Date();

      // Find the first upcoming appointment within the alert window
      for (const appointment of todayAppointments) {
        const startTime = new Date(appointment.start_time);
        const minutesUntil = differenceInMinutes(startTime, now);

        // Check if appointment is within alert window and hasn't started yet
        if (minutesUntil > 0 && minutesUntil <= ALERT_WINDOW_MINUTES) {
          // Check if not already dismissed
          if (!isAlertDismissed(appointment.id)) {
            setCurrentAlert(appointment);
            return;
          }
        }
      }

      // No upcoming appointment found, clear alert
      if (currentAlert) {
        const currentStartTime = new Date(currentAlert.start_time);
        const currentMinutesUntil = differenceInMinutes(currentStartTime, now);

        // Clear if the current alert's appointment has passed
        if (currentMinutesUntil <= 0) {
          setCurrentAlert(null);
        }
      }
    };

    // Check immediately
    checkUpcoming();

    // Set up interval to check every 30 seconds
    const intervalId = setInterval(checkUpcoming, 30 * 1000);

    return () => clearInterval(intervalId);
  }, [todayAppointments, shouldMonitorAlerts, isAlertDismissed, currentAlert]);

  // Calculate minutes until appointment
  const minutesUntilAppointment = useMemo(() => {
    if (!currentAlert) return null;
    return differenceInMinutes(new Date(currentAlert.start_time), new Date());
  }, [currentAlert]);

  return {
    /** Current appointment to show alert for */
    currentAlert,
    /** Whether there's an active alert */
    hasAlert: !!currentAlert && !!minutesUntilAppointment && minutesUntilAppointment > 0,
    /** Minutes until the appointment starts */
    minutesUntilAppointment,
    /** Dismiss the current alert */
    dismissAlert,
    /** Open the patient's medical record */
    openMedicalRecord,
    /** Whether alerts are enabled for this user */
    alertsEnabled,
  };
}
