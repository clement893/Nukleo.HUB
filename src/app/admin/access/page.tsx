"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Shield,
  Brain,
  Building2,
  FolderKanban,
  Save,
  Check,
  X,
  Search,
  Users,
  DollarSign,
  Contact,
  TrendingUp,
  FileText,
  Lock,
  Unlock,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  department: string;
  photoUrl: string | null;
  access: EmployeeAccess | null;
  leoContext: LeoContext | null;
}

interface EmployeeAccess {
  id: string;
  accessType: string;
  clientAccess: string | null;
  projectAccess: string | null;
}

interface LeoContext {
  id: string;
  canAccessTasks: boolean;
  canAccessProjects: boolean;
  canAccessClients: boolean;
  canAccessContacts: boolean;
  canAccessFinancials: boolean;
  canAccessTeam: boolean;
  canAccessOpportunities: boolean;
  customInstructions: string | null;
  restrictedTopics: string | null;
}

interface Company {
  id: string;
  name: string;
  isClient: boolean;
}

interface Project {
  id: string;
  name: string;
  client: string | null;
}

export default function AdminAccessPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // État local pour l'édition
  const [accessType, setAccessType] = useState("all");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [leoConfig, setLeoConfig] = useState({
    canAccessTasks: true,
    canAccessProjects: true,
    canAccessClients: false,
    canAccessContacts: false,
    canAccessFinancials: false,
    canAccessTeam: false,
    canAccessOpportunities: false,
    customInstructions: "",
    restrictedTopics: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, compRes, projRes] = await Promise.all([
        fetch("/api/admin/employee-access"),
        fetch("/api/companies?isClient=true"),
        fetch("/api/projects"),
      ]);

      const empData = await empRes.json();
      const compData = await compRes.json();
      const projData = await projRes.json();

      setEmployees(empData);
      setCompanies(compData);
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSaved(false);

    // Charger les accès existants
    if (emp.access) {
      setAccessType(emp.access.accessType || "all");
      setSelectedClients(
        emp.access.clientAccess && emp.access.clientAccess !== "*"
          ? emp.access.clientAccess.split(",")
          : []
      );
      setSelectedProjects(
        emp.access.projectAccess && emp.access.projectAccess !== "*"
          ? emp.access.projectAccess.split(",")
          : []
      );
    } else {
      setAccessType("all");
      setSelectedClients([]);
      setSelectedProjects([]);
    }

    // Charger le contexte Leo existant
    if (emp.leoContext) {
      setLeoConfig({
        canAccessTasks: emp.leoContext.canAccessTasks,
        canAccessProjects: emp.leoContext.canAccessProjects,
        canAccessClients: emp.leoContext.canAccessClients,
        canAccessContacts: emp.leoContext.canAccessContacts,
        canAccessFinancials: emp.leoContext.canAccessFinancials,
        canAccessTeam: emp.leoContext.canAccessTeam,
        canAccessOpportunities: emp.leoContext.canAccessOpportunities,
        customInstructions: emp.leoContext.customInstructions || "",
        restrictedTopics: emp.leoContext.restrictedTopics || "",
      });
    } else {
      setLeoConfig({
        canAccessTasks: true,
        canAccessProjects: true,
        canAccessClients: false,
        canAccessContacts: false,
        canAccessFinancials: false,
        canAccessTeam: false,
        canAccessOpportunities: false,
        customInstructions: "",
        restrictedTopics: "",
      });
    }
  };

  const saveAccess = async () => {
    if (!selectedEmployee) return;

    setSaving(true);
    try {
      await fetch("/api/admin/employee-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          access: {
            accessType,
            clientAccess: accessType === "all" ? "*" : selectedClients.join(","),
            projectAccess: accessType === "all" ? "*" : selectedProjects.join(","),
          },
          leoContext: leoConfig,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // Rafraîchir les données
      fetchData();
    } catch (error) {
      console.error("Error saving access:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leoContextOptions = [
    { key: "canAccessTasks", label: "Tâches assignées", icon: FileText, description: "Accès aux tâches de l'employé" },
    { key: "canAccessProjects", label: "Projets", icon: FolderKanban, description: "Accès aux projets assignés" },
    { key: "canAccessClients", label: "Clients", icon: Building2, description: "Accès aux informations clients" },
    { key: "canAccessContacts", label: "Contacts", icon: Contact, description: "Accès au répertoire de contacts" },
    { key: "canAccessFinancials", label: "Finances", icon: DollarSign, description: "Accès aux factures et devis" },
    { key: "canAccessTeam", label: "Équipe", icon: Users, description: "Accès aux infos de l'équipe" },
    { key: "canAccessOpportunities", label: "Pipeline", icon: TrendingUp, description: "Accès aux opportunités commerciales" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des accès</h1>
              <p className="text-sm text-gray-500">
                Contrôlez les accès aux clients, projets et le contexte de Leo IA
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des employés */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="divide-y max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => selectEmployee(emp)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                    selectedEmployee?.id === emp.id ? "bg-blue-50" : ""
                  }`}
                >
                  {emp.photoUrl ? (
                    <Image
                      src={emp.photoUrl}
                      alt={emp.name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.department}</p>
                  </div>
                  <div className="flex gap-1">
                    {emp.access?.accessType === "selected" ? (
                      <Lock className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-500" />
                    )}
                    {emp.leoContext && (
                      <Brain className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration des accès */}
          {selectedEmployee ? (
            <div className="lg:col-span-2 space-y-6">
              {/* En-tête employé */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedEmployee.photoUrl ? (
                      <Image
                        src={selectedEmployee.photoUrl}
                        alt={selectedEmployee.name}
                        width={56}
                        height={56}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-7 h-7 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedEmployee.name}
                      </h2>
                      <p className="text-gray-500">{selectedEmployee.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={saveAccess}
                    disabled={saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      saved
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Enregistré
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Accès aux données */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Accès aux données
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        value="all"
                        checked={accessType === "all"}
                        onChange={() => setAccessType("all")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Accès complet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accessType"
                        value="selected"
                        checked={accessType === "selected"}
                        onChange={() => setAccessType("selected")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Accès restreint</span>
                    </label>
                  </div>

                  {accessType === "selected" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      {/* Clients */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <h4 className="font-medium text-gray-900">Clients autorisés</h4>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {companies.map((company) => (
                            <label
                              key={company.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedClients.includes(company.id)}
                                onChange={() => toggleClient(company.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm">{company.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Projets */}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <FolderKanban className="w-4 h-4 text-gray-500" />
                          <h4 className="font-medium text-gray-900">Projets autorisés</h4>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {projects.map((project) => (
                            <label
                              key={project.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedProjects.includes(project.id)}
                                onChange={() => toggleProject(project.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm truncate">{project.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contexte Leo IA */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contexte Leo IA
                  </h3>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Définissez quelles informations Leo peut utiliser pour répondre aux questions de cet employé.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {leoContextOptions.map((option) => (
                    <label
                      key={option.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        leoConfig[option.key as keyof typeof leoConfig]
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={leoConfig[option.key as keyof typeof leoConfig] as boolean}
                        onChange={(e) =>
                          setLeoConfig((prev) => ({
                            ...prev,
                            [option.key]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <option.icon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions personnalisées pour Leo
                    </label>
                    <textarea
                      value={leoConfig.customInstructions}
                      onChange={(e) =>
                        setLeoConfig((prev) => ({
                          ...prev,
                          customInstructions: e.target.value,
                        }))
                      }
                      placeholder="Ex: Réponds toujours en français. Sois concis. Focus sur les aspects techniques..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sujets restreints (séparés par virgule)
                    </label>
                    <input
                      type="text"
                      value={leoConfig.restrictedTopics}
                      onChange={(e) =>
                        setLeoConfig((prev) => ({
                          ...prev,
                          restrictedTopics: e.target.value,
                        }))
                      }
                      placeholder="Ex: salaires, contrats, informations RH"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center justify-center text-center">
              <Shield className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sélectionnez un employé
              </h3>
              <p className="text-gray-500">
                Choisissez un employé dans la liste pour configurer ses accès et le contexte Leo IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
