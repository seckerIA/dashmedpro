import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePatients, usePatient } from "@/hooks/usePatients";
import { PatientInfoTab } from "@/components/medical-records/PatientInfoTab";
import { MedicalHistoryTab } from "@/components/medical-records/MedicalHistoryTab";
import { NewRecordModal } from "@/components/medical-records/NewRecordModal";
import { PatientSelectorModal } from "@/components/medical-records/PatientSelectorModal";
import { PrescriptionsTab } from "@/components/medical-records/PrescriptionsTab";
import {
  Search,
  User,
  Calendar,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Phone,
  CreditCard,
  Plus,
  ClipboardList,
  Pill,
  History
} from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "ficha", label: "Ficha", icon: User },
  { id: "historico", label: "Histórico", icon: History },
  { id: "receitas", label: "Receitas", icon: Pill },
] as const;

const MedicalRecords = () => {
  const { isMedico, isAdmin, profile, isLoading: profileLoading } = useUserProfile();
  const { patients, isLoading: patientsLoading } = usePatients();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("ficha");
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isPatientSelectorModalOpen, setIsPatientSelectorModalOpen] = useState(false);

  // Refs para as seções
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

  // Buscar dados do paciente selecionado
  const { patient: selectedPatient, isLoading: patientLoading } = usePatient(selectedPatientId);

  // Scroll para seção ao clicar no guia
  const scrollToSection = useCallback((sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      isScrollingProgrammatically.current = true;
      setActiveSection(sectionId);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Reset flag após a animação
      setTimeout(() => {
        isScrollingProgrammatically.current = false;
      }, 800);
    }
  }, []);

  // Intersection Observer para destacar seção ativa ao scrollar
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrollingProgrammatically.current) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [selectedPatientId, selectedPatient]);

  // Ler query params da URL para selecionar paciente automaticamente
  useEffect(() => {
    const patientIdFromUrl = searchParams.get('patientId');
    const tabFromUrl = searchParams.get('tab');
    const openNewRecordFromUrl = searchParams.get('openNewRecord');

    if (patientIdFromUrl) {
      setSelectedPatientId(patientIdFromUrl);
      if (patients && patients.length > 0) {
        const patient = patients.find(p => p.id === patientIdFromUrl);
        if (patient) {
          setSelectedPatientName(patient.full_name || null);
        }
      }
    }

    if (tabFromUrl && ['ficha', 'historico', 'receitas'].includes(tabFromUrl)) {
      // Scroll para a seção correspondente após um delay
      setTimeout(() => scrollToSection(tabFromUrl), 300);
    }

    if (openNewRecordFromUrl === 'true' && patientIdFromUrl) {
      setIsNewRecordModalOpen(true);
    }

    if (patientIdFromUrl || tabFromUrl || openNewRecordFromUrl) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('patientId');
      newSearchParams.delete('tab');
      newSearchParams.delete('openNewRecord');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, patients, setSearchParams, scrollToSection]);

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
                        }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
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

        {/* Prontuário do Paciente - Coluna Direita (Página Única Scrollável) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-0">
          {selectedPatientId && selectedPatient ? (
            <>
              {/* Header do paciente + Navegação sticky */}
              <Card className="sticky top-0 z-10 rounded-b-none border-b-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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

                  {/* Navegação por seções */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    {SECTIONS.map(({ id, label, icon: Icon }) => (
                      <Button
                        key={id}
                        variant={activeSection === id ? "default" : "ghost"}
                        size="sm"
                        onClick={() => scrollToSection(id)}
                        className={cn(
                          "gap-2 transition-all",
                          activeSection === id
                            ? "shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Button>
                    ))}
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsNewRecordModalOpen(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Novo Atendimento
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Conteúdo scrollável — todas as seções visíveis */}
              <div ref={scrollContainerRef} className="space-y-6 pb-8">
                {/* Seção: Ficha do Paciente */}
                <Card
                  className="rounded-t-none border-t-0"
                  ref={(el) => { sectionRefs.current["ficha"] = el; }}
                >
                  <CardContent className="pt-6">
                    <PatientInfoTab
                      patient={selectedPatient}
                      onUpdate={() => { }}
                      onNewRecord={() => setIsNewRecordModalOpen(true)}
                    />
                  </CardContent>
                </Card>

                {/* Seção: Histórico de Atendimentos */}
                <Card ref={(el) => { sectionRefs.current["historico"] = el; }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-500" />
                      Histórico de Atendimentos
                    </CardTitle>
                    <CardDescription>
                      Todos os registros médicos deste paciente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MedicalHistoryTab
                      contactId={selectedPatientId}
                      patient={selectedPatient}
                    />
                  </CardContent>
                </Card>

                {/* Seção: Receitas */}
                <Card ref={(el) => { sectionRefs.current["receitas"] = el; }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="h-5 w-5 text-cyan-500" />
                      Receitas Médicas
                    </CardTitle>
                    <CardDescription>
                      Prescrições e receitas emitidas para este paciente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PrescriptionsTab
                      contactId={selectedPatientId}
                      patient={selectedPatient}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : patientLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  Carregando paciente...
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
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
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Seleção de Paciente */}
      <PatientSelectorModal
        open={isPatientSelectorModalOpen}
        onOpenChange={setIsPatientSelectorModalOpen}
        onSelectPatient={(patientId, patientName) => {
          setSelectedPatientId(patientId);
          setSelectedPatientName(patientName);
          setIsPatientSelectorModalOpen(false);
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
