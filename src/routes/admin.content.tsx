import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Megaphone, MessageSquare, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/content")({ component: ContentPage });

type Row = Record<string, any>;

function ContentPage() {
  const qc = useQueryClient();
  const adsQ = useQuery({ queryKey: ["content", "ads", "production"], queryFn: () => adminApi.advertisements() as Promise<Row[]> });
  const postsQ = useQuery({ queryKey: ["content", "posts", "production"], queryFn: () => adminApi.communityPosts() as Promise<Row[]> });
  const adMut = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateAdvertisement(id, { status }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["content", "ads"] }); toast.success("Ad updated"); }, onError: (e: Error) => toast.error(e.message) });
  const postMut = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.moderateCommunityPost(id, { status }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["content", "posts"] }); toast.success("Post updated"); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div>
      <PageHeader title="Content" description="Moderate promotions, ads and community content from production data." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Ads & offers</CardTitle></CardHeader>
          <CardContent>{adsQ.isLoading ? <Skeleton className="h-56 w-full" /> : (adsQ.data ?? []).length === 0 ? <EmptyState icon={<FileText className="h-8 w-8" />} title="No ads yet" /> : <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Scope</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{(adsQ.data ?? []).map((ad) => <TableRow key={ad.ad_id || ad.id}><TableCell><div className="font-medium">{ad.title}</div><div className="text-xs text-muted-foreground">{ad.source_type || "admin"}</div></TableCell><TableCell>{ad.target_scope}</TableCell><TableCell><Badge variant={ad.status === "active" ? "default" : "secondary"}>{ad.status}</Badge></TableCell><TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => adMut.mutate({ id: ad.ad_id || ad.id, status: "active" })}><CheckCircle2 className="mr-1 h-3 w-3" />Active</Button><Button size="sm" variant="outline" onClick={() => adMut.mutate({ id: ad.ad_id || ad.id, status: "paused" })}><EyeOff className="mr-1 h-3 w-3" />Pause</Button></TableCell></TableRow>)}</TableBody></Table>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Community moderation</CardTitle></CardHeader>
          <CardContent>{postsQ.isLoading ? <Skeleton className="h-56 w-full" /> : (postsQ.data ?? []).length === 0 ? <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="No posts yet" /> : <Table><TableHeader><TableRow><TableHead>Post</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{(postsQ.data ?? []).map((post) => <TableRow key={post.post_id || post.id}><TableCell className="max-w-xs truncate">{post.content || post.type || "Media post"}</TableCell><TableCell><Badge variant={post.status === "active" ? "default" : "secondary"}>{post.status}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{post.created_at ? new Date(post.created_at).toLocaleDateString() : "—"}</TableCell><TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => postMut.mutate({ id: post.post_id || post.id, status: "active" })}>Approve</Button><Button size="sm" variant="outline" onClick={() => postMut.mutate({ id: post.post_id || post.id, status: "hidden" })}>Hide</Button></TableCell></TableRow>)}</TableBody></Table>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
