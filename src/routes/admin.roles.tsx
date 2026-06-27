import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-log";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

type StaffRole = "super_admin" | "admin" | "staff";
const STAFF_ROLES: StaffRole[] = ["super_admin", "admin", "staff"];

function RolesPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles").select("id,user_id,role,created_at")
        .in("role", STAFF_ROLES)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
      let profs: { id: string; email: string | null; full_name: string | null }[] = [];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id,email,full_name").in("id", ids);
        profs = data ?? [];
      }
      return (roles ?? []).map((r) => ({
        ...r,
        profile: profs.find((p) => p.id === r.user_id),
      }));
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const e = email.trim().toLowerCase();
      if (!e) throw new Error("Email required");
      const { data: prof, error: e1 } = await supabase.from("profiles").select("id").eq("email", e).maybeSingle();
      if (e1) throw e1;
      if (!prof) throw new Error("No user found with that email. They must sign up first.");
      const { error } = await supabase.from("user_roles").insert({ user_id: prof.id, role });
      if (error) throw error;
      await logAdminAction("role.granted", "user_roles", prof.id, { role });
    },
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role granted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction("role.revoked", "user_roles", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Admin roles"
        description="Grant staff, admin, or super admin access. Only super admins can modify roles."
      />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">User email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="w-44 space-y-1">
            <label className="text-xs text-muted-foreground">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}>Grant role</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Tip: to seed your first super admin, create an account on /auth then run
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">INSERT INTO user_roles (user_id, role) SELECT id, 'super_admin' FROM auth.users WHERE email = 'you@example.com';</code>
          from the database tools.
        </p>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (data ?? []).length === 0 ? (
          <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="No staff roles yet" description="Grant the first role using the form above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data!.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.profile?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.profile?.email ?? r.user_id}</TableCell>
                  <TableCell><Badge>{r.role}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeMut.mutate(r.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}