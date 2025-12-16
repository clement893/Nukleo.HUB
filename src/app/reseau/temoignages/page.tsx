"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Quote,
  Star,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  Clock,
  Send,
  Globe,
  X,
  Building2,
  User,
  StarOff,
} from "lucide-react";

interface Testimonial {
  id: string;
  clientName: string;
  contactName?: string;
  companyName?: string;
  status: string;
  textFr?: string;
  textEn?: string;
  titleFr?: string;
  titleEn?: string;
  rating: number;
  featured: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  online: { label: "En ligne", color: "bg-green-500", icon: Globe },
  received: { label: "Reçu", color: "bg-blue-500", icon: CheckCircle },
  requested: { label: "Demandé", color: "bg-yellow-500", icon: Send },
  pending: { label: "En attente", color: "bg-gray-500", icon: Clock },
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [language, setLanguage] = useState<"fr" | "en">("fr");

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    contactName: "",
    companyName: "",
    status: "received",
    textFr: "",
    textEn: "",
    titleFr: "",
    titleEn: "",
    rating: 5,
    featured: false,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/testimonials");
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = async () => {
    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTestimonials();
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error adding testimonial:", error);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Supprimer ce témoignage ?")) return;

    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTestimonials();
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
    }
  };

  const handleToggleFeatured = async (testimonial: Testimonial) => {
    try {
      const response = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !testimonial.featured }),
      });

      if (response.ok) {
        fetchTestimonials();
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTestimonials();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      contactName: "",
      companyName: "",
      status: "received",
      textFr: "",
      textEn: "",
      titleFr: "",
      titleEn: "",
      rating: 5,
      featured: false,
    });
  };

  const filteredTestimonials = testimonials.filter((t) => {
    const matchesSearch =
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contactName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: testimonials.length,
    online: testimonials.filter((t) => t.status === "online").length,
    received: testimonials.filter((t) => t.status === "received").length,
    requested: testimonials.filter((t) => t.status === "requested").length,
    featured: testimonials.filter((t) => t.featured).length,
  };

  const getText = (t: Testimonial) => language === "fr" ? t.textFr : t.textEn;
  const getTitle = (t: Testimonial) => language === "fr" ? t.titleFr : t.titleEn;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Témoignages</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les témoignages clients et leur publication
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter un témoignage
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Quote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Globe className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.online}</p>
                <p className="text-sm text-muted-foreground">En ligne</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.received}</p>
                <p className="text-sm text-muted-foreground">Reçus</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Send className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.requested}</p>
                <p className="text-sm text-muted-foreground">Demandés</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Star className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.featured}</p>
                <p className="text-sm text-muted-foreground">Mis en avant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un témoignage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Tous les statuts</option>
            <option value="online">En ligne</option>
            <option value="received">Reçu</option>
            <option value="requested">Demandé</option>
            <option value="pending">En attente</option>
          </select>

          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setLanguage("fr")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === "fr"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                language === "en"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-12">
            <Quote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun témoignage trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => {
              const statusConfig = STATUS_CONFIG[testimonial.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const text = getText(testimonial);
              const title = getTitle(testimonial);

              return (
                <div
                  key={testimonial.id}
                  className={`relative p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer group ${
                    testimonial.featured ? "ring-2 ring-secondary/50" : ""
                  }`}
                  onClick={() => {
                    setSelectedTestimonial(testimonial);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Featured badge */}
                  {testimonial.featured && (
                    <div className="absolute -top-2 -right-2 p-1.5 bg-secondary rounded-full">
                      <Star className="w-4 h-4 text-white fill-white" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {testimonial.clientName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{testimonial.clientName}</h3>
                        {testimonial.companyName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {testimonial.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="mb-4">
                    <Quote className="w-6 h-6 text-primary/30 mb-2" />
                    {text ? (
                      <p className="text-foreground line-clamp-4 text-sm leading-relaxed">
                        {text}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic text-sm">
                        {language === "fr" ? "Pas de texte en français" : "No English text"}
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    {title && (
                      <p className="text-xs text-muted-foreground">{title}</p>
                    )}
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < testimonial.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(testimonial);
                      }}
                      className="p-1.5 bg-muted rounded-lg hover:bg-muted-foreground/20 transition-colors"
                      title={testimonial.featured ? "Retirer de la mise en avant" : "Mettre en avant"}
                    >
                      {testimonial.featured ? (
                        <StarOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Star className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTestimonial(testimonial.id);
                      }}
                      className="p-1.5 bg-muted rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Nouveau témoignage</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Client *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nom du client"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Contact</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nom du contact"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Entreprise</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="received">Reçu</option>
                    <option value="requested">Demandé</option>
                    <option value="online">En ligne</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Titre FR</label>
                <input
                  type="text"
                  value={formData.titleFr}
                  onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Directeur Marketing"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Témoignage FR</label>
                <textarea
                  value={formData.textFr}
                  onChange={(e) => setFormData({ ...formData, textFr: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={4}
                  placeholder="Texte du témoignage en français..."
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Titre EN</label>
                <input
                  type="text"
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Marketing Director"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Témoignage EN</label>
                <textarea
                  value={formData.textEn}
                  onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={4}
                  placeholder="Testimonial text in English..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Note</label>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating <= formData.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="featured" className="text-sm text-foreground">
                    Mettre en avant
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTestimonial}
                  disabled={!formData.clientName}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTestimonial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Détails du témoignage</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTestimonial(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary">
                    {selectedTestimonial.clientName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedTestimonial.clientName}</h2>
                  {selectedTestimonial.contactName && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedTestimonial.contactName}
                    </p>
                  )}
                  {selectedTestimonial.companyName && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {selectedTestimonial.companyName}
                    </p>
                  )}
                </div>
              </div>

              {/* Status and rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Statut:</span>
                  <select
                    value={selectedTestimonial.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedTestimonial.id, e.target.value);
                      setSelectedTestimonial({ ...selectedTestimonial, status: e.target.value });
                    }}
                    className="px-3 py-1.5 bg-muted border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="online">En ligne</option>
                    <option value="received">Reçu</option>
                    <option value="requested">Demandé</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < selectedTestimonial.rating
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* French text */}
              {selectedTestimonial.textFr && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    🇫🇷 Témoignage FR
                    {selectedTestimonial.titleFr && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{selectedTestimonial.titleFr}</span>
                    )}
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Quote className="w-5 h-5 text-primary/30 mb-2" />
                    <p className="text-foreground whitespace-pre-wrap">{selectedTestimonial.textFr}</p>
                  </div>
                </div>
              )}

              {/* English text */}
              {selectedTestimonial.textEn && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    🇬🇧 Testimonial EN
                    {selectedTestimonial.titleEn && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{selectedTestimonial.titleEn}</span>
                    )}
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Quote className="w-5 h-5 text-primary/30 mb-2" />
                    <p className="text-foreground whitespace-pre-wrap">{selectedTestimonial.textEn}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
