import React from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  List, 
  ShieldAlert, 
  Flag,
  Ticket,
  Activity,
  Megaphone,
  CreditCard,
  LineChart,
  Shield,
  Radio,
  Bell,
  Settings,
  Gift,
  Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, STAFF_ROLE_LABELS, type Permission, type StaffRole } from "@/lib/permissions";

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, permission: "view_admin" },
  { href: "/users", label: "Users", icon: Users, permission: "view_admin" },
  { href: "/listings", label: "Listings", icon: List, permission: "view_admin" },
  { href: "/moderation", label: "Moderation Queue", icon: ShieldAlert, permission: "moderate_listings" },
  { href: "/reports", label: "Reports", icon: Flag, permission: "manage_reports" },
  { href: "/support", label: "Support Tickets", icon: Ticket, permission: "manage_support" },
  { href: "/leads", label: "Leads", icon: Activity, permission: "view_admin" },
  { href: "/financing", label: "Financing CRM", icon: Landmark, permission: "manage_financing" },
  { href: "/ads", label: "Ad Campaigns", icon: Megaphone, permission: "view_finance" },
  { href: "/revenue", label: "Revenue", icon: CreditCard, permission: "view_finance" },
  { href: "/analytics", label: "Analytics", icon: LineChart, permission: "view_finance" },
  { href: "/fraud", label: "Fraud Signals", icon: Shield, permission: "manage_reports" },
  { href: "/monitoring", label: "Monitoring", icon: Radio, permission: "view_admin" },
  { href: "/alerts", label: "Alerts", icon: Bell, permission: "view_admin" },
  { href: "/promo", label: "Free Ad Credit", icon: Gift, permission: "manage_payments" },
  { href: "/settings", label: "Payment Settings", icon: Settings, permission: "manage_payments" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: meResp } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const staffRole = (meResp?.data?.staff_role ?? "user") as StaffRole;
  const navItems = NAV_ITEMS.filter((item) => hasPermission(staffRole, item.permission));
  const roleLabel = STAFF_ROLE_LABELS[staffRole] ?? "Staff";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-white">
              B
            </div>
            <span className="font-semibold tracking-tight text-lg">Control Center</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    active 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border flex items-center gap-3">
          <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          <div className="flex flex-col text-sm">
            <span className="font-medium text-foreground">{roleLabel}</span>
            <span className="text-xs text-muted-foreground">BANCO Staff</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
