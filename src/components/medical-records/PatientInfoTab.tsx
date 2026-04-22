import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Patient, UpdatePatientMedicalInfoInput, EmergencyContact, BLOOD_TYPES } from '@/types/medicalRecords';
import { usePatients } from '@/hooks/usePatients';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Droplets,
  AlertTriangle,
  Heart,
  Pill,
  UserCheck,
  Edit2,
  Save,
  X,
  Plus,
  Stethoscope
} from 'lucide-react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientInfoTabProps {
  patient: Patient;
  onUpdate?: () => void;
  onNewRecord?: () => void;
}

export function PatientInfoTab({ patient, onUpdate, onNewRecord }: PatientInfoTabProps) {
  const { updatePatientMedicalInfo, isUpdating } = usePatients();
  const [isEditing, setIsEditing] = useState(false);

  // Estados de edição
  const [birthDate, setBirthDate] = useState(patient.birth_date || '');
  const [bloodType, setBloodType] = useState(patient.blood_type || '');
  const [cpf, setCpf] = useState(patient.cpf || '');
  const [gender, setGender] = useState(patient.gender || '');
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [chronicConditions, setChronicConditions] = useState<string[]>(patient.chronic_conditions || []);
  const [currentMedications, setCurrentMedications] = useState<string[]>(patient.current_medications || []);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    patient.emergency_contact || { name: '', phone: '', relationship: '' }
  );

  // Estados para inputs temporários
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const calculateAge = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    try {
      return differenceInYears(new Date(), parseISO(dateString));
    } catch {
      return null;
    }
  };

  const handleSave = () => {
    const updates: UpdatePatientMedicalInfoInput = {
      birth_date: birthDate || undefined,
      blood_type: bloodType || undefined,
      cpf: cpf || undefined,
      gender: (gender as any) || undefined,
      allergies,
      chronic_conditions: chronicConditions,
      current_medications: currentMedications,
      emergency_contact: emergencyContact.name ? emergencyContact : undefined,
    };

    updatePatientMedicalInfo(
      { patientId: patient.id, updates },
      {
        onSuccess: () => {
          setIsEditing(false);
          onUpdate?.();
        },
      }
    );
  };

  const handleCancel = () => {
    // Resetar para valores originais
    setBirthDate(patient.birth_date || '');
    setBloodType(patient.blood_type || '');
    setCpf(patient.cpf || '');
    setGender(patient.gender || '');
    setAllergies(patient.allergies || []);
    setChronicConditions(patient.chronic_conditions || []);
    setCurrentMedications(patient.current_medications || []);
    setEmergencyContact(patient.emergency_contact || { name: '', phone: '', relationship: '' });
    setIsEditing(false);
  };

  const addTag = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (value.trim() && !list.includes(value.trim())) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const removeTag = (
    index: number,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const age = calculateAge(patient.birth_date);

  return (
    <div className="space-y-6">
      {/* Header com botões */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ficha do Paciente</h3>
        <div className="flex gap-2">
          {onNewRecord && (
            <Button onClick={onNewRecord} className="gap-2">
              <Stethoscope className="h-4 w-4" />
              Novo Atendimento
            </Button>
          )}
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Editar Ficha
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isUpdating} className="gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Nome Completo</Label>
            <p className="font-medium">{patient.full_name}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">CPF</Label>
            {isEditing ? (
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length > 11) value = value.slice(0, 11);
                  if (value.length > 9) {
                    value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
                  } else if (value.length > 6) {
                    value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
                  } else if (value.length > 3) {
                    value = `${value.slice(0, 3)}.${value.slice(3)}`;
                  }
                  setCpf(value);
                }}
              />
            ) : (
              <p className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                {patient.cpf || 'Não informado'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Telefone</Label>
            <p className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {patient.phone || 'Não informado'}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">E-mail</Label>
            <p className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {patient.email || 'Não informado'}
            </p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Data de Nascimento</Label>
            {isEditing ? (
              <DatePicker
                date={birthDate ? new Date(birthDate + 'T00:00:00') : undefined}
                setDate={(date) => setBirthDate(date ? format(date, 'yyyy-MM-dd') : '')}
              />
            ) : (
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {(() => {
                  try {
                    if (!patient.birth_date) return 'Não informado';
                    const date = parseISO(patient.birth_date);
                    // Validar se a data é válida e o ano é razoável (ex: < 3000)
                    if (isNaN(date.getTime()) || date.getFullYear() > 2500) return 'Data inválida';

                    return `${format(date, 'dd/MM/yyyy', { locale: ptBR })} (${age !== null ? age : '?'} anos)`;
                  } catch (e) {
                    return 'Data inválida';
                  }
                })()}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Gênero</Label>
            {isEditing ? (
              <Select value={gender} onValueChange={(v: any) => setGender(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium capitalize">
                {patient.gender?.replace('_', ' ') || 'Não informado'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Tipo Sanguíneo</Label>
            {isEditing ? (
              <Select value={bloodType} onValueChange={setBloodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4 text-red-500" />
                {patient.blood_type || 'Não informado'}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Convênio</Label>
            <p className="font-medium">
              {patient.insurance_type === 'convenio'
                ? patient.insurance_name || 'Convênio'
                : patient.insurance_type === 'particular'
                  ? 'Particular'
                  : 'Não informado'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alergias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Alergias
          </CardTitle>
          <CardDescription>Registre todas as alergias conhecidas do paciente</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma alergia e pressione Enter"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newAllergy, setNewAllergy, allergies, setAllergies);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newAllergy, setNewAllergy, allergies, setAllergies)}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300 gap-1"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => removeTag(index, allergies, setAllergies)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allergies.length > 0 ? (
                allergies.map((allergy, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    {allergy}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma alergia registrada</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condições Crônicas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Condições Crônicas
          </CardTitle>
          <CardDescription>Doenças crônicas e condições de saúde permanentes</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma condição e pressione Enter"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newCondition, setNewCondition, chronicConditions, setChronicConditions);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newCondition, setNewCondition, chronicConditions, setChronicConditions)}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {chronicConditions.map((condition, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-red-100 text-red-800 border-red-300 gap-1"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeTag(index, chronicConditions, setChronicConditions)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {chronicConditions.length > 0 ? (
                chronicConditions.map((condition, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-red-100 text-red-800 border-red-300"
                  >
                    {condition}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma condição registrada</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medicamentos em Uso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="h-4 w-4 text-blue-500" />
            Medicamentos em Uso Contínuo
          </CardTitle>
          <CardDescription>Medicamentos que o paciente utiliza regularmente</CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um medicamento e pressione Enter"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(newMedication, setNewMedication, currentMedications, setCurrentMedications);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newMedication, setNewMedication, currentMedications, setCurrentMedications)}
                >
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentMedications.map((medication, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 border-blue-300 gap-1"
                  >
                    {medication}
                    <button
                      type="button"
                      onClick={() => removeTag(index, currentMedications, setCurrentMedications)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentMedications.length > 0 ? (
                currentMedications.map((medication, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 border-blue-300"
                  >
                    {medication}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum medicamento registrado</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contato de Emergência */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            Contato de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome do contato"
                  value={emergencyContact.name}
                  onChange={(e) =>
                    setEmergencyContact({ ...emergencyContact, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={emergencyContact.phone}
                  onChange={(e) =>
                    setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Input
                  placeholder="Ex: Mãe, Cônjuge"
                  value={emergencyContact.relationship}
                  onChange={(e) =>
                    setEmergencyContact({ ...emergencyContact, relationship: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Nome</Label>
                <p className="font-medium">{emergencyContact.name || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Telefone</Label>
                <p className="font-medium">{emergencyContact.phone || 'Não informado'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Parentesco</Label>
                <p className="font-medium">{emergencyContact.relationship || 'Não informado'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
