import { Plus, Trash2, Edit2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth-storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreelancerTopBar } from "@/components/freelancer/FreelancerTopBar";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";

const serviceOptions = [
  "Web development",
  "App development",
  "UI/UX design",
  "Product strategy",
  "AI/ML integration",
];

// Use relative path to leverage Vite proxy in development
const API_BASE_URL = "/api";
const buildUrl = (path) => `${API_BASE_URL}${path.replace(/^\/api/, "")}`;

const initialWorkForm = {
  company: "",
  position: "",
  from: "",
  to: "",
  description: "",
};

const FreelancerProfile = () => {
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]); // [{ name }]
  const [workExperience, setWorkExperience] = useState([]); // {title, period, description}
  const [services, setServices] = useState([]); // string[]
  const [skillForm, setSkillForm] = useState({ name: "" });
  const [workForm, setWorkForm] = useState(initialWorkForm);
  const [editingIndex, setEditingIndex] = useState(null); // null = add, number = edit

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });
  const [session, setSession] = useState(null);

  // Derive initials for avatar
  const initials =
    personal.name
      ?.trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KS";

  useEffect(() => {
    const authSession = getSession();
    setSession(authSession);

    if (authSession?.user) {
      setPersonal((prev) => ({
        ...prev,
        name: authSession.user.fullName ?? authSession.user.name ?? prev.name,
        email: authSession.user.email ?? prev.email,
      }));
    }

    const loadProfile = async () => {
      if (!authSession?.user?.email) return;

      try {
        const response = await fetch(
          buildUrl(`/profile?email=${encodeURIComponent(authSession.user.email)}`)
        );

        if (!response.ok) {
          console.warn("Profile GET not ok:", response.status);
          return;
        }

        const { data = {} } = await response.json();

        setPersonal((prev) => ({
          ...prev,
          name: data.personal?.name ?? prev.name,
          email: data.personal?.email ?? prev.email,
          phone: data.personal?.phone ?? "",
          location: data.personal?.location ?? "",
          headline: data.personal?.headline ?? "",
          avatar: data.personal?.avatar ?? "",
          available: data.personal?.available ?? true,
        }));

        const skillsFromApi = Array.isArray(data.skills) ? data.skills : [];
        setSkills(
          skillsFromApi.map((s) =>
            typeof s === "string" ? { name: s } : { name: String(s?.name ?? "") }
          )
        );

        setWorkExperience(data.workExperience ?? []);
        setServices(Array.isArray(data.services) ? data.services : []);
      } catch (error) {
        console.error("Unable to load profile", error);
      }
    };

    loadProfile();
  }, []);

  // ----- Skills -----
  const addSkill = () => {
    const name = skillForm.name.trim();
    if (!name) return;
    setSkills((prev) => [...prev, { name }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const deleteSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Work Experience (add + edit) -----
  const openCreateExperienceModal = () => {
    setEditingIndex(null);
    setWorkForm(initialWorkForm);
    setModalType("work");
  };

  const openEditExperienceModal = (item, index) => {
    const [position, company] = (item.title ?? "").split(" · ");
    const [from, to] = (item.period ?? " – ").split(" – ");

    setWorkForm({
      company: company ?? "",
      position: position ?? "",
      from: from ?? "",
      to: to ?? "",
      description: item.description ?? "",
    });

    setEditingIndex(index);
    setModalType("work");
  };

  const saveExperience = () => {
    const { company, position, from, to, description } = workForm;
    if (!company.trim() || !position.trim() || !from.trim() || !to.trim()) return;

    const newItem = {
      title: `${position.trim()} · ${company.trim()}`,
      period: `${from.trim()} – ${to.trim()}`,
      description: description.trim(),
    };

    if (editingIndex !== null) {
      setWorkExperience((prev) =>
        prev.map((item, idx) => (idx === editingIndex ? newItem : item))
      );
    } else {
      setWorkExperience((prev) => [...prev, newItem]);
    }

    setWorkForm(initialWorkForm);
    setEditingIndex(null);
    setModalType(null);
  };

  const deleteExperience = (index) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Save to backend -----
  const handleSave = async () => {
    if (!personal.email) {
      toast.error("Cannot save profile", {
        description: "Missing email on your profile.",
      });
      return;
    }

    const skillsForApi = skills
      .map((s) => (typeof s === "string" ? s : s.name))
      .map((s) => s?.trim())
      .filter(Boolean);

    const payload = {
      personal: {
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        location: personal.location,
        headline: personal.headline,
        available: personal.available,
      },
      skills: skillsForApi,
      workExperience,
      services,
    };

    console.log("Saving profile payload:", payload);

    try {
      const response = await fetch(buildUrl("/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("Save response:", response.status, text);

      if (!response.ok) {
        toast.error("Save failed", {
          description: "Check backend logs for more details.",
        });
        return;
      }

      toast.success("Profile saved", {
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description: "Something went wrong. Check console for details.",
      });
    }
  };

  // ----- Personal Details Edit (Name, Headline, Phone, Location) -----
  const openEditPersonalModal = () => {
    setModalType("personal");
  };

  const handlePersonalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPersonal((prev) => ({ 
        ...prev, 
        [name]: type === "checkbox" ? checked : value 
    }));
  };

  // ----- Add Custom Service -----
  const [serviceForm, setServiceForm] = useState("");
  const addService = () => {
    const name = serviceForm.trim();
    if (name && !services.includes(name)) {
        setServices(prev => [...prev, name]);
    }
    setServiceForm("");
    setModalType(null);
  };

  // Merge default options with any custom ones saved in the profile
  const displayServices = Array.from(new Set([...serviceOptions, ...services]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <FreelancerTopBar label={`${personal.name || "Freelancer"}'s profile`} />
        {/* Header Section with Profile Picture */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-8">
            {/* Profile Image / Initials */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-card border border-border p-1 overflow-hidden shadow">
                 {personal.avatar ? (
                    <img 
                        src={personal.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-xl"
                    />
                 ) : (
                    <div className="w-full h-full rounded-xl bg-secondary flex items-center justify-center text-3xl md:text-5xl font-bold text-secondary-foreground">
                      {initials}
                    </div>
                 )}
              </div>
              {personal.available && (
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground shadow-sm animate-in fade-in zoom-in duration-300">
                  Available
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-2">
                <p className="text-muted-foreground text-xs tracking-widest uppercase">
                  Profile
                </p>
                <button 
                  onClick={openEditPersonalModal}
                  className="text-primary hover:text-primary/80 transition-colors"
                  title="Edit Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-3 text-foreground leading-tight truncate">
                {personal.name || "Your Name"}
              </h1>
              <p className="text-lg text-foreground/80 mb-2 font-medium">
                {personal.headline || "Add a headline to describe your role"}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-4">
                <a
                  href={personal.email ? `mailto:${personal.email}` : "#"}
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                  {personal.email || ""}
                </a>
                
                {personal.phone && (
                  <span className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                     {personal.phone}
                  </span>
                )}
                
                {personal.location && (
                  <span className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                     {personal.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
                Expertise
              </p>
              <h2 className="text-2xl font-bold text-foreground">Services</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setModalType("service")}
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {displayServices.map((label) => {
              const active = services.includes(label);
              return (
                <div
                  key={label}
                  onClick={() =>
                    setServices((prev) =>
                      prev.includes(label)
                        ? prev.filter((item) => item !== label)
                        : [...prev, label]
                    )
                  }
                  className={`px-4 py-3 rounded-lg text-sm font-medium text-center transition-all cursor-pointer border
                    ${
                      active
                        ? "bg-primary border-primary text-primary-foreground shadow-sm"
                        : "bg-secondary border-border text-secondary-foreground hover:border-primary hover:bg-primary/10"
                    }`}
                >
                  {label}
                </div>
              );
            })}
            {services.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground mt-2">
                No services selected yet. Click a service to add it to your profile.
              </p>
            )}
          </div>
        </section>

        {/* Skills Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
                Technical Skills
              </p>
              <h2 className="text-2xl font-bold text-foreground">Skills</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setModalType("skill")}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Skill
            </Button>
          </div>

          {skills.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {skills.map((skill, idx) => (
                <div
                  key={`${skill.name}-${idx}`}
                  className={`group px-4 py-3 rounded-lg text-sm font-medium text-center transition-all cursor-pointer border flex items-center justify-between
                    bg-secondary border-border text-secondary-foreground hover:border-primary hover:bg-primary/10`}
                >
                  <span className="flex-1 text-left truncate">
                    {skill.name || "Untitled skill"}
                  </span>
                  <Trash2
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-destructive ml-2"
                    onClick={() => deleteSkill(idx)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No skills added yet. Use &quot;Add Skill&quot; to start listing your strengths.
            </p>
          )}
        </section>

        {/* Work Experience Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">
                Professional Journey
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                Work Experience
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={openCreateExperienceModal}
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>

          {workExperience.length ? (
            <div className="space-y-4">
              {workExperience.map((exp, idx) => {
                const [position, company] = (exp.title ?? "").split(" · ");
                return (
                  <Card
                    key={`${exp.title}-${idx}`}
                    className="p-5 md:p-6 border-border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-all mb-1">
                          {position || exp.title || "Role"}
                        </h3>
                        {company && (
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-primary text-sm font-medium">
                              {company}
                            </p>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Edit2
                          className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          onClick={() => openEditExperienceModal(exp, idx)}
                        />
                        <Trash2
                          className="w-4 h-4 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                          onClick={() => deleteExperience(idx)}
                        />
                      </div>
                    </div>
                    {exp.period && (
                      <p className="text-muted-foreground text-xs font-medium mb-3 uppercase tracking-wide">
                        {exp.period}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-foreground text-sm leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No work experience added yet. Use &quot;Add&quot; to document your
              professional journey.
            </p>
          )}
        </section>

        {/* CTA Section */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4 py-12 border-t border-border mt-8">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm w-full sm:w-auto"
            onClick={handleSave}
          >
            Save Profile
          </Button>
        </section>
      </main>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
            {modalType === "skill" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the skill a name so clients can quickly scan your strengths.
                </p>
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Skill name"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "service" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Custom Service
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Offer a specialized service not in the default list.
                </p>
                <input
                  value={serviceForm}
                  onChange={(event) => setServiceForm(event.target.value)}
                  placeholder="Service name (e.g. Rust Development)"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addService}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : modalType === "personal" ? (
               <>
                <h1 className="text-lg font-semibold text-foreground">
                  Edit Personal Details
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update your public profile information.
                </p>

                <div className="mt-4 space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-2xl border border-border bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Available for work</span>
                    <input
                      type="checkbox"
                      name="available"
                      checked={personal.available || false}
                      onChange={handlePersonalChange}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </label>

                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Headline
                    <input
                      name="headline"
                      value={personal.headline || ""}
                      onChange={handlePersonalChange}
                      placeholder="e.g. Senior React Developer"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  
                  <label className="block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    Display Name
                    <input
                      name="name"
                      value={personal.name || ""}
                      onChange={handlePersonalChange}
                      placeholder="Your Name"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Phone
                      <input
                        name="phone"
                        value={personal.phone || ""}
                        onChange={handlePersonalChange}
                        placeholder="+91..."
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                    <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      Location
                      <input
                        name="location"
                        value={personal.location || ""}
                        onChange={handlePersonalChange}
                        placeholder="City, Country"
                        className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Done
                  </button>
                </div>
               </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  {editingIndex !== null
                    ? "Edit Work Experience"
                    : "Add Work Experience"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture your role, timeline, and the impact you had.
                </p>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Company
                  <input
                    value={workForm.company}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Position
                  <input
                    value={workForm.position}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    From
                    <input
                      value={workForm.from}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          from: event.target.value,
                        }))
                      }
                      placeholder="Jan 2020"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    To
                    <input
                      value={workForm.to}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          to: event.target.value,
                        }))
                      }
                      placeholder="Present"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                  <textarea
                    value={workForm.description}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setEditingIndex(null);
                      setWorkForm(initialWorkForm);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveExperience}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85 transition-colors"
                  >
                    {editingIndex !== null ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const FreelancerProfileWrapper = () => {
    return (
        <RoleAwareSidebar>
            <FreelancerProfile />
        </RoleAwareSidebar>
    )
}

export default FreelancerProfileWrapper;
