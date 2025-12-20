import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Search, Briefcase, User, Calendar, FileText, DollarSign } from "lucide-react";

const AdminProjects = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/admin/projects`);
      const data = await res.json();
      if (data?.data?.projects) {
        setProjects(data.data.projects);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: "bg-gray-500",
      OPEN: "bg-blue-500",
      IN_PROGRESS: "bg-yellow-500",
      COMPLETED: "bg-green-500"
    };
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
        {status?.replace("_", " ")}
      </Badge>
    );
  };

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.owner?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label="Projects" />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground mt-2">Manage all projects on the platform.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-muted-foreground">Loading projects...</div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg cursor-pointer group"
                  onClick={() => navigate(`/admin/projects/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">{project.title}</CardTitle>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Client Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-500" />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground mr-1">Client:</span>
                        <span className="font-medium text-foreground">{project.owner?.fullName || "N/A"}</span>
                        {project.owner?.email && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            ({project.owner.email})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Freelancer Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className={`h-4 w-4 ${
                        project.freelancer ? 'text-emerald-500' : 
                        (project.status === 'OPEN' || project.status === 'IN_PROGRESS') ? 'text-yellow-500' : 
                        'text-muted-foreground'
                      }`} />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground mr-1">Freelancer:</span>
                        {project.freelancer ? (
                          <>
                            <span className="font-medium text-foreground">{project.freelancer.fullName}</span>
                            {project.freelancer.email && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({project.freelancer.email})
                              </span>
                            )}
                          </>
                        ) : (
                          (project.status === 'OPEN' && (project._count?.proposals || 0) > 0) ? (
                            <span className="text-yellow-500 font-medium">Pending Proposals</span>
                          ) : project.status === 'OPEN' ? (
                            <span className="text-yellow-500 font-medium">Pending</span>
                          ) : (
                            <span className="text-muted-foreground italic">No proposals</span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-500 mb-1" />
                        <span className="text-xs text-muted-foreground">Budget</span>
                        <span className="font-semibold text-sm">{formatCurrency(project.budget)}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
                        <FileText className="h-4 w-4 text-blue-500 mb-1" />
                        <span className="text-xs text-muted-foreground">Proposals</span>
                        <span className="font-semibold text-sm">{project._count?.proposals || 0}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-orange-500 mb-1" />
                        <span className="text-xs text-muted-foreground">Created</span>
                        <span className="font-semibold text-sm">{formatDate(project.createdAt).split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProjects;
