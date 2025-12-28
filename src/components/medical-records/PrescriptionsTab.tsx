import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePrescriptions } from '@/hooks/useMedicalRecords';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Prescription,
  MedicationPrescription,
  CreatePrescriptionInput,
  MEDICATION_ROUTES,
  Patient
} from '@/types/medicalRecords';
import {
  Pill,
  Plus,
  Printer,
  FileText,
  Calendar,
  Trash2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PrescriptionsTabProps {
  contactId: string;
  patient: Patient;
}

export function PrescriptionsTab({ contactId, patient }: PrescriptionsTabProps) {
  const { prescriptions, isLoading, createPrescription, markAsPrinted, isCreating } = usePrescriptions(contactId);
  const { profile } = useUserProfile();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // Estados para nova receita
  const [medications, setMedications] = useState<MedicationPrescription[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [prescriptionType, setPrescriptionType] = useState<'simple' | 'controlled' | 'special'>('simple');
  const [newMed, setNewMed] = useState<Partial<MedicationPrescription>>({});

  const handleAddMedication = () => {
    if (newMed.medication && newMed.dosage) {
      setMedications([...medications, {
        id: crypto.randomUUID(),
        medication: newMed.medication,
        dosage: newMed.dosage,
        frequency: newMed.frequency || '',
        duration: newMed.duration || '',
        quantity: newMed.quantity,
        instructions: newMed.instructions,
        route: newMed.route,
      }]);
      setNewMed({});
    }
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleCreatePrescription = () => {
    if (medications.length === 0) return;

    const input: CreatePrescriptionInput = {
      contact_id: contactId,
      medications,
      notes: notes || undefined,
      valid_until: validUntil || undefined,
      prescription_type: prescriptionType,
    };

    createPrescription(input, {
      onSuccess: () => {
        setIsNewModalOpen(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setMedications([]);
    setNotes('');
    setValidUntil('');
    setPrescriptionType('simple');
    setNewMed({});
  };

  const handlePrint = (prescription: Prescription) => {
    setPrintingId(prescription.id);

    // Gerar HTML para impressão
    const printContent = generatePrintHTML(prescription, patient, profile);

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();

        // Marcar como impressa após fechar a janela de impressão
        printWindow.onafterprint = () => {
          markAsPrinted(prescription.id);
          printWindow.close();
          setPrintingId(null);
        };
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          Carregando receitas...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Receitas Médicas</h3>
          <p className="text-sm text-muted-foreground">
            {prescriptions?.length || 0} receita(s) emitida(s)
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {/* Lista de receitas */}
      {prescriptions && prescriptions.length > 0 ? (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              onPrint={() => handlePrint(prescription)}
              isPrinting={printingId === prescription.id}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium text-lg mb-2">Nenhuma receita emitida</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Clique no botão acima para criar uma nova receita
            </p>
            <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Receita
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Receita */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Nova Receita
            </DialogTitle>
            <DialogDescription>
              Paciente: <strong>{patient.full_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tipo de receita */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Receita</Label>
                <Select
                  value={prescriptionType}
                  onValueChange={(value: any) => setPrescriptionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Receita Simples</SelectItem>
                    <SelectItem value="controlled">Receita Controlada</SelectItem>
                    <SelectItem value="special">Receita Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Válida até</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {/* Adicionar medicamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Adicionar Medicamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Medicamento *</Label>
                    <Input
                      placeholder="Nome do medicamento"
                      value={newMed.medication || ''}
                      onChange={(e) => setNewMed({ ...newMed, medication: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dosagem *</Label>
                    <Input
                      placeholder="Ex: 500mg"
                      value={newMed.dosage || ''}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Posologia</Label>
                    <Input
                      placeholder="Ex: 8/8h"
                      value={newMed.frequency || ''}
                      onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duração</Label>
                    <Input
                      placeholder="Ex: 7 dias"
                      value={newMed.duration || ''}
                      onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      placeholder="Ex: 21 comp"
                      value={newMed.quantity || ''}
                      onChange={(e) => setNewMed({ ...newMed, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Via</Label>
                    <Select
                      value={newMed.route || ''}
                      onValueChange={(value) => setNewMed({ ...newMed, route: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEDICATION_ROUTES.map((route) => (
                          <SelectItem key={route.value} value={route.value}>
                            {route.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instruções</Label>
                  <Input
                    placeholder="Ex: Tomar após as refeições"
                    value={newMed.instructions || ''}
                    onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddMedication} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Medicamento
                </Button>
              </CardContent>
            </Card>

            {/* Lista de medicamentos adicionados */}
            {medications.length > 0 && (
              <div className="space-y-2">
                <Label>Medicamentos ({medications.length})</Label>
                {medications.map((med, index) => (
                  <div
                    key={med.id || index}
                    className="flex items-start justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                  >
                    <div>
                      <p className="font-medium">{med.medication} - {med.dosage}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.frequency} por {med.duration}
                        {med.quantity && ` (${med.quantity})`}
                      </p>
                      {med.instructions && (
                        <p className="text-sm text-muted-foreground italic">{med.instructions}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMedication(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea
                placeholder="Instruções adicionais para o paciente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsNewModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreatePrescription}
                disabled={medications.length === 0 || isCreating}
              >
                {isCreating ? 'Salvando...' : 'Salvar Receita'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Card da receita
interface PrescriptionCardProps {
  prescription: Prescription;
  onPrint: () => void;
  isPrinting: boolean;
}

function PrescriptionCard({ prescription, onPrint, isPrinting }: PrescriptionCardProps) {
  const typeLabels = {
    simple: 'Simples',
    controlled: 'Controlada',
    special: 'Especial',
  };

  const typeColors = {
    simple: 'bg-blue-100 text-blue-800 border-blue-300',
    controlled: 'bg-orange-100 text-orange-800 border-orange-300',
    special: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center justify-center min-w-[50px] p-2 rounded-md bg-primary/10">
              <Pill className="h-5 w-5 text-primary mb-1" />
              <span className="text-xs font-medium">
                {prescription.medications?.length || 0}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className={typeColors[prescription.prescription_type]}>
                  {typeLabels[prescription.prescription_type]}
                </Badge>
                {prescription.is_printed && (
                  <Badge variant="outline" className="gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Impressa
                  </Badge>
                )}
              </div>
              <CardTitle className="text-base">
                Receita de {format(parseISO(prescription.prescription_date), "dd/MM/yyyy", { locale: ptBR })}
              </CardTitle>
              <CardDescription className="flex items-center gap-3 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(prescription.created_at), "HH:mm", { locale: ptBR })}
                </span>
                {prescription.valid_until && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Válida até {format(parseISO(prescription.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={isPrinting}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Imprimindo...' : 'Imprimir'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {prescription.medications?.map((med, index) => (
            <div key={index} className="p-2 rounded bg-muted/50">
              <p className="font-medium text-sm">{med.medication} - {med.dosage}</p>
              <p className="text-xs text-muted-foreground">
                {med.frequency} por {med.duration}
                {med.quantity && ` (${med.quantity})`}
              </p>
            </div>
          ))}
        </div>
        {prescription.notes && (
          <p className="text-sm text-muted-foreground mt-3 italic">
            Obs: {prescription.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Função para gerar HTML de impressão
function generatePrintHTML(prescription: Prescription, patient: Patient, doctor: any): string {
  const medications = prescription.medications || [];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receita Médica - ${patient.full_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.5;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          color: #666;
        }
        .patient-info {
          margin-bottom: 30px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .patient-info p {
          margin-bottom: 5px;
        }
        .prescription-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .medications {
          margin-bottom: 30px;
        }
        .medication {
          margin-bottom: 20px;
          padding-left: 20px;
          border-left: 3px solid #333;
        }
        .medication-name {
          font-weight: bold;
          font-size: 16px;
        }
        .medication-details {
          margin-top: 5px;
        }
        .instructions {
          font-style: italic;
          color: #666;
          margin-top: 5px;
        }
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #fff9e6;
          border: 1px solid #ffd700;
          border-radius: 5px;
        }
        .footer {
          margin-top: 60px;
          text-align: center;
        }
        .signature-line {
          width: 300px;
          border-top: 1px solid #333;
          margin: 0 auto 10px;
          padding-top: 10px;
        }
        .date {
          margin-top: 30px;
          text-align: right;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Clínica Médica</h1>
        <p>Endereço da Clínica • Telefone: (00) 0000-0000</p>
      </div>

      <div class="patient-info">
        <p><strong>Paciente:</strong> ${patient.full_name}</p>
        ${patient.cpf ? `<p><strong>CPF:</strong> ${patient.cpf}</p>` : ''}
        <p><strong>Data:</strong> ${format(parseISO(prescription.prescription_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      <div class="prescription-title">Receituário</div>

      <div class="medications">
        ${medications.map((med, index) => `
          <div class="medication">
            <div class="medication-name">${index + 1}. ${med.medication} ${med.dosage}</div>
            <div class="medication-details">
              ${med.frequency ? `Posologia: ${med.frequency}` : ''}
              ${med.duration ? ` por ${med.duration}` : ''}
              ${med.quantity ? ` - Quantidade: ${med.quantity}` : ''}
            </div>
            ${med.instructions ? `<div class="instructions">${med.instructions}</div>` : ''}
          </div>
        `).join('')}
      </div>

      ${prescription.notes ? `
        <div class="notes">
          <strong>Observações:</strong> ${prescription.notes}
        </div>
      ` : ''}

      <div class="footer">
        <div class="signature-line">
          ${doctor?.full_name || 'Médico Responsável'}
        </div>
        <p>CRM: _____________</p>
      </div>

      <div class="date">
        ${format(new Date(), "'Local', dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </div>
    </body>
    </html>
  `;
}
