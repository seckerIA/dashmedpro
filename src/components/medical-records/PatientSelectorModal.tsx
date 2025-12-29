import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Patient } from '@/types/medicalRecords';
import { Search, User, Phone, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PatientSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPatient: (patientId: string, patientName: string) => void;
}

interface PatientWithLastAppointment extends Patient {
  last_appointment_date?: string;
  total_appointments?: number;
}

export function PatientSelectorModal({
  open,
  onOpenChange,
  onSelectPatient,
}: PatientSelectorModalProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar pacientes que têm consultas marcadas
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-with-appointments', user?.id],
    queryFn: async ({ signal }) => {
      if (!user?.id) return [];

      try {
        // Buscar contatos únicos que têm appointments
        // Primeiro buscar appointments (usando cast para contornar problema de tipos)
        const appointmentsQuery = (supabase.from as any)('medical_appointments')
          .select('contact_id, start_time')
          .order('start_time', { ascending: false });
        
        const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery;

        if (appointmentsError) {
          console.error('Erro ao buscar appointments:', appointmentsError);
          throw new Error(`Erro ao buscar consultas: ${appointmentsError.message}`);
        }

        if (!appointmentsData || appointmentsData.length === 0) return [];

        // Extrair contact_ids únicos e mapear informações
        const appointmentsMap = new Map<string, { date: string; count: number }>();
        const contactIdsSet = new Set<string>();

        appointmentsData.forEach((apt: any) => {
          const contactId = apt.contact_id;
          if (!contactId) return;

          contactIdsSet.add(contactId);
          
          const existing = appointmentsMap.get(contactId);
          if (!existing || new Date(apt.start_time) > new Date(existing.date)) {
            appointmentsMap.set(contactId, {
              date: apt.start_time,
              count: (existing?.count || 0) + 1,
            });
          } else {
            appointmentsMap.set(contactId, {
              date: existing.date,
              count: existing.count + 1,
            });
          }
        });

        const contactIds = Array.from(contactIdsSet);
        if (contactIds.length === 0) return [];

        // Buscar informações dos contatos
        const { data: contactsData, error: contactsError } = await supabase
          .from('crm_contacts')
          .select(`
            id,
            full_name,
            email,
            phone,
            birth_date
          `)
          .in('id', contactIds)
          .order('full_name', { ascending: true });

        if (contactsError) {
          console.error('Erro ao buscar contatos:', contactsError);
          throw new Error(`Erro ao buscar pacientes: ${contactsError.message}`);
        }

        if (!contactsData) return [];

        // Mapear pacientes com informações de última consulta
        return contactsData.map((contact: any) => {
          const appointmentInfo = appointmentsMap.get(contact.id);
          return {
            ...contact,
            last_appointment_date: appointmentInfo?.date,
            total_appointments: appointmentInfo?.count || 0,
          } as PatientWithLastAppointment;
        });
      } catch (error) {
        console.error('Erro ao buscar pacientes com consultas:', error);
        throw error;
      }
    },
    enabled: !!user?.id && open,
    staleTime: 2 * 60 * 1000,
  });

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

  const handleSelectPatient = (patient: PatientWithLastAppointment) => {
    onSelectPatient(patient.id, patient.full_name || 'Paciente');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Selecionar Paciente
          </DialogTitle>
          <DialogDescription>
            Escolha um paciente que já possui consultas marcadas para criar um novo prontuário.
          </DialogDescription>
        </DialogHeader>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de pacientes */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                Carregando pacientes...
              </div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                {patients && patients.length === 0
                  ? 'Nenhum paciente com consultas encontrado.'
                  : 'Nenhum paciente encontrado com os termos de busca.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <Button
                  key={patient.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex items-start justify-between w-full text-left">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-foreground">
                          {patient.full_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground pl-6">
                        {patient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </span>
                        )}
                      </div>

                      {patient.last_appointment_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground pl-6">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Última consulta: {format(parseISO(patient.last_appointment_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </span>
                          {patient.total_appointments && patient.total_appointments > 1 && (
                            <span className="ml-2">
                              ({patient.total_appointments} consulta{patient.total_appointments > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
