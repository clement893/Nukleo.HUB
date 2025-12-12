"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedEmployeePortalProps {
  children: React.ReactNode;
  employeeId: string;
}

export function ProtectedEmployeePortal({
  children,
  employeeId,
}: ProtectedEmployeePortalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Récupérer les informations de l'utilisateur connecté
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          // Pas connecté, rediriger vers Google OAuth
          router.push("/api/auth/google");
          return;
        }

        const userData = await userRes.json();
        const currentUser = userData.user;

        if (!currentUser) {
          router.push("/api/auth/google");
          return;
        }

        // Vérifier si l'utilisateur est super admin ou l'employé lui-même
        const isSuperAdmin = currentUser.role === "super_admin";
        const isOwnPortal = currentUser.id === employeeId;

        if (!isSuperAdmin && !isOwnPortal) {
          // Accès refusé
          router.push("/teams/employees");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/api/auth/google");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [employeeId, router]);

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
