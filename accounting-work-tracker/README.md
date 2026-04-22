# Accounting Work Tracker

Next.js app for tracking accounting work items, operational readiness, and LINE OA notifications.

## Getting started

```bash
npm install
npm run dev
```

## Required environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_TARGET_GROUP_ID=
LINE_SENDER_NAME=
LINE_SENDER_ICON_URL=
```

`LINE_SENDER_NAME` and `LINE_SENDER_ICON_URL` are optional and are used to attach a sender profile to outbound LINE messages.

## LINE OA outbound delivery

The app now supports a real server-side dispatch path:

1. Queue rows into `line_notifications`.
   - From **Settings → LINE OA Test Queue**.
   - Or automatically when qualifying work item status changes queue a notification.
2. Run **Settings → LINE OA Manual Dispatch**.
3. The server reads queued rows, claims them with `processing`, sends each one through the LINE Messaging API push endpoint, then updates the row to `sent` or `failed` with `sent_at` and `error_message`.
4. Review **Notification Logs** and **Failed Deliveries** in Settings.

## Database setup

Apply the SQL files in `supabase/`, especially `supabase/phase5-schema.sql`.

The Phase 5 schema includes:

- `notification_rules`
- `line_notifications`
- `notification_status` values `queued`, `processing`, `sent`, `failed`

## Notes

- Delivery currently targets one configured LINE group or room per environment using `LINE_TARGET_GROUP_ID`.
- Manual dispatch is the intended first production path. It can be automated later by calling the same server-side dispatcher from a scheduled job or trusted endpoint.
