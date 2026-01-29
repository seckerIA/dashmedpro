/**
 * ConfirmationStep Component
 *
 * Step 5: Final confirmation and summary
 * - Shows summary of all collected data
 * - Allows editing by going back to specific steps
 * - Final "Start Using" button to complete onboarding
 */

import { Sparkles, Building2, Stethoscope, Syringe, Users, Edit2, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  OnboardingClinicData,
  OnboardingDoctorData,
  OnboardingProcedure,
  OnboardingTeamMember,
  formatCurrency,
  getSpecialtyInfo,
} from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface ConfirmationStepProps {
  clinicData: OnboardingClinicData;
  doctorData: OnboardingDoctorData;
  procedures: OnboardingProcedure[];
  teamMembers: OnboardingTeamMember[];
  onEdit: (step: number) => void;
  onComplete: () => Promise<void>;
  isCompleting: boolean;
}

export function ConfirmationStep({
  clinicData,
  doctorData,
  procedures,
  teamMembers,
  onEdit,
  onComplete,
  isCompleting,
}: ConfirmationStepProps) {
  const specialtyInfo = getSpecialtyInfo(doctorData.specialty);
  const selectedProcedures = procedures.filter(p => p.isSelected);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Tudo Pronto!</h1>
        <p className="text-muted-foreground text-lg">
          Confira seus dados antes de finalizar
        </p>
      </div>

      {/* Summary Cards */}
      <div className="max-w-lg mx-auto grid gap-4 sm:grid-cols-2">
        {/* Clinic Card */}
        <SummaryCard
          icon={<Building2 className="w-5 h-5" />}
          iconColor="text-primary"
          title="Clinica"
          onEdit={() => onEdit(1)}
        >
          <p className="text-white font-medium">{clinicData.name || '-'}</p>
          {clinicData.city && (
            <p className="text-sm text-muted-foreground">{clinicData.city}</p>
          )}
          {clinicData.slug && (
            <p className="text-xs text-muted-foreground mt-1">
              dashmed.pro/{clinicData.slug}
            </p>
          )}
        </SummaryCard>

        {/* Doctor Card */}
        <SummaryCard
          icon={<Stethoscope className="w-5 h-5" />}
          iconColor="text-blue-400"
          title="Medico"
          onEdit={() => onEdit(2)}
        >
          <p className="text-white font-medium">{doctorData.fullName || '-'}</p>
          {specialtyInfo && (
            <p className="text-sm text-muted-foreground">
              {specialtyInfo.emoji} {specialtyInfo.label}
            </p>
          )}
          <p className="text-sm text-primary mt-1">
            Consulta: {formatCurrency(doctorData.consultationValue || 0)}
          </p>
        </SummaryCard>

        {/* Procedures Card */}
        <SummaryCard
          icon={<Syringe className="w-5 h-5" />}
          iconColor="text-blue-400"
          title="Procedimentos"
          onEdit={() => onEdit(3)}
        >
          {selectedProcedures.length > 0 ? (
            <>
              {selectedProcedures.slice(0, 3).map((p) => (
                <p key={p.id} className="text-sm text-muted-foreground truncate">
                  • {p.name}
                </p>
              ))}
              {selectedProcedures.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{selectedProcedures.length - 3} mais
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum adicionado</p>
          )}
        </SummaryCard>

        {/* Team Card */}
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          iconColor="text-blue-400"
          title="Equipe"
          onEdit={() => onEdit(4)}
        >
          {teamMembers.length > 0 ? (
            teamMembers.map((m) => (
              <p key={m.id} className="text-sm text-muted-foreground truncate">
                • {m.name}{' '}
                <span className="text-muted-foreground/60">
                  ({m.role === 'secretaria' ? 'Secretaria' : 'Medico'})
                </span>
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Voce pode adicionar depois
            </p>
          )}
        </SummaryCard>
      </div>

      {/* Complete Button */}
      <div className="max-w-md mx-auto pt-4">
        <Button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-full py-6 text-lg bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 disabled:from-zinc-600 disabled:to-zinc-700 text-white rounded-xl font-semibold shadow-lg shadow-primary/25 disabled:shadow-none"
        >
          {isCompleting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Configurando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Comecar a Usar
            </span>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Ao continuar, voce concorda com os termos de uso do DashMed Pro
        </p>
      </div>
    </div>
  );
}

// ============================================
// Summary Card Component
// ============================================
interface SummaryCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function SummaryCard({ icon, iconColor, title, onEdit, children }: SummaryCardProps) {
  return (
    <div className="relative p-4 bg-card rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn('flex items-center gap-2', iconColor)}>
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <button
          onClick={onEdit}
          className="text-muted-foreground hover:text-white transition-colors p-1"
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
