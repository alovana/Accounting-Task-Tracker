create type notification_event_type as enum ('completed', 'blocked', 'overdue');
create type notification_target_type as enum ('work_item', 'work_cycle');
create type notification_status as enum ('queued', 'sent', 'failed');
create type notification_channel as enum ('line_oa', 'email', 'internal');

create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  event_type notification_event_type not null,
  channel notification_channel not null default 'line_oa',
  enabled boolean not null default true,
  recipients_json jsonb not null default '[]'::jsonb,
  template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists line_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type notification_event_type not null,
  target_type notification_target_type not null,
  target_id uuid,
  message text not null,
  status notification_status not null default 'queued',
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_rules_event_type on notification_rules(event_type);
create index if not exists idx_line_notifications_status on line_notifications(status);
create index if not exists idx_line_notifications_event_type on line_notifications(event_type);
