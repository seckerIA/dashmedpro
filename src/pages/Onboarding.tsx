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
    if (!profileLoading && profile?.onboarding_completed === true) {
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
  if (user && (!profile?.onboarding_completed)) {
    return <OnboardingWizard />;
  }

  // Fallback loading state (shouldn't normally reach here)
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  );
}
