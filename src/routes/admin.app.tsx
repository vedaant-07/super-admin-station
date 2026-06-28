import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/app")({ component: AppPage });

type MapT = Record<string, any>;

function AppPage() {
  const qc = useQueryClient();
  const [local, setLocal] = useState<MapT>({});
  const { data, isLoading } = useQuery({ queryKey: ["app-management", "production"], queryFn: async () => { const rows = (await adminApi.settings()) as any[]; const map: MapT = {}; rows.forEach((r) => { map[r.key] = r.value; }); return map; } });
  useEffect(() => { if (data) setLocal(data); }, [data]);
  const saveMut = useMutation({ mutationFn: (key: string) => adminApi.updateSetting(key, { key, value: local[key], scope: "app" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["app-management"] }); toast.success("Saved"); }, onError: (e: Error) => toast.error(e.message) });
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  const features = (local.features as Record<string, boolean>) ?? {};
  const appVersion = (local["app.version"] as Record<string, string>) ?? {};
  const downloads = (local.download_links as Record<string, string>) ?? {};

  return (
    <div>
      <PageHeader title="App management" description="Control app version, feature flags and download links from production settings." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Release config</CardTitle></CardHeader><CardContent className="space-y-3"><div className="space-y-2"><Label>Android version</Label><Input value={appVersion.android ?? ""} onChange={(e) => setLocal({ ...local, "app.version": { ...appVersion, android: e.target.value } })} placeholder="1.0.0" /></div><div className="space-y-2"><Label>iOS version</Label><Input value={appVersion.ios ?? ""} onChange={(e) => setLocal({ ...local, "app.version": { ...appVersion, ios: e.target.value } })} placeholder="1.0.0" /></div><Button size="sm" onClick={() => saveMut.mutate("app.version")}>Save version</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Download links</CardTitle></CardHeader><CardContent className="space-y-3"><div className="space-y-2"><Label>Play Store URL</Label><Input value={downloads.play_store_url ?? ""} onChange={(e) => setLocal({ ...local, download_links: { ...downloads, play_store_url: e.target.value } })} /></div><div className="space-y-2"><Label>App Store URL</Label><Input value={downloads.app_store_url ?? ""} onChange={(e) => setLocal({ ...local, download_links: { ...downloads, app_store_url: e.target.value } })} /></div><div className="space-y-2"><Label>APK URL</Label><Input value={downloads.apk_url ?? ""} onChange={(e) => setLocal({ ...local, download_links: { ...downloads, apk_url: e.target.value } })} /></div><Button size="sm" onClick={() => saveMut.mutate("download_links")}>Save links</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Feature flags</CardTitle></CardHeader><CardContent className="space-y-4">{["signups_enabled", "maintenance_mode", "ai_trainer_enabled", "food_scan_enabled", "community_enabled", "payments_enabled"].map((key) => <div key={key} className="flex items-center justify-between"><Label>{key.replace(/_/g, " ")}</Label><Switch checked={!!features[key]} onCheckedChange={(v) => setLocal({ ...local, features: { ...features, [key]: v } })} /></div>)}<Button size="sm" onClick={() => saveMut.mutate("features")}>Save flags</Button></CardContent></Card>
      </div>
    </div>
  );
}
