import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { 
  User, 
  Mail, 
  Calendar, 
  Briefcase, 
  DollarSign, 
  FileText, 
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  Wrench,
  Loader2,
  ExternalLink,
  Award
} from "lucide-react";

const UserDetailsDialog = ({ userId, open, onOpenChange }) => {
  const { authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/users/${userId}`);
      const result = await res.json();
      if (result?.data) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setError("Failed to load user details");
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

  // Parse bio JSON
  const parseBio = (bio) => {
    if (!bio) return null;
    try {
      const parsed = JSON.parse(bio);
      return typeof parsed === 'object' ? parsed : { bio };
    } catch {
      return { bio };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl min-h-[400px] p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive">{error}</div>
        ) : data ? (() => {
          const bioData = parseBio(data.user.bio);
          const isFreelancer = data.user.role === "FREELANCER";
          
          return (
            <div className="flex flex-col">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 border-b">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{data.user.fullName}</h3>
                      <Badge variant={data.user.role === "CLIENT" ? "default" : "secondary"}>
                        {data.user.role}
                      </Badge>
                      <Badge variant={data.user.status === "ACTIVE" ? "outline" : "destructive"}>
                        {data.user.status}
                      </Badge>
                    </div>
                    
                    {/* Headline */}
                    {bioData?.headline && (
                      <p className="text-sm text-muted-foreground mt-1">{bioData.headline}</p>
                    )}
                    
                    {/* Contact Info Row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {data.user.email}
                      </span>
                      {bioData?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {bioData.phone}
                        </span>
                      )}
                      {bioData?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {bioData.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {formatDate(data.user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-5 space-y-5">
                {/* Services Row */}
                {bioData?.services && bioData.services.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Services: </span>
                      <span className="text-sm text-muted-foreground">{bioData.services.join(", ")}</span>
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Statistics</h4>
                  <div className="grid grid-cols-3 gap-3 justify-items-center">
                    {data.user.role === "CLIENT" ? (
                      <>
                        <StatCard icon={Briefcase} label="Projects" value={data.stats.totalProjects} color="blue" />
                        <StatCard icon={Clock} label="Active" value={data.stats.activeProjects} color="yellow" />
                        <StatCard icon={CheckCircle} label="Completed" value={data.stats.completedProjects} color="green" />
                        <StatCard icon={DollarSign} label="Spent" value={formatCurrency(data.stats.totalSpent)} color="emerald" />
                        <StatCard icon={DollarSign} label="Remaining" value={formatCurrency(data.stats.moneyRemaining)} color="purple" />
                      </>
                    ) : (
                      <>
                        <StatCard icon={FileText} label="Proposals" value={data.stats.totalProposals} color="blue" />
                        <StatCard icon={CheckCircle} label="Accepted" value={data.stats.acceptedProposals} color="green" />
                        <StatCard icon={Clock} label="Pending" value={data.stats.pendingProposals} color="yellow" />
                        <StatCard icon={DollarSign} label="Earnings" value={formatCurrency(data.stats.totalEarnings)} color="emerald" />
                        <StatCard icon={DollarSign} label="Pending Amt" value={formatCurrency(data.stats.pendingAmount)} color="orange" />
                      </>
                    )}
                  </div>
                </div>

                {/* Freelancer Additional Details - Full Width */}
                {isFreelancer && (
                  <div className="space-y-4">
                    {/* Skills - Full Width */}
                    {data.user.skills?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.user.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info Row */}
                    <div className="flex items-center gap-6 flex-wrap">
                      {/* Hourly Rate */}
                      {data.user.hourlyRate && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">
                            <span className="font-medium">Hourly Rate:</span>{" "}
                            <span className="text-muted-foreground">{formatCurrency(data.user.hourlyRate)}/hr</span>
                          </span>
                        </div>
                      )}

                      {/* Availability */}
                      {bioData?.available !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${bioData.available ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">
                            {bioData.available ? 'Available for work' : 'Not available'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Work Experience */}
                    {bioData?.workExperience && bioData.workExperience.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          Work Experience
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {bioData.workExperience.map((exp, idx) => (
                            <div key={idx} className="bg-muted/30 rounded px-3 py-1.5 text-sm">
                              <span className="font-medium">{exp.title || exp.role || exp.company || 'Experience'}</span>
                              {exp.company && exp.title && (
                                <span className="text-muted-foreground"> at {exp.company}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Portfolio Links - Check multiple field names */}
                    {(() => {
                      const portfolioLink = bioData?.portfolioUrl || bioData?.portfolio?.portfolioUrl || bioData?.portfolio;
                      const linkedinLink = bioData?.linkedinUrl || bioData?.portfolio?.linkedinUrl || bioData?.linkedin;
                      
                      if (!portfolioLink && !linkedinLink) return null;
                      
                      return (
                        <div className="flex items-center gap-3 pt-3 border-t">
                          <ExternalLink className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Links:</span>
                          {portfolioLink && typeof portfolioLink === 'string' && (
                            <a 
                              href={portfolioLink.startsWith('http') ? portfolioLink : `https://${portfolioLink}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              Portfolio
                            </a>
                          )}
                          {linkedinLink && typeof linkedinLink === 'string' && (
                            <>
                              {portfolioLink && <span className="text-muted-foreground">•</span>}
                              <a 
                                href={linkedinLink.startsWith('http') ? linkedinLink : `https://${linkedinLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:underline"
                              >
                                LinkedIn
                              </a>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Bio Text */}
                {bioData?.bio && typeof bioData.bio === 'string' && bioData.bio.length > 5 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{bioData.bio}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })() : null}
      </DialogContent>
    </Dialog>
  );
};

// Compact stat card component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    green: "text-green-500",
    emerald: "text-emerald-500",
    purple: "text-purple-500",
    orange: "text-orange-500"
  };
  
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${colorClasses[color]}`} />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

export default UserDetailsDialog;
