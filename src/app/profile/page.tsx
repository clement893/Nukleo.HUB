"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        // Récupérer les informations de l'utilisateur connecté
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        const user = data.user;

        // Si l'utilisateur a un employeeId, rediriger vers le profil employé
        if (user.employeeId) {
          router.push(`/teams/employees/${user.employeeId}`);
        } else {
          // Sinon, rediriger vers le tableau de bord
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/");
      }
    };

    fetchAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement de votre profil...</p>
      </div>
    </div>
  );
}
