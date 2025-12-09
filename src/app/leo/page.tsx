"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  FolderOpen,
  Users,
  Briefcase,
  ListTodo,
  TrendingUp,
  Megaphone,
  RefreshCw,
  Zap,
  Brain,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Stats {
  totalProjects: number;
  totalContacts: number;
  totalEmployees: number;
  totalTasks: number;
  totalOpportunities: number;
  totalCommunicationClients: number;
}

const QUICK_ACTIONS = [
  { label: "Résumé des projets", prompt: "Donne-moi un résumé des projets en cours", icon: FolderOpen },
  { label: "Équipe Nukleo", prompt: "Qui sont les membres de l'équipe Nukleo ?", icon: Users },
  { label: "Opportunités", prompt: "Quelles sont les opportunités commerciales actuelles ?", icon: Briefcase },
  { label: "Tâches urgentes", prompt: "Quelles sont les tâches prioritaires ?", icon: ListTodo },
  { label: "Statistiques", prompt: "Donne-moi les statistiques générales de Nukleo", icon: TrendingUp },
  { label: "Clients communication", prompt: "Liste les clients du hub communication", icon: Megaphone },
];

export default function LeoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/leo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.context) {
        setStats(data.context);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setStats(null);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Bullet points
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return `<li key="${i}" class="ml-4">${line.substring(2)}</li>`;
        }
        return `<p key="${i}" class="mb-1">${line}</p>`;
      })
      .join("");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Leo
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-normal">
                    IA Assistant
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  Votre assistant intelligent avec accès à toutes les données Nukleo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {stats && (
                <div className="hidden lg:flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FolderOpen className="h-4 w-4 text-blue-400" />
                    <span>{stats.totalProjects}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="h-4 w-4 text-green-400" />
                    <span>{stats.totalContacts}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="h-4 w-4 text-amber-400" />
                    <span>{stats.totalOpportunities}</span>
                  </div>
                </div>
              )}
              <button
                onClick={clearConversation}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Nouvelle conversation
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="max-w-2xl w-full text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-500/30">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Bonjour, je suis Leo 👋
                    </h2>
                    <p className="text-slate-400 mb-8">
                      Votre assistant IA avec accès à tous les projets, contacts, équipes et données de Nukleo.
                      <br />
                      Posez-moi n'importe quelle question !
                    </p>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => sendMessage(action.prompt)}
                          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-violet-500/50 transition-all text-left group"
                        >
                          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                            <action.icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            {action.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                          message.role === "user"
                            ? "bg-violet-600 text-white"
                            : "bg-slate-800 text-slate-200"
                        }`}
                      >
                        <div
                          className="prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />
                        <p className="text-xs opacity-50 mt-2">
                          {message.timestamp.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-slate-800 rounded-2xl px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Leo réfléchit...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-slate-900/50 border-t border-slate-800">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Posez une question à Leo..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-slate-500 bg-slate-700 rounded">
                        Entrée
                      </kbd>
                    </div>
                  </div>
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="p-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Leo a accès à tous les projets, contacts, employés, tâches et opportunités de Nukleo
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar with Quick Info */}
          <div className="hidden xl:block w-80 border-l border-slate-800 bg-slate-900/50 p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Suggestions
            </h3>
            <div className="space-y-2">
              {[
                "Qui travaille sur le projet X ?",
                "Quels sont les contacts à Montréal ?",
                "Résumé des opportunités en cours",
                "Tâches assignées à l'équipe Lab",
                "Budget total des projets actifs",
                "Clients communication actifs",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(suggestion)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-left text-sm text-slate-400 hover:text-white transition-colors group"
                >
                  <MessageSquare className="h-4 w-4 text-violet-400 flex-shrink-0" />
                  <span className="flex-1 truncate">{suggestion}</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Capacités
              </h3>
              <div className="space-y-3">
                {[
                  { icon: FolderOpen, label: "Recherche de projets", color: "text-blue-400" },
                  { icon: Users, label: "Gestion des contacts", color: "text-green-400" },
                  { icon: Briefcase, label: "Suivi des opportunités", color: "text-amber-400" },
                  { icon: ListTodo, label: "Analyse des tâches", color: "text-pink-400" },
                  { icon: Zap, label: "Recommandations", color: "text-violet-400" },
                ].map((cap, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                    <cap.icon className={`h-4 w-4 ${cap.color}`} />
                    <span>{cap.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
