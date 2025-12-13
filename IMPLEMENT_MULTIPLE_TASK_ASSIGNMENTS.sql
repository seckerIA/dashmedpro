-- =====================================================
-- IMPLEMENTAÇÃO: MÚLTIPLAS ATRIBUIÇÕES DE TAREFAS
-- =====================================================
-- Execute este SQL completo no Dashboard do Supabase
-- para implementar o sistema de múltiplas atribuições

-- 1. Criar tabela para múltiplas atribuições de tarefas
CREATE TABLE IF NOT EXISTS public.task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.task_status NOT NULL DEFAULT 'pendente',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Evitar duplicatas
    UNIQUE(task_id, user_id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON public.task_assignments(status);

-- 3. Adicionar comentários para documentação
COMMENT ON TABLE public.task_assignments IS 'Armazena múltiplas atribuições de tarefas para usuários';
COMMENT ON COLUMN public.task_assignments.task_id IS 'ID da tarefa atribuída';
COMMENT ON COLUMN public.task_assignments.user_id IS 'ID do usuário que recebeu a tarefa';
COMMENT ON COLUMN public.task_assignments.assigned_at IS 'Data/hora da atribuição';
COMMENT ON COLUMN public.task_assignments.assigned_by IS 'ID do usuário que fez a atribuição';
COMMENT ON COLUMN public.task_assignments.status IS 'Status individual da tarefa para este usuário';
COMMENT ON COLUMN public.task_assignments.completed_at IS 'Data/hora da conclusão individual';

-- 4. Habilitar RLS na nova tabela
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para task_assignments
CREATE POLICY "Users can view their own task assignments"
ON public.task_assignments
FOR SELECT
USING ( 
    auth.uid() = user_id OR 
    auth.uid() = assigned_by OR
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id 
        AND (t.user_id = auth.uid() OR t.created_by = auth.uid())
    )
);

CREATE POLICY "Users can insert task assignments"
ON public.task_assignments
FOR INSERT
WITH CHECK ( 
    auth.uid() = assigned_by OR
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id 
        AND (t.user_id = auth.uid() OR t.created_by = auth.uid())
    )
);

CREATE POLICY "Users can update their own task assignments"
ON public.task_assignments
FOR UPDATE
USING ( auth.uid() = user_id )
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete task assignments they created"
ON public.task_assignments
FOR DELETE
USING ( 
    auth.uid() = assigned_by OR
    EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id 
        AND (t.user_id = auth.uid() OR t.created_by = auth.uid())
    )
);

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER handle_task_assignments_updated_at 
    BEFORE UPDATE ON public.task_assignments
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- 7. Migrar dados existentes da tabela tasks para task_assignments
-- (apenas tarefas que têm assigned_to preenchido)
INSERT INTO public.task_assignments (task_id, user_id, assigned_by, status, assigned_at)
SELECT 
    t.id as task_id,
    t.assigned_to as user_id,
    t.created_by as assigned_by,
    t.status,
    t.created_at as assigned_at
FROM public.tasks t
WHERE t.assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;

-- 8. Criar função para sincronizar atribuições
CREATE OR REPLACE FUNCTION public.sync_task_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é uma nova atribuição, manter o campo assigned_to da tabela tasks
    -- para compatibilidade com código existente
    IF TG_OP = 'INSERT' THEN
        -- Atualizar o campo assigned_to na tabela tasks com o primeiro usuário
        UPDATE public.tasks 
        SET assigned_to = NEW.user_id
        WHERE id = NEW.task_id 
        AND assigned_to IS NULL;
        
        RETURN NEW;
    END IF;
    
    -- Se é uma atualização de status, sincronizar com a tabela tasks
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        -- Se todos os usuários atribuídos completaram, marcar tarefa como concluída
        IF NEW.status = 'concluida' THEN
            -- Verificar se todos os usuários atribuídos completaram
            IF NOT EXISTS (
                SELECT 1 FROM public.task_assignments ta
                WHERE ta.task_id = NEW.task_id 
                AND ta.status = 'pendente'
            ) THEN
                UPDATE public.tasks 
                SET status = 'concluida'
                WHERE id = NEW.task_id;
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Criar trigger para sincronizar atribuições
DROP TRIGGER IF EXISTS trigger_sync_task_assignments ON public.task_assignments;
CREATE TRIGGER trigger_sync_task_assignments
    AFTER INSERT OR UPDATE ON public.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_task_assignments();

-- 10. Criar função para buscar tarefas com múltiplas atribuições
CREATE OR REPLACE FUNCTION public.get_tasks_with_assignments(user_id_param UUID)
RETURNS TABLE (
    task_id UUID,
    title TEXT,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority public.task_priority,
    status public.task_status,
    category public.task_category,
    created_by UUID,
    user_id UUID,
    position INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deal_id UUID,
    contact_id UUID,
    -- Campos das atribuições
    assignment_id UUID,
    assigned_user_id UUID,
    assignment_status public.task_status,
    assigned_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Campos dos perfis
    created_by_name TEXT,
    created_by_email TEXT,
    assigned_user_name TEXT,
    assigned_user_email TEXT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        t.id as task_id,
        t.title,
        t.description,
        t.due_date,
        t.priority,
        t.status,
        t.category,
        t.created_by,
        t.user_id,
        t.position,
        t.created_at,
        t.updated_at,
        t.deal_id,
        t.contact_id,
        -- Campos das atribuições
        ta.id as assignment_id,
        ta.user_id as assigned_user_id,
        ta.status as assignment_status,
        ta.assigned_at,
        ta.completed_at,
        -- Campos dos perfis
        cb.full_name as created_by_name,
        cb.email as created_by_email,
        au.full_name as assigned_user_name,
        au.email as assigned_user_email
    FROM public.tasks t
    LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
    LEFT JOIN public.profiles cb ON t.created_by = cb.id
    LEFT JOIN public.profiles au ON ta.user_id = au.id
    WHERE 
        -- Tarefas do usuário (criadas por ele ou atribuídas a ele)
        (t.user_id = user_id_param OR t.created_by = user_id_param OR ta.user_id = user_id_param)
    ORDER BY t.position ASC, ta.assigned_at ASC;
$$;

-- 11. Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('tasks', 'task_assignments')
ORDER BY table_name, ordinal_position;

-- 12. Verificar dados migrados
SELECT 
    'Tarefas com assigned_to' as tipo,
    COUNT(*) as quantidade
FROM public.tasks 
WHERE assigned_to IS NOT NULL
UNION ALL
SELECT 
    'Atribuições migradas' as tipo,
    COUNT(*) as quantidade
FROM public.task_assignments;

-- 13. Testar a função de busca
-- SELECT * FROM public.get_tasks_with_assignments(auth.uid()) LIMIT 5;


