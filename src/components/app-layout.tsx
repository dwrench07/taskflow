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
  Sparkles,
  BookOpen,
  Zap,
  Trophy,
  Brain
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border bg-sidebar">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48] overflow-hidden">
              <img src="/icon.png" alt="Dash Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Dash</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 pb-4">
          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider h-6 px-2">Core</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {[
                  { href: "/", label: "Dashboard", icon: LayoutDashboard },
                  { href: "/tasks", label: "Tasks", icon: ListTodo },
                  { href: "/focus", label: "Focus", icon: Timer },
                  { href: "/frogs", label: "Frogs", icon: Zap },
                  { href: "/habits", label: "Habits", icon: Repeat },
                ].map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="rounded-md transition-all hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link href={item.href} className="flex items-center gap-2 px-2 py-0">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider h-6 px-2">Plan</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {[
                  { href: "/plan", label: "Daily", icon: FilePenLine },
                  { href: "/calendar", label: "Calendar", icon: Calendar },
                  { href: "/chores", label: "Chores", icon: CheckSquare },
                  { href: "/templates", label: "Templates", icon: ClipboardList },
                ].map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="rounded-md transition-all hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link href={item.href} className="flex items-center gap-2 px-2 py-0">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="py-1">
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider h-6 px-2">Brain</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {[
                  { href: "/alignment", label: "Vision", icon: Map },
                  { href: "/jots", label: "Jots", icon: StickyNote },
                  { href: "/back-of-mind", label: "Deep Store", icon: Brain },
                  { href: "/interests", label: "Interests", icon: Sparkles },
                  { href: "/achievements", label: "Wins", icon: Trophy },
                  { href: "/logs", label: "Logs", icon: BookOpen },
                  { href: "/profile", label: "Profile", icon: User },
                ].map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="rounded-md transition-all hover:bg-white/5 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                    >
                      <Link href={item.href} className="flex items-center gap-2 px-2 py-0">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6 md:hidden">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e11d48] overflow-hidden">
              <img src="/icon.png" alt="Dash Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Dash</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
