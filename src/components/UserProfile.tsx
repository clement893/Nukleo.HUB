"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

export default function UserProfile({ user }: UserProfileProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Créer les initiales pour l'avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Couleur de l'avatar basée sur le hash du nom
  const colors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];
  const colorIndex = user.id.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton profil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a24] transition-colors"
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-semibold`}
        >
          {initials}
        </div>

        {/* Nom et rôle */}
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">{user.name}</div>
          <div className="text-xs text-gray-400">{user.role || "Utilisateur"}</div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#12121a] rounded-lg shadow-xl shadow-black/50 border border-[#1a1a24] z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1a1a24]">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold`}
              >
                {initials}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <button
              onClick={() => {
                router.push("/profile");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a24] transition-colors"
            >
              <User className="w-4 h-4" />
              Mon profil
            </button>

            <button
              onClick={() => {
                router.push("/settings");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-[#1a1a24] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Paramètres
            </button>

            <div className="border-t border-[#1a1a24] my-2" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
