"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  KPICards,
  PipelineChart,
  RecentActivity,
  NewContacts,
  UpcomingDeadlines,
  WeekAgenda,
} from "@/components/DashboardWidgets";
import { Settings2, GripVertical } from "lucide-react";

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Accueil</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenue sur votre centre de commande
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isEditing
                  ? "bg-primary text-white"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <Settings2 className="h-4 w-4" />
              {isEditing ? "Terminer" : "Personnaliser"}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* KPI Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
              <h2 className="text-lg font-semibold text-foreground">Indicateurs clés</h2>
            </div>
            <KPICards />
          </section>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
                  <h2 className="text-lg font-semibold text-foreground">Vue d&apos;ensemble</h2>
                </div>
                <PipelineChart />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
                  <h2 className="text-lg font-semibold text-foreground">Activité</h2>
                </div>
                <RecentActivity />
              </section>
            </div>

            {/* Right Column - 1/3 width */}
            <div className="space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
                </div>
                <NewContacts />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
                </div>
                <UpcomingDeadlines />
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  {isEditing && <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />}
                </div>
                <WeekAgenda />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
