create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  company_name text not null,
  segment text, city text, state text, country text default 'Brasil',
  website text, phone text, whatsapp text, email text,
  contact_name text, contact_role text,
  lead_quality text not null default 'medium',
  lead_score int not null default 50,
  signals jsonb not null default '[]'::jsonb,
  justification text,
  status text not null default 'new',
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null,
  stage text not null default 'interest',
  signal text,
  next_step text,
  value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lead_id uuid references public.leads(id) on delete cascade,
  channel text not null default 'whatsapp',
  interlocutor_type text default 'unknown',
  last_intent text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null,
  body text not null,
  delivery_status text not null default 'recorded',
  created_at timestamptz not null default now()
);
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lead_id uuid references public.leads(id) on delete set null,
  kind text not null default 'reminder',
  reason text not null,
  context text,
  action text,
  due_at timestamptz not null,
  requires_authorization boolean not null default false,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  message text,
  audience jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_name text not null,
  service text,
  value numeric not null default 0,
  payment_status text not null default 'pending',
  confirmed_by_user boolean not null default true,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  category text not null,
  title text not null,
  content text not null,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null default 'Nova operação',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  role text not null,
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  thread_id uuid references public.agent_threads(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  tool text not null,
  intent text,
  summary text not null,
  input jsonb not null default '{}'::jsonb,
  authorization_level int not null default 1,
  status text not null default 'preparing',
  result text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.authorizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  lead_id uuid references public.leads(id) on delete cascade,
  level int not null,
  scope text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create table public.agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  thread_id uuid,
  action_id uuid,
  intent text,
  event text not null,
  detail text,
  authorized_by text,
  status text,
  error text,
  created_at timestamptz not null default now()
);
create table public.autopilot_settings (
  user_id uuid primary key default auth.uid(),
  enabled boolean not null default false,
  permissions jsonb not null default '{"search":false,"analyze":false,"notify":false,"prepare":false,"follow_up":false,"send":false,"negotiate":false,"close":false}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['leads','opportunities','conversations','conversation_messages','follow_ups','campaigns','sales','knowledge_items','agent_threads','agent_messages','agent_actions','authorizations','agent_audit_log','autopilot_settings'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

create index on public.agent_messages(thread_id, created_at);
create index on public.leads(user_id, lead_score desc);