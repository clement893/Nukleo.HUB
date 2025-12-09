"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  TrendingUp,
  Users,
  Building2,
  FolderKanban,
  UsersRound,
  Calendar,
  Search,
  Settings,
  ChevronDown,
  Command,
  Sun,
  Moon,
  Sparkles,
  Receipt,
  Megaphone,
  GraduationCap,
  Brain,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  { name: "Accueil", href: "/", icon: Home },
  {
    name: "Commercial",
    href: "/commercial",
    icon: TrendingUp,
    children: [
      { name: "Tableau de bord", href: "/commercial/dashboard" },
      { name: "Pipeline", href: "/commercial/pipeline" },
    ],
  },
  {
    name: "Réseau",
    href: "/reseau",
    icon: Users,
    children: [
      { name: "Contacts", href: "/reseau/contacts" },
      { name: "Entreprises", href: "/reseau/entreprises" },
      { name: "Témoignages", href: "/reseau/temoignages" },
    ],
  },
  { name: "Projets", href: "/projects", icon: FolderKanban },
  { name: "Transformation", href: "/transformation", icon: Sparkles },
  {
    name: "Équipes",
    href: "/teams",
    icon: UsersRound,
    children: [
      { name: "Tableau de bord", href: "/teams" },
      { name: "Employés", href: "/teams/employees" },
      { name: "Charge de travail", href: "/teams/workload" },
    ],
  },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Facturation", href: "/billing", icon: Receipt },
  { name: "Hub Communication", href: "/communication", icon: Megaphone },
  { name: "Admin Onboarding", href: "/admin/onboarding", icon: GraduationCap },
  { name: "Leo IA", href: "/leo", icon: Brain },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Commercial", "Réseau"]);
  const { theme, toggleTheme } = useTheme();

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Nukleo Hub</span>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <button className="flex w-full items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-hover transition-colors">
            <Search className="h-4 w-4" />
            <span>Rechercher...</span>
            <kbd className="ml-auto flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-hover text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                      <ChevronDown
                        className={clsx(
                          "ml-auto h-4 w-4 transition-transform",
                          expandedItems.includes(item.name) && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedItems.includes(item.name) && (
                      <ul className="mt-1 space-y-1 pl-11">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={clsx(
                                "block rounded-lg px-3 py-2 text-sm transition-colors",
                                pathname === child.href
                                  ? "bg-primary/10 text-primary"
                                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                              )}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
              <span className="text-sm font-medium text-white">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@nukleo.io</p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
