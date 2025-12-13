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
import { Calendar, Clock, User, AlertCircle, Save, X, Sparkles, Star, Zap, Users, Target, Briefcase, ImagePlus } from 'lucide-react';
import { TaskWithProfile, TaskWithCRM, CreateTaskData, UpdateTaskData, TASK_PRIORITIES, TASK_CATEGORIES } from '@/types/tasks';
import { useCRM } from '@/hooks/useCRM';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Schema de validação
const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  due_date: z.string().optional(),
  priority: z.enum(['baixa', 'media', 'alta']).optional(),
  assigned_to: z.string().optional(), // Mantido para compatibilidade
  assigned_to_users: z.array(z.string()).optional(), // Novo campo para múltiplas atribuições
  category: z.enum(['comercial', 'marketing', 'financeiro', 'social_media', 'empresarial']).optional(),
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(task?.image_url || null);
  const { deals, contacts } = useCRM();
  const { uploadTaskImage, isUploading } = useFileUpload();
  const { user } = useAuth();
  
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
      priority: task?.priority || 'media',
      assigned_to: task?.assigned_to || '',
      assigned_to_users: task?.assignments?.map(a => a.user_id) || [],
      category: task?.category || 'comercial',
      deal_id: task?.deal_id || '',
      contact_id: task?.contact_id || '',
    },
  });

  const watchedPriority = watch('priority');
  const watchedDueDate = watch('due_date');
  const watchedCategory = watch('category');
  const watchedDealId = watch('deal_id');
  const watchedContactId = watch('contact_id');

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      const assignedUsers = task.assignments?.map(a => a.user_id) || [];
      setSelectedUsers(assignedUsers);
      setImagePreview(task.image_url || null);
      setImageFile(null);
      reset({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        priority: task.priority || 'media',
        assigned_to: task.assigned_to || '',
        assigned_to_users: assignedUsers,
        category: task.category || 'comercial',
        deal_id: task.deal_id || '',
        contact_id: task.contact_id || '',
      });
      setIsEditing(true);
    } else {
      setSelectedUsers([]);
      setImagePreview(null);
      setImageFile(null);
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
      
      // Upload da imagem primeiro, se houver
      let imageUrl: string | undefined = task?.image_url || undefined;
      
      if (imageFile && user) {
        console.log('[TaskForm] Fazendo upload da imagem...');
        const uploadedUrl = await uploadTaskImage(imageFile, user.id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
          console.log('[TaskForm] Imagem carregada:', uploadedUrl);
        }
      }
      
      const formData = {
        title: data.title,
        description: data.description || undefined,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        priority: data.priority,
        assigned_to: data.assigned_to || undefined, // Mantido para compatibilidade
        assigned_to_users: selectedUsers.length > 0 ? selectedUsers : undefined, // Novo campo
        category: data.category,
        deal_id: data.deal_id || undefined,
        contact_id: data.contact_id || undefined,
        image_url: imageUrl,
      };

      console.log('[TaskForm] Dados formatados:', formData);
      await onSave(formData);
      console.log('[TaskForm] Tarefa salva com sucesso');
      
      if (!isEditing) {
        reset();
        setSelectedUsers([]);
        setImageFile(null);
        setImagePreview(null);
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

  // Função para gerenciar upload de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const getPriorityConfig = (priority: string) => {
    return TASK_PRIORITIES.find(p => p.value === priority);
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="relative bg-gradient-to-br from-card/80 via-card/50 to-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
      {/* Magic UI Background Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <CardHeader className="pb-4 pt-8 px-8 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="relative">
              <Calendar className="h-8 w-8 text-primary" />
              <Sparkles className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              <Star className="h-3 w-3 text-amber-500 absolute -bottom-1 -left-1 animate-pulse" />
            </div>
            <span className="font-bold">
              {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-10 w-10 p-0 hover:bg-accent rounded-xl transition-all hover:scale-110"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8 relative z-10">
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
              <Calendar className="h-5 w-5 text-primary" />
              Data e Hora de Vencimento
            </label>
            <Input
              type="datetime-local"
              {...register('due_date')}
              className="bg-background text-foreground border-input text-base font-medium h-12 rounded-xl transition-all"
            />
            {watchedDueDate && (
              <p className="text-sm text-foreground font-medium">
                {formatDateTime(watchedDueDate)}
              </p>
            )}
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
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Categoria
            </label>
            <Select
              value={watchedCategory}
              onValueChange={(value) => setValue('category', value as any)}
            >
              <SelectTrigger className="bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                {TASK_CATEGORIES.map((category) => (
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
                Categoria: {TASK_CATEGORIES.find(cat => cat.value === watchedCategory)?.label}
              </p>
            )}
          </div>

          {/* Deal Relacionado */}
          {deals.length > 0 && (
            <div className="space-y-3">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Deal Relacionado
              </label>
              <Select
                value={watchedDealId}
                onValueChange={(value) => setValue('deal_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger className="bg-card text-foreground border-border text-base font-medium h-12 rounded-xl transition-all">
                  <SelectValue placeholder="Selecione um contrato (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-foreground border-border rounded-xl">
                  <SelectItem value="none" className="hover:bg-accent">Nenhum contrato</SelectItem>
                  {deals.map((deal) => (
                    <SelectItem key={deal.id} value={deal.id} className="hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{deal.title}</span>
                        {deal.value && (
                          <Badge variant="outline" className="text-xs">
                            R$ {deal.value.toLocaleString('pt-BR')}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {watchedDealId && (
                <p className="text-sm text-foreground font-medium">
                  Deal: {deals.find(deal => deal.id === watchedDealId)?.title}
                </p>
              )}
            </div>
          )}

          {/* Contato Relacionado */}
          {contacts.length > 0 && (
            <div className="space-y-3">
              <label className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contato Relacionado
              </label>
              <Select
                value={watchedContactId}
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

          {/* Upload de Imagem */}
          <div className="space-y-3">
            <label className="text-base font-bold text-foreground flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              Imagem (Opcional)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-all">
                <label 
                  htmlFor="task-image-upload" 
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <ImagePlus className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Clique para adicionar uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG até 5MB
                  </p>
                </label>
                <input
                  id="task-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative border border-border rounded-xl overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
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
