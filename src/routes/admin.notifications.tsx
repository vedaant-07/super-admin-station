import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, Send } from "lucide-react";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-log";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"push" | "announcement" | "email">("announcement");
  const [target, setTarget] = useState<"app" | "website" | "admin">("website");
  const [schedule, setSchedule] = useState("");

  const listQ = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (status: "draft" | "scheduled" | "sent") => {
      if (!title.trim() || !body.trim()) throw new Error("Title and body are required");
      const payload = {
        title: title.trim(),
        body: body.trim(),
        channel,
        target,
        status,
        scheduled_at: status === "scheduled" && schedule ? new Date(schedule).toISOString() : null,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      };
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("notifications").insert({ ...payload, created_by: user?.id ?? null });
      if (error) throw error;
      await logAdminAction(`notification.${status}`, "notifications", undefined, { channel, target });
    },
    onSuccess: () => {
      setTitle(""); setBody(""); setSchedule("");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await logAdminAction("notification.sent", "notifications", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Sent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Notifications" description="Push to app, announcements to website, or email blasts." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Compose</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t">Title</Label>
              <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b">Message</Label>
              <Textarea id="b" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as "push" | "announcement" | "email")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push (app)</SelectItem>
                    <SelectItem value="announcement">Announcement (website)</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target audience</Label>
                <Select value={target} onValueChange={(v) => setTarget(v as "app" | "website" | "admin")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">App users</SelectItem>
                    <SelectItem value="website">Website visitors</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s">Schedule (optional)</Label>
              <Input id="s" type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={() => createMut.mutate("draft")} disabled={createMut.isPending}>Save draft</Button>
              <Button variant="outline" onClick={() => createMut.mutate("scheduled")} disabled={createMut.isPending || !schedule}>Schedule</Button>
              <Button onClick={() => createMut.mutate("sent")} disabled={createMut.isPending}>
                <Send className="mr-1 h-4 w-4" /> Send now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Recent notifications</CardTitle></CardHeader>
          <CardContent>
            {listQ.isLoading && <Skeleton className="h-40 w-full" />}
            {!listQ.isLoading && (listQ.data ?? []).length === 0 && (
              <EmptyState icon={<Bell className="h-8 w-8" />} title="No notifications yet" description="Compose one on the left to get started." />
            )}
            <ul className="divide-y divide-border">
              {(listQ.data ?? []).map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{n.title}</span>
                      <Badge variant="outline">{n.channel}</Badge>
                      <Badge variant="secondary">{n.target}</Badge>
                      <Badge variant={n.status === "sent" ? "default" : n.status === "scheduled" ? "outline" : "secondary"}>{n.status}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.sent_at ? `Sent ${new Date(n.sent_at).toLocaleString()}` :
                       n.scheduled_at ? `Scheduled ${new Date(n.scheduled_at).toLocaleString()}` :
                       `Created ${new Date(n.created_at).toLocaleString()}`}
                    </p>
                  </div>
                  {n.status !== "sent" && (
                    <Button size="sm" variant="outline" onClick={() => sendMut.mutate(n.id)}>Send</Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}