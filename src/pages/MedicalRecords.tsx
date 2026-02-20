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
  History,
  Printer
} from "lucide-react";
import { format, differenceInYears, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { RECORD_TYPES } from "@/types/medicalRecords";
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
  const { records } = useMedicalRecords(selectedPatientId || undefined);

  const getRecordTypeInfo = (type: string) => {
    const typeInfo = RECORD_TYPES.find(t => t.value === type);
    return typeInfo || { label: type, description: '' };
  };

  const handlePrintFullRecord = () => {
    if (!records || records.length === 0 || !selectedPatient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prontuário Completo - ${selectedPatient.full_name || 'Paciente'}</title>
          <style>
            @page { margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .info-item { margin-bottom: 8px; }
            .label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 2px; }
            .value { font-size: 15px; font-weight: 500; color: #0f172a; }
            .record-block { margin-bottom: 40px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .record-header { background: #f1f5f9; padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .record-date { font-weight: bold; font-size: 16px; color: #0f172a; }
            .record-type { background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #475569; margin-left: 10px; }
            .record-doctor { font-size: 13px; color: #64748b; }
            .record-body { padding: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 14px; font-weight: 700; color: #334155; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; display: flex; align-items: center; }
            .content { font-size: 14px; white-space: pre-wrap; color: #334155; }
            .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500; margin-right: 5px; background: #e2e8f0; color: #475569; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
              .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .record-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #f1f5f9 !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DashMed Pro</div>
            <div class="subtitle">Prontuário Médico Completo</div>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="label">Paciente</span>
                <span class="value">${selectedPatient.full_name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">Data de Nascimento</span>
                <span class="value">${selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="label">CPF</span>
                <span class="value">${selectedPatient.cpf || 'N/A'}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="info-item">
                <span class="label">Data de Emissão</span>
                <span class="value">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="info-item">
                <span class="label">Total de Registros</span>
                <span class="value">${records.length}</span>
              </div>
            </div>
          </div>

          <div class="records-container">
            ${records.map(record => `
              <div class="record-block">
                <div class="record-header">
                  <div>
                    <span class="record-date">${new Date(record.created_at).toLocaleDateString('pt-BR')} ${new Date(record.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span class="record-type">${getRecordTypeInfo(record.record_type).label}</span>
                  </div>
                  <div class="record-doctor">
                    ${record.doctor ? `Dr(a). ${record.doctor.full_name}` : 'Médico não identificado'}
                  </div>
                </div>
                
                <div class="record-body">
                  ${record.chief_complaint ? `
                    <div class="section">
                      <div class="section-title">Queixa Principal</div>
                      <div class="content">${record.chief_complaint}</div>
                    </div>
                  ` : ''}

                  ${record.history_current_illness ? `
                    <div class="section">
                      <div class="section-title">HDA</div>
                      <div class="content">${record.history_current_illness}</div>
                    </div>
                  ` : ''}

                  ${record.diagnostic_hypothesis ? `
                    <div class="section">
                      <div class="section-title">Diagnóstico</div>
                      <div class="content">${record.diagnostic_hypothesis}</div>
                      ${record.cid_codes && record.cid_codes.length > 0 ? `
                        <div style="margin-top: 5px;">
                          ${record.cid_codes.map((cid: string) => `<span class="tag">CID: ${cid}</span>`).join('')}
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}

                  ${record.treatment_plan ? `
                    <div class="section">
                      <div class="section-title">Conduta</div>
                      <div class="content">${record.treatment_plan}</div>
                    </div>
                  ` : ''}

                  ${record.prescriptions && record.prescriptions.length > 0 ? `
                    <div class="section">
                      <div class="section-title">Prescrições</div>
                      <div class="content">
                        ${record.prescriptions.map((p: any) => `
                          <div style="margin-bottom: 5px;">• ${p.medication} ${p.dosage} - ${p.frequency}</div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            Documento gerado eletronicamente pelo sistema DashMed Pro em ${new Date().toLocaleDateString('pt-BR')}.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

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
        <div className="flex gap-2">
          {selectedPatientId && (
            <Button
              variant="outline"
              onClick={() => handlePrintFullRecord()}
              className="gap-2 hidden md:flex"
              disabled={!records || records.length === 0}
            >
              <Printer className="h-4 w-4" />
              Imprimir Prontuário
            </Button>
          )}
          <Button onClick={() => setIsPatientSelectorModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Novo Prontuário
          </Button>
        </div>
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
