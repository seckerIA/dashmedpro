import { supabase } from '@/integrations/supabase/client';
import type { OrganizationPortalSettings } from '@/types/organization';

export async function updateOrganizationPortalSettings(
  organizationId: string,
  portal_settings: OrganizationPortalSettings,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-portal', {
    body: {
      action: 'update_portal_settings',
      organizationId,
      portal_settings,
    },
  });

  if (error) throw new Error(error.message);

  const body = data as { error?: string } | null;
  if (body && typeof body === 'object' && 'error' in body && body.error) {
    throw new Error(body.error);
  }
}
