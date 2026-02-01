import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 'confirmation' | 'scheduling' | 'new_patient' | 'call' | 'note' | 'whatsapp' | 'email';

export interface SecretaryActivity {
  id: string;
  type: ActivityType;
  secretary: string;
  patient: string;
  time: Date;
  description: string;
}

export function useSecretaryActivities() {
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();

  return useQuery({
    queryKey: ["secretary-activities", user?.id, profile?.organization_id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const activities: SecretaryActivity[] = [];
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Buscar atividades do CRM (calls, emails, whatsapp, notes)
      // Nota: Envolvido em try/catch pois tabela pode não existir ou RLS pode bloquear
      try {
        const { data: crmActivities, error: crmError } = await supabase
          .from("crm_activities")
          .select(`id, type, title, description, created_at`)
          .gte("created_at", last24h.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (!crmError && crmActivities) {
        for (const activity of crmActivities) {
          const contactName = 'Paciente'; // FK não existe
          const userName = 'Equipe'; // FK não existe

          let activityType: ActivityType = 'note';
          let description = activity.description || activity.title || '';

          switch (activity.type) {
            case 'call':
              activityType = 'call';
              description = description || 'registrou uma ligação';
              break;
            case 'whatsapp':
              activityType = 'whatsapp';
              description = description || 'enviou mensagem WhatsApp';
              break;
            case 'email':
              activityType = 'email';
              description = description || 'enviou email';
              break;
            case 'meeting':
              activityType = 'scheduling';
              description = description || 'registrou reunião';
              break;
            case 'note':
            case 'task':
              activityType = 'note';
              description = description || 'adicionou anotação';
              break;
          }

          activities.push({
            id: `crm-${activity.id}`,
            type: activityType,
            secretary: userName,
            patient: contactName,
            time: new Date(activity.created_at),
            description: description,
          });
        }
        }
      } catch (e) {
        // crm_activities pode não existir ou RLS pode bloquear - ignorar silenciosamente
        console.debug('[useSecretaryActivities] crm_activities query failed:', e);
      }

      // 2. Buscar agendamentos recentes
      // Nota: Envolvido em try/catch pois RLS pode bloquear
      try {
        const { data: appointments, error: aptError } = await supabase
          .from("medical_appointments")
          .select(`id, status, created_at, start_time, contact_id`)
          .gte("created_at", last24h.toISOString())
          .order("created_at", { ascending: false })
          .limit(10);

        if (!aptError && appointments) {
          for (const apt of appointments) {
            const contactName = 'Paciente'; // Simplificado para evitar erros de FK
            const userName = 'Equipe'; // Simplificado para evitar erros de FK
            const aptDate = new Date(apt.start_time);
            const formattedDate = aptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

            let description = `agendou consulta para ${formattedDate}`;
            let activityType: ActivityType = 'scheduling';

            if (apt.status === 'confirmed') {
              description = 'confirmou consulta';
              activityType = 'confirmation';
            } else if (apt.status === 'completed') {
              description = 'marcou consulta como concluída';
              activityType = 'confirmation';
            } else if (apt.status === 'cancelled') {
              description = 'cancelou consulta';
              activityType = 'note';
            }

            activities.push({
              id: `apt-${apt.id}`,
              type: activityType,
              secretary: userName,
              patient: contactName,
              time: new Date(apt.created_at),
              description: description,
            });
          }
        }
      } catch (e) {
        // medical_appointments pode falhar por RLS - ignorar silenciosamente
        console.debug('[useSecretaryActivities] medical_appointments query failed:', e);
      }

      // 3. Buscar novos contatos/pacientes criados
      // Nota: Envolvido em try/catch pois RLS pode bloquear
      try {
        const { data: newContacts, error: contactsError } = await supabase
          .from("crm_contacts")
          .select(`
            id,
            full_name,
            created_at
          `)
          .gte("created_at", last24h.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        if (!contactsError && newContacts) {
          for (const contact of newContacts) {
            const userName = 'Equipe'; // FK para user não existe

            activities.push({
              id: `contact-${contact.id}`,
              type: 'new_patient',
              secretary: userName,
              patient: contact.full_name || 'Novo Paciente',
              time: new Date(contact.created_at),
              description: 'cadastrou novo paciente',
            });
          }
        }
      } catch (e) {
        // crm_contacts pode falhar por RLS - ignorar silenciosamente
        console.debug('[useSecretaryActivities] crm_contacts query failed:', e);
      }

      // 4. Buscar tarefas completadas recentemente
      // Nota: Envolvido em try/catch pois tabela pode não existir ou RLS pode bloquear
      try {
        const { data: completedTasks, error: tasksError } = await supabase
          .from("tasks")
          .select(`id, title, completed_at`)
          .eq("status", "completed")
          .not("completed_at", "is", null)
          .gte("completed_at", last24h.toISOString())
          .order("completed_at", { ascending: false })
          .limit(5);

        if (!tasksError && completedTasks) {
          for (const task of completedTasks) {
            const userName = 'Equipe'; // FK não existe

            activities.push({
              id: `task-${task.id}`,
              type: 'confirmation',
              secretary: userName,
              patient: task.title || 'Tarefa',
              time: new Date(task.completed_at!),
              description: 'completou tarefa',
            });
          }
        }
      } catch (e) {
        // tasks pode não existir ou RLS pode bloquear - ignorar silenciosamente
        console.debug('[useSecretaryActivities] tasks query failed:', e);
      }

      // Ordenar todas atividades por tempo (mais recente primeiro)
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());

      // Retornar apenas as 10 mais recentes
      return activities.slice(0, 10);
    },
    // Esperar user E profile carregarem para evitar query stuck
    enabled: !!user && !!profile && !isLoadingProfile,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}
