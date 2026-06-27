import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Globe, CheckCircle2 } from "lucide-react";
import { logAdminAction } from "@/lib/admin-log";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/website")({
  component: WebsitePage,
});

function WebsitePage() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [iframeKey, setIframeKey] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["website-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["site.website_url", "site.website_name"]);
      if (error) throw error;
      const map: Record<string, Json> = {};
      for (const row of data) map[row.key] = row.value;
      return map;
    },
  });

  useEffect(() => {
    if (!data) return;
    setUrl((data["site.website_url"] as string) ?? "");
    setName((data["site.website_name"] as string) ?? "");
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      try {
        new URL(url);
      } catch {
        throw new Error("Enter a valid URL (https://…)");
      }
      const { data: { user } } = await supabase.auth.getUser();
      const rows = [
        { key: "site.website_url", value: url as unknown as Json, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
        { key: "site.website_name", value: name as unknown as Json, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
      ];
      const { error } = await supabase.from("app_settings").upsert(rows);
      if (error) throw error;
      await logAdminAction("website.connected", "app_settings", "site.website_url");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Website connected");
      setIframeKey((k) => k + 1);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const isConnected = !!url;

  return (
    <div>
      <PageHeader
        title="Website management"
        description="Connect your public website so the admin dashboard can manage and preview it."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Connection
                </CardTitle>
                <CardDescription>Public URL used across admin tools and emails.</CardDescription>
              </div>
              {isConnected ? (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline">Not connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Website name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My website" />
            </div>
            <div className="space-y-2">
              <Label>Website URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                {saveMut.isPending ? "Saving…" : "Save connection"}
              </Button>
              <Button
                variant="outline"
                disabled={!url}
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Open site
              </Button>
              <Button variant="ghost" disabled={!url} onClick={() => setIframeKey((k) => k + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh preview
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Common pages on the connected site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                { label: "Home", path: "/" },
                { label: "Login", path: "/login" },
                { label: "App features", path: "/#app-features" },
                { label: "Owner dashboard", path: "/dashboard" },
              ] as const
            ).map((l) => (
              <a
                key={l.path}
                href={url ? `${url.replace(/\/$/, "")}${l.path}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"
              >
                <span>{l.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>
            {url ? url : "Save a URL above to load a live preview."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {url ? (
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <iframe
                key={iframeKey}
                src={url}
                title="Website preview"
                className="h-[640px] w-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No website connected yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}