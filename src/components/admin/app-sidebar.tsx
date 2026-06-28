import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  LifeBuoy,
  Bell,
  BarChart3,
  CreditCard,
  Settings,
  ShieldCheck,
  ScrollText,
  Smartphone,
  Globe,
  FileText,
  LogOut,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; exact?: boolean };
const groups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true }, { title: "Analytics", url: "/admin/analytics", icon: BarChart3 }] },
  { label: "People & Gyms", items: [{ title: "Users", url: "/admin/users", icon: Users }, { title: "Gyms", url: "/admin/gyms", icon: Building2 }, { title: "Admin Roles", url: "/admin/roles", icon: ShieldCheck }] },
  { label: "Operations", items: [{ title: "Support", url: "/admin/support", icon: LifeBuoy }, { title: "Notifications", url: "/admin/notifications", icon: Bell }, { title: "Payments", url: "/admin/payments", icon: CreditCard }] },
  { label: "Content", items: [{ title: "Content", url: "/admin/content", icon: FileText }, { title: "App Management", url: "/admin/app", icon: Smartphone }, { title: "Website Management", url: "/admin/website", icon: Globe }] },
  { label: "System", items: [{ title: "Settings", url: "/admin/settings", icon: Settings }, { title: "Activity Logs", url: "/admin/logs", icon: ScrollText }] },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isActive = (url: string, exact?: boolean) => exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30"><ShieldCheck className="h-4 w-4" /></div>
          {!collapsed && <div className="flex flex-col leading-tight"><span className="text-sm font-semibold">SE7EN FIT Admin</span><span className="text-[10px] text-muted-foreground">App + Website + Gyms</span></div>}
        </div>
      </SidebarHeader>
      <SidebarContent className="no-scrollbar">
        {groups.map((g) => <SidebarGroup key={g.label}><SidebarGroupLabel>{g.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{g.items.map((item) => <SidebarMenuItem key={item.url}><SidebarMenuButton asChild isActive={isActive(item.url, item.exact)} tooltip={item.title}><Link to={item.url} className="flex items-center gap-2"><item.icon className="h-4 w-4" /><span>{item.title}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border"><SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={handleSignOut} tooltip="Sign out"><LogOut className="h-4 w-4" /><span>Sign out</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
    </Sidebar>
  );
}
