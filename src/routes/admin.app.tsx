import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Smartphone } from "lucide-react";

export const Route = createFileRoute("/admin/app")({
  component: () => (
    <div>
      <PageHeader title="App management" description="Control screens, in-app messages, versions and feature flags for the mobile app." />
      <EmptyState
        icon={<Smartphone className="h-8 w-8" />}
        title="Connect your mobile app"
        description="Point your app at the shared backend; this section is ready for app-specific config."
      />
    </div>
  ),
});