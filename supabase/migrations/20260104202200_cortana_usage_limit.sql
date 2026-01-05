-- Tabela para rastrear uso diário da Cortana
create table if not exists public.cortana_daily_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  usage_date date not null default current_date,
  usage_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, usage_date)
);

-- RLS
alter table public.cortana_daily_usage enable row level security;

create policy "Users can view own usage"
  on public.cortana_daily_usage for select
  using (auth.uid() = user_id);

-- Função RPC para verificar e incrementar uso
create or replace function check_and_increment_cortana_usage(limit_count int)
returns json
language plpgsql
security definer
as $$
declare
  current_usage int;
  user_role text;
begin
  -- Verificar role do usuário (admins sempre liberados)
  select role into user_role from public.profiles where id = auth.uid();
  
  if user_role = 'admin' or user_role = 'dono' then
    return json_build_object('allowed', true, 'usage', 0, 'remaining', 9999);
  end if;

  -- Inserir ou atualizar contador do dia
  insert into public.cortana_daily_usage (user_id, usage_date, usage_count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, usage_date)
  do update set usage_count = cortana_daily_usage.usage_count + 1
  returning usage_count into current_usage;

  -- Verificar limite (se current_usage for 1, é o primeiro uso, então ok se limit >= 1)
  -- Mas espere, queremos permitir ATÉ o limite.
  -- Se o contador APÓS incremento for maior que o limite, então bloqueamos? 
  -- Não, idealmente verificamos antes. Mas para atomicidade, incrementamos e checamos.
  
  -- Se incrementou para 6 e o limite é 5, então este uso (o 6º) deve ser bloqueado?
  -- Vamos fazer diferente: checar antes de incrementar para não gastar o contador com tentativa falha, 
  -- MAS isso tem race condition.
  -- Melhor abordagem para UX simples:
  -- Incrementar. Se usou mais que o limite, retorna false E faz rollback? Não precisa rollback, só negar.
  
  if current_usage > limit_count then
    return json_build_object('allowed', false, 'usage', current_usage, 'remaining', 0);
  end if;

  return json_build_object('allowed', true, 'usage', current_usage, 'remaining', limit_count - current_usage);
end;
$$;
