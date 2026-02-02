import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Github, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeveloperProject {
  id: string;
  category_id: string;
  business_name: string;
  lovable_link: string | null;
  github_link: string | null;
  email_used: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["For Demo", "Approved", "Completed", "Rejected"];

const DeveloperProjectsTable = () => {
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DeveloperProject>>({});

  // New project form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject] = useState({
    business_name: "",
    lovable_link: "",
    github_link: "",
    email_used: "",
    status: "For Demo",
    notes: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchProjects();
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("contact_categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
      if (data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("developer_projects")
      .select("*")
      .eq("category_id", selectedCategoryId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name) return;

    const { data, error } = await supabase
      .from("contact_categories")
      .insert([{ name }])
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
      setSelectedCategoryId(data.id);
      toast.success("Category added");
    } else {
      toast.error("Failed to add category");
    }
  };

  const handleAddProject = async () => {
    if (!newProject.business_name || !selectedCategoryId) {
      toast.error("Business name is required");
      return;
    }

    const { data, error } = await supabase
      .from("developer_projects")
      .insert([{
        category_id: selectedCategoryId,
        business_name: newProject.business_name,
        lovable_link: newProject.lovable_link || null,
        github_link: newProject.github_link || null,
        email_used: newProject.email_used || null,
        status: newProject.status,
        notes: newProject.notes || null,
      }])
      .select()
      .single();

    if (!error && data) {
      setProjects([data, ...projects]);
      setNewProject({
        business_name: "",
        lovable_link: "",
        github_link: "",
        email_used: "",
        status: "For Demo",
        notes: "",
      });
      setShowNewForm(false);
      toast.success("Project added");
    } else {
      toast.error("Failed to add project");
    }
  };

  const handleEdit = (project: DeveloperProject) => {
    setEditingId(project.id);
    setEditData(project);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("developer_projects")
      .update({
        business_name: editData.business_name,
        lovable_link: editData.lovable_link || null,
        github_link: editData.github_link || null,
        email_used: editData.email_used || null,
        status: editData.status,
        notes: editData.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    if (!error) {
      setProjects(projects.map(p => p.id === editingId ? { ...p, ...editData } : p));
      setEditingId(null);
      setEditData({});
      toast.success("Project updated");
    } else {
      toast.error("Failed to update project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;

    const { error } = await supabase
      .from("developer_projects")
      .delete()
      .eq("id", id);

    if (!error) {
      setProjects(projects.filter(p => p.id !== id));
      toast.success("Project deleted");
    } else {
      toast.error("Failed to delete project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "For Demo": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Approved": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Rejected": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredByStatus = (status: string) => projects.filter(p => p.status === status);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Developer Projects</span>
          <div className="flex items-center gap-2">
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleAddCategory}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
            <TabsTrigger value="For Demo">For Demo ({filteredByStatus("For Demo").length})</TabsTrigger>
            <TabsTrigger value="Approved">Approved ({filteredByStatus("Approved").length})</TabsTrigger>
            <TabsTrigger value="Completed">Completed ({filteredByStatus("Completed").length})</TabsTrigger>
            <TabsTrigger value="Rejected">Rejected ({filteredByStatus("Rejected").length})</TabsTrigger>
          </TabsList>

          {["all", ...STATUS_OPTIONS].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {/* Add New Project Button */}
                {!showNewForm && (
                  <Button onClick={() => setShowNewForm(true)} className="mb-4">
                    <Plus className="w-4 h-4 mr-2" /> Add Project
                  </Button>
                )}

                {/* New Project Form */}
                {showNewForm && (
                  <Card className="bg-muted/30 mb-4">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Business Name *"
                          value={newProject.business_name}
                          onChange={(e) => setNewProject({ ...newProject, business_name: e.target.value })}
                        />
                        <Input
                          placeholder="Lovable Link"
                          value={newProject.lovable_link}
                          onChange={(e) => setNewProject({ ...newProject, lovable_link: e.target.value })}
                        />
                        <Input
                          placeholder="GitHub Link"
                          value={newProject.github_link}
                          onChange={(e) => setNewProject({ ...newProject, github_link: e.target.value })}
                        />
                        <Input
                          placeholder="Email Used"
                          value={newProject.email_used}
                          onChange={(e) => setNewProject({ ...newProject, email_used: e.target.value })}
                        />
                        <Select
                          value={newProject.status}
                          onValueChange={(v) => setNewProject({ ...newProject, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Notes"
                          value={newProject.notes}
                          onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleAddProject}>Save Project</Button>
                        <Button variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Projects Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Lovable Link</TableHead>
                        <TableHead>GitHub</TableHead>
                        <TableHead>Email Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tabValue === "all" ? projects : filteredByStatus(tabValue)).map(project => (
                        <TableRow key={project.id}>
                          {editingId === project.id ? (
                            <>
                              <TableCell>
                                <Input
                                  value={editData.business_name || ""}
                                  onChange={(e) => setEditData({ ...editData, business_name: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.lovable_link || ""}
                                  onChange={(e) => setEditData({ ...editData, lovable_link: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.github_link || ""}
                                  onChange={(e) => setEditData({ ...editData, github_link: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.email_used || ""}
                                  onChange={(e) => setEditData({ ...editData, email_used: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editData.status}
                                  onValueChange={(v) => setEditData({ ...editData, status: v })}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData.notes || ""}
                                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                                    <Save className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                    <X className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-medium">{project.business_name}</TableCell>
                              <TableCell>
                                {project.lovable_link && (
                                  <a
                                    href={project.lovable_link.startsWith("http") ? project.lovable_link : `https://${project.lovable_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Link
                                  </a>
                                )}
                              </TableCell>
                              <TableCell>
                                {project.github_link && (
                                  <a
                                    href={project.github_link.startsWith("http") ? project.github_link : `https://${project.github_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                  >
                                    <Github className="w-4 h-4" />
                                  </a>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{project.email_used}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                                {project.notes}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => handleEdit(project)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDelete(project.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                      {(tabValue === "all" ? projects : filteredByStatus(tabValue)).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No projects yet. Add your first project above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DeveloperProjectsTable;