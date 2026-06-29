import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { adminApi } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/gyms")({ component: GymsPage });

type Row = Record<string, any>;
const gymName = (r: Row) => r.gym?.name || r.gym?.gym_name || r.owner?.gym_name || r.gym_name || r.name || "Unnamed gym";
const ownerName = (r: Row) => r.owner?.owner_name || r.full_name || r.name || r.email || "Gym owner";
const rowStatus = (r: Row) => r.account_status || r.status || r.gym?.status || "pending";
const userId = (r: Row) => r.user_id || r.owner?.user_id || r.id;

function GymsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "gyms"], queryFn: () => adminApi.gymOwners() as Promise<Row[]> });
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      const text = [gymName(r), ownerName(r), r.email, r.phone, r.owner?.phone, r.gym?.city].join(" ").toLowerCase();
      return (!term || text.includes(term)) && (status === "all" || rowStatus(r) === status);
    });
  }, [data, q, status]);
  const mut = useMutation({
    mutationFn: ({ row, next }: { row: Row; next: string }) => adminApi.updateGymStatus(userId(row), next),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "gyms"] }); toast.success("Gym owner status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return <div><PageHeader title="Gyms" description="Approve, activate, deactivate and block gym-owner accounts from the production backend." /><Card className="p-4"><div className="mb-4 flex flex-wrap gap-2"><div className="relative max-w-sm flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gym, owner, email, phone…" className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="deactivated">Deactivated</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>{isLoading ? <Skeleton className="h-64 w-full" /> : error ? <EmptyState icon={<Building2 className="h-8 w-8" />} title="Could not load gyms" description={(error as Error).message} /> : rows.length === 0 ? <EmptyState icon={<Building2 className="h-8 w-8" />} title="No gyms found" description="Gym-owner registrations will appear here." /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Gym</TableHead><TableHead>Owner</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{rows.map((r) => <TableRow key={userId(r)}><TableCell className="font-medium">{gymName(r)}</TableCell><TableCell>{ownerName(r)}</TableCell><TableCell className="text-muted-foreground">{r.email || r.owner?.email || "—"}</TableCell><TableCell className="text-muted-foreground">{r.phone || r.owner?.phone || r.gym?.phone || "—"}</TableCell><TableCell className="text-muted-foreground">{r.gym?.city || r.city || "—"}</TableCell><TableCell><Badge variant={rowStatus(r) === "active" ? "default" : rowStatus(r) === "blocked" ? "destructive" : "outline"}>{rowStatus(r)}</Badge></TableCell><TableCell className="space-x-2"><Button size="sm" onClick={() => mut.mutate({ row: r, next: "active" })}>Activate</Button><Button size="sm" variant="outline" onClick={() => mut.mutate({ row: r, next: "deactivated" })}>Pause</Button><Button size="sm" variant="destructive" onClick={() => mut.mutate({ row: r, next: "blocked" })}>Block</Button></TableCell></TableRow>)}</TableBody></Table></div>}</Card></div>;
}
