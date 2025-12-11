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
  List,
  Grid3X3,
  Bell,
  CalendarDays,
  CalendarRange,
  Palmtree,
  Building2,
  PartyPopper,
  User,
  Cake,
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

interface VacationEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  type: "vacation" | "holiday" | "closure" | "birthday";
  color: string;
  employeeId?: string;
  employeeName?: string;
  employeePhoto?: string | null;
  status?: string;
}

const EVENT_TYPES = [
  { id: "meeting", name: "Réunion", color: "#6366f1" },
  { id: "deadline", name: "Échéance", color: "#ef4444" },
  { id: "reminder", name: "Rappel", color: "#f59e0b" },
  { id: "call", name: "Appel", color: "#10b981" },
  { id: "other", name: "Autre", color: "#8b5cf6" },
];

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAYS_FULL = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [vacationEvents, setVacationEvents] = useState<VacationEvent[]>([]);
  const [showVacations, setShowVacations] = useState(true);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
      let start: Date, end: Date;
      
      if (view === "day") {
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
      } else if (view === "week") {
        start = getWeekStart(currentDate);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }
      
      // Récupérer les événements
      const res = await fetch(
        `/api/events?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      setEvents(data);

      // Récupérer les vacances, jours fériés et fermetures
      const vacRes = await fetch(
        `/api/agenda/vacations?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      if (vacRes.ok) {
        const vacData = await vacRes.json();
        setVacationEvents(vacData);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
    setLoading(false);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
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

  const navigate = (direction: number) => {
    const d = new Date(currentDate);
    if (view === "month") {
      d.setMonth(d.getMonth() + direction);
    } else if (view === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else if (view === "day") {
      d.setDate(d.getDate() + direction);
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getEventsForDay = (day: number, month?: number, year?: number) => {
    const m = month ?? currentDate.getMonth();
    const y = year ?? currentDate.getFullYear();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day && eventDate.getMonth() === m && eventDate.getFullYear() === y;
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter((event) => {
      if (event.allDay) return false;
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString() && eventDate.getHours() === hour;
    });
  };

  const getAllDayEvents = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return event.allDay && eventDate.toDateString() === date.toDateString();
    });
  };

  // Fonction pour vérifier si une date est dans une plage (pour les vacances multi-jours)
  const isDateInRange = (date: Date, startDate: string, endDate: string | null) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : start;
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  // Récupérer les vacances/fériés/fermetures pour un jour donné
  const getVacationsForDay = (day: number, month?: number, year?: number) => {
    if (!showVacations) return [];
    const m = month ?? currentDate.getMonth();
    const y = year ?? currentDate.getFullYear();
    const date = new Date(y, m, day);
    return vacationEvents.filter((event) => isDateInRange(date, event.startDate, event.endDate));
  };

  // Récupérer les vacances/fériés/fermetures pour une date donnée
  const getVacationsForDate = (date: Date) => {
    if (!showVacations) return [];
    return vacationEvents.filter((event) => isDateInRange(date, event.startDate, event.endDate));
  };

  // Vérifier si un jour est un jour férié
  const isHoliday = (day: number, month?: number, year?: number) => {
    const vacations = getVacationsForDay(day, month, year);
    return vacations.some(v => v.type === "holiday");
  };

  // Vérifier si un jour est pendant la fermeture du bureau
  const isClosure = (day: number, month?: number, year?: number) => {
    const vacations = getVacationsForDay(day, month, year);
    return vacations.some(v => v.type === "closure");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTodayDay = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (date: Date) => {
    setNewEvent({
      ...newEvent,
      startDate: date.toISOString().split("T")[0],
      endDate: date.toISOString().split("T")[0],
    });
    setShowAddEvent(true);
  };

  const handleHourClick = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split("T")[0];
    setNewEvent({
      ...newEvent,
      startDate: dateStr,
      endDate: dateStr,
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
    });
    setShowAddEvent(true);
  };

  const getHeaderTitle = () => {
    if (view === "day") {
      return `${DAYS_FULL[currentDate.getDay()]} ${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (view === "week") {
      const weekDays = getWeekDays();
      const start = weekDays[0];
      const end = weekDays[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${start.getDate()} ${MONTHS[start.getMonth()]} - ${end.getDate()} ${MONTHS[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground">{getHeaderTitle()}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button onClick={() => setView("month")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "month" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Mois">
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "week" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Semaine">
                  <CalendarRange className="h-4 w-4" />
                </button>
                <button onClick={() => setView("day")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "day" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Jour">
                  <CalendarDays className="h-4 w-4" />
                </button>
                <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="Liste">
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setShowVacations(!showVacations)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border ${showVacations ? "bg-sky-500/10 border-sky-500/30 text-sky-600" : "border-border text-muted-foreground hover:bg-muted"}`}
                title="Afficher/masquer vacances et fériés"
              >
                <Palmtree className="h-4 w-4" />
                Vacances
              </button>
              <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted text-muted-foreground">Aujourd'hui</button>
              <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
              <button onClick={() => { resetNewEvent(); setShowAddEvent(true); }} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                <Plus className="h-4 w-4" />Nouvel événement
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : view === "month" ? (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {DAYS.map((day) => (<div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">{day}</div>))}
              </div>
              <div className="grid grid-cols-7">
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const dayVacations = day ? getVacationsForDay(day) : [];
                  const holidayToday = day ? isHoliday(day) : false;
                  const closureToday = day ? isClosure(day) : false;
                  return (
                    <div 
                      key={index} 
                      className={`min-h-[120px] border-b border-r border-border p-2 ${day ? "cursor-pointer hover:bg-muted/50" : "bg-muted/20"} ${holidayToday ? "bg-red-500/5" : ""} ${closureToday ? "bg-violet-500/5" : ""}`} 
                      onClick={() => day && handleDayClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    >
                      {day && (
                        <>
                          <div className="flex items-center gap-1 mb-1">
                            <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isTodayDay(day) ? "bg-primary text-white" : holidayToday ? "bg-red-500 text-white" : "text-foreground"}`}>{day}</div>
                            {holidayToday && <PartyPopper className="h-3.5 w-3.5 text-red-500" />}
                            {closureToday && !holidayToday && <Building2 className="h-3.5 w-3.5 text-violet-500" />}
                          </div>
                          <div className="space-y-1">
                            {/* Afficher les vacances/fériés/fermetures */}
                            {dayVacations.slice(0, 2).map((vac) => (
                              <div 
                                key={vac.id} 
                                className="text-xs px-2 py-1 rounded truncate flex items-center gap-1" 
                                style={{ backgroundColor: `${vac.color}20`, color: vac.color, borderLeft: `3px solid ${vac.color}` }}
                              >
                                {vac.type === "vacation" && <User className="h-3 w-3 flex-shrink-0" />}
                                {vac.type === "holiday" && <PartyPopper className="h-3 w-3 flex-shrink-0" />}
                                {vac.type === "closure" && <Building2 className="h-3 w-3 flex-shrink-0" />}
                                {vac.type === "birthday" && <Cake className="h-3 w-3 flex-shrink-0" />}
                                <span className="truncate">{vac.title}</span>
                              </div>
                            ))}
                            {/* Afficher les événements réguliers */}
                            {dayEvents.slice(0, 3 - Math.min(dayVacations.length, 2)).map((event) => (
                              <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80" style={{ backgroundColor: `${event.color || "#6366f1"}20`, color: event.color || "#6366f1", borderLeft: `3px solid ${event.color || "#6366f1"}` }}>
                                {!event.allDay && <span className="font-medium">{formatTime(event.startDate)} </span>}{event.title}
                              </div>
                            ))}
                            {(dayEvents.length + dayVacations.length) > 3 && <div className="text-xs text-muted-foreground px-2">+{dayEvents.length + dayVacations.length - 3} autres</div>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : view === "week" ? (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="grid grid-cols-8 border-b border-border">
                <div className="py-3 px-2 text-center text-sm font-medium text-muted-foreground border-r border-border"></div>
                {getWeekDays().map((date, i) => {
                  const dateVacations = getVacationsForDate(date);
                  const isHolidayDate = dateVacations.some(v => v.type === "holiday");
                  const isClosureDate = dateVacations.some(v => v.type === "closure");
                  return (
                    <div key={i} className={`py-3 text-center border-r border-border ${isToday(date) ? "bg-primary/10" : ""} ${isHolidayDate ? "bg-red-500/10" : ""} ${isClosureDate && !isHolidayDate ? "bg-violet-500/10" : ""}`}>
                      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        {DAYS[date.getDay()]}
                        {isHolidayDate && <PartyPopper className="h-3 w-3 text-red-500" />}
                        {isClosureDate && !isHolidayDate && <Building2 className="h-3 w-3 text-violet-500" />}
                      </div>
                      <div className={`text-lg font-semibold ${isToday(date) ? "text-primary" : isHolidayDate ? "text-red-500" : "text-foreground"}`}>{date.getDate()}</div>
                      {/* Afficher les vacances */}
                      {dateVacations.length > 0 && (
                        <div className="mt-1 space-y-1 px-1">
                          {dateVacations.slice(0, 2).map((vac) => (
                            <div key={vac.id} className="text-xs px-1 py-0.5 rounded truncate flex items-center gap-0.5 justify-center" style={{ backgroundColor: vac.color, color: "white" }}>
                              {vac.type === "vacation" && <User className="h-2.5 w-2.5" />}
                              {vac.type === "birthday" && <Cake className="h-2.5 w-2.5" />}
                              <span className="truncate">{vac.type === "vacation" ? vac.employeeName?.split(" ")[0] : vac.type === "birthday" ? vac.employeeName?.split(" ")[0] : vac.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Afficher les événements all-day */}
                      {getAllDayEvents(date).length > 0 && (
                        <div className="mt-1 space-y-1 px-1">
                          {getAllDayEvents(date).slice(0, 2 - Math.min(dateVacations.length, 2)).map((event) => (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="text-xs px-1 py-0.5 rounded truncate cursor-pointer" style={{ backgroundColor: event.color || "#6366f1", color: "white" }}>{event.title}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {HOURS.slice(6, 22).map((hour) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-border min-h-[60px]">
                    <div className="py-2 px-2 text-xs text-muted-foreground border-r border-border text-right">{hour.toString().padStart(2, "0")}:00</div>
                    {getWeekDays().map((date, i) => {
                      const hourEvents = getEventsForHour(date, hour);
                      return (
                        <div key={i} className={`border-r border-border p-1 cursor-pointer hover:bg-muted/50 ${isToday(date) ? "bg-primary/5" : ""}`} onClick={() => handleHourClick(date, hour)}>
                          {hourEvents.map((event) => (
                            <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className="text-xs px-2 py-1 rounded mb-1 cursor-pointer hover:opacity-80" style={{ backgroundColor: `${event.color || "#6366f1"}20`, color: event.color || "#6366f1", borderLeft: `3px solid ${event.color || "#6366f1"}` }}>
                              <span className="font-medium">{formatTime(event.startDate)}</span> {event.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : view === "day" ? (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="border-b border-border p-4">
                <div className={`text-center ${isToday(currentDate) ? "text-primary" : "text-foreground"}`}>
                  <div className="text-sm text-muted-foreground">{DAYS_FULL[currentDate.getDay()]}</div>
                  <div className="text-3xl font-bold">{currentDate.getDate()}</div>
                  <div className="text-sm text-muted-foreground">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
                </div>
                {getAllDayEvents(currentDate).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Journée entière</div>
                    {getAllDayEvents(currentDate).map((event) => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className="px-3 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: event.color || "#6366f1", color: "white" }}>{event.title}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {HOURS.map((hour) => {
                  const hourEvents = getEventsForHour(currentDate, hour);
                  return (
                    <div key={hour} className="flex border-b border-border min-h-[60px] cursor-pointer hover:bg-muted/50" onClick={() => handleHourClick(currentDate, hour)}>
                      <div className="w-20 py-2 px-3 text-sm text-muted-foreground border-r border-border text-right flex-shrink-0">{hour.toString().padStart(2, "0")}:00</div>
                      <div className="flex-1 p-2">
                        {hourEvents.map((event) => (
                          <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className="px-3 py-2 rounded-lg mb-1 cursor-pointer hover:opacity-80" style={{ backgroundColor: `${event.color || "#6366f1"}20`, color: event.color || "#6366f1", borderLeft: `4px solid ${event.color || "#6366f1"}` }}>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs opacity-80">{formatTime(event.startDate)}{event.endDate && ` - ${formatTime(event.endDate)}`}</div>
                            {event.location && <div className="text-xs opacity-80 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{event.location}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Section Vacances, Fériés et Fermetures */}
              {showVacations && vacationEvents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Palmtree className="h-4 w-4" />
                    Vacances, Fériés et Fermetures
                  </h3>
                  <div className="space-y-2">
                    {vacationEvents.map((vac) => (
                      <div key={vac.id} className="glass-card rounded-xl p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-1 h-full min-h-[50px] rounded-full" style={{ backgroundColor: vac.color }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: `${vac.color}20`, color: vac.color }}>
                                {vac.type === "vacation" && <><User className="h-3 w-3" />Vacances</>}
                                {vac.type === "holiday" && <><PartyPopper className="h-3 w-3" />Férié</>}
                                {vac.type === "closure" && <><Building2 className="h-3 w-3" />Fermeture</>}
                                {vac.type === "birthday" && <><Cake className="h-3 w-3" />Anniversaire</>}
                              </span>
                            </div>
                            <h3 className="font-medium text-foreground">{vac.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDate(vac.startDate)}
                                {vac.endDate && vac.endDate !== vac.startDate && ` - ${formatDate(vac.endDate)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Section Événements */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Événements
                </h3>
                {events.length === 0 ? (
                  <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">Aucun événement ce mois-ci</div>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-1 h-full min-h-[60px] rounded-full" style={{ backgroundColor: event.color || "#6366f1" }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${event.color || "#6366f1"}20`, color: event.color || "#6366f1" }}>{EVENT_TYPES.find((t) => t.id === event.type)?.name || event.type}</span>
                              {event.reminder && <Bell className="h-3 w-3 text-amber-500" />}
                            </div>
                            <h3 className="font-medium text-foreground">{event.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{formatDate(event.startDate)}</span>
                              {!event.allDay && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatTime(event.startDate)}{event.endDate && ` - ${formatTime(event.endDate)}`}</span>}
                              {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Nouvel événement</h2>
              <button onClick={() => setShowAddEvent(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Titre *</label>
                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" placeholder="Titre de l'événement" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                <select value={newEvent.type} onChange={(e) => { const type = EVENT_TYPES.find((t) => t.id === e.target.value); setNewEvent({ ...newEvent, type: e.target.value, color: type?.color || "#6366f1" }); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground">
                  {EVENT_TYPES.map((type) => (<option key={type.id} value={type.id}>{type.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allDay" checked={newEvent.allDay} onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })} className="rounded border-border" />
                <label htmlFor="allDay" className="text-sm text-foreground">Journée entière</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date de début *</label>
                  <input type="date" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </div>
                {!newEvent.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Heure de début</label>
                    <input type="time" value={newEvent.startTime} onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Date de fin</label>
                  <input type="date" value={newEvent.endDate} onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                </div>
                {!newEvent.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Heure de fin</label>
                    <input type="time" value={newEvent.endTime} onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Lieu</label>
                <input type="text" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground" placeholder="Adresse ou lien visio" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground resize-none" rows={3} placeholder="Description de l'événement" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="reminder" checked={newEvent.reminder} onChange={(e) => setNewEvent({ ...newEvent, reminder: e.target.checked })} className="rounded border-border" />
                  <label htmlFor="reminder" className="text-sm text-foreground">Rappel</label>
                </div>
                {newEvent.reminder && (
                  <select value={newEvent.reminderTime} onChange={(e) => setNewEvent({ ...newEvent, reminderTime: parseInt(e.target.value) })} className="rounded-lg border border-border bg-background px-3 py-1 text-sm text-foreground">
                    <option value={15}>15 min avant</option>
                    <option value={30}>30 min avant</option>
                    <option value={60}>1h avant</option>
                    <option value={1440}>1 jour avant</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Annuler</button>
              <button onClick={handleAddEvent} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Créer</button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${selectedEvent.color || "#6366f1"}20`, color: selectedEvent.color || "#6366f1" }}>{EVENT_TYPES.find((t) => t.id === selectedEvent.type)?.name || selectedEvent.type}</span>
              <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-4">{selectedEvent.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted-foreground"><CalendarIcon className="h-4 w-4" /><span>{formatDate(selectedEvent.startDate)}</span></div>
              {!selectedEvent.allDay && <div className="flex items-center gap-3 text-muted-foreground"><Clock className="h-4 w-4" /><span>{formatTime(selectedEvent.startDate)}{selectedEvent.endDate && ` - ${formatTime(selectedEvent.endDate)}`}</span></div>}
              {selectedEvent.location && <div className="flex items-center gap-3 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{selectedEvent.location}</span></div>}
              {selectedEvent.description && <p className="text-foreground mt-4 pt-4 border-t border-border">{selectedEvent.description}</p>}
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <button onClick={() => handleDeleteEvent(selectedEvent.id)} className="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg">Supprimer</button>
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
