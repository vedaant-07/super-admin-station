import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, LifeBuoy, Dot } from "lucide-react";

export const Route = createFileRoute("/admin/support")({
  component: SupportPage,
});

const statusColor: Record<string, string> = {
  new: "default",
  open: "default",
  pending: "outline",
  resolved: "secondary",
  closed: "secondary",
};

function SupportPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", q, status, priority, source],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("id,user_name,user_email,subject,priority,status,source,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (q.trim()) {
        const t = `%${q.trim()}%`;
        query = query.or(`subject.ilike.${t},user_email.ilike.${t},user_name.ilike.${t}`);
      }
      if (status !== "all") query = query.eq("status", status as "new" | "open" | "pending" | "resolved" | "closed");
      if (priority !== "all") query = query.eq("priority", priority as "low" | "normal" | "high" | "urgent");
      if (source !== "all") query = query.eq("source", source as "app" | "website" | "admin");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Support requests"
        description="Tickets from your app and website land here. Click one to reply."
      />
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, name, email…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {["new","open","pending","resolved","closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {["low","normal","high","urgent"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {["app","website","admin"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon={<LifeBuoy className="h-8 w-8" />}
            title="No tickets"
            description="When your users submit support requests from the app or website, they'll show up here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer">
                    <TableCell>{!t.is_read && <Dot className="h-6 w-6 text-primary" />}</TableCell>
                    <TableCell className="font-medium">
                      <Link to="/admin/support/$id" params={{ id: t.id }} className="hover:underline">
                        {t.subject}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{t.user_name || "—"}</div>
                      <div className="text-xs">{t.user_email || "—"}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t.source}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={t.priority === "urgent" || t.priority === "high" ? "destructive" : "outline"}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(statusColor[t.status] ?? "default") as "default" | "secondary" | "outline" | "destructive"}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}