/**
 * Hook for fetching VOIP call history
 * @module hooks/useCallHistory
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSecretaryDoctors } from '@/hooks/useSecretaryDoctors';
import { useUserProfile } from '@/hooks/useUserProfile';
import { createVisibilityAwareInterval } from '@/lib/queryUtils';
import type { VOIPCallSessionWithRelations, VOIPCallDirection } from '@/types/voip';

export const VOIP_CALL_HISTORY_KEY = 'voip-call-history';

interface UseCallHistoryOptions {
  limit?: number;
  contactId?: string;
  conversationId?: string;
  direction?: VOIPCallDirection;
  enabled?: boolean;
}

export function useCallHistory(options: UseCallHistoryOptions = {}) {
  const {
    limit = 50,
    contactId,
    conversationId,
    direction,
    enabled = true,
  } = options;

  const { user } = useAuth();
  const { profile, isSecretaria } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();

  // Build list of user IDs to query
  const userIds = user?.id
    ? isSecretaria && doctorIds?.length
      ? [...doctorIds, user.id]
      : [user.id]
    : [];

  const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';

  return useQuery({
    queryKey: [VOIP_CALL_HISTORY_KEY, userIds, contactId, conversationId, direction, limit],
    queryFn: async (): Promise<VOIPCallSessionWithRelations[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('voip_call_sessions' as any)
        .select(`
          *,
          contact:crm_contacts(id, full_name, phone, email)
        `)
        .order('initiated_at', { ascending: false })
        .limit(limit);

      // Apply user filter (skip for admin/dono)
      if (!isAdmin && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      // Apply optional filters
      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      }

      if (direction) {
        query = query.eq('direction', direction);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useCallHistory] Fetch error:', error);
        throw error;
      }

      return (data || []) as VOIPCallSessionWithRelations[];
    },
    enabled: enabled && !!user?.id && (!isSecretaria || !isLoadingDoctors),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: createVisibilityAwareInterval(60 * 1000), // 1 minute auto-refresh (quando tab visível)
  });
}

/**
 * Hook for fetching recent calls (last 24 hours)
 */
export function useRecentCalls(limit = 10) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();

  const isSecretaria = profile?.role === 'secretaria';
  const userIds = user?.id
    ? isSecretaria && doctorIds?.length
      ? [...doctorIds, user.id]
      : [user.id]
    : [];

  const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';

  return useQuery({
    queryKey: ['voip-recent-calls', userIds, limit],
    queryFn: async (): Promise<VOIPCallSessionWithRelations[]> => {
      if (!user?.id) return [];

      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      let query = supabase
        .from('voip_call_sessions' as any)
        .select(`
          *,
          contact:crm_contacts(id, full_name, phone, email)
        `)
        .gte('initiated_at', yesterday.toISOString())
        .order('initiated_at', { ascending: false })
        .limit(limit);

      if (!isAdmin && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useRecentCalls] Fetch error:', error);
        throw error;
      }

      return (data || []) as VOIPCallSessionWithRelations[];
    },
    enabled: !!user?.id && (!isSecretaria || !isLoadingDoctors),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for call statistics
 */
export function useCallStats() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { doctorIds, isLoading: isLoadingDoctors } = useSecretaryDoctors();

  const isSecretaria = profile?.role === 'secretaria';
  const userIds = user?.id
    ? isSecretaria && doctorIds?.length
      ? [...doctorIds, user.id]
      : [user.id]
    : [];

  const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';

  return useQuery({
    queryKey: ['voip-call-stats', userIds],
    queryFn: async () => {
      if (!user?.id) {
        return {
          totalCalls: 0,
          completedCalls: 0,
          missedCalls: 0,
          averageDuration: 0,
          todayCalls: 0,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from('voip_call_sessions' as any)
        .select('status, duration_seconds, initiated_at');

      if (!isAdmin && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useCallStats] Fetch error:', error);
        throw error;
      }

      const calls = data || [];

      const totalCalls = calls.length;
      const completedCalls = calls.filter((c: any) => c.status === 'completed').length;
      const missedCalls = calls.filter((c: any) =>
        ['no_answer', 'busy', 'failed', 'cancelled'].includes(c.status)
      ).length;

      const completedDurations = calls
        .filter((c: any) => c.status === 'completed' && c.duration_seconds > 0)
        .map((c: any) => c.duration_seconds);

      const averageDuration = completedDurations.length > 0
        ? Math.round(completedDurations.reduce((a: number, b: number) => a + b, 0) / completedDurations.length)
        : 0;

      const todayCalls = calls.filter((c: any) =>
        new Date(c.initiated_at) >= today
      ).length;

      return {
        totalCalls,
        completedCalls,
        missedCalls,
        averageDuration,
        todayCalls,
      };
    },
    enabled: !!user?.id && (!isSecretaria || !isLoadingDoctors),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
