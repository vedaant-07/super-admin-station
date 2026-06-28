import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

type ProfileRow = Record<string, any>;

function UsersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [source, setSource] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["users", "production", q, status, source],
    queryFn: async () => {
      const rows = (await adminApi.users()) as ProfileRow[];
      const term = q.trim().toLowerCase();
      return rows.filter((u) => {
        const matchesTerm = !term || [u.email, u.full_name, u.phone].some((v) => String(v || "").toLowerCase().includes(term));
        const matchesStatus = status === "all" || u.status === status;
        const matchesSource = source === "all" || u.source === source;
        return matchesTerm && matchesStatus && matchesSource;
      });
    },
  });

  const setStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "blocked" }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Users" description="View, search, filter and block users from the production backend." />
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="blocked">Blocked</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="app">App</SelectItem><SelectItem value="website">Website</SelectItem><SelectItem value="gym_owner">Gym Owner</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
          </Select>
        </div>

        {isLoading ? <Skeleton className="h-64 w-full" /> : (data ?? []).length === 0 ? (
          <EmptyState icon={<UsersIcon className="h-8 w-8" />} title="No users found" description="Adjust filters or wait for sign-ups from app, website or gym owner dashboard." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {data!.map((u) => {
                  const id = u.user_id || u.id;
                  return (
                    <TableRow key={id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{u.role || "user"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{u.source || "app"}</Badge></TableCell>
                      <TableCell><Badge variant={u.status === "blocked" ? "destructive" : u.status === "pending" ? "outline" : "default"}>{u.status || "active"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {u.status !== "blocked" ? <DropdownMenuItem onClick={() => setStatusMut.mutate({ id, status: "blocked" })}>Block user</DropdownMenuItem> : <DropdownMenuItem onClick={() => setStatusMut.mutate({ id, status: "active" })}>Unblock user</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
