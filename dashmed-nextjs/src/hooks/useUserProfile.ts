import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/lib/supabase/types';

type Profile = Tables<'profiles'>;

export function useUserProfile() {
    const supabase = createClient();

    const { data: user } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        },
        staleTime: Infinity, // User session rarely changes
        gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    });

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            return data as Profile | null;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60,
    });

    const isSecretaria = profile?.role === 'secretaria';
    const isAdmin = profile?.role === 'admin' || profile?.role === 'dono';
    const isMedico = profile?.role === 'medico';
    const isVendedor = profile?.role === 'vendedor';

    return {
        user,
        profile,
        isLoading,
        isSecretaria,
        isAdmin,
        isMedico,
        isVendedor,
    };
}
