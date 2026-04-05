create type work_cycle_status as enum ('planned', 'in_progress', 'at_risk', 'completed');

create table if not exists work_cycles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  period_year integer not null,
  period_month integer not null check (period_month between 1 and 12),
  status work_cycle_status not null default 'planned',
  generated_at timestamptz not null default now(),
  generated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, period_year, period_month)
);

create table if not exists work_items (
  id uuid primary key default gen_random_uuid(),
  work_cycle_id uuid not null references work_cycles(id) on delete cascade,
  template_item_id uuid references checklist_template_items(id),
  assigned_user_id uuid,
  title text not null,
  assigned_to_name text default '',
  status work_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  due_date date,
  blocked_reason text,
  note text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists work_item_updates (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references work_items(id) on delete cascade,
  old_status work_status not null,
  new_status work_status not null,
  comment text default '',
  updated_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_cycles_customer_period on work_cycles(customer_id, period_year, period_month);
create index if not exists idx_work_items_work_cycle_id on work_items(work_cycle_id);
create index if not exists idx_work_item_updates_work_item_id on work_item_updates(work_item_id);
