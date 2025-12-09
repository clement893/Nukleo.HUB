"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Plus,
  X,
  Loader2,
  FolderOpen,
  Globe,
  Figma,
  Github,
} from "lucide-react";
import Link from "next/link";

interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  url: string | null;
  fileKey: string | null;
  mimeType: string | null;
  size: number | null;
  description: string | null;
  category: string | null;
  uploadedBy: string | null;
  createdAt: string;
  taskDocuments?: { taskId: string }[];
}

interface Project {
  id: string;
  name: string;
  client: string | null;
}

const CATEGORIES = [
  { id: "all", name: "Tous", icon: FolderOpen },
  { id: "design", name: "Design", icon: Figma },
  { id: "dev", name: "Développement", icon: Code },
  { id: "docs", name: "Documentation", icon: FileText },
  { id: "contracts", name: "Contrats", icon: File },
  { id: "assets", name: "Assets", icon: Image },
  { id: "general", name: "Général", icon: Folder },
];

const LINK_TYPES = [
  { id: "link", name: "Lien web", icon: Globe },
  { id: "drive", name: "Google Drive", icon: Folder },
  { id: "figma", name: "Figma", icon: Figma },
  { id: "github", name: "GitHub", icon: Github },
  { id: "notion", name: "Notion", icon: FileText },
];

function getFileIcon(mimeType: string | null, type: string) {
  if (type === "figma") return Figma;
  if (type === "github") return Github;
  if (type === "drive") return Folder;
  if (type === "notion") return FileText;
  if (type === "link") return Globe;
  
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return Archive;
  if (mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json")) return Code;
  return File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    type: "link",
    category: "general",
    description: "",
  });

  useEffect(() => {
    fetchProject();
    fetchDocuments();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("category", selectedCategory === "all" ? "general" : selectedCategory);

      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const newDoc = await res.json();
          setDocuments((prev) => [newDoc, ...prev]);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!newLink.name || !newLink.url) return;

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLink,
          projectId,
        }),
      });

      if (res.ok) {
        const doc = await res.json();
        setDocuments((prev) => [doc, ...prev]);
        setShowAddLinkModal(false);
        setNewLink({ name: "", url: "", type: "link", category: "general", description: "" });
      }
    } catch (error) {
      console.error("Error adding link:", error);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) return;

    try {
      const res = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                  <Link href="/projects" className="hover:text-white">Projets</Link>
                  <span>/</span>
                  <span>{project?.name || "..."}</span>
                </div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-violet-400" />
                  Hub Documents
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddLinkModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                Ajouter un lien
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Uploader
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FolderOpen className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Aucun document</p>
              <p className="text-sm">Uploadez des fichiers ou ajoutez des liens pour commencer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocuments.map((doc) => {
                const IconComponent = getFileIcon(doc.mimeType, doc.type);
                return (
                  <div
                    key={doc.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-violet-500/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <IconComponent className="h-6 w-6 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {doc.type === "file" ? formatFileSize(doc.size) : doc.type}
                          {doc.category && ` • ${doc.category}`}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {doc.description}
                          </p>
                        )}
                        {doc.taskDocuments && doc.taskDocuments.length > 0 && (
                          <p className="text-xs text-violet-400 mt-1">
                            Attaché à {doc.taskDocuments.length} tâche(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                      <span className="text-xs text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {showAddLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Ajouter un lien</h2>
              <button
                onClick={() => setShowAddLinkModal(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nom</label>
                <input
                  type="text"
                  value={newLink.name}
                  onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                  placeholder="Nom du document"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {LINK_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewLink({ ...newLink, type: type.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        newLink.type === type.id
                          ? "bg-violet-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <type.icon className="h-4 w-4" />
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Catégorie</label>
                <select
                  value={newLink.category}
                  onChange={(e) => setNewLink({ ...newLink, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Description (optionnel)</label>
                <textarea
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="Description du document..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddLinkModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddLink}
                disabled={!newLink.name || !newLink.url}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
