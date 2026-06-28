import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText } from "lucide-react";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/admin/logs")({ component: LogsPage });

type LogRow = Record<string, any>;

function LogsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-logs", "production"], queryFn: () => adminApi.logs() as Promise<LogRow[]> });
  return (
    <div>
      <PageHeader title="Activity logs" description="Admin actions from the production backend are recorded here." />
      <Card className="p-4">
        {isLoading ? <Skeleton className="h-64 w-full" /> : (data ?? []).length === 0 ? (
          <EmptyState icon={<ScrollText className="h-8 w-8" />} title="No activity yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
              <TableBody>
                {data!.map((l) => (
                  <TableRow key={l.log_id || l.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                    <TableCell className="text-sm">{l.entity ?? "—"} {l.entity_id ? <span className="text-xs text-muted-foreground">({String(l.entity_id).slice(0, 8)})</span> : null}</TableCell>
                    <TableCell className="max-w-md truncate text-xs text-muted-foreground">{l.details && Object.keys(l.details as object).length > 0 ? JSON.stringify(l.details) : "—"}</TableCell>
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
