import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admin Console" },
      { name: "description", content: "Centralized admin dashboard for your app and website." },
      { property: "og:title", content: "Admin Console" },
      { property: "og:description", content: "Centralized admin dashboard for your app and website." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
          One console for your app & website
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground">
          Manage users, support, content, notifications, settings and analytics across every surface
          from a single dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Sign in to admin <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
