# Database Schema (Draft)

## users
- id
- full_name
- email
- password_hash
- role (admin|manager|staff)
- line_user_id
- active
- created_at
- updated_at

## business_types
- id
- name
- description
- active

## customers
- id
- code
- name
- tax_id
- business_type_id
- assigned_user_id
- manager_user_id
- service_status
- notes
- active
- created_at
- updated_at

## checklist_templates
- id
- name
- business_type_id
- description
- active
- created_at
- updated_at

## checklist_template_items
- id
- template_id
- title
- description
- sort_order
- is_required
- due_day_offset
- default_assignee_role
- active

## work_cycles
- id
- customer_id
- period_year
- period_month
- status
- generated_at
- generated_by

## work_items
- id
- work_cycle_id
- template_item_id
- assigned_user_id
- status
- started_at
- completed_at
- due_date
- blocked_reason
- note
- updated_by
- updated_at

## work_item_updates
- id
- work_item_id
- old_status
- new_status
- comment
- updated_by
- created_at

## line_notifications
- id
- event_type
- target_type
- target_id
- message
- status
- sent_at
- error_message

## audit_logs
- id
- actor_user_id
- entity_type
- entity_id
- action
- payload_json
- created_at
