import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VitalSigns, VITAL_SIGNS_RANGES, calculateBMI } from '@/types/medicalRecords';
import { useEffect } from 'react';

interface VitalSignsInputProps {
  value: VitalSigns;
  onChange: (vitalSigns: VitalSigns) => void;
  disabled?: boolean;
}

export function VitalSignsInput({ value, onChange, disabled = false }: VitalSignsInputProps) {
  // Auto-calculate BMI when weight or height changes
  useEffect(() => {
    const newBMI = calculateBMI(value.weight, value.height);
    if (newBMI && newBMI !== value.bmi) {
      onChange({ ...value, bmi: newBMI });
    }
  }, [value.weight, value.height]);

  const handleChange = (field: keyof VitalSigns, inputValue: string) => {
    const numValue = inputValue === '' ? undefined : Number(inputValue);
    onChange({ ...value, [field]: numValue });
  };

  const getInputClass = (field: keyof VitalSigns) => {
    const val = value[field];
    if (!val) return '';

    const range = VITAL_SIGNS_RANGES[field];
    if (!range) return '';

    if (val < range.min || val > range.max) {
      return 'border-destructive';
    }
    return '';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Row 1: Temperature, BP Systolic, BP Diastolic */}
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperatura (°C)</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          min={VITAL_SIGNS_RANGES.temperature.min}
          max={VITAL_SIGNS_RANGES.temperature.max}
          value={value.temperature ?? ''}
          onChange={(e) => handleChange('temperature', e.target.value)}
          placeholder="36.5"
          disabled={disabled}
          className={getInputClass('temperature')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bp_systolic">PA Sistólica (mmHg)</Label>
        <Input
          id="bp_systolic"
          type="number"
          min={VITAL_SIGNS_RANGES.bp_systolic.min}
          max={VITAL_SIGNS_RANGES.bp_systolic.max}
          value={value.bp_systolic ?? ''}
          onChange={(e) => handleChange('bp_systolic', e.target.value)}
          placeholder="120"
          disabled={disabled}
          className={getInputClass('bp_systolic')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bp_diastolic">PA Diastólica (mmHg)</Label>
        <Input
          id="bp_diastolic"
          type="number"
          min={VITAL_SIGNS_RANGES.bp_diastolic.min}
          max={VITAL_SIGNS_RANGES.bp_diastolic.max}
          value={value.bp_diastolic ?? ''}
          onChange={(e) => handleChange('bp_diastolic', e.target.value)}
          placeholder="80"
          disabled={disabled}
          className={getInputClass('bp_diastolic')}
        />
      </div>

      {/* Row 2: Heart Rate, Respiratory Rate, Oxygen Saturation */}
      <div className="space-y-2">
        <Label htmlFor="heart_rate">FC (bpm)</Label>
        <Input
          id="heart_rate"
          type="number"
          min={VITAL_SIGNS_RANGES.heart_rate.min}
          max={VITAL_SIGNS_RANGES.heart_rate.max}
          value={value.heart_rate ?? ''}
          onChange={(e) => handleChange('heart_rate', e.target.value)}
          placeholder="75"
          disabled={disabled}
          className={getInputClass('heart_rate')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="respiratory_rate">FR (irpm)</Label>
        <Input
          id="respiratory_rate"
          type="number"
          min={VITAL_SIGNS_RANGES.respiratory_rate.min}
          max={VITAL_SIGNS_RANGES.respiratory_rate.max}
          value={value.respiratory_rate ?? ''}
          onChange={(e) => handleChange('respiratory_rate', e.target.value)}
          placeholder="16"
          disabled={disabled}
          className={getInputClass('respiratory_rate')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="spo2">SpO2 (%)</Label>
        <Input
          id="spo2"
          type="number"
          min={VITAL_SIGNS_RANGES.spo2.min}
          max={VITAL_SIGNS_RANGES.spo2.max}
          value={value.spo2 ?? ''}
          onChange={(e) => handleChange('spo2', e.target.value)}
          placeholder="98"
          disabled={disabled}
          className={getInputClass('spo2')}
        />
      </div>

      {/* Row 3: Weight, Height, BMI (auto-calculated) */}
      <div className="space-y-2">
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min={VITAL_SIGNS_RANGES.weight.min}
          max={VITAL_SIGNS_RANGES.weight.max}
          value={value.weight ?? ''}
          onChange={(e) => handleChange('weight', e.target.value)}
          placeholder="70.0"
          disabled={disabled}
          className={getInputClass('weight')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="height">Altura (cm)</Label>
        <Input
          id="height"
          type="number"
          min={VITAL_SIGNS_RANGES.height.min}
          max={VITAL_SIGNS_RANGES.height.max}
          value={value.height ?? ''}
          onChange={(e) => handleChange('height', e.target.value)}
          placeholder="170"
          disabled={disabled}
          className={getInputClass('height')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bmi">IMC (calculado)</Label>
        <Input
          id="bmi"
          type="number"
          value={value.bmi ?? ''}
          placeholder="0.0"
          disabled
          className="bg-muted"
        />
      </div>
    </div>
  );
}
