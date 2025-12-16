"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
  Moon,
} from "lucide-react";

interface NotificationPreferences {
  id: string;
  timesheetApproved: boolean;
  timesheetRejected: boolean;
  taskAssigned: boolean;
  taskUpdated: boolean;
  requestApproved: boolean;
  requestRejected: boolean;
  generalAnnouncements: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  emailFrequency: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export default function NotificationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [token]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch(`/api/employee-portal/${token}/notification-preferences`);
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/employee-portal/${token}/notification-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const Toggle = ({
    enabled,
    onChange,
    disabled = false,
  }: {
    enabled: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-violet-500" : "bg-white/20"}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white/60">Erreur lors du chargement des préférences</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/employee-portal/${token}/notifications`)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-6 h-6 text-violet-400" />
                  Paramètres de notifications
                </h1>
                <p className="text-sm text-white/60">Personnalisez vos préférences</p>
              </div>
            </div>
            <button
              onClick={savePreferences}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-violet-500 hover:bg-violet-600 text-white"
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? "Enregistré" : "Enregistrer"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Méthodes de notification */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-violet-400" />
            Méthodes de notification
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <div className="font-medium text-white">Notifications in-app</div>
                <div className="text-sm text-white/50">Recevoir les notifications dans l&apos;application</div>
              </div>
              <Toggle
                enabled={preferences.inAppEnabled}
                onChange={value => updatePreference("inAppEnabled", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <div className="font-medium text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  Notifications par email
                </div>
                <div className="text-sm text-white/50">Recevoir les notifications par courriel</div>
              </div>
              <Toggle
                enabled={preferences.emailEnabled}
                onChange={value => updatePreference("emailEnabled", value)}
              />
            </div>

            {preferences.emailEnabled && (
              <div className="py-3 pl-6 border-l-2 border-violet-500/30">
                <div className="font-medium text-white mb-2">Fréquence des emails</div>
                <div className="flex gap-2">
                  {[
                    { value: "instant", label: "Instantané" },
                    { value: "daily", label: "Quotidien" },
                    { value: "weekly", label: "Hebdomadaire" },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updatePreference("emailFrequency", option.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        preferences.emailFrequency === option.value
                          ? "bg-violet-500 text-white"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Types de notifications */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" />
            Types de notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <div className="font-medium text-white">Feuille de temps approuvée</div>
                  <div className="text-sm text-white/50">Quand votre feuille de temps est validée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.timesheetApproved}
                onChange={value => updatePreference("timesheetApproved", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-medium text-white">Feuille de temps rejetée</div>
                  <div className="text-sm text-white/50">Quand votre feuille de temps est refusée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.timesheetRejected}
                onChange={value => updatePreference("timesheetRejected", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-violet-500" />
                <div>
                  <div className="font-medium text-white">Nouvelle tâche assignée</div>
                  <div className="text-sm text-white/50">Quand une tâche vous est attribuée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.taskAssigned}
                onChange={value => updatePreference("taskAssigned", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-white">Tâche mise à jour</div>
                  <div className="text-sm text-white/50">Quand une de vos tâches est modifiée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.taskUpdated}
                onChange={value => updatePreference("taskUpdated", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium text-white">Demande approuvée</div>
                  <div className="text-sm text-white/50">Quand votre demande est acceptée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.requestApproved}
                onChange={value => updatePreference("requestApproved", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-medium text-white">Demande rejetée</div>
                  <div className="text-sm text-white/50">Quand votre demande est refusée</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.requestRejected}
                onChange={value => updatePreference("requestRejected", value)}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-white">Annonces générales</div>
                  <div className="text-sm text-white/50">Messages de l&apos;administration</div>
                </div>
              </div>
              <Toggle
                enabled={preferences.generalAnnouncements}
                onChange={value => updatePreference("generalAnnouncements", value)}
              />
            </div>
          </div>
        </section>

        {/* Heures de silence */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-violet-400" />
            Heures de silence
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <div className="font-medium text-white">Activer les heures de silence</div>
                <div className="text-sm text-white/50">Ne pas recevoir de notifications pendant cette période</div>
              </div>
              <Toggle
                enabled={preferences.quietHoursEnabled}
                onChange={value => updatePreference("quietHoursEnabled", value)}
              />
            </div>

            {preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 py-3 pl-6 border-l-2 border-violet-500/30">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Début</label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart || "22:00"}
                    onChange={e => updatePreference("quietHoursStart", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Fin</label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd || "07:00"}
                    onChange={e => updatePreference("quietHoursEnd", e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
