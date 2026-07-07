-- Álbum Copa 2026 — schema do Supabase
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).

-- Estado do álbum (1 linha por usuário)
create table if not exists public.collections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  schema_version int not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "usuario acessa apenas a propria colecao"
  on public.collections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Snapshots automáticos (mantidos os últimos 30 pelo app)
create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  state jsonb not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists snapshots_user_created
  on public.snapshots (user_id, created_at desc);

alter table public.snapshots enable row level security;

create policy "usuario acessa apenas os proprios snapshots"
  on public.snapshots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
