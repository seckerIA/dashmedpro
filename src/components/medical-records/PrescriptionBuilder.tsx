import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MedicationPrescription as Prescription } from '@/types/medicalRecords';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface PrescriptionBuilderProps {
  value: Prescription[];
  onChange: (prescriptions: Prescription[]) => void;
  disabled?: boolean;
}

export function PrescriptionBuilder({ value, onChange, disabled = false }: PrescriptionBuilderProps) {
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleAdd = () => {
    if (!medication.trim() || !dosage.trim() || !frequency.trim() || !duration.trim()) {
      return;
    }

    const newPrescription: Prescription = {
      medication: medication.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      duration: duration.trim(),
      instructions: instructions.trim() || undefined,
    };

    onChange([...value, newPrescription]);

    // Clear form
    setMedication('');
    setDosage('');
    setFrequency('');
    setDuration('');
    setInstructions('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* List of existing prescriptions */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((prescription, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{prescription.medication}</p>
                    <p className="text-sm text-muted-foreground">
                      {prescription.dosage} - {prescription.frequency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duração: {prescription.duration}
                    </p>
                    {prescription.instructions && (
                      <p className="text-sm text-muted-foreground italic">
                        {prescription.instructions}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form to add new prescription */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-sm">Adicionar Prescrição</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="medication">Medicamento *</Label>
            <Input
              id="medication"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              placeholder="Ex: Dipirona"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosagem *</Label>
            <Input
              id="dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Ex: 500mg"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência *</Label>
            <Input
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Ex: 8 em 8 horas"
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duração *</Label>
            <Input
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 7 dias"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instruções Adicionais</Label>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Ex: Tomar com alimentos"
            rows={2}
            disabled={disabled}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          disabled={disabled || !medication.trim() || !dosage.trim() || !frequency.trim() || !duration.trim()}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Prescrição
        </Button>
      </div>
    </div>
  );
}
