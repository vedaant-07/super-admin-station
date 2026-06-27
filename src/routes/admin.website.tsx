import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Globe } from "lucide-react";

export const Route = createFileRoute("/admin/website")({
  component: () => (
    <div>
      <PageHeader title="Website management" description="Manage pages, navigation, banners and SEO for the public website." />
      <EmptyState
        icon={<Globe className="h-8 w-8" />}
        title="Website modules go here"
        description="Point your website at the shared backend; this section is ready for website-specific config."
      />
    </div>
  ),
});