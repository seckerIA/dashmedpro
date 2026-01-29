/**
 * ClinicInfoStep Component
 *
 * Step 1: Collects basic clinic information
 * - Clinic name
 * - URL slug (auto-generated, editable)
 * - Phone number
 * - City
 */

import { useEffect, useCallback } from 'react';
import { Building2, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingClinicData, generateSlug, formatPhone } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

interface ClinicInfoStepProps {
  data: OnboardingClinicData;
  onChange: (data: Partial<OnboardingClinicData>) => void;
  isSlugAvailable: boolean | null;
  checkingSlug: boolean;
  onCheckSlug: (slug: string) => void;
}

export function ClinicInfoStep({
  data,
  onChange,
  isSlugAvailable,
  checkingSlug,
  onCheckSlug,
}: ClinicInfoStepProps) {
  // Debounced slug check
  const debouncedCheckSlug = useDebouncedCallback((slug: string) => {
    onCheckSlug(slug);
  }, 500);

  // Auto-generate slug from clinic name
  const handleNameChange = useCallback((name: string) => {
    const newSlug = generateSlug(name);
    onChange({ name, slug: newSlug });
    if (newSlug) {
      debouncedCheckSlug(newSlug);
    }
  }, [onChange, debouncedCheckSlug]);

  // Handle manual slug change
  const handleSlugChange = useCallback((rawSlug: string) => {
    const slug = generateSlug(rawSlug);
    onChange({ slug });
    if (slug) {
      debouncedCheckSlug(slug);
    }
  }, [onChange, debouncedCheckSlug]);

  // Handle phone change with formatting
  const handlePhoneChange = useCallback((value: string) => {
    onChange({ phone: formatPhone(value) });
  }, [onChange]);

  // Check initial slug if exists
  useEffect(() => {
    if (data.slug && isSlugAvailable === null) {
      onCheckSlug(data.slug);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">
          Bem-vindo ao{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            DashMed Pro
          </span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Vamos configurar sua clinica em poucos passos
        </p>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto space-y-6">
        {/* Clinic Name */}
        <div className="space-y-2">
          <Label htmlFor="clinic-name" className="text-muted-foreground">
            Nome da Clinica <span className="text-destructive">*</span>
          </Label>
          <Input
            id="clinic-name"
            value={data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Clinica Estetica Beleza"
            className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="clinic-slug" className="text-muted-foreground">
            Endereco Web
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              dashmed.pro/
            </div>
            <Input
              id="clinic-slug"
              value={data.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="sua-clinica"
              className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary pl-[100px] pr-10"
            />
            {/* Slug validation indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checkingSlug && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {!checkingSlug && isSlugAvailable === true && (
                <Check className="w-4 h-4 text-primary" />
              )}
              {!checkingSlug && isSlugAvailable === false && (
                <X className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          {data.slug && (
            <p className={cn(
              'text-xs',
              isSlugAvailable === true && 'text-primary',
              isSlugAvailable === false && 'text-destructive',
              isSlugAvailable === null && 'text-muted-foreground'
            )}>
              {isSlugAvailable === true && 'Endereco disponivel!'}
              {isSlugAvailable === false && 'Este endereco ja esta em uso'}
              {isSlugAvailable === null && `Seu link: dashmed.pro/${data.slug}`}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="clinic-phone" className="text-muted-foreground">
            Telefone
          </Label>
          <Input
            id="clinic-phone"
            value={data.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="clinic-city" className="text-muted-foreground">
            Cidade
          </Label>
          <Input
            id="clinic-city"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Sao Paulo"
            className="bg-card border-border text-white placeholder:text-zinc-600 focus:ring-ring focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
