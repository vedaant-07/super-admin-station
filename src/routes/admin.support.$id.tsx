import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/support/$id")({ component: TicketDetail });

type Ticket = Record<string, any>;
type Message = Record<string, any>;

function TicketDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);

  const ticketQ = useQuery({ queryKey: ["ticket", id, "production"], queryFn: () => adminApi.supportTicket(id) as Promise<Ticket> });
  const msgsQ = useQuery({ queryKey: ["ticket-msgs", id, "production"], queryFn: () => adminApi.supportTicketMessages(id) as Promise<Message[]> });

  const updateMut = useMutation({
    mutationFn: (patch: Partial<{ status: string; priority: string }>) => adminApi.updateSupportTicket(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ticket", id] }); qc.invalidateQueries({ queryKey: ["tickets"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const replyMut = useMutation({
    mutationFn: async () => {
      const body = reply.trim();
      if (!body) throw new Error("Reply is empty");
      return adminApi.createSupportTicketMessage(id, { body, is_internal: internal });
    },
    onSuccess: () => { setReply(""); qc.invalidateQueries({ queryKey: ["ticket-msgs", id] }); qc.invalidateQueries({ queryKey: ["ticket", id] }); toast.success(internal ? "Note added" : "Reply sent"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => adminApi.deleteSupportTicket(id),
    onSuccess: () => { toast.success("Ticket deleted"); navigate({ to: "/admin/support" }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const t = ticketQ.data;

  return (
    <div>
      <Link to="/admin/support" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to tickets</Link>
      <PageHeader title={t?.subject ?? "Ticket"} description={t ? `${t.user_name ?? "Anonymous"} · ${t.user_email ?? ""} · ${t.source}` : undefined} actions={<Button variant="ghost" size="sm" onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>} />

      {ticketQ.isLoading || !t ? <Skeleton className="h-64 w-full" /> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card><CardHeader><CardTitle className="text-base">Original message</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm">{t.message}</p><p className="mt-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Conversation</CardTitle></CardHeader><CardContent className="space-y-3">{msgsQ.isLoading && <Skeleton className="h-24 w-full" />}{(msgsQ.data ?? []).length === 0 && !msgsQ.isLoading && <p className="text-sm text-muted-foreground">No replies yet.</p>}{(msgsQ.data ?? []).map((m) => <div key={m.id} className={`rounded-md border p-3 text-sm ${m.is_internal ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-secondary/40"}`}><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">{m.is_internal ? <Badge variant="outline">Internal note</Badge> : <Badge variant="secondary">Reply</Badge>}<span>{new Date(m.created_at).toLocaleString()}</span></div><p className="whitespace-pre-wrap">{m.body}</p></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Reply</CardTitle></CardHeader><CardContent className="space-y-3"><Textarea rows={5} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your response…" /><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Switch id="internal" checked={internal} onCheckedChange={setInternal} /><Label htmlFor="internal" className="text-sm">Internal note</Label></div><Button onClick={() => replyMut.mutate()} disabled={replyMut.isPending}>Send</Button></div></CardContent></Card>
          </div>
          <div className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label className="text-xs text-muted-foreground">Status</Label><Select value={t.status} onValueChange={(v) => updateMut.mutate({ status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["new","open","pending","resolved","closed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs text-muted-foreground">Priority</Label><Select value={t.priority} onValueChange={(v) => updateMut.mutate({ priority: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{["low","normal","high","urgent"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1 text-xs text-muted-foreground"><div>Source: <span className="text-foreground">{t.source}</span></div><div>Phone: <span className="text-foreground">{t.user_phone || "—"}</span></div><div>Updated: <span className="text-foreground">{t.updated_at ? new Date(t.updated_at).toLocaleString() : "—"}</span></div></div></CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}
