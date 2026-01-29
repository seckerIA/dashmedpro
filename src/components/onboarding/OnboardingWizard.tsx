/**
 * OnboardingWizard Component
 *
 * Main container for the onboarding wizard. Handles step rendering,
 * navigation, and animations between steps.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OnboardingProgress } from './OnboardingProgress';
import { ClinicInfoStep } from './steps/ClinicInfoStep';
import { DoctorProfileStep } from './steps/DoctorProfileStep';
import { ProceduresStep } from './steps/ProceduresStep';
import { TeamStep } from './steps/TeamStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { useOnboarding } from '@/hooks/useOnboarding';
// Using logo from public folder
const dashmedLogo = '/dashmed transparente.png';

// Animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const {
    state,
    isLoading,
    isSaving,
    isCompleting,
    currentStep,
    totalSteps,
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
  } = useOnboarding();

  // Track direction for animation
  const direction = 1; // 1 = forward, -1 = backward

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClinicInfoStep
            data={state.clinicData}
            onChange={updateClinicData}
            isSlugAvailable={isSlugAvailable}
            checkingSlug={checkingSlug}
            onCheckSlug={checkSlugAvailability}
          />
        );
      case 2:
        return (
          <DoctorProfileStep
            data={state.doctorData}
            onChange={updateDoctorData}
            onSpecialtyChange={loadProceduresForSpecialty}
          />
        );
      case 3:
        return (
          <ProceduresStep
            procedures={state.procedures}
            onToggle={toggleProcedure}
            onAddCustom={addCustomProcedure}
            loading={loadingSpecialtyProcedures}
            specialty={state.doctorData.specialty}
          />
        );
      case 4:
        return (
          <TeamStep
            members={state.teamMembers}
            onAdd={addTeamMember}
            onRemove={removeTeamMember}
          />
        );
      case 5:
        return (
          <ConfirmationStep
            clinicData={state.clinicData}
            doctorData={state.doctorData}
            procedures={state.procedures}
            teamMembers={state.teamMembers}
            onEdit={goToStep}
            onComplete={completeOnboarding}
            isCompleting={isCompleting}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl min-h-screen flex flex-col">
        {/* Header with Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src={dashmedLogo} alt="DashMed Pro" className="h-12 w-auto" />
        </div>

        {/* Progress Bar */}
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          className="mb-8"
        />

        {/* Step Content */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-1"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer (not shown on confirmation step) */}
        {currentStep < totalSteps && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="text-muted-foreground hover:text-white disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Salvando...
                </span>
              )}

              <Button
                onClick={nextStep}
                disabled={!canProceed}
                className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 disabled:from-zinc-700 disabled:to-zinc-700 text-white shadow-lg shadow-primary/25 disabled:shadow-none"
              >
                {currentStep === 4 ? 'Revisar' : 'Continuar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
