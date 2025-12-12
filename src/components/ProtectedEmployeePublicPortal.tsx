"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedEmployeePublicPortalProps {
  children: React.ReactNode;
  token: string;
}

export function ProtectedEmployeePublicPortal({
  children,
  token,
}: ProtectedEmployeePublicPortalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // D'abord, vérifier que le token est valide en récupérant les données du portail
        const portalRes = await fetch(`/api/employee-portal/${token}`);
        if (!portalRes.ok) {
          setError("Token invalide ou expiré");
          setLoading(false);
          return;
        }

        const portalData = await portalRes.json();
        const employeeId = portalData?.employee?.id;

        if (!employeeId) {
          setError("Portail employé non trouvé");
          setLoading(false);
          return;
        }

        // Récupérer les informations de l'utilisateur connecté
        const userRes = await fetch("/api/auth/me");
        
        // Si pas connecté, rediriger vers Google OAuth
        if (!userRes.ok) {
          const loginUrl = `/api/auth/google?redirect=/employee-portal/${token}`;
          router.push(loginUrl);
          return;
        }

        const userData = await userRes.json();
        const currentUser = userData.user;

        if (!currentUser) {
          const loginUrl = `/api/auth/google?redirect=/employee-portal/${token}`;
          router.push(loginUrl);
          return;
        }

        // Vérifier si l'utilisateur est super admin ou l'employé lui-même
        const isSuperAdmin = currentUser.role === "super_admin";
        const isOwnPortal = currentUser.id === employeeId;

        if (!isSuperAdmin && !isOwnPortal) {
          // Accès refusé
          setError("Vous n'avez pas accès à ce portail");
          setLoading(false);
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking access:", error);
        setError("Erreur lors de la vérification des permissions");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Accès refusé</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
