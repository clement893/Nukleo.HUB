"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EmployeeAccess {
  id: string;
  accessType: string;
  clientAccess: string | null;
  projectAccess: string | null;
}

export function useAccessControl(requiredAccess?: string) {
  const router = useRouter();
  const [access, setAccess] = useState<EmployeeAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/user-access");
        const data = await res.json();
        const userAccess = data.access;
        setAccess(userAccess);

        // Vérifier si l'utilisateur a accès à la page requise
        if (requiredAccess && userAccess?.accessType === "specific") {
          // Si accès spécifique et pas d'accès client/projet, bloquer
          const hasClientAccess = userAccess.clientAccess && userAccess.clientAccess !== "*";
          const hasProjectAccess = userAccess.projectAccess && userAccess.projectAccess !== "*";

          if (requiredAccess === "clients" && !hasClientAccess) {
            setHasAccess(false);
            router.push("/");
            return;
          }

          if (requiredAccess === "projects" && !hasProjectAccess) {
            setHasAccess(false);
            router.push("/");
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredAccess, router]);

  return { access, loading, hasAccess };
}
