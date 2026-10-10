import {
  LayoutDashboard,
  ListTodo,
  ListChecks,
  Timer,
  Zap,
  Repeat,
  FilePenLine,
  Calendar,
  CheckSquare,
  ClipboardList,
  Map,
  StickyNote,
  Brain,
  Sparkles,
  Trophy,
  HelpCircle,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Core",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "home overview" },
      { href: "/tasks", label: "Tasks", icon: ListTodo, keywords: "todo work" },
      { href: "/subtasks", label: "Subtasks", icon: ListChecks },
      { href: "/focus", label: "Focus", icon: Timer, keywords: "pomodoro deep work timer" },
      { href: "/frogs", label: "Frogs", icon: Zap, keywords: "hard tasks eat the frog" },
      { href: "/habits", label: "Habits", icon: Repeat, keywords: "streak routine" },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/plan", label: "Daily", icon: FilePenLine, keywords: "today plan" },
      { href: "/calendar", label: "Calendar", icon: Calendar, keywords: "schedule" },
      { href: "/chores", label: "Chores", icon: CheckSquare, keywords: "recurring" },
      { href: "/templates", label: "Templates", icon: ClipboardList },
    ],
  },
  {
    label: "Brain",
    items: [
      { href: "/alignment", label: "Vision", icon: Map, keywords: "alignment pillars goals" },
      { href: "/jots", label: "Jots", icon: StickyNote, keywords: "notes quick capture" },
      { href: "/back-of-mind", label: "Deep Store", icon: Brain, keywords: "back of mind" },
      { href: "/interests", label: "Interests", icon: Sparkles },
      { href: "/achievements", label: "Wins", icon: Trophy, keywords: "achievements badges" },
      { href: "/guide", label: "Strategy Guide", icon: HelpCircle, keywords: "help docs" },
      { href: "/profile", label: "Profile", icon: User, keywords: "account settings" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Resolve the display title for the current pathname. */
export function titleForPath(pathname: string | null): string {
  if (!pathname) return "Dash";
  // Exact match first, then the longest prefix match (for nested routes).
  const exact = NAV_ITEMS.find((i) => i.href === pathname);
  if (exact) return exact.label;
  const prefix = NAV_ITEMS
    .filter((i) => i.href !== "/" && pathname.startsWith(i.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return prefix?.label ?? "Dash";
}
