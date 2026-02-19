-- Criar tabela profiles (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger para criar profile automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger só cria se não existir
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabelas do app
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  original_url text,
  status text default 'pending',
  duration integer,
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cortes (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  title text not null,
  caption text,
  storage_path text,
  video_url text,
  thumbnail_url text,
  viral_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS (Segurança)
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.videos enable row level security;
alter table public.cortes enable row level security;

-- Políticas de acesso básico (usuário vê seus próprios dados)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own workspaces" on public.workspaces for select using (auth.uid() = owner_id);
create policy "Users can insert own workspaces" on public.workspaces for insert with check (auth.uid() = owner_id);
create policy "Users can update own workspaces" on public.workspaces for update using (auth.uid() = owner_id);
create policy "Users can delete own workspaces" on public.workspaces for delete using (auth.uid() = owner_id);

create policy "Users can view own videos" on public.videos for select using (
  exists (select 1 from public.workspaces where id = workspace_id and owner_id = auth.uid())
);
create policy "Users can insert own videos" on public.videos for insert with check (
  exists (select 1 from public.workspaces where id = workspace_id and owner_id = auth.uid())
);

  exists (select 1 from public.videos v join public.workspaces w on v.workspace_id = w.id where v.id = video_id and w.owner_id = auth.uid())
);

-- Trigger para criar workspace default
create or replace function public.handle_new_user_workspace()
returns trigger as $$
begin
  insert into public.workspaces (name, owner_id)
  values ('Meu Workspace', new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_workspace();


-- Storage Setup (Execute via SQL Editor if buckets don't exist)
insert into storage.buckets (id, name, public) values ('raw_videos', 'raw_videos', true);
insert into storage.buckets (id, name, public) values ('processed_cuts', 'processed_cuts', true);

-- Policies for Storage
-- Allow authenticated users to upload to raw_videos
create policy "Authenticated users can upload" on storage.objects for insert with check (
  bucket_id = 'raw_videos' and auth.role() = 'authenticated'
);

create policy "Authenticated users can select" on storage.objects for select using (
  bucket_id = 'raw_videos' and auth.role() = 'authenticated'
);
