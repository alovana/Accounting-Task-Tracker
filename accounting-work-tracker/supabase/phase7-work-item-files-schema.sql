create table if not exists work_item_files (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items(id) on delete cascade,
  file_name text not null,
  file_size_bytes bigint not null default 0,
  content_type text not null default 'application/octet-stream',
  storage_provider text not null default 'cloudflare_r2',
  storage_bucket text not null,
  storage_object_key text not null unique,
  uploaded_by_user_id uuid references user_profiles(id) on delete set null,
  uploaded_by_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_item_files_work_item_id on work_item_files(work_item_id);
create index if not exists idx_work_item_files_created_at on work_item_files(created_at desc);
