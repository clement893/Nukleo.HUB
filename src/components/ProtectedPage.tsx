"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredAccess?: "clients" | "projects" | "billing" | "teams" | "admin";
  requiredSpaces?: string[];
}

export function ProtectedPage({
  children,
  requiredAccess,
  requiredSpaces,
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

        // Vérifier l'accès aux clients
        if (requiredAccess === "clients") {
          if (userAccess.clientsAccess === "none") {
            router.push("/");
            return;
          }
        }

        // Vérifier l'accès aux projets
        if (requiredAccess === "projects") {
          if (userAccess.projectsAccess === "none") {
            router.push("/");
            return;
          }
        }

        // Vérifier l'accès aux espaces
        if (requiredSpaces && requiredSpaces.length > 0) {
          if (userAccess.spacesAccess === "none") {
            router.push("/");
            return;
          }

          if (userAccess.spacesAccess === "specific") {
            const hasRequiredSpace = requiredSpaces.some(space =>
              userAccess.allowedSpaces?.includes(space)
            );
            if (!hasRequiredSpace) {
              router.push("/");
              return;
            }
          }
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
  }, [requiredAccess, requiredSpaces, router]);

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
