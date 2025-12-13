-- Dropar função antiga e recriar com image_url
DROP FUNCTION IF EXISTS public.get_tasks_with_assignments(UUID);

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
    "position" INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deal_id UUID,
    contact_id UUID,
    image_url TEXT,
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
        t."position",
        t.created_at,
        t.updated_at,
        t.deal_id,
        t.contact_id,
        t.image_url,
        -- Campos das atribuições
        ta.id as assignment_id,
        ta.user_id as assigned_user_id,
        ta.status as assignment_status,
        ta.assigned_at,
        ta.completed_at,
        -- Campos dos perfis
        p_creator.full_name as created_by_name,
        p_creator.email as created_by_email,
        p_assigned.full_name as assigned_user_name,
        p_assigned.email as assigned_user_email
    FROM public.tasks t
    LEFT JOIN public.task_assignments ta ON t.id = ta.task_id
    LEFT JOIN public.profiles p_creator ON t.created_by = p_creator.id
    LEFT JOIN public.profiles p_assigned ON ta.user_id = p_assigned.id
    WHERE 
        t.user_id = user_id_param
        OR ta.user_id = user_id_param
        OR t.created_by = user_id_param
    ORDER BY t."position" ASC, t.created_at DESC;
$$;