-- =====================================================
-- CRIAÇÃO DA TABELA DE NOTIFICAÇÕES
-- =====================================================
-- Execute este SQL completo no Dashboard do Supabase
-- para criar o sistema de notificações

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_assigned', 'task_completed', 'task_created')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON public.notifications(task_id);

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE public.notifications IS 'Armazena notificações para usuários';
COMMENT ON COLUMN public.notifications.user_id IS 'ID do usuário que recebeu a notificação';
COMMENT ON COLUMN public.notifications.type IS 'Tipo da notificação (task_assigned, task_completed, task_created)';
COMMENT ON COLUMN public.notifications.title IS 'Título da notificação';
COMMENT ON COLUMN public.notifications.message IS 'Mensagem da notificação';
COMMENT ON COLUMN public.notifications.read IS 'Se a notificação foi lida';
COMMENT ON COLUMN public.notifications.task_id IS 'ID da tarefa relacionada (opcional)';

-- 4. Habilitar RLS na tabela
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para notificações
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK ( true ); -- Permitir inserção de notificações para qualquer usuário

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER handle_notifications_updated_at 
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- 7. Criar função para criar notificação de tarefa atribuída
CREATE OR REPLACE FUNCTION public.create_task_assigned_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar notificação para o usuário que recebeu a tarefa
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    VALUES (
        NEW.user_id,
        'task_assigned',
        'Nova tarefa atribuída',
        'Você recebeu uma nova tarefa: ' || (SELECT title FROM public.tasks WHERE id = NEW.task_id),
        NEW.task_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Criar trigger para notificar quando tarefa é atribuída
DROP TRIGGER IF EXISTS trigger_task_assigned_notification ON public.task_assignments;
CREATE TRIGGER trigger_task_assigned_notification
    AFTER INSERT ON public.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.create_task_assigned_notification();

-- 9. Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 10. Testar inserção de notificação (opcional)
-- INSERT INTO public.notifications (user_id, type, title, message)
-- VALUES (
--     auth.uid(),
--     'task_created',
--     'Teste de notificação',
--     'Esta é uma notificação de teste'
-- );


