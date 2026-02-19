import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Clock, User, AlertCircle, Save, X, Zap, Users, Target, Briefcase, Paperclip, Settings2 } from 'lucide-react';
import { TaskWithProfile, TaskWithCRM, CreateTaskData, UpdateTaskData, TASK_PRIORITIES, TASK_CATEGORIES } from '@/types/tasks';
import { useCRM } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { useTaskCategories, CATEGORY_COLORS } from '@/hooks/useTaskCategories';
import { useTaskAttachments } from '@/hooks/useTaskAttachments';
import { CategoryManagerModal } from './CategoryManagerModal';
import { TaskAttachments } from './TaskAttachments';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateTimeSlots } from '@/types/medicalAppointments';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Schema de validação
const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  due_date: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta']).optional(),
  assigned_to: z.string().optional(), // Mantido para compatibilidade
  assigned_to_users: z.array(z.string()).optional(), // Novo campo para múltiplas atribuições
  category: z.string().optional(), // Aceita qualquer categoria (padrão ou personalizada)
  deal_id: z.string().optional(),
  contact_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: TaskWithCRM | null;
  onSave: (data: CreateTaskData | UpdateTaskData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  teamMembers?: Array<{
    id: string;
    full_name: string | null;
    email: string;
  }>;
}

export function TaskForm({ task, onSave, onCancel, isLoading = false, teamMembers = [] }: TaskFormProps) {
  const [isEditing, setIsEditing] = useState(!!task);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [currentlyUploading, setCurrentlyUploading] = useState<string[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );
  const { deals, contacts } = useCRM();
  const { user } = useAuth();
  const { categories, isLoading: isLoadingCategories } = useTaskCategories();
  const { uploadAttachment, isUploading } = useTaskAttachments(task?.id);

  const timeSlots = generateTimeSlots();

  // Combinar categorias do banco com as padrão (fallback)
  const allCategories = categories.length > 0
    ? categories.map(cat => ({ value: cat.name, label: cat.name, color: cat.color }))
    : TASK_CATEGORIES;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      due_date: task?.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      priority: (task?.priority as any) || 'media',
      assigned_to: task?.assigned_to || '',
      assigned_to_users: task?.assignments?.map(a => a.user_id) || [],
      category: (task?.category as any) || 'comercial',
      deal_id: task?.deal_id || '',
      contact_id: task?.contact_id || '',
    },
  });

  const handleRemoveFailedFile = (index: number) => {
    setFailedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const watchedPriority = watch('priority');
  const watchedDueDate = watch('due_date');
  const watchedCategory = watch('category');
  const watchedDealId = watch('deal_id');
  const watchedContactId = watch('contact_id');

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      const assignedUsers = task.assignments?.map(a => a.user_id) || [];
      const dueDate = task.due_date ? new Date(task.due_date) : undefined;
      setSelectedUsers(assignedUsers);
      setPendingFiles([]);
      setSelectedDate(dueDate);
      reset({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        priority: (task.priority as any) || 'media',
        assigned_to: task.assigned_to || '',
        assigned_to_users: assignedUsers,
        category: (task.category as any) || 'comercial',
        deal_id: task.deal_id || '',
        contact_id: task.contact_id || '',
      });
      setIsEditing(true);
    } else {
      setSelectedUsers([]);
      setPendingFiles([]);
      setSelectedDate(undefined);
      reset({
        title: '',
        description: '',
        due_date: '',
        priority: 'media',
        assigned_to: '',
        assigned_to_users: [],
        category: 'comercial',
        deal_id: '',
        contact_id: '',
      });
      setIsEditing(false);
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      console.log('[TaskForm] Iniciando submissão do formulário:', data);
      setIsSaving(true);

      // Função para criar ISO string com timezone local (ex: 2026-01-13T09:00:00-03:00)
      const toISOWithTimezone = (dateStr: string): string => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = '00';

        // Calcular offset do timezone (ex: -03:00 para Brasil)
        const tzOffset = date.getTimezoneOffset();
        const sign = tzOffset <= 0 ? '+' : '-';
        const offsetHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(tzOffset) % 60).padStart(2, '0');
        const timezone = `${sign}${offsetHours}:${offsetMinutes}`;

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;
      };

      const formData = {
        title: data.title,
        description: data.description || undefined,
        due_date: data.due_date ? toISOWithTimezone(data.due_date) : undefined,
        priority: data.priority,
        // Ensure assigned_to is set if users are selected (fallback to first user)
        assigned_to: data.assigned_to || (selectedUsers.length > 0 ? selectedUsers[0] : undefined),
        assigned_to_users: selectedUsers.length > 0 ? selectedUsers : undefined,
        category: data.category,
        deal_id: data.deal_id || undefined,
        contact_id: data.contact_id || undefined,
      };

      console.log('[TaskForm] Dados formatados:', formData);
      const savedTask = await onSave(formData);
      console.log('[TaskForm] Tarefa salva com sucesso:', savedTask);

      // Upload de anexos pendentes após salvar a tarefa
      // Usar o ID da tarefa salva (retornada) OU o ID da tarefa existente
      const taskIdForUpload = (savedTask as any)?.id || task?.id;
      if (pendingFiles.length > 0 && taskIdForUpload) {
        console.log('[TaskForm] Fazendo upload de', pendingFiles.length, 'anexos para tarefa:', taskIdForUpload);

        const currentFailedFiles: File[] = [];

        for (const file of pendingFiles) {
          try {
            setCurrentlyUploading(prev => [...prev, file.name]);
            // Força a atualização do cache após cada upload bem sucedido
            await uploadAttachment({ file, taskId: taskIdForUpload });
          } catch (uploadError: any) {
            console.error('[TaskForm] Erro ao fazer upload do anexo:', file.name, uploadError);
            currentFailedFiles.push(file);
            toast({
              variant: 'destructive',
              title: 'Erro no upload',
              description: `Falha ao enviar ${file.name}: ${uploadError.message || 'Erro desconhecido'}`
            });
          } finally {
            setCurrentlyUploading(prev => prev.filter(name => name !== file.name));
          }
        }

        // Adiciona os arquivos que falharam à lista de falhas
        if (currentFailedFiles.length > 0) {
          setFailedFiles(prev => [...prev, ...currentFailedFiles]);
          console.warn('[TaskForm] Alguns arquivos falharam no upload:', currentFailedFiles.length);
        } else {
          console.log('[TaskForm] Upload de todos os anexos concluído com sucesso');
          onCancel();
        }

        // Limpa a lista de pendentes pois ou foram salvos ou movidos para falhas
        setPendingFiles([]);

      } else {
        // Se não tinha arquivos para upload, fecha direto
        onCancel();
      }

    } catch (error) {
      console.error('[TaskForm] Erro ao salvar tarefa:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para gerenciar seleção de usuários
  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      const newSelectedUsers = [...selectedUsers, userId];
      setSelectedUsers(newSelectedUsers);
      setValue('assigned_to_users', newSelectedUsers);
    } else {
      const newSelectedUsers = selectedUsers.filter(id => id !== userId);
      setSelectedUsers(newSelectedUsers);
      setValue('assigned_to_users', newSelectedUsers);
    }
  };

  // Funções para gerenciar anexos
  const handleFilesSelected = async (files: File[]) => {
    if (task?.id) {
      // Upload imediato se a tarefa já existir
      const taskId = task.id;
      for (const file of files) {
        try {
          setCurrentlyUploading(prev => [...prev, file.name]);
          setPendingFiles(prev => [...prev, file]);
          await uploadAttachment({ file, taskId });
          setPendingFiles(prev => prev.filter(f => f.name !== file.name));
        } catch (error: any) {
          console.error('[TaskForm] Erro no upload imediato:', error);
          setFailedFiles(prev => [...prev, file]);
          setPendingFiles(prev => prev.filter(f => f.name !== file.name));
        } finally {
          setCurrentlyUploading(prev => prev.filter(name => name !== file.name));
        }
      }
    } else {
      setPendingFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityConfig = (priority: string) => {
    return TASK_PRIORITIES.find(p => p.value === priority);
  };

  // Get current time from due_date or default to current time
  const getCurrentTime = (): string => {
    if (watchedDueDate) {
      const date = new Date(watchedDueDate);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '09:00';
  };

  // Formatar data local sem conversão UTC (evita problema de timezone)
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const currentTime = getCurrentTime();
      const [hours, minutes] = currentTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      setValue('due_date', formatLocalDateTime(date));
    } else {
      setValue('due_date', '');
    }
    setIsDatePickerOpen(false);
  };

  // Handle time change
  const handleTimeChange = (time: string) => {
    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
      setValue('due_date', formatLocalDateTime(newDate));
    } else {
      // If no date selected, create a date for today with the selected time
      const today = new Date();
      const [hours, minutes] = time.split(':');
      today.setHours(parseInt(hours || '0'), parseInt(minutes || '0'));
      setSelectedDate(today);
      setValue('due_date', formatLocalDateTime(today));
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <span>
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Título */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Título *
            </label>
            <Input
              {...register('title')}
              placeholder="Digite o título da tarefa..."
              className={cn(
                "bg-background text-foreground border-input text-base font-medium h-12 rounded-xl transition-all",
                errors.title && "border-destructive focus:border-destructive focus:ring-destructive/20"
              )}
            />
            {errors.title && (
              <p className="text-sm text-destructive font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Descrição
            </label>
            <Textarea
              {...register('description')}
              placeholder="Descreva os detalhes da tarefa..."
              rows={4}
              className={cn(
                "bg-background text-foreground border-input text-base font-medium resize-none rounded-xl transition-all",
                errors.description && "border-destructive focus:border-destructive focus:ring-destructive/20"
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Data e Hora de Vencimento
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12 rounded-xl bg-background text-foreground border-input",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Select */}
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select
                  value={getCurrentTime()}
                  onValueChange={(value) => handleTimeChange(value)}
                >
                  <SelectTrigger className="bg-background text-foreground border-input text-base font-medium h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Prioridade
            </label>
            <Select
              value={watchedPriority}
              onValueChange={(value) => setValue('priority', value as any)}
            >
              <SelectTrigger className="bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value} className="hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-sm font-bold px-3 py-1",
                          priority.value === 'alta' && "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300",
                          priority.value === 'media' && "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300",
                          priority.value === 'baixa' && "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300"
                        )}
                      >
                        {priority.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {watchedPriority && (
              <p className="text-sm text-foreground font-medium">
                Prioridade: {getPriorityConfig(watchedPriority)?.label}
              </p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Categoria
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCategoryManager(true)}
                className="h-8 text-xs gap-1"
              >
                <Settings2 className="h-3 w-3" />
                Gerenciar
              </Button>
            </div>
            <Select
              value={watchedCategory}
              onValueChange={(value) => setValue('category', value as any)}
            >
              <SelectTrigger className="bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                {allCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value} className="hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-sm font-bold px-3 py-1",
                          category.color,
                          "bg-background/50 border-current/20"
                        )}
                      >
                        {category.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {watchedCategory && (
              <p className="text-sm text-foreground font-medium">
                Categoria: {allCategories.find(cat => cat.value === watchedCategory)?.label}
              </p>
            )}
          </div>

          {/* Modal de Gerenciamento de Categorias */}
          <CategoryManagerModal
            open={showCategoryManager}
            onOpenChange={setShowCategoryManager}
          />

          {/* Contato Relacionado */}
          {contacts.length > 0 && (
            <div className="space-y-3">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contato Relacionado
              </label>
              <Select
                value={watchedContactId || 'none'}
                onValueChange={(value) => setValue('contact_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger className="bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                  <SelectValue placeholder="Selecione um contato (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                  <SelectItem value="none" className="hover:bg-accent">Nenhum contato</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id} className="hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact.full_name || contact.email}</span>
                        {contact.company && (
                          <Badge variant="outline" className="text-xs">
                            {contact.company}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchedContactId && (
                <p className="text-sm text-foreground font-medium">
                  Contato: {contacts.find(contact => contact.id === watchedContactId)?.full_name || contacts.find(contact => contact.id === watchedContactId)?.email}
                </p>
              )}
            </div>
          )}

          {/* Anexos */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Anexos
            </label>
            <TaskAttachments
              taskId={task?.id}
              isEditing={true}
              onFilesSelected={handleFilesSelected}
              pendingFiles={pendingFiles}
              failedFiles={failedFiles}
              currentlyUploading={currentlyUploading}
              onRemovePendingFile={handleRemovePendingFile}
              onRemoveFailedFile={handleRemoveFailedFile}
            />
          </div>

          {/* Atribuir para múltiplas pessoas */}
          {teamMembers.length > 0 && (
            <div className="space-y-3">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Atribuir para
              </label>
              <div className="bg-card border border-border rounded-xl p-4 max-h-48 overflow-y-auto">
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedUsers.includes(member.id)}
                        onCheckedChange={(checked) => handleUserToggle(member.id, checked as boolean)}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer flex-1"
                      >
                        {member.full_name || member.email}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {selectedUsers.length} pessoa{selectedUsers.length !== 1 ? 's' : ''} selecionada{selectedUsers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center gap-4 pt-6">
            <Button
              type="submit"
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 font-bold text-lg px-8 py-4"
            >
              <Save className="h-5 w-5" />
              {(isLoading || isSaving) ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Tarefa')}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSaving}
              className="hover:bg-accent hover:border-border transition-all hover:scale-105 font-semibold text-lg px-6 py-4"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
