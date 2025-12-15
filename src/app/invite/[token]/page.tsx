"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, XCircle, Mail, Shield, ArrowRight } from "lucide-react";

interface InvitationData {
  email: string;
  role: string;
  inviter: { name: string | null; email: string };
  expiresAt: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  user: "Utilisateur",
};

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        const data = await res.json();
        
        if (res.ok) {
          setInvitation(data.invitation);
        } else {
          setError(data.error || "Invitation invalide");
        }
      } catch (e) {
        console.error("Error checking invitation:", e);
        setError("Erreur lors de la vérification de l'invitation");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      checkInvitation();
    }
  }, [token]);

  const handleAccept = () => {
    // Rediriger vers la connexion Google
    window.location.href = "/api/auth/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invitation invalide</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Aller à la connexion
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vous êtes invité !</h1>
          <p className="text-slate-400">
            {invitation.inviter.name || invitation.inviter.email} vous invite à rejoindre Nukleo.HUB
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Email</span>
            <span className="text-white font-medium">{invitation.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Rôle attribué</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">
              <Shield className="w-3 h-3" />
              {roleLabels[invitation.role] || invitation.role}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Expire le</span>
            <span className="text-white">
              {new Date(invitation.expiresAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <button
          onClick={handleAccept}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Accepter avec Google
        </button>

        <p className="text-center text-slate-500 text-sm mt-4">
          Connectez-vous avec votre compte Google {invitation.email}
        </p>
      </div>
    </div>
  );
}
