"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Search, Moon, Sun, User as UserIcon } from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { useAuth, isAuthPath } from "@/context/AuthContext";
import { NAV_SECTIONS, titleForPath } from "@/lib/nav";
import { useTheme } from "@/lib/use-theme";
import {
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/command-palette";
import { PullToRefresh } from "@/components/pull-to-refresh";

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1 py-0.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-[13px] font-bold text-primary-foreground ring-1 ring-primary/30">
        D
      </span>
      <span className="text-sm font-semibold tracking-tight text-foreground">Dash</span>
    </Link>
  );
}

function SidebarNav() {
  const pathname = usePathname();
  return (
    <SidebarContent className="px-2 py-2 scrollbar-thin">
      {NAV_SECTIONS.map((section) => (
        <SidebarGroup key={section.label} className="py-1">
          <SidebarGroupLabel className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      size="sm"
                      isActive={active}
                      tooltip={item.label}
                      className="relative rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-foreground"
                    >
                      <Link href={item.href} className="flex items-center gap-2.5 px-2">
                        {active && (
                          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const name = user?.name || "User";
  const email = user?.email || "";
  const initial = (name || email || "U").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <Avatar className="h-7 w-7 rounded-md">
            <AvatarFallback className="rounded-md bg-primary/15 text-xs font-semibold text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{name}</span>
            {email && <span className="truncate text-xs text-muted-foreground">{email}</span>}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{name}</span>
            {email && <span className="text-xs text-muted-foreground">{email}</span>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommandSearchButton() {
  const { setOpen } = useCommandPalette();
  return (
    <>
      {/* Desktop: faux search field */}
      <button
        onClick={() => setOpen(true)}
        className="hidden h-9 w-64 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-ring/40 hover:text-foreground sm:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      {/* Mobile: icon button */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>
    </>
  );
}

function Topbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="h-5 w-px bg-border" />
      <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
        {titleForPath(pathname)}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <CommandSearchButton />
      </div>
    </header>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border px-3">
          <BrandMark />
        </SidebarHeader>
        <SidebarNav />
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <UserMenu />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <Topbar />
        <PullToRefresh />
        <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  // Auth pages (login / register) render full-screen, without the app chrome.
  if (isAuthPath(pathname)) {
    return <>{children}</>;
  }

  // For protected routes, don't render the app shell until we have an
  // authenticated user. While the session resolves — or for logged-out users
  // (whom AuthProvider redirects to /login) — show a minimal placeholder so the
  // sidebar and page content never flash for someone who isn't signed in.
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <CommandPaletteProvider onLogout={logout}>
      <Shell>{children}</Shell>
    </CommandPaletteProvider>
  );
}
