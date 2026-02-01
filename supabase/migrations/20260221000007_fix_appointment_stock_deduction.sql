-- Fix handle_appointment_stock_deduction to use FEFO logic instead of updating non-existent total_quantity column
CREATE OR REPLACE FUNCTION public.handle_appointment_stock_deduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    usage_record RECORD;
    batch_record RECORD;
    remaining_to_deduct NUMERIC;
    current_deduction NUMERIC;
BEGIN
    -- Check if status changed to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        -- Loop through usage records for this appointment that haven't been deducted yet
        FOR usage_record IN 
            SELECT * FROM public.appointment_stock_usage 
            WHERE appointment_id = NEW.id AND deducted = FALSE
        LOOP
            remaining_to_deduct := usage_record.quantity;
            
            -- Find batches for this item using FEFO (First Expiry First Out)
            FOR batch_record IN 
                SELECT * FROM public.inventory_batches 
                WHERE item_id = usage_record.inventory_item_id 
                AND is_active = TRUE 
                AND quantity > 0
                ORDER BY expiration_date ASC NULLS LAST, created_at ASC
            LOOP
                EXIT WHEN remaining_to_deduct <= 0;
                
                -- Calculate how much to take from this batch
                IF batch_record.quantity >= remaining_to_deduct THEN
                    current_deduction := remaining_to_deduct;
                ELSE
                    current_deduction := batch_record.quantity;
                END IF;
                
                -- Register movement (Trigger on movements will update the batch quantity)
                INSERT INTO public.inventory_movements (
                    batch_id,
                    type,
                    quantity,
                    reference_id,
                    description,
                    created_by
                ) VALUES (
                    batch_record.id,
                    'OUT',
                    -current_deduction,
                    NEW.id,
                    'Dedução automática: Consulta ' || NEW.title,
                    NEW.user_id
                );
                
                remaining_to_deduct := remaining_to_deduct - current_deduction;
            END LOOP;
            
            -- Mark as deducted
            UPDATE public.appointment_stock_usage
            SET deducted = TRUE
            WHERE id = usage_record.id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$function$;
