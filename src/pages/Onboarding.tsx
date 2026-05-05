/**
 * Onboarding Page
 *
 * Main page for the customer onboarding wizard.
 * Displays the OnboardingWizard component for new users who haven't
 * completed their initial setup.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingWizard } from '@/components/onboarding';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

/** Conta já passou pelo cadastro da clínica (flag ou organização vinculada). */
function isOnboardingDone(profile: {
  onboarding_completed?: boolean | null;
  organization_id?: string | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.onboarding_completed === true) return true;
  // complete-onboarding sempre define organization_id; se flag vier null por inconsistência, não prende no wizard
  return Boolean(profile.organization_id);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (!profileLoading && profile && isOnboardingDone(profile)) {
      navigate('/', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  // Show loading while checking auth/profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and hasn't completed onboarding, show wizard
  if (user && profile && !isOnboardingDone(profile)) {
    return <OnboardingWizard />;
  }

  // Sem linha em profiles ainda — primeiro acesso / trigger pendente
  if (user && !profile) {
    return <OnboardingWizard />;
  }

  // Fallback loading state (shouldn't normally reach here)
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );
}
