"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Building2,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Camera,
  ExternalLink,
  User,
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  role?: string;
  department: string;
  capacityHoursPerWeek?: number;
  avatar?: string;
  status?: string;
  currentTaskId?: string;
  currentTask?: {
    id: string;
    title: string;
  };
  createdAt: string;
}

const DEPARTMENTS = [
  { value: "Lab", label: "Lab", color: "bg-purple-500/10 text-purple-500 border-purple-500/30" },
  { value: "Bureau", label: "Bureau", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  { value: "Studio", label: "Studio", color: "bg-green-500/10 text-green-500 border-green-500/30" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [_uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "Lab",
    capacityHoursPerWeek: 35,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      let employeeId: string;
      let savedEmployee: Employee;

      if (editingEmployee) {
        // Update existing employee
        const response = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          savedEmployee = await response.json();
          employeeId = editingEmployee.id;
        } else {
          throw new Error("Failed to update employee");
        }
      } else {
        // Create new employee
        const response = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          savedEmployee = await response.json();
          employeeId = savedEmployee.id;
        } else {
          throw new Error("Failed to create employee");
        }
      }

      // Upload photo if selected
      if (photoFile) {
        setUploadingPhoto(true);
        const photoFormData = new FormData();
        photoFormData.append("photo", photoFile);
        
        const photoResponse = await fetch(`/api/employees/${employeeId}/photo`, {
          method: "POST",
          body: photoFormData,
        });
        
        if (photoResponse.ok) {
          const { photoUrl } = await photoResponse.json();
          savedEmployee = { ...savedEmployee, photoUrl };
        }
        setUploadingPhoto(false);
      }

      // Update employees list
      if (editingEmployee) {
        setEmployees(employees.map(e => e.id === employeeId ? savedEmployee : e));
      } else {
        setEmployees([...employees, savedEmployee]);
      }

      resetForm();
    } catch (error) {
      console.error("Error saving employee:", error);
      setUploadingPhoto(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEmployees(employees.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
      department: employee.department,
      capacityHoursPerWeek: employee.capacityHoursPerWeek || 35,
    });
    setPhotoPreview(employee.photoUrl || null);
    setPhotoFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "Lab",
      capacityHoursPerWeek: 35,
    });
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (employee.role?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getDepartmentInfo = (dept: string) => {
    return DEPARTMENTS.find(d => d.value === dept) || DEPARTMENTS[0];
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const stats = {
    total: employees.length,
    lab: employees.filter(e => e.department === "Lab").length,
    bureau: employees.filter(e => e.department === "Bureau").length,
    studio: employees.filter(e => e.department === "Studio").length,
    available: employees.filter(e => !e.currentTaskId).length,
    busy: employees.filter(e => e.currentTaskId).length,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des employés</h1>
            <p className="text-muted-foreground mt-1">Gérez votre équipe et attribuez les départements</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un employé
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.lab}</p>
                <p className="text-xs text-muted-foreground">Lab</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.bureau}</p>
                <p className="text-xs text-muted-foreground">Bureau</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Building2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.studio}</p>
                <p className="text-xs text-muted-foreground">Studio</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <UserX className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.busy}</p>
                <p className="text-xs text-muted-foreground">Occupés</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">Tous les départements</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept.value} value={dept.value}>{dept.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Employees Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun employé trouvé</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary hover:underline"
            >
              Ajouter le premier employé
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => {
              const deptInfo = getDepartmentInfo(employee.department);
              const isAvailable = !employee.currentTaskId;

              return (
                <div
                  key={employee.id}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {employee.photoUrl ? (
                          <img 
                            src={employee.photoUrl} 
                            alt={employee.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-semibold">
                            {getInitials(employee.name)}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                          isAvailable ? 'bg-green-500' : 'bg-orange-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{employee.name}</h3>
                        {employee.role && (
                          <p className="text-sm text-muted-foreground">{employee.role}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/teams/employees/${employee.id}`}
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-colors"
                        title="Voir le profil"
                      >
                        <User className="w-4 h-4 text-blue-500" />
                      </Link>
                      <a
                        href={`/employee-portal/${employee.id}`}
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await fetch(`/api/employees/${employee.id}/portal`);
                            if (res.ok) {
                              const data = await res.json();
                              window.open(data.url, '_blank');
                            } else {
                              const createRes = await fetch(`/api/employees/${employee.id}/portal`, { method: 'POST' });
                              if (createRes.ok) {
                                const data = await createRes.json();
                                window.open(data.url, '_blank');
                              }
                            }
                          } catch (error) {
                            console.error('Error opening portal:', error);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-purple-500/10 transition-colors"
                        title="Ouvrir le portail"
                      >
                        <ExternalLink className="w-4 h-4 text-purple-500" />
                      </a>
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${deptInfo.color}`}>
                        {deptInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {employee.capacityHoursPerWeek || 35}h/sem
                      </span>
                    </div>
                    <span className={`text-xs ${isAvailable ? 'text-green-500' : 'text-orange-500'}`}>
                      {isAvailable ? 'Disponible' : 'Occupé'}
                    </span>
                  </div>

                  {employee.currentTask && (
                    <div className="mt-3 p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <p className="text-xs text-muted-foreground">Tâche en cours :</p>
                      <p className="text-sm text-foreground truncate">{employee.currentTask.title}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editingEmployee ? "Modifier l'employé" : "Nouvel employé"}
              </h2>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Photo Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">Cliquez pour ajouter une photo</p>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Prénom Nom"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Poste / Rôle</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Designer, Développeur, Chef de projet..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Capacité (heures/semaine)</label>
                <input
                  type="number"
                  value={formData.capacityHoursPerWeek}
                  onChange={(e) => setFormData({ ...formData, capacityHoursPerWeek: parseInt(e.target.value) || 35 })}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Département *</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept.value}
                      onClick={() => setFormData({ ...formData, department: dept.value })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.department === dept.value
                          ? dept.color + " border-2"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{dept.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {editingEmployee ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
