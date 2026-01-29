/**
 * ProceduresStep Component
 *
 * Step 3: Procedure selection based on specialty
 * - Shows suggested procedures for the selected specialty
 * - Allows toggling procedures on/off
 * - Supports adding custom procedures
 */

import { useState } from 'react';
import { Syringe, Plus, Loader2, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OnboardingProcedure, formatCurrency, getSpecialtyInfo } from '@/types/onboarding';
import { formatCurrencyInput, parseCurrencyToNumber } from '@/lib/currency';
import { cn } from '@/lib/utils';

// Helper function to format duration display
const formatDuration = (minutes: number) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes} min`;
};

interface ProceduresStepProps {
  procedures: OnboardingProcedure[];
  onToggle: (procedureId: string) => void;
  onAddCustom: (procedure: Omit<OnboardingProcedure, 'id' | 'isSelected' | 'isCustom'>) => void;
  loading: boolean;
  specialty: string;
}

export function ProceduresStep({
  procedures,
  onToggle,
  onAddCustom,
  loading,
  specialty,
}: ProceduresStepProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customProcedure, setCustomProcedure] = useState({
    name: '',
    category: 'procedure' as OnboardingProcedure['category'],
    price: 0,
    priceDisplay: '',
    durationHours: 0,
    durationMinutes: 30,
  });

  const specialtyInfo = getSpecialtyInfo(specialty);
  const selectedCount = procedures.filter(p => p.isSelected).length;

  // Handler for price input with R$ formatting
  const handlePriceChange = (value: string) => {
    const formatted = formatCurrencyInput(value);
    const numericValue = parseCurrencyToNumber(formatted) || 0;
    setCustomProcedure(prev => ({
      ...prev,
      priceDisplay: formatted,
      price: numericValue,
    }));
  };

  const handleAddCustom = () => {
    if (!customProcedure.name.trim() || customProcedure.price <= 0) return;

    // Calculate total minutes from hours + minutes
    const totalMinutes = (customProcedure.durationHours * 60) + customProcedure.durationMinutes;

    onAddCustom({
      name: customProcedure.name,
      category: customProcedure.category,
      price: customProcedure.price,
      durationMinutes: totalMinutes > 0 ? totalMinutes : 30,
    });

    // Reset form
    setCustomProcedure({
      name: '',
      category: 'procedure',
      price: 0,
      priceDisplay: '',
      durationHours: 0,
      durationMinutes: 30,
    });
    setShowAddDialog(false);
  };

  // Group procedures by category
  const groupedProcedures = procedures.reduce((acc, proc) => {
    const category = proc.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(proc);
    return acc;
  }, {} as Record<string, OnboardingProcedure[]>);

  const categoryLabels: Record<string, string> = {
    consultation: 'Consultas',
    procedure: 'Procedimentos',
    exam: 'Exames',
    surgery: 'Cirurgias',
    other: 'Outros',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary to-blue-500">
          <Syringe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Procedimentos</h1>
        <p className="text-muted-foreground text-lg">
          Selecione os procedimentos que voce realiza
        </p>
      </div>

      {/* Specialty indicator */}
      {specialtyInfo && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{specialtyInfo.emoji}</span>
          <span>Sugestoes para {specialtyInfo.label}</span>
        </div>
      )}

      {/* Selection count */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {loading ? 'Carregando sugestoes...' : `${procedures.length} procedimentos disponiveis`}
        </span>
        <span className="text-sm text-primary">
          {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Procedures Grid */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(groupedProcedures).map(([category, procs]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                {categoryLabels[category] || category}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {procs.map((procedure) => (
                  <ProcedureCard
                    key={procedure.id}
                    procedure={procedure}
                    onToggle={() => onToggle(procedure.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Procedure Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full py-6 border-2 border-dashed border-border bg-transparent text-muted-foreground hover:text-white hover:border-zinc-600 hover:bg-zinc-900/50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Procedimento Personalizado
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-popover border-border text-white">
          <DialogHeader>
            <DialogTitle>Novo Procedimento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome do Procedimento</Label>
              <Input
                value={customProcedure.name}
                onChange={(e) => setCustomProcedure(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Avaliacao Inicial"
                className="bg-card border-border text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Categoria</Label>
              <Select
                value={customProcedure.category}
                onValueChange={(value) => setCustomProcedure(prev => ({
                  ...prev,
                  category: value as OnboardingProcedure['category']
                }))}
              >
                <SelectTrigger className="bg-card border-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="procedure">Procedimento</SelectItem>
                  <SelectItem value="exam">Exame</SelectItem>
                  <SelectItem value="surgery">Cirurgia</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price field with R$ formatting */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Preco</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={customProcedure.priceDisplay}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="R$ 0,00"
                className="bg-card border-border text-white"
              />
            </div>

            {/* Duration fields with hours + minutes */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Duracao</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Horas</span>
                  <Input
                    type="number"
                    min={0}
                    max={12}
                    value={customProcedure.durationHours || ''}
                    onChange={(e) => setCustomProcedure(prev => ({
                      ...prev,
                      durationHours: Math.min(12, parseInt(e.target.value) || 0)
                    }))}
                    placeholder="0"
                    className="bg-card border-border text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Minutos</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={customProcedure.durationMinutes || ''}
                    onChange={(e) => setCustomProcedure(prev => ({
                      ...prev,
                      durationMinutes: Math.min(59, parseInt(e.target.value) || 0)
                    }))}
                    placeholder="30"
                    className="bg-card border-border text-white"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleAddCustom}
              disabled={!customProcedure.name.trim() || customProcedure.price <= 0}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Adicionar Procedimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Helper text */}
      <p className="text-center text-sm text-muted-foreground">
        Voce pode adicionar mais procedimentos depois
      </p>
    </div>
  );
}

// ============================================
// Procedure Card Component
// ============================================
interface ProcedureCardProps {
  procedure: OnboardingProcedure;
  onToggle: () => void;
}

function ProcedureCard({ procedure, onToggle }: ProcedureCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all duration-200',
        procedure.isSelected
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-zinc-900/30 hover:border-zinc-700'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              'font-medium truncate',
              procedure.isSelected ? 'text-white' : 'text-zinc-300'
            )}>
              {procedure.name}
            </h4>
            {procedure.isCustom && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                Personalizado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="text-primary font-medium">
              {formatCurrency(procedure.price)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(procedure.durationMinutes)}
            </span>
          </div>
        </div>

        {/* Toggle indicator */}
        <div
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            procedure.isSelected
              ? 'border-primary bg-primary'
              : 'border-zinc-600 bg-transparent'
          )}
        >
          {procedure.isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
    </button>
  );
}
