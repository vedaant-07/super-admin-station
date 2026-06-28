import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExternalLink, RefreshCw, Globe, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/website")({ component: WebsitePage });

type MapT = Record<string, any>;

function WebsitePage() {
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const { data, isLoading } = useQuery({ queryKey: ["website-settings", "production"], queryFn: async () => { const rows = (await adminApi.settings()) as any[]; const map: MapT = {}; rows.forEach((r) => { map[r.key] = r.value; }); return map; } });
  useEffect(() => { if (!data) return; setUrl((data["site.website_url"] as string) ?? ""); setName((data["site.website_name"] as string) ?? ""); }, [data]);
  const saveMut = useMutation({ mutationFn: async () => { try { new URL(url); } catch { throw new Error("Enter a valid URL (https://…)"); } await adminApi.updateSetting("site.website_url", { key: "site.website_url", value: url, scope: "website" }); await adminApi.updateSetting("site.website_name", { key: "site.website_name", value: name, scope: "website" }); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["website-settings"] }); qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Website connected"); setIframeKey((k) => k + 1); }, onError: (e: Error) => toast.error(e.message) });
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  const isConnected = !!url;

  return (
    <div>
      <PageHeader title="Website management" description="Connect and preview the production website from the shared backend settings." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Connection</CardTitle><CardDescription>Public URL used across admin tools.</CardDescription></div>{isConnected ? <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Connected</Badge> : <Badge variant="outline">Not connected</Badge>}</div></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Website name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SE7EN FIT" /></div><div className="space-y-2"><Label>Website URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" /></div><div className="flex flex-wrap gap-2"><Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>{saveMut.isPending ? "Saving…" : "Save connection"}</Button><Button variant="outline" disabled={!url} onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 h-4 w-4" /> Open site</Button><Button variant="ghost" disabled={!url} onClick={() => setIframeKey((k) => k + 1)}><RefreshCw className="mr-2 h-4 w-4" /> Refresh preview</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Quick links</CardTitle><CardDescription>Common pages on the connected site.</CardDescription></CardHeader><CardContent className="space-y-2">{[{ label: "Home", path: "/" }, { label: "Login", path: "/login" }, { label: "Register Gym", path: "/register" }, { label: "Download App", path: "/download-app" }, { label: "Owner dashboard", path: "/dashboard" }].map((l) => <a key={l.path} href={url ? `${url.replace(/\/$/, "")}${l.path}` : "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"><span>{l.label}</span><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></a>)}</CardContent></Card>
      </div>
      <Card className="mt-4"><CardHeader><CardTitle>Live preview</CardTitle><CardDescription>{url || "Save a URL above to load a live preview."}</CardDescription></CardHeader><CardContent>{url ? <div className="overflow-hidden rounded-md border border-border bg-background"><iframe key={iframeKey} src={url} title="Website preview" className="h-[640px] w-full" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" /></div> : <p className="text-sm text-muted-foreground">No website connected yet.</p>}</CardContent></Card>
    </div>
  );
}
