import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: () => (
    <div>
      <PageHeader title="Content" description="Banners, homepage sections, FAQs, announcements, images and copy." />
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Content modules go here"
        description="Add a content table or CMS-style sections here; the dashboard shell and admin auth are already wired."
      />
    </div>
  ),
});