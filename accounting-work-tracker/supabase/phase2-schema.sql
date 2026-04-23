create type app_role as enum ('admin', 'manager', 'staff');
create type service_status as enum ('active', 'onboarding', 'paused');
create type work_status as enum ('not_started', 'in_progress', 'waiting_customer', 'blocked', 'completed', 'skipped');

create table if not exists business_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  tax_id text not null,
  business_type_id uuid references business_types(id),
  assigned_user_id uuid,
  manager_user_id uuid,
  service_status service_status not null default 'active',
  notes text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_type_id uuid references business_types(id),
  description text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates(id) on delete cascade,
  title text not null,
  description text default '',
  sort_order integer not null default 1,
  is_required boolean not null default true,
  due_day_offset integer not null default 0,
  due_day_detail text default '',
  default_assignee_role app_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_business_type_id on customers(business_type_id);
create index if not exists idx_checklist_templates_business_type_id on checklist_templates(business_type_id);
create index if not exists idx_checklist_template_items_template_id on checklist_template_items(template_id);
