"use client";

import { usePathname } from "next/navigation";
import {
  Calendar,
  FilePenLine,
  LayoutDashboard,
  ListTodo,
  User,
  Activity,
  ClipboardList,
  Repeat,
  Timer,
  StickyNote,
  Map,
  CheckSquare,
  Sparkles
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/templates", label: "Templates", icon: ClipboardList },
  { href: "/plan", label: "Plan", icon: FilePenLine },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/jots", label: "Jots", icon: StickyNote },
  { href: "/alignment", label: "Alignment", icon: Map },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/interests", label: "Interests", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-white/5 bg-background/50 backdrop-blur-xl">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] shadow-lg shadow-red-500/20 overflow-hidden">
              <img src="/icon.png" alt="Dash Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Dash</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3">
          <SidebarMenu className="gap-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className="rounded-lg transition-all hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                >
                  <Link href={item.href} className="flex items-center gap-3 px-3 py-2">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {user && (
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user.name || 'User'}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Log Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        )}
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-white/5 bg-background/50 backdrop-blur-xl px-4 sm:px-6 md:hidden">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e11d48] shadow-sm overflow-hidden">
              <img src="/icon.png" alt="Dash Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Dash</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
