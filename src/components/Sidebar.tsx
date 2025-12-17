"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  TrendingUp,
  Users,
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
  Megaphone,
  Brain,
  Ticket,
  Shield,
  LogOut,
  Loader2,
  ExternalLink,
  Briefcase,
  DollarSign,
} from "lucide-react";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}
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
      { name: "Soumissions", href: "/commercial/submissions" },
    ],
  },
  {
    name: "Réseau",
    href: "/reseau",
    icon: Users,
    children: [
      { name: "Contacts", href: "/reseau/contacts" },
      { name: "Entreprises", href: "/reseau/entreprises" },
      { name: "Clients", href: "/reseau/clients" },
      { name: "Témoignages", href: "/reseau/temoignages" },
    ],
  },
  {
    name: "Projets",
    href: "/projects",
    icon: FolderKanban,
    children: [
      { name: "Liste", href: "/projects" },
      { name: "Importer", href: "/projects/import" },
    ],
  },
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
  { name: "Hub Communication", href: "/communication", icon: Megaphone },
  { name: "Leo IA", href: "/leo", icon: Brain },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  {
    name: "Administration",
    href: "/admin",
    icon: Shield,
    children: [
      { name: "Tableau de bord", href: "/admin" },
      { name: "Utilisateurs", href: "/admin/users" },
      { name: "Notifications", href: "/admin/notifications" },
      { name: "Accès", href: "/admin/access" },
      { name: "Permissions Menu", href: "/admin/menu-permissions" },
    ],
  },
  {
    name: "Gestion",
    href: "/management",
    icon: Briefcase,
    children: [
      { name: "Vacances", href: "/admin/vacations" },
      { name: "Feuilles de temps", href: "/admin/timesheets" },
      { name: "Onboarding", href: "/admin/onboarding" },
      { name: "Recommandations", href: "/admin/recommendations" },
      { name: "Sondages", href: "/admin/surveys" },
    ],
  },
  {
    name: "Finances",
    href: "/finances",
    icon: DollarSign,
    children: [
      { name: "Facturation", href: "/billing" },
      { name: "Rapports", href: "/billing" },
      { name: "Factures", href: "/billing/invoices" },
      { name: "Devis", href: "/billing/quotes" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Commercial", "Réseau"]);
  
  // Auto-expand menu based on current pathname
  useEffect(() => {
    const pathToParent: Record<string, string> = {
      "/admin/vacations": "Gestion",
      "/admin/timesheets": "Gestion",
      "/admin/onboarding": "Gestion",
      "/admin/recommendations": "Gestion",
      "/admin/surveys": "Gestion",
      "/billing": "Finances",
      "/billing/invoices": "Finances",
      "/billing/quotes": "Finances",
      "/commercial/submissions": "Commercial",
    };
    
    const parentMenu = pathToParent[pathname];
    if (parentMenu && !expandedItems.includes(parentMenu)) {
      setExpandedItems(prev => [...prev, parentMenu]);
    }
  }, [pathname]);
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userAccess, setUserAccess] = useState<any>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [_loadingPortal, _setLoadingPortal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.user);

        // Récupérer les permissions d'accès de l'utilisateur
        if (data.user) {
          const accessRes = await fetch("/api/user-access");
          const accessData = await accessRes.json();
          setUserAccess(accessData.access);

          // Récupérer le portail employé si l'utilisateur n'est pas admin
          if (data.user.role !== "admin" && data.user.role !== "super_admin") {
            try {
              const portalRes = await fetch(`/api/employees/${data.user.id}/portal`);
              if (portalRes.ok) {
                const portalData = await portalRes.json();
                setPortalUrl(portalData.url);
              }
            } catch (error) {
              console.error("Error fetching employee portal:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setLoggingOut(false);
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    
    // Logique spéciale pour les sections avec enfants
    const pathToParent: Record<string, string> = {
      "/admin/vacations": "/management",
      "/admin/timesheets": "/management",
      "/admin/onboarding": "/management",
      "/admin/recommendations": "/management",
      "/admin/surveys": "/management",
      "/admin/access": "/admin",
      "/admin/menu-permissions": "/admin",
      "/admin/notifications": "/admin",
      "/admin/users": "/admin",
      "/billing": "/finances",
      "/billing/invoices": "/finances",
      "/billing/quotes": "/finances",
      "/commercial/submissions": "/commercial",
    };
    
    // Vérifier si le chemin actuel correspond à un parent
    const parent = pathToParent[pathname];
    if (parent) {
      return href === parent;
    }
    
    // Sinon, utiliser la logique par défaut
    return pathname.startsWith(href);
  };

  // Vérifier si l'utilisateur a accès à une page
  const hasAccessToPage = (href: string): boolean => {
    // Si pas de restriction d'accès, accès complet
    if (!userAccess) return true;

    // Pages toujours accessibles
    const alwaysAccessible = ["/", "/profile", "/settings"];
    if (alwaysAccessible.includes(href)) return true;

    // Vérifier l'accès à Agenda
    if (href.startsWith("/agenda")) {
      // Agenda peut être contrôlé par spacesAccess
      if (userAccess.spacesAccess === "none") return false;
      if (userAccess.spacesAccess === "specific") {
        return userAccess.allowedSpaces?.includes("agenda") || false;
      }
      return true;
    }

    // Vérifier l'accès aux clients (Réseau)
    const clientPages = ["/reseau", "/reseau/clients", "/reseau/contacts", "/reseau/entreprises"];
    if (clientPages.some(page => href.startsWith(page))) {
      // Si spacesAccess est "specific", vérifier SEULEMENT spacesAccess
      if (userAccess.spacesAccess === "specific") {
        return userAccess.allowedSpaces?.includes("reseau") || false;
      }
      // Si spacesAccess est "none", vérifier clientsAccess
      if (userAccess.spacesAccess === "none") {
        return userAccess.clientsAccess !== "none";
      }
      // Si spacesAccess est "all", autoriser
      return true;
    }

    // Vérifier l'accès aux projets (Commercial, Projets)
    const projectPages = ["/projects", "/commercial"];
    if (projectPages.some(page => href.startsWith(page))) {
      const spaceId = href.startsWith("/commercial") ? "commercial" : "projects";
      // Si spacesAccess est "specific", vérifier SEULEMENT spacesAccess
      if (userAccess.spacesAccess === "specific") {
        return userAccess.allowedSpaces?.includes(spaceId) || false;
      }
      // Si spacesAccess est "none", vérifier projectsAccess
      if (userAccess.spacesAccess === "none") {
        return userAccess.projectsAccess !== "none";
      }
      // Si spacesAccess est "all", autoriser
      return true;
    }

    // Vérifier l'accès aux espaces
    // Note: /commercial, /reseau, /projects et /agenda sont déjà vérifiés ci-dessus
    const spaceMap: Record<string, string> = {
      "/transformation": "transformation",
      "/teams": "teams",
      "/billing": "billing",
      "/communication": "communication",
      "/leo": "leo",
      "/tickets": "tickets",
      "/admin": "admin",
    };

    for (const [path, spaceId] of Object.entries(spaceMap)) {
      if (href.startsWith(path)) {
        if (userAccess.spacesAccess === "none") return false;
        if (userAccess.spacesAccess === "specific") {
          return userAccess.allowedSpaces?.includes(spaceId) || false;
        }
        return true;
      }
    }

    return true;
  };

  // Filtrer le menu en fonction des permissions
  const getAccessibleNavigation = () => {
    if (!userAccess) return navigation;

    return navigation.filter(item => hasAccessToPage(item.href)).map(item => ({
      ...item,
      children: item.children?.filter(child => hasAccessToPage(child.href)),
    }));
  };

  const accessibleNav = getAccessibleNavigation();

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
          <button 
            className="flex w-full items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Rechercher dans l'application (raccourci: Cmd+K)"
            title="Rechercher (Cmd+K)"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Rechercher...</span>
            <kbd className="ml-auto flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-xs text-muted-foreground" aria-label="Raccourci clavier">
              <Command className="h-3 w-3" aria-hidden="true" />K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {accessibleNav.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={clsx(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        isActive(item.href)
                          ? "bg-sidebar-hover text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                      )}
                      aria-expanded={expandedItems.includes(item.name)}
                      aria-controls={`submenu-${item.name}`}
                      aria-label={`${item.name}, ${expandedItems.includes(item.name) ? "réduire" : "développer"} le menu`}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.name}</span>
                      <ChevronDown
                        className={clsx(
                          "ml-auto h-4 w-4 transition-transform",
                          expandedItems.includes(item.name) && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {expandedItems.includes(item.name) && (
                      <ul 
                        id={`submenu-${item.name}`}
                        className="mt-1 space-y-1 pl-11"
                        role="menu"
                        aria-label={`Sous-menu ${item.name}`}
                      >
                        {item.children.map((child) => (
                          <li key={child.name} role="none">
                            <Link
                              href={child.href}
                              className={clsx(
                                "block rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                pathname === child.href
                                  ? "bg-primary/10 text-primary"
                                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground"
                              )}
                              role="menuitem"
                              aria-current={pathname === child.href ? "page" : undefined}
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
          {loadingUser ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : user ? (
            <div className="space-y-2">
              <button
                onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-hover transition-colors"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name || "User"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                    <span className="text-sm font-medium text-white">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
              
              <div className="flex items-center gap-2 px-1">
                {portalUrl && user?.role !== "admin" && user?.role !== "super_admin" ? (
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-hover rounded transition-colors text-xs"
                    title="Accéder à mon portail"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Mon portail</span>
                  </a>
                ) : (
                  <button
                    onClick={() => router.push("/settings")}
                    className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-hover rounded transition-colors text-xs"
                    title="Paramétrer"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Paramétrer</span>
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-hover rounded transition-colors"
                  title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center justify-center p-1.5 text-muted-foreground hover:text-red-500 hover:bg-sidebar-hover rounded transition-colors"
                  title="Se déconnecter"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
