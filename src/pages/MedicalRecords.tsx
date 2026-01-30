import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePatients, usePatient } from "@/hooks/usePatients";
import { PatientInfoTab } from "@/components/medical-records/PatientInfoTab";
import { MedicalHistoryTab } from "@/components/medical-records/MedicalHistoryTab";
import { NewRecordModal } from "@/components/medical-records/NewRecordModal";
import { PatientSelectorModal } from "@/components/medical-records/PatientSelectorModal";
import { PrescriptionsTab } from "@/components/medical-records/PrescriptionsTab";
import {
  FileText,
  Search,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Phone,
  CreditCard,
  Clock,
  Plus,
  ClipboardList,
  Pill,
  History
} from "lucide-react";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

const MedicalRecords = () => {
  const { isMedico, isAdmin, profile, isLoading: profileLoading } = useUserProfile();
  const { patients, isLoading: patientsLoading } = usePatients();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ficha");
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isPatientSelectorModalOpen, setIsPatientSelectorModalOpen] = useState(false);

  // Buscar dados do paciente selecionado
  const { patient: selectedPatient, isLoading: patientLoading } = usePatient(selectedPatientId);

  // Ler query params da URL para selecionar paciente e aba automaticamente
  useEffect(() => {
    const patientIdFromUrl = searchParams.get('patientId');
    const tabFromUrl = searchParams.get('tab');
    const openNewRecordFromUrl = searchParams.get('openNewRecord');

    if (patientIdFromUrl) {
      setSelectedPatientId(patientIdFromUrl);
      // Buscar o nome do paciente se disponível
      if (patients && patients.length > 0) {
        const patient = patients.find(p => p.id === patientIdFromUrl);
        if (patient) {
          setSelectedPatientName(patient.full_name || null);
        }
      }
    }

    if (tabFromUrl && ['ficha', 'historico', 'receitas'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }

    // Se openNewRecord=true, abrir o modal de novo prontuário
    if (openNewRecordFromUrl === 'true' && patientIdFromUrl) {
      setIsNewRecordModalOpen(true);
    }

    // Limpar query params após processar para evitar problemas de navegação
    if (patientIdFromUrl || tabFromUrl || openNewRecordFromUrl) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('patientId');
      newSearchParams.delete('tab');
      newSearchParams.delete('openNewRecord');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, patients, setSearchParams]);

  // Filtrar pacientes pela busca
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchTerm) return patients;

    const term = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.full_name?.toLowerCase().includes(term) ||
        patient.phone?.includes(term) ||
        patient.email?.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Calcular idade
  const calculateAge = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    try {
      return differenceInYears(new Date(), parseISO(dateString));
    } catch {
      return null;
    }
  };

  // Verificar permissão
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          Verificando permissões...
        </div>
      </div>
    );
  }

  if (!isMedico && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
              <h2 className="text-xl font-semibold">Acesso Restrito</h2>
              <p className="text-muted-foreground">
                Esta área é restrita a médicos e administradores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-background px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Prontuários Médicos
          </h1>
          <p className="text-muted-foreground">
            Gerencie prontuários, histórico clínico e receitas dos pacientes
          </p>
        </div>
        <Button onClick={() => setIsPatientSelectorModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Prontuário
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Pacientes - Coluna Esquerda */}
        <Card className="lg:col-span-4 xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Pacientes
            </CardTitle>
            <CardDescription>
              {filteredPatients.length} paciente(s)
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {patientsLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Carregando pacientes...
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Nenhum paciente encontrado</p>
                  <p className="text-sm">
                    {searchTerm ? "Tente buscar por outro termo" : "Cadastre pacientes no CRM"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredPatients.map((patient) => {
                    const age = calculateAge(patient.birth_date);
                    const isSelected = selectedPatientId === patient.id;

                    return (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setSelectedPatientName(patient.full_name);
                          setActiveTab("ficha");
                        }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">
                                {patient.full_name}
                              </p>
                              {patient.insurance_type && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {patient.insurance_type === 'convenio' ? 'Conv' : 'Part'}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {patient.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {patient.phone}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {patient.cpf && (
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {patient.cpf}
                                </span>
                              )}
                              {age && (
                                <span>{age} anos</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isSelected ? 'text-primary rotate-90' : ''}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Prontuário do Paciente - Coluna Direita */}
        <Card className="lg:col-span-8 xl:col-span-9">
          {selectedPatientId && selectedPatient ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {selectedPatient.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {selectedPatient.full_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        {selectedPatient.cpf && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {selectedPatient.cpf}
                          </span>
                        )}
                        {selectedPatient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {selectedPatient.phone}
                          </span>
                        )}
                        {selectedPatient.birth_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {calculateAge(selectedPatient.birth_date)} anos
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Badges de info rápida */}
                  <div className="flex items-center gap-2">
                    {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {selectedPatient.allergies.length} Alergia(s)
                      </Badge>
                    )}
                    {selectedPatient.insurance_type && (
                      <Badge variant="outline">
                        {selectedPatient.insurance_type === 'convenio'
                          ? selectedPatient.insurance_name || 'Convênio'
                          : 'Particular'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full max-w-md">
                    <TabsTrigger value="ficha" className="gap-2">
                      <User className="h-4 w-4" />
                      Ficha
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="gap-2">
                      <History className="h-4 w-4" />
                      Histórico
                    </TabsTrigger>
                    <TabsTrigger value="receitas" className="gap-2">
                      <Pill className="h-4 w-4" />
                      Receitas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ficha" className="mt-6">
                    <PatientInfoTab
                      patient={selectedPatient}
                      onUpdate={() => {}}
                      onNewRecord={() => setIsNewRecordModalOpen(true)}
                    />
                  </TabsContent>

                  <TabsContent value="historico" className="mt-6">
                    <MedicalHistoryTab
                      contactId={selectedPatientId}
                    />
                  </TabsContent>

                  <TabsContent value="receitas" className="mt-6">
                    <PrescriptionsTab
                      contactId={selectedPatientId}
                      patient={selectedPatient}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : patientLoading ? (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                Carregando paciente...
              </div>
            </CardContent>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center text-muted-foreground">
                <Stethoscope className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Selecione um paciente</h3>
                <p className="text-sm max-w-md">
                  Escolha um paciente na lista ao lado para visualizar seu prontuário,
                  histórico de atendimentos e receitas médicas.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Modal de Seleção de Paciente */}
      <PatientSelectorModal
        open={isPatientSelectorModalOpen}
        onOpenChange={setIsPatientSelectorModalOpen}
        onSelectPatient={(patientId, patientName) => {
          setSelectedPatientId(patientId);
          setSelectedPatientName(patientName);
          setActiveTab("historico");
          setIsPatientSelectorModalOpen(false);
          // Abrir modal de novo prontuário após um pequeno delay para garantir que o paciente foi selecionado
          setTimeout(() => {
            setIsNewRecordModalOpen(true);
          }, 100);
        }}
      />

      {/* Modal de Novo Atendimento */}
      {selectedPatientId && (selectedPatientName || selectedPatient?.full_name) && (
        <NewRecordModal
          open={isNewRecordModalOpen}
          onOpenChange={setIsNewRecordModalOpen}
          contactId={selectedPatientId}
          patientName={selectedPatientName || selectedPatient?.full_name || 'Paciente'}
        />
      )}
    </div>
  );
};

export default MedicalRecords;
