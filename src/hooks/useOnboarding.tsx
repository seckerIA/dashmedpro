/**
 * useOnboarding Hook
 *
 * Manages the onboarding wizard state, persistence, and completion.
 * Persists progress to onboarding_state table so users can resume if they refresh.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  OnboardingState,
  OnboardingClinicData,
  OnboardingDoctorData,
  OnboardingProcedure,
  OnboardingTeamMember,
  OnboardingStateDB,
  SpecialtyProcedure,
  OnboardingCompletionPayload,
  DEFAULT_ONBOARDING_STATE,
  TOTAL_ONBOARDING_STEPS,
} from '@/types/onboarding';

// ============================================
// Hook Return Type
// ============================================
interface UseOnboardingReturn {
  // State
  state: OnboardingState;
  isLoading: boolean;
  isSaving: boolean;
  isCompleting: boolean;
  error: Error | null;

  // Step Navigation
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  canProceed: boolean;

  // Data Updates
  updateClinicData: (data: Partial<OnboardingClinicData>) => void;
  updateDoctorData: (data: Partial<OnboardingDoctorData>) => void;
  updateProcedures: (procedures: OnboardingProcedure[]) => void;
  toggleProcedure: (procedureId: string) => void;
  addCustomProcedure: (procedure: Omit<OnboardingProcedure, 'id' | 'isSelected' | 'isCustom'>) => void;
  updateTeamMembers: (members: OnboardingTeamMember[]) => void;
  addTeamMember: (member: Omit<OnboardingTeamMember, 'id'>) => void;
  removeTeamMember: (memberId: string) => void;

  // Specialty Procedures
  specialtyProcedures: SpecialtyProcedure[];
  loadingSpecialtyProcedures: boolean;
  loadProceduresForSpecialty: (specialty: string) => void;

  // Completion
  completeOnboarding: () => Promise<void>;

  // Slug Validation
  isSlugAvailable: boolean | null;
  checkingSlug: boolean;
  checkSlugAvailability: (slug: string) => void;
}

// ============================================
// Main Hook
// ============================================
export function useOnboarding(): UseOnboardingReturn {
  const { user, refreshOrganization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for the wizard
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  // ============================================
  // Load saved onboarding state from database
  // ============================================
  const {
    data: savedState,
    isLoading: loadingState,
    error: stateError,
  } = useQuery({
    queryKey: ['onboarding-state', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('onboarding_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as OnboardingStateDB | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // ============================================
  // Load specialty procedures from database
  // ============================================
  const {
    data: specialtyProcedures = [],
    isLoading: loadingSpecialtyProcedures,
  } = useQuery({
    queryKey: ['specialty-procedures', selectedSpecialty],
    queryFn: async () => {
      if (!selectedSpecialty) return [];

      const { data, error } = await supabase
        .from('specialty_procedures')
        .select('*')
        .eq('specialty', selectedSpecialty)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as SpecialtyProcedure[];
    },
    enabled: !!selectedSpecialty,
  });

  // ============================================
  // Helper to deduplicate procedures by normalized name
  // ============================================
  const deduplicateProcedures = useCallback((procedures: OnboardingProcedure[]) => {
    const seen = new Map<string, OnboardingProcedure>();
    for (const proc of procedures) {
      const normalizedName = proc.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Keep the first occurrence (or prefer the one with isSelected: true)
      if (!seen.has(normalizedName) || (proc.isSelected && !seen.get(normalizedName)?.isSelected)) {
        seen.set(normalizedName, proc);
      }
    }
    return Array.from(seen.values());
  }, []);

  // ============================================
  // Initialize state from saved data
  // ============================================
  useEffect(() => {
    if (savedState) {
      // Deduplicate procedures from saved state to remove any legacy duplicates
      const cleanedProcedures = deduplicateProcedures(savedState.procedures_data || []);

      setState({
        currentStep: savedState.current_step || 1,
        clinicData: savedState.clinic_data || DEFAULT_ONBOARDING_STATE.clinicData,
        doctorData: savedState.doctor_data || DEFAULT_ONBOARDING_STATE.doctorData,
        procedures: cleanedProcedures,
        teamMembers: savedState.team_data || [],
      });

      // If doctor has a specialty, load procedures for it
      if (savedState.doctor_data?.specialty) {
        setSelectedSpecialty(savedState.doctor_data.specialty);
      }
    }
  }, [savedState, deduplicateProcedures]);

  // ============================================
  // Save state to database (debounced)
  // ============================================
  const saveState = useCallback(async (newState: OnboardingState) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        current_step: newState.currentStep,
        clinic_data: newState.clinicData,
        doctor_data: newState.doctorData,
        procedures_data: newState.procedures,
        team_data: newState.teamMembers,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('onboarding_state')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // ============================================
  // Step Navigation
  // ============================================
  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, TOTAL_ONBOARDING_STEPS);
      const newState = { ...prev, currentStep: newStep };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const prevStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.max(prev.currentStep - 1, 1);
      const newState = { ...prev, currentStep: newStep };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > TOTAL_ONBOARDING_STEPS) return;
    setState(prev => {
      const newState = { ...prev, currentStep: step };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // ============================================
  // Validation - Can proceed to next step?
  // ============================================
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 1: // Clinic Info
        return !!(
          state.clinicData.name.trim() &&
          state.clinicData.slug.trim() &&
          isSlugAvailable !== false
        );
      case 2: // Doctor Profile
        return !!(
          state.doctorData.fullName.trim() &&
          state.doctorData.specialty &&
          state.doctorData.consultationValue > 0
        );
      case 3: // Procedures
        return state.procedures.some(p => p.isSelected);
      case 4: // Team (optional)
        return true; // Always can proceed from team step
      case 5: // Confirmation
        return true;
      default:
        return false;
    }
  }, [state, isSlugAvailable]);

  // ============================================
  // Data Update Functions
  // ============================================
  const updateClinicData = useCallback((data: Partial<OnboardingClinicData>) => {
    setState(prev => {
      const newState = {
        ...prev,
        clinicData: { ...prev.clinicData, ...data },
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const updateDoctorData = useCallback((data: Partial<OnboardingDoctorData>) => {
    setState(prev => {
      const newState = {
        ...prev,
        doctorData: { ...prev.doctorData, ...data },
      };

      // If specialty changed, load new procedures
      if (data.specialty && data.specialty !== prev.doctorData.specialty) {
        setSelectedSpecialty(data.specialty);
      }

      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const updateProcedures = useCallback((procedures: OnboardingProcedure[]) => {
    setState(prev => {
      const newState = { ...prev, procedures };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const toggleProcedure = useCallback((procedureId: string) => {
    setState(prev => {
      const newProcedures = prev.procedures.map(p =>
        p.id === procedureId ? { ...p, isSelected: !p.isSelected } : p
      );
      const newState = { ...prev, procedures: newProcedures };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const addCustomProcedure = useCallback((procedure: Omit<OnboardingProcedure, 'id' | 'isSelected' | 'isCustom'>) => {
    setState(prev => {
      const newProcedure: OnboardingProcedure = {
        ...procedure,
        id: `custom-${Date.now()}`,
        isSelected: true,
        isCustom: true,
      };
      const newState = {
        ...prev,
        procedures: [...prev.procedures, newProcedure],
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const updateTeamMembers = useCallback((members: OnboardingTeamMember[]) => {
    setState(prev => {
      const newState = { ...prev, teamMembers: members };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const addTeamMember = useCallback((member: Omit<OnboardingTeamMember, 'id'>) => {
    setState(prev => {
      const newMember: OnboardingTeamMember = {
        ...member,
        id: `member-${Date.now()}`,
      };
      const newState = {
        ...prev,
        teamMembers: [...prev.teamMembers, newMember],
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const removeTeamMember = useCallback((memberId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        teamMembers: prev.teamMembers.filter(m => m.id !== memberId),
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // ============================================
  // Load specialty procedures
  // ============================================
  const loadProceduresForSpecialty = useCallback((specialty: string) => {
    setSelectedSpecialty(specialty);
  }, []);

  // Helper function to normalize names for comparison (removes accents, lowercase)
  const normalizeName = useCallback((name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    []);

  // Convert specialty procedures to onboarding procedures when loaded
  useEffect(() => {
    // We always want a "Consulta" item at the very least
    const ensureConsultationExists = (existingProcedures: OnboardingProcedure[]) => {
      const hasConsultation = existingProcedures.some(p => p.category === 'consultation' || normalizeName(p.name).includes('consulta'));
      if (!hasConsultation && state.doctorData.consultationValue > 0) {
        return [
          {
            id: 'default-consultation',
            name: 'Consulta',
            category: 'consultation' as const,
            price: state.doctorData.consultationValue,
            durationMinutes: 30,
            isSelected: true,
            isCustom: false,
          },
          ...existingProcedures
        ];
      }
      return existingProcedures;
    };

    if (selectedSpecialty) {
      setState(prev => {
        const existingNames = new Set(prev.procedures.map(p => normalizeName(p.name)));

        // Map new specialty procedures
        const newSpecialtyProcs = specialtyProcedures
          .filter(sp => !existingNames.has(normalizeName(sp.name)))
          .map(sp => ({
            id: sp.id,
            name: sp.name,
            category: sp.category as OnboardingProcedure['category'],
            price: sp.default_price,
            durationMinutes: sp.default_duration_minutes,
            description: sp.description,
            isSelected: sp.category === 'consultation', // Pre-select consultations
            isCustom: false,
          }));

        const combined = [...prev.procedures, ...newSpecialtyProcs];
        const withConsultation = ensureConsultationExists(combined);

        if (withConsultation.length === prev.procedures.length) return prev;

        return {
          ...prev,
          procedures: withConsultation,
        };
      });
    }
  }, [specialtyProcedures, selectedSpecialty, normalizeName, state.doctorData.consultationValue]);

  // Sync consultationValue from Step 2 with the main "Consulta" procedure
  useEffect(() => {
    if (state.doctorData.consultationValue > 0) {
      setState(prev => {
        const consultIdx = prev.procedures.findIndex(p => p.category === 'consultation');
        if (consultIdx !== -1) {
          if (prev.procedures[consultIdx].price !== state.doctorData.consultationValue) {
            const newProcedures = [...prev.procedures];
            newProcedures[consultIdx] = {
              ...newProcedures[consultIdx],
              price: state.doctorData.consultationValue,
              isSelected: true
            };
            return { ...prev, procedures: newProcedures };
          }
        }
        return prev;
      });
    }
  }, [state.doctorData.consultationValue]);

  // ============================================
  // Slug Availability Check
  // ============================================
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug.trim()) {
      setIsSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug.toLowerCase())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsSlugAvailable(!data); // Available if no matching org found
    } catch (error) {
      console.error('Error checking slug:', error);
      setIsSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  // ============================================
  // Complete Onboarding
  // ============================================
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prepare procedures, ensuring at least one consultation matches doctor's input
      let finalProcedures = state.procedures
        .filter(p => p.isSelected)
        .map(({ id, isSelected, isCustom, ...rest }) => rest);

      const hasConsultation = finalProcedures.some(p => p.category === 'consultation');
      if (!hasConsultation && state.doctorData.consultationValue > 0) {
        finalProcedures.push({
          name: 'Consulta',
          category: 'consultation',
          price: state.doctorData.consultationValue,
          durationMinutes: 30,
        });
      }

      const payload: OnboardingCompletionPayload = {
        clinic: state.clinicData,
        doctor: state.doctorData,
        procedures: finalProcedures,
        teamMembers: state.teamMembers.map(({ id, ...rest }) => rest),
      };

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('complete-onboarding', {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: async () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-state'] });

      // Refresh organization context so dashboard loads correctly
      await refreshOrganization();

      toast({
        title: 'Configuracao concluida!',
        description: 'Sua clinica esta pronta para uso.',
      });
    },
    onError: (error: Error) => {
      console.error('Onboarding completion error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao finalizar',
        description: error.message || 'Tente novamente.',
      });
    },
  });

  const completeOnboarding = useCallback(async () => {
    await completeMutation.mutateAsync();
  }, [completeMutation]);

  // ============================================
  // Return
  // ============================================
  return {
    state,
    isLoading: loadingState,
    isSaving,
    isCompleting: completeMutation.isPending,
    error: stateError as Error | null,

    currentStep: state.currentStep,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    nextStep,
    prevStep,
    goToStep,
    canProceed,

    updateClinicData,
    updateDoctorData,
    updateProcedures,
    toggleProcedure,
    addCustomProcedure,
    updateTeamMembers,
    addTeamMember,
    removeTeamMember,

    specialtyProcedures,
    loadingSpecialtyProcedures,
    loadProceduresForSpecialty,

    completeOnboarding,

    isSlugAvailable,
    checkingSlug,
    checkSlugAvailability,
  };
}
