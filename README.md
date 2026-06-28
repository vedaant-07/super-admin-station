# SE7EN FIT Super Admin Station

Centralized production admin dashboard for SE7EN FIT app + website control.

## Production stack

```text
Super Admin Station → SE7EN FIT Render Backend API → Supabase PostgreSQL + Supabase Storage
```

Backend API:

```bash
https://se7en-fit-api.onrender.com/api
```

## What this dashboard controls

- Admin authentication through Supabase Auth
- Admin/staff/super_admin access through `public.user_roles`
- User/profile management through `public.profiles`
- Gym owners and gyms through the shared production backend
- Gym verification and suspension workflows
- Members, referrals, leads, attendance and gym data
- Support requests from app, website, and gym owner dashboard
- Ticket replies and internal notes through `public.ticket_messages`
- Notifications through `public.notifications`
- App, website and admin settings through `public.app_settings`
- Admin activity logs through `public.admin_logs`
- Ads, offers, challenges, leaderboard prizes, rewards, community moderation, subscriptions and payments

## Required environment variables

Set these on the admin dashboard deployment:

```bash
VITE_API_BASE_URL=https://se7en-fit-api.onrender.com/api
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
```

The Vite variables are used by the browser bundle. The non-Vite variables are available for server-side rendering fallback.

## Database setup

Use the production migrations from the app/backend repo first:

```bash
vedaant-07/SE7EN-FIT/server/supabase/migrations/001_initial_schema.sql
vedaant-07/SE7EN-FIT/server/supabase/migrations/002_production_schema.sql
vedaant-07/SE7EN-FIT/server/supabase/migrations/003_auth_otp_challenges.sql
vedaant-07/SE7EN-FIT/server/supabase/migrations/004_gym_owner_management_extensions.sql
```

This admin repo also contains an older dashboard migration for the support/admin foundation:

```bash
supabase/migrations/20260628000000_admin_dashboard_schema.sql
```

After creating your first admin user in Supabase Auth, promote that user:

```sql
insert into public.user_roles (user_id, role)
values ('YOUR_AUTH_USER_ID', 'super_admin')
on conflict do nothing;
```

## Production backend client

The admin frontend now has a shared backend client:

```text
src/lib/api-client.ts
```

It uses the logged-in Supabase session token and calls the protected backend admin routes:

```text
/admin/dashboard
/admin/users
/admin/gyms
/admin/advertisements
/admin/support/tickets
/admin/notifications
/admin/settings
/admin/logs
```

## Deploy on Render

This repo includes `render.yaml`.

1. Create a new Render Blueprint from this repository.
2. Add the Supabase and API environment variables.
3. Deploy the service.
4. Copy the deployed admin URL, normally similar to:

```bash
https://se7enfit-admin.onrender.com/admin
```

## Support request integration

App, website and gym-owner support forms must create tickets through the shared backend API:

```text
POST /api/support/tickets
```

New tickets appear in Admin Dashboard → Support Requests.
