import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: () => (
    <div>
      <PageHeader title="Analytics" description="Traffic, activity and revenue across app and website." />
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="Hook up your data source"
        description="Connect product analytics or pipe events into the database to populate this section."
      />
    </div>
  ),
});