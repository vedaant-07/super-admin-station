import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LifeBuoy, Bell, Activity, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

async function fetchOverview() {
  const sinceISO = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const [users, activeUsers, newUsers, openTickets, scheduledNotifs, recentLogs, recentTickets] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", sinceISO),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sinceISO),
      supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["new", "open", "pending"]),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
      supabase.from("admin_logs").select("id,action,entity,created_at,actor_id").order("created_at", { ascending: false }).limit(6),
      supabase.from("support_tickets").select("id,subject,priority,status,source,created_at").order("created_at", { ascending: false }).limit(5),
    ]);

  // signup trend last 7 days (client side bucket)
  const trend: { day: string; count: number }[] = [];
  const { data: recent } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", sinceISO);
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trend.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: (recent ?? []).filter((r) => r.created_at?.slice(0, 10) === key).length,
    });
  }

  return {
    users: users.count ?? 0,
    activeUsers: activeUsers.count ?? 0,
    newUsers: newUsers.count ?? 0,
    openTickets: openTickets.count ?? 0,
    scheduledNotifs: scheduledNotifs.count ?? 0,
    recentLogs: recentLogs.data ?? [],
    recentTickets: recentTickets.data ?? [],
    trend,
  };
}

const stats = [
  { key: "users", label: "Total users", icon: Users },
  { key: "activeUsers", label: "Active (7d)", icon: Activity },
  { key: "openTickets", label: "Open tickets", icon: LifeBuoy },
  { key: "scheduledNotifs", label: "Scheduled", icon: Bell },
] as const;

function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "overview"], queryFn: fetchOverview });

  return (
    <div>
      <PageHeader title="Dashboard" description="What's happening across your app and website." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-semibold">{data?.[s.key] ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New users — last 7 days</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend ?? []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.74 0.16 155)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.74 0.16 155)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.014 250)" />
                  <XAxis dataKey="day" stroke="oklch(0.68 0.02 250)" fontSize={12} />
                  <YAxis stroke="oklch(0.68 0.02 250)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.205 0.014 250)",
                      border: "1px solid oklch(0.28 0.014 250)",
                      borderRadius: 8,
                      color: "oklch(0.96 0.005 250)",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="oklch(0.74 0.16 155)" fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent admin activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <Skeleton className="h-24 w-full" />}
            {!isLoading && (data?.recentLogs ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {(data?.recentLogs ?? []).map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">{l.action}</div>
                  <div className="text-xs text-muted-foreground">{l.entity ?? "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            <Link to="/admin/logs" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent support tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-24 w-full" />}
            {!isLoading && (data?.recentTickets ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            )}
            <ul className="divide-y divide-border">
              {(data?.recentTickets ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to="/admin/support/$id" params={{ id: t.id }} className="block truncate font-medium hover:underline">
                      {t.subject}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {t.source} · {t.priority} · {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{t.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}