# SE7EN FIT Super Admin Station Integration Audit

This repo is the control center for the full SE7EN FIT ecosystem.

Primary integration target:

```text
Admin dashboard → Supabase direct read where safe + Render Backend API for privileged actions
```

The admin panel must control both:

- SE7EN FIT user app
- Gym owner website / management tool

---

## Current state

- React/TanStack app.
- Supabase client configured.
- Admin migration already creates core admin/support tables:
  - `profiles`
  - `user_roles`
  - `support_tickets`
  - `ticket_messages`
  - `notifications`
  - `app_settings`
  - `admin_logs`
- Admin/support foundation is present, but full product control is not complete yet.

---

## Production responsibility

Admin dashboard must control:

- Users
- Roles
- Gym owners
- Gyms
- Gym verification
- Gym members
- Leads
- Attendance
- Ads and offers
- Challenges
- Rewards
- Leaderboard prizes
- Community moderation
- Support tickets
- Notifications
- App and website settings
- Payments/subscriptions
- Media assets
- Admin logs

---

## Required admin modules

| Module | Required capabilities |
|---|---|
| Overview | Total users, gyms, owners, members, revenue, tickets, ads, challenges |
| Users | Search, view, block/unblock, role assign, activity |
| Gym owners | Search, verify, suspend, view owner/gym data |
| Gyms | Verify/reject/suspend, edit critical details |
| Members | View memberships across all gyms |
| Leads | View all leads, filter by gym/status |
| Attendance | System-wide attendance logs |
| Ads/promotions | Admin ads for all users, approve/manage gym ads if required |
| Challenges | Create/edit/delete global challenges |
| Leaderboard prizes | Manage global and gym-specific prizes |
| Rewards | Adjust coins, view reward transactions |
| Community | Hide/delete posts, review reports |
| Support | Ticket inbox, replies, internal notes, assignment/status |
| Notifications | Broadcast/scheduled/push notifications |
| Settings | Maintenance mode, app links, AI status, feature flags |
| Logs | Admin action audit trail |

---

## Required shared APIs

Admin can read some Supabase tables directly with RLS, but sensitive writes should go through the backend.

Priority routes:

```text
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/status
PATCH  /api/admin/users/:id/role
GET    /api/admin/gyms
PATCH  /api/admin/gyms/:id/status
GET    /api/admin/gym-owners
PATCH  /api/admin/gym-owners/:id/status
GET    /api/admin/advertisements
POST   /api/admin/advertisements
PATCH  /api/admin/advertisements/:id
DELETE /api/admin/advertisements/:id
GET    /api/admin/challenges
POST   /api/admin/challenges
PATCH  /api/admin/challenges/:id
DELETE /api/admin/challenges/:id
GET    /api/admin/community/posts
PATCH  /api/admin/community/posts/:id/moderate
GET    /api/admin/support/tickets
PATCH  /api/admin/support/tickets/:id
POST   /api/admin/notifications
GET    /api/admin/settings
PATCH  /api/admin/settings/:key
GET    /api/admin/logs
```

---

## Missing or incomplete production features

| Area | Status | Required action |
|---|---|---|
| Full platform schema | Incomplete | Extend migration beyond admin/support tables |
| Gym control | Missing/incomplete | Add gym owner/gym/membership modules |
| Ads control | Missing/incomplete | Admin global ads + gym ad moderation |
| Community moderation | Missing/incomplete | List/hide/delete/report workflow |
| Challenges/rewards | Missing/incomplete | Global challenge and reward management |
| Leaderboard prizes | Missing/incomplete | Global/gym prize control |
| App store links/settings | Missing/incomplete | Store Play Store/App Store/APK URLs in `app_settings` |
| Payments | Missing/incomplete | Payment/subscription tables and admin pages |
| Push notifications | Partial foundation | Add push token integration and send workflow |
| Brand cleanup | Incomplete | Remove generic Lovable metadata/title |

---

## Admin access rules

- `super_admin`: full access, role assignment, destructive actions.
- `admin`: normal operational access, no super-admin role escalation.
- `staff`: support/limited operations only.

Every sensitive action should write `admin_logs`:

```json
{
  "actor_id": "auth-user-id",
  "action": "gym.verify",
  "entity": "gyms",
  "entity_id": "gym-id",
  "details": { "status": "verified" }
}
```

---

## Implementation order for this repo

1. Brand metadata and layout cleanup.
2. Add app/website settings module with download app URLs.
3. Add users and roles module.
4. Add gyms/gym owners module.
5. Add ads/promotions module.
6. Add support ticket workflow completion.
7. Add challenges/rewards/leaderboard control.
8. Add community moderation.
9. Add payment/subscription oversight.
10. Add admin logs page.
