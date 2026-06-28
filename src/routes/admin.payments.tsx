import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Users, TrendingUp } from "lucide-react";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/payments")({ component: PaymentsPage });

type Row = Record<string, any>;

function PaymentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["payments", "production"], queryFn: () => adminApi.payments() as Promise<Row[]> });
  const rows = data ?? [];
  const active = rows.filter((r) => r.payment_status === "paid" || r.status === "active");
  const total = active.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return (
    <div>
      <PageHeader title="Payments" description="Production membership and billing overview." />
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Tracked amount</CardTitle><CreditCard className="h-4 w-4" /></CardHeader><CardContent className="text-2xl font-semibold">₹{total.toLocaleString("en-IN")}</CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Active memberships</CardTitle><Users className="h-4 w-4" /></CardHeader><CardContent className="text-2xl font-semibold">{active.length}</CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">Total records</CardTitle><TrendingUp className="h-4 w-4" /></CardHeader><CardContent className="text-2xl font-semibold">{rows.length}</CardContent></Card>
      </div>
      <Card className="p-4">
        {isLoading ? <Skeleton className="h-64 w-full" /> : rows.length === 0 ? <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payment records yet" /> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Gym</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead><TableHead>Amount</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{rows.map((r) => <TableRow key={r.membership_id || r.id}><TableCell><div className="font-medium">{r.profile?.full_name || "—"}</div><div className="text-xs text-muted-foreground">{r.profile?.email || r.user_id}</div></TableCell><TableCell>{r.gym?.name || r.gym_id}</TableCell><TableCell><Badge variant={r.status === "active" ? "default" : "outline"}>{r.status}</Badge></TableCell><TableCell><Badge variant={r.payment_status === "paid" ? "default" : "secondary"}>{r.payment_status}</Badge></TableCell><TableCell>₹{Number(r.amount || 0).toLocaleString("en-IN")}</TableCell><TableCell className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TableCell></TableRow>)}</TableBody></Table></div>
        )}
      </Card>
    </div>
  );
}
