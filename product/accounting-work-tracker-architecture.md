# Architecture

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth)
- Vercel (deployment)
- LINE OA Messaging API (notifications)

## High-level Components
- Web client (responsive)
- App server / server actions / route handlers
- Supabase database
- Notification service for LINE OA

## User Roles
- admin
- manager
- staff

## Main Domains
- users
- customers
- business types
- checklist templates
- work cycles
- work items
- notifications
- audit logs

## Core Flows
1. Admin creates business types and checklist templates
2. Admin/manager assigns customers to staff
3. System generates monthly work cycles
4. Staff updates work item status
5. Manager monitors progress in dashboard
6. Notification service sends LINE alerts on key events

## Deployment
- Source code in Git workspace
- Push to GitHub
- Deploy app to Vercel
- Connect Supabase project via env vars

## Environment Variables (planned)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- LINE_CHANNEL_ACCESS_TOKEN
- LINE_CHANNEL_SECRET

## Notes
- Responsive-first design
- Keep MVP lean
- Main dashboard and monthly tracking are the highest-priority modules
