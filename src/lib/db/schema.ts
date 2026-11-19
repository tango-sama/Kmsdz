/** Idempotent schema; applied automatically on first use (see db/index.ts). Append new statements to evolve it. */
export const SCHEMA_STATEMENTS: string[] = [
  `create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text not null unique,
    full_name text not null,
    role text not null check (role in ('admin','worker')),
    password_hash text not null,
    must_change_password boolean not null default true,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    last_login_at timestamptz
  )`,
  `create table if not exists sessions (
    token_hash text primary key,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
  )`,
  `create index if not exists sessions_user_idx on sessions(user_id)`,
  `create table if not exists login_attempts (
    id bigserial primary key,
    username text not null,
    ip text not null,
    at timestamptz not null default now()
  )`,
  `create index if not exists login_attempts_user_idx on login_attempts(username, at)`,
  `create index if not exists login_attempts_ip_idx on login_attempts(ip, at)`,
  `create table if not exists jobs (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null default '',
    location text not null default '',
    client text not null default '',
    status text not null default 'new' check (status in ('new','in_progress','on_hold','done')),
    priority text not null default 'normal' check (priority in ('normal','high','urgent')),
    start_date date,
    due_date date,
    audience text not null default 'all' check (audience in ('all','selected')),
    created_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists files (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null default '',
    category text not null default 'other',
    filename text not null,
    mime text not null,
    size integer not null,
    data bytea not null,
    job_id uuid references jobs(id) on delete set null,
    audience text not null default 'all' check (audience in ('all','selected')),
    uploaded_by uuid references users(id) on delete set null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists grants (
    kind text not null check (kind in ('job','file')),
    item_id uuid not null,
    user_id uuid not null references users(id) on delete cascade,
    primary key (kind, item_id, user_id)
  )`,
  `create table if not exists posts (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references users(id) on delete cascade,
    title text not null default '',
    body text not null,
    pinned boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists posts_created_idx on posts(created_at desc)`,
  `create table if not exists comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references posts(id) on delete cascade,
    author_id uuid not null references users(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists comments_post_idx on comments(post_id, created_at)`,
];
