/**
 * DoctorProfileStep Component
 *
 * Step 2: Collects doctor profile information
 * - Full name
 * - Medical specialty (with visual selection)
 * - Default consultation value
 */

import { Stethoscope, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingDoctorData, MEDICAL_SPECIALTIES, formatCurrency } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface DoctorProfileStepProps {
  data: OnboardingDoctorData;
  onChange: (data: Partial<OnboardingDoctorData>) => void;
  onSpecialtyChange: (specialty: string) => void;
}

export function DoctorProfileStep({
  data,
  onChange,
  onSpecialtyChange,
}: DoctorProfileStepProps) {
  // Handle specialty selection
  const handleSpecialtySelect = (specialty: string) => {
    onChange({ specialty });
    onSpecialtyChange(specialty);
  };

  // Handle consultation value (currency input)
  const handleValueChange = (value: string) => {
    // Remove non-numeric characters except comma and dot
    const cleaned = value.replace(/[^\d,]/g, '');
    // Parse to number (Brazilian format: comma as decimal separator)
    const numValue = parseFloat(cleaned.replace(',', '.')) || 0;
    onChange({ consultationValue: numValue });
  };

  // Format display value
  const displayValue = data.consultationValue > 0
    ? data.consultationValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Seu Perfil</h1>
        <p className="text-muted-foreground text-lg">
          Configure seu perfil e escolha sua especialidade
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="doctor-name" className="text-muted-foreground">
            Seu Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="doctor-name"
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Dr. Joao Silva"
            className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary"
          />
        </div>

        {/* Consultation Value */}
        <div className="space-y-2">
          <Label htmlFor="consultation-value" className="text-muted-foreground">
            Valor da Consulta <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <Input
              id="consultation-value"
              value={displayValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="350"
              className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Valor padrao para novas consultas
          </p>
        </div>
      </div>

      {/* Specialty Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white text-center">
          Sua Especialidade <span className="text-destructive">*</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {MEDICAL_SPECIALTIES.map((specialty) => {
            const isSelected = data.specialty === specialty.value;

            return (
              <button
                key={specialty.value}
                type="button"
                onClick={() => handleSpecialtySelect(specialty.value)}
                className={cn(
                  'relative w-full text-left p-4 rounded-2xl border transition-all duration-300',
                  isSelected
                    ? 'border-primary/50 bg-primary/10 scale-[1.02]'
                    : 'border-border bg-zinc-900/30 hover:border-zinc-700'
                )}
              >
                {/* Background gradient when selected */}
                {isSelected && (
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-10 rounded-2xl',
                      specialty.color
                    )}
                  />
                )}

                <div className="relative flex flex-col items-center gap-2 text-center">
                  {/* Emoji/Icon */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                      isSelected
                        ? `bg-gradient-to-br ${specialty.color}`
                        : 'bg-muted'
                    )}
                  >
                    {specialty.emoji}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-white' : 'text-muted-foreground'
                    )}
                  >
                    {specialty.label}
                  </span>

                  {/* Check indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
