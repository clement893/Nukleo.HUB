"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  X,
  Users,
  Briefcase,
  Target,
  Building2,
  List,
  Grid3X3,
  Bell,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  location: string | null;
  color: string | null;
  contactId: string | null;
  opportunityId: string | null;
  projectId: string | null;
  companyId: string | null;
  reminder: boolean;
  reminderTime: number | null;
}

const EVENT_TYPES = [
  { id: "meeting", name: "Réunion", color: "#6366f1" },
  { id: "deadline", name: "Échéance", color: "#ef4444" },
  { id: "reminder", name: "Rappel", color: "#f59e0b" },
  { id: "call", name: "Appel", color: "#10b981" },
  { id: "other", name: "Autre", color: "#8b5cf6" },
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "meeting",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "10:00",
    allDay: false,
    location: "",
    color: "#6366f1",
    reminder: false,
    reminderTime: 30,
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const res = await fetch(
        `/api/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
    setLoading(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startDate) return;

    try {
      const startDateTime = newEvent.allDay
        ? new Date(newEvent.startDate)
        : new Date(`${newEvent.startDate}T${newEvent.startTime}`);
      
      const endDateTime = newEvent.endDate
        ? newEvent.allDay
          ? new Date(newEvent.endDate)
          : new Date(`${newEvent.endDate}T${newEvent.endTime}`)
        : null;

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime?.toISOString(),
          allDay: newEvent.allDay,
          location: newEvent.location,
          color: newEvent.color,
          reminder: newEvent.reminder,
          reminderTime: newEvent.reminder ? newEvent.reminderTime : null,
        }),
      });

      if (res.ok) {
        setShowAddEvent(false);
        resetNewEvent();
        fetchEvents();
      }
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;

    try {
      await fetch(`/api/events/${id}`, { method: "DELETE" });
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      description: "",
      type: "meeting",
      startDate: "",
      startTime: "09:00",
      endDate: "",
      endTime: "10:00",
      allDay: false,
      location: "",
      color: "#6366f1",
      reminder: false,
      reminderTime: 30,
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setNewEvent({
      ...newEvent,
      startDate: date.toISOString().split("T")[0],
      endDate: date.toISOString().split("T")[0],
    });
    setShowAddEvent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
                <p className="text-sm text-muted-foreground">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setView("month")}
                  className={`px-3 py-1.5 text-sm ${
                    view === "month"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 text-sm ${
                    view === "list"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation */}
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted text-muted-foreground"
              >
                Aujourd'hui
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  resetNewEvent();
                  setShowAddEvent(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nouvel événement
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : view === "month" ? (
            /* Month View */
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Days Header */}
              <div className="grid grid-cols-7 border-b border-border">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="py-3 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] border-b border-r border-border p-2 ${
                        day ? "cursor-pointer hover:bg-muted/50" : "bg-muted/20"
                      }`}
                      onClick={() => day && handleDayClick(day)}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                              isToday(day)
                                ? "bg-primary text-white"
                                : "text-foreground"
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                }}
                                className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80"
                                style={{
                                  backgroundColor: `${event.color || "#6366f1"}20`,
                                  color: event.color || "#6366f1",
                                  borderLeft: `3px solid ${event.color || "#6366f1"}`,
                                }}
                              >
                                {!event.allDay && (
                                  <span className="font-medium">
                                    {formatTime(event.startDate)}{" "}
                                  </span>
                                )}
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground px-2">
                                +{dayEvents.length - 3} autres
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                  Aucun événement ce mois-ci
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-1 h-full min-h-[60px] rounded-full"
                        style={{ backgroundColor: event.color || "#6366f1" }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${event.color || "#6366f1"}20`,
                              color: event.color || "#6366f1",
                            }}
                          >
                            {EVENT_TYPES.find((t) => t.id === event.type)?.name || event.type}
                          </span>
                          {event.reminder && (
                            <Bell className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <h3 className="font-medium text-foreground">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {formatDate(event.startDate)}
                          </span>
                          {!event.allDay && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatTime(event.startDate)}
                              {event.endDate && ` - ${formatTime(event.endDate)}`}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Nouvel événement
              </h2>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Titre de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => {
                    const type = EVENT_TYPES.find((t) => t.id === e.target.value);
                    setNewEvent({
                      ...newEvent,
                      type: e.target.value,
                      color: type?.color || "#6366f1",
                    });
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEvent.allDay}
                  onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="allDay" className="text-sm text-foreground">
                  Journée entière
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                {!newEvent.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Heure de début
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  />
                </div>
                {!newEvent.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Heure de fin
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  placeholder="Adresse ou lien visio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground resize-none"
                  rows={3}
                  placeholder="Description de l'événement"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reminder"
                    checked={newEvent.reminder}
                    onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })}
                    className="rounded border-border"
                  />
                  <label htmlFor="reminder" className="text-sm text-foreground">
                    Rappel
                  </label>
                </div>
                {newEvent.reminder && (
                  <select
                    value={newEvent.reminderTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, reminderTime: parseInt(e.target.value) })
                    }
                    className="rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground"
                  >
                    <option value={15}>15 min avant</option>
                    <option value={30}>30 min avant</option>
                    <option value={60}>1h avant</option>
                    <option value={1440}>1 jour avant</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${selectedEvent.color || "#6366f1"}20`,
                  color: selectedEvent.color || "#6366f1",
                }}
              >
                {EVENT_TYPES.find((t) => t.id === selectedEvent.type)?.name || selectedEvent.type}
              </span>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-4">
              {selectedEvent.title}
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(selectedEvent.startDate)}</span>
              </div>

              {!selectedEvent.allDay && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(selectedEvent.startDate)}
                    {selectedEvent.endDate && ` - ${formatTime(selectedEvent.endDate)}`}
                  </span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-foreground mt-4 pt-4 border-t border-border">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg"
              >
                Supprimer
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
