# SE7EN FIT Super Admin Station

Centralized admin dashboard for SE7EN FIT app + website control.

## What this dashboard controls

- Admin authentication through Supabase Auth
- Admin/staff/super_admin access through `public.user_roles`
- User/profile management through `public.profiles`
- Support requests from both app and website through `public.support_tickets`
- Ticket replies and internal notes through `public.ticket_messages`
- Notifications through `public.notifications`
- App, website and admin settings through `public.app_settings`
- Admin activity logs through `public.admin_logs`

## Required environment variables

Set these on the admin dashboard deployment:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
```

The Vite variables are used by the browser bundle. The non-Vite variables are available for server-side rendering fallback.

## Database setup

Run this migration before using the dashboard:

```bash
supabase/migrations/20260628000000_admin_dashboard_schema.sql
```

This creates the tables, enums, RLS policies and helper functions expected by the dashboard.

After creating your first admin user in Supabase Auth, promote that user:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_ID', 'super_admin')
on conflict do nothing;
```

## Deploy on Render

This repo includes `render.yaml`.

1. Create a new Render Blueprint from this repository.
2. Add the Supabase environment variables.
3. Deploy the service.
4. Copy the deployed admin URL, normally similar to:

```bash
https://se7enfit-admin.onrender.com/admin
```

## Connect the SE7EN FIT website to this dashboard

In the website repo `vedaant-07/SE7ENFIT-ORIGINAL`, set:

```bash
EXPO_PUBLIC_ADMIN_DASHBOARD_URL=https://your-admin-domain.com/admin
```

The website now has an `/admin` route that opens this dashboard. Users with `super_admin`, `admin`, or `staff` role are routed to `/admin` from the website auth gate.

## Support request integration

App and website support forms should insert rows into `public.support_tickets` using the same Supabase project:

```ts
await supabase.from('support_tickets').insert({
  source: 'website', // or 'app'
  user_name,
  user_email,
  user_phone,
  subject,
  message,
  priority: 'normal',
});
```

New tickets will appear in Admin Dashboard → Support Requests.
