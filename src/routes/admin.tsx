import { createFileRoute, Outlet, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Console" }] }),
  component: AdminLayout,
});

type GateState =
  | { kind: "loading" }
  | { kind: "unauth" }
  | { kind: "forbidden"; email: string | null }
  | { kind: "ok" };

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [state, setState] = useState<GateState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setState({ kind: "unauth" });
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const isAdmin = (roles ?? []).some((r) =>
        ["super_admin", "admin", "staff"].includes(r.role),
      );
      if (!active) return;
      setState(isAdmin ? { kind: "ok" } : { kind: "forbidden", email: user.email ?? null });
    })();
    return () => {
      active = false;
    };
  }, [navigate, pathname]);

  if (state.kind === "loading" || state.kind === "unauth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (state.kind === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{state.email}</span>, but your account
            does not have an admin, staff or super admin role.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Ask a super admin to grant access from the Admin Roles page.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="outline"><Link to="/">Back to site</Link></Button>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <AppSidebar />
        <div className="flex h-full flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="ml-2 text-sm text-muted-foreground">Admin</div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}