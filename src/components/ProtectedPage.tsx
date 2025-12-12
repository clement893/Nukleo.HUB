"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredAccess?: "clients" | "projects" | "billing" | "teams" | "admin" | "reseau" | "commercial" | "agenda" | "transformation" | "communication" | "leo" | "tickets";
}

export function ProtectedPage({
  children,
  requiredAccess,
}: ProtectedPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/user-access");
        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        const userAccess = data.access;

        if (!userAccess) {
          router.push("/");
          return;
        }

        let hasRequiredAccess = false;

        // Vérifier l'accès selon le type
        switch (requiredAccess) {
          case "clients":
            hasRequiredAccess = userAccess.clientsAccess !== "none";
            break;

          case "reseau":
            // Réseau : spacesAccess "specific" prime, sinon clientsAccess
            if (userAccess.spacesAccess === "specific") {
              hasRequiredAccess = userAccess.allowedSpaces?.includes("reseau") || false;
            } else if (userAccess.spacesAccess === "none") {
              hasRequiredAccess = userAccess.clientsAccess !== "none";
            } else {
              hasRequiredAccess = true;
            }
            break;

          case "projects":
            hasRequiredAccess = userAccess.projectsAccess !== "none";
            break;

          case "commercial":
            // Commercial : spacesAccess "specific" prime, sinon projectsAccess
            if (userAccess.spacesAccess === "specific") {
              hasRequiredAccess = userAccess.allowedSpaces?.includes("commercial") || false;
            } else if (userAccess.spacesAccess === "none") {
              hasRequiredAccess = userAccess.projectsAccess !== "none";
            } else {
              hasRequiredAccess = true;
            }
            break;

          case "agenda":
            // Agenda : contrôlé par spacesAccess
            if (userAccess.spacesAccess === "none") {
              hasRequiredAccess = false;
            } else if (userAccess.spacesAccess === "specific") {
              hasRequiredAccess = userAccess.allowedSpaces?.includes("agenda") || false;
            } else {
              hasRequiredAccess = true;
            }
            break;

          case "transformation":
          case "teams":
          case "billing":
          case "communication":
          case "leo":
          case "tickets":
          case "admin":
            // Autres espaces : contrôlés par spacesAccess
            if (userAccess.spacesAccess === "none") {
              hasRequiredAccess = false;
            } else if (userAccess.spacesAccess === "specific") {
              hasRequiredAccess = userAccess.allowedSpaces?.includes(requiredAccess) || false;
            } else {
              hasRequiredAccess = true;
            }
            break;

          default:
            hasRequiredAccess = true;
        }

        if (!hasRequiredAccess) {
          router.push("/");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredAccess, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
