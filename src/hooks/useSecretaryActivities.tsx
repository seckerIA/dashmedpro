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
  const { profile } = useUserProfile();

  return useQuery({
    queryKey: ["secretary-activities", user?.id, profile?.organization_id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const activities: SecretaryActivity[] = [];
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Buscar atividades do CRM (calls, emails, whatsapp, notes)
      const { data: crmActivities } = await supabase
        .from("crm_activities")
        .select(`
          id,
          type,
          title,
          description,
          created_at,
          contact:crm_contacts!crm_activities_contact_id_fkey(full_name),
          user:profiles!crm_activities_user_id_fkey(full_name)
        `)
        .gte("created_at", last24h.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (crmActivities) {
        for (const activity of crmActivities) {
          const contactName = (activity.contact as any)?.full_name || 'Paciente';
          const userName = (activity.user as any)?.full_name || 'Usuário';

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

      // 2. Buscar agendamentos recentes
      const { data: appointments } = await supabase
        .from("medical_appointments")
        .select(`
          id,
          status,
          created_at,
          start_time,
          contact:crm_contacts!medical_appointments_contact_id_fkey(full_name),
          created_by_user:profiles!medical_appointments_user_id_fkey(full_name)
        `)
        .gte("created_at", last24h.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (appointments) {
        for (const apt of appointments) {
          const contactName = (apt.contact as any)?.full_name || 'Paciente';
          const userName = (apt.created_by_user as any)?.full_name || 'Usuário';
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

      // 3. Buscar novos contatos/pacientes criados
      const { data: newContacts } = await supabase
        .from("crm_contacts")
        .select(`
          id,
          full_name,
          created_at,
          created_by:profiles!crm_contacts_user_id_fkey(full_name)
        `)
        .gte("created_at", last24h.toISOString())
        .order("created_at", { ascending: false })
        .limit(5);

      if (newContacts) {
        for (const contact of newContacts) {
          const userName = (contact.created_by as any)?.full_name || 'Usuário';

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

      // 4. Buscar tarefas completadas recentemente
      const { data: completedTasks } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          completed_at,
          assigned_user:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .gte("completed_at", last24h.toISOString())
        .order("completed_at", { ascending: false })
        .limit(5);

      if (completedTasks) {
        for (const task of completedTasks) {
          const userName = (task.assigned_user as any)?.full_name || 'Usuário';

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

      // Ordenar todas atividades por tempo (mais recente primeiro)
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());

      // Retornar apenas as 10 mais recentes
      return activities.slice(0, 10);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Atualizar a cada 5 minutos
  });
}
