import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

const SELF_VALUE = '__self__';

interface SecretaryOption {
  id: string;
  full_name: string | null;
  email: string;
}

interface ScheduledBySelectorProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** ID do médico vinculado (para filtrar secretárias relacionadas). Se não informado, busca todas da org. */
  doctorId?: string;
}

/**
 * Mostra um seletor "Agendado por" que permite a quem está logado (médico/dono/admin)
 * atribuir manualmente o crédito do agendamento a uma secretária da equipe.
 *
 * Regras:
 * - Secretárias logadas NÃO veem o seletor (o sistema grava auth.uid() automaticamente).
 * - Médicos veem apenas suas secretárias vinculadas em `secretary_doctor_links`.
 * - Admins/Donos veem todas as secretárias ativas da organização.
 */
export function ScheduledBySelector({ value, onChange, doctorId }: ScheduledBySelectorProps) {
  const { user } = useAuth();
  const { profile, isAdmin, isMedico, isSecretaria } = useUserProfile();

  const [options, setOptions] = useState<SecretaryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const orgId = profile?.organization_id ?? null;

  // Secretária logada: não precisa de seletor, o auth.uid() resolve.
  const shouldRender = !isSecretaria && !!profile;

  useEffect(() => {
    if (!shouldRender || !user?.id) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        // Médico (não admin): apenas secretárias vinculadas a ELE (ou ao doctorId selecionado, se houver)
        if (isMedico && !isAdmin) {
          const targetDoctor = doctorId || user.id;
          const { data: links } = await supabase
            .from('secretary_doctor_links')
            .select('secretary_id')
            .eq('doctor_id', targetDoctor);

          const ids = (links || []).map((l: { secretary_id: string }) => l.secretary_id);
          if (ids.length === 0) {
            if (!cancelled) setOptions([]);
            return;
          }

          const { data: secs } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'secretaria')
            .eq('is_active', true)
            .in('id', ids)
            .order('full_name', { ascending: true });
          if (!cancelled) setOptions((secs as SecretaryOption[]) || []);
          return;
        }

        // Admin/Dono: todas as secretárias ativas da org (com filtro opcional por médico)
        if (doctorId) {
          const { data: links } = await supabase
            .from('secretary_doctor_links')
            .select('secretary_id')
            .eq('doctor_id', doctorId);
          const ids = (links || []).map((l: { secretary_id: string }) => l.secretary_id);
          if (ids.length === 0) {
            if (!cancelled) setOptions([]);
            return;
          }
          const { data: secs } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('role', 'secretaria')
            .eq('is_active', true)
            .in('id', ids)
            .order('full_name', { ascending: true });
          if (!cancelled) setOptions((secs as SecretaryOption[]) || []);
          return;
        }

        const baseQuery = supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('role', 'secretaria')
          .eq('is_active', true)
          .order('full_name', { ascending: true });
        const finalQuery = orgId ? baseQuery.eq('organization_id', orgId) : baseQuery;
        const { data: secs } = await finalQuery;
        if (!cancelled) setOptions((secs as SecretaryOption[]) || []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [shouldRender, user?.id, orgId, doctorId, isMedico, isAdmin]);

  const selectValue = value ?? SELF_VALUE;
  const selfLabel = useMemo(() => {
    const name = (profile as any)?.full_name || user?.email || 'Eu';
    return `Eu mesmo (${name})`;
  }, [profile, user?.email]);

  if (!shouldRender) return null;

  return (
    <div className="space-y-2">
      <Label htmlFor="scheduled_by" className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-muted-foreground" />
        Agendado por
        <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
      </Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === SELF_VALUE ? undefined : v)}
        disabled={isLoading}
      >
        <SelectTrigger id="scheduled_by">
          <SelectValue
            placeholder={isLoading ? 'Carregando equipe…' : 'Atribuir o crédito a uma secretária'}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELF_VALUE}>
            <span className="text-muted-foreground">{selfLabel}</span>
          </SelectItem>
          {isLoading ? (
            <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando…
            </div>
          ) : options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">
              Nenhuma secretária ativa encontrada.
            </div>
          ) : (
            options.map((sec) => (
              <SelectItem key={sec.id} value={sec.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{sec.full_name || sec.email}</span>
                  <span className="text-xs text-muted-foreground">{sec.email}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Se deixar como "Eu mesmo", o crédito do agendamento fica com você.
      </p>
    </div>
  );
}
