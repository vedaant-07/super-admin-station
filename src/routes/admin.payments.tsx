import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: () => (
    <div>
      <PageHeader title="Payments" description="Subscriptions, invoices and revenue overview." />
      <EmptyState
        icon={<CreditCard className="h-8 w-8" />}
        title="No payment provider connected"
        description="Enable Stripe or another provider, then this section can display transactions and subscriptions."
      />
    </div>
  ),
});