import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { logAdminAction } from "@/lib/admin-log";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type SettingsMap = Record<string, Json>;

function SettingsPage() {
  const qc = useQueryClient();
  const [local, setLocal] = useState<SettingsMap>({});

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data) map[row.key] = row.value;
      return map;
    },
  });

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (key: string) => {
      const value = local[key];
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("app_settings")
        .upsert({ key, value: value as Json, updated_by: user?.id ?? null, updated_at: new Date().toISOString() });
      if (error) throw error;
      await logAdminAction("settings.updated", "app_settings", key);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const siteName = (local["site.name"] as string) ?? "";
  const contactEmail = (local["site.contact_email"] as string) ?? "";
  const contactPhone = (local["site.contact_phone"] as string) ?? "";
  const social = (local["site.social"] as Record<string, string>) ?? {};
  const legal = (local["site.legal"] as Record<string, string>) ?? {};
  const features = (local["features"] as Record<string, boolean>) ?? {};

  return (
    <div>
      <PageHeader title="Settings" description="Shared settings that drive both your app and website." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Brand & contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site name</Label>
              <Input value={siteName} onChange={(e) => setLocal({ ...local, "site.name": e.target.value })} />
              <Button size="sm" onClick={() => saveMut.mutate("site.name")}>Save</Button>
            </div>
            <div className="space-y-2">
              <Label>Contact email</Label>
              <Input value={contactEmail} onChange={(e) => setLocal({ ...local, "site.contact_email": e.target.value })} />
              <Button size="sm" onClick={() => saveMut.mutate("site.contact_email")}>Save</Button>
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input value={contactPhone} onChange={(e) => setLocal({ ...local, "site.contact_phone": e.target.value })} />
              <Button size="sm" onClick={() => saveMut.mutate("site.contact_phone")}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(["twitter","instagram","facebook","linkedin"] as const).map((k) => (
              <div key={k} className="space-y-2">
                <Label className="capitalize">{k}</Label>
                <Input
                  value={social[k] ?? ""}
                  onChange={(e) => setLocal({ ...local, "site.social": { ...social, [k]: e.target.value } })}
                  placeholder="https://…"
                />
              </div>
            ))}
            <Button size="sm" onClick={() => saveMut.mutate("site.social")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Legal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Terms URL</Label>
              <Input value={legal.terms ?? ""} onChange={(e) => setLocal({ ...local, "site.legal": { ...legal, terms: e.target.value } })} />
            </div>
            <div className="space-y-2">
              <Label>Privacy URL</Label>
              <Input value={legal.privacy ?? ""} onChange={(e) => setLocal({ ...local, "site.legal": { ...legal, privacy: e.target.value } })} />
            </div>
            <Button size="sm" onClick={() => saveMut.mutate("site.legal")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Feature toggles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["signups_enabled","maintenance_mode","payments_enabled"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between">
                <div>
                  <Label className="capitalize">{k.replace(/_/g, " ")}</Label>
                </div>
                <Switch
                  checked={!!features[k]}
                  onCheckedChange={(v) => setLocal({ ...local, features: { ...features, [k]: v } })}
                />
              </div>
            ))}
            <Button size="sm" onClick={() => saveMut.mutate("features")}>Save</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}