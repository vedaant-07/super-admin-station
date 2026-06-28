import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/gyms")({ component: GymsPage });

type GymRow = Record<string, any>;

function GymsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const { data, isLoading } = useQuery({
    queryKey: ["gyms", "production", q, status],
    queryFn: async () => {
      const rows = (await adminApi.gyms()) as GymRow[];
      const term = q.trim().toLowerCase();
      return rows.filter((gym) => {
        const matchesTerm = !term || [gym.name, gym.email, gym.phone, gym.city, gym.referral_code].some((v) => String(v || "").toLowerCase().includes(term));
        return matchesTerm && (status === "all" || gym.status === status);
      });
    },
  });
  const statusMut = useMutation({
    mutationFn: ({ gymId, status }: { gymId: string; status: string }) => adminApi.updateGymStatus(gymId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gyms"] }); toast.success("Gym updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <PageHeader title="Gyms" description="Verify, suspend and review gym owner profiles from the production backend." />
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gym, city, code…" className="pl-9" /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
        </div>
        {isLoading ? <Skeleton className="h-64 w-full" /> : (data ?? []).length === 0 ? <EmptyState icon={<Building2 className="h-8 w-8" />} title="No gyms found" /> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Gym</TableHead><TableHead>City</TableHead><TableHead>Referral</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {data!.map((gym) => <TableRow key={gym.gym_id}><TableCell className="font-medium"><div>{gym.name}</div><div className="text-xs text-muted-foreground">{gym.email || gym.phone || "—"}</div></TableCell><TableCell>{gym.city || "—"}</TableCell><TableCell><Badge variant="secondary">{gym.referral_code}</Badge></TableCell><TableCell><Badge variant={gym.status === "verified" ? "default" : gym.status === "suspended" ? "destructive" : "outline"}>{gym.status}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{gym.created_at ? new Date(gym.created_at).toLocaleDateString() : "—"}</TableCell><TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => statusMut.mutate({ gymId: gym.gym_id, status: "verified" })}>Verify</Button><Button size="sm" variant="outline" onClick={() => statusMut.mutate({ gymId: gym.gym_id, status: "suspended" })}>Suspend</Button></TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
