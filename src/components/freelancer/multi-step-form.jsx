"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { API_BASE_URL, signup } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const PROFESSIONAL_FIELD_ICONS = {
  "Development & Tech": "💻",
  "Digital Marketing": "📱",
  "Creative & Design": "🎨",
  "Writing & Content": "✍️",
  "Lead Generation": "🎯",
  "Video Services": "🎬",
  "Lifestyle & Personal": "💆",
  "Customer Support": "💬",
  "Administrative Services": "📊",
  "Audio Services": "🎧",
};

const STEPS = [
  { id: 1, key: "professional", label: "Professional" },
  { id: 2, key: "specialty", label: "Specialty" },
  { id: 3, key: "skills", label: "Skills" },
  { id: 4, key: "experience", label: "Experience" },
  { id: 5, key: "portfolio", label: "Portfolio" },
  { id: 6, key: "terms", label: "Terms" },
  { id: 7, key: "personal", label: "Personal info" },
];

const PROFESSIONAL_FIELDS = [
  "Development & Tech",
  "Digital Marketing",
  "Creative & Design",
  "Writing & Content",
  "Lead Generation",
  "Video Services",
  ,
  "Lifestyle & Personal",
  "Customer Support",
  "Administrative Services",
  "Audio Services",
];

const SPECIALTY_SKILLS_MAP = {
  "Front-end Development": [
    "React",
    "Vue.js",
    "Angular",
    "Tailwind CSS",
    "TypeScript",
    "Next.js",
    "Svelte",
  ],
  "Back-end Development": [
    "Node.js",
    "Python",
    "Java",
    "C#",
    "PostgreSQL",
    "MongoDB",
    "Docker",
  ],
  "Full-stack Development": [
    "React",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "TypeScript",
    "AWS",
    "Git",
  ],
  "Mobile App Development": [
    "Swift (iOS)",
    "Kotlin (Android)",
    "React Native",
    "Flutter",
    "Firebase",
  ],
  "DevOps & Cloud": [
    "AWS",
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Linux",
    "Terraform",
    "GitHub Actions",
  ],
  "Data & Analytics": [
    "Python",
    "SQL",
    "Tableau",
    "Power BI",
    "Machine Learning",
    "Pandas",
    "Data Science",
  ],
  "SEO Specialist": [
    "SEO",
    "SEM",
    "Google Analytics",
    "Keyword Research",
    "Content Optimization",
    "Link Building",
  ],
  "Performance Marketer": [
    "Google Ads",
    "Facebook Ads",
    "Conversion Optimization",
    "A/B Testing",
    "Analytics",
  ],
  "Content Marketing": [
    "Content Writing",
    "Copywriting",
    "Blog Writing",
    "SEO Writing",
    "Social Media Content",
  ],
  "Email Marketing": [
    "Email Campaigns",
    "Automation",
    "Segmentation",
    "Copy Writing",
    "A/B Testing",
  ],
  "UI/UX Design": [
    "Figma",
    "Sketch",
    "Adobe XD",
    "Prototyping",
    "User Research",
    "Wireframing",
  ],
  "Graphic Design": [
    "Adobe Creative Suite",
    "Canva",
    "Logo Design",
    "Branding",
    "Typography",
    "Illustration",
  ],
  "Product Design": [
    "Figma",
    "Prototyping",
    "User Testing",
    "Design Systems",
    "Interaction Design",
  ],
  "Brand Identity": [
    "Logo Design",
    "Brand Strategy",
    "Color Theory",
    "Typography",
    "Visual Identity",
  ],
  "General Specialist": ["General Services", "Consulting", "Strategy"],
};

const EXPERIENCE_OPTIONS = ["0-1", "1-3", "3-5", "5-8", "10+"];

const specialtyOptionsByField = {
  "Development & Tech": [
    "Front-end Development",
    "Back-end Development",
    "Full-stack Development",
    "Mobile App Development",
    "DevOps & Cloud",
    "Data & Analytics",
  ],
  "Digital Marketing": [
    "SEO Specialist",
    "Performance Marketer",
    "Content Marketing",
    "Email Marketing",
  ],
  "Creative & Design": [
    "UI/UX Design",
    "Graphic Design",
    "Product Design",
    "Brand Identity",
  ],
};

const fallbackSpecialtyOptions = [
  "General Specialist",
  "Consultant",
  "Strategist",
  "Project Specialist",
];

const FreelancerMultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    professionalField: "",
    specialty: "",
    skills: [],
    customSkillInput: "",
    experience: "",
    portfolioWebsite: "",
    linkedinProfile: "",
    portfolioFileName: "",
    termsAccepted: false,
    fullName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const navigate = useNavigate();
  const { login: setAuthSession } = useAuth();

  const totalSteps = STEPS.length;
  const progress = Math.round((currentStep / totalSteps) * 100);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (stepError) {
      setStepError("");
    }
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
      };
    });
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddCustomSkill = () => {
    const value = formData.customSkillInput.trim();
    if (!value) return;

    setFormData((prev) => {
      if (prev.skills.includes(value)) {
        return { ...prev, customSkillInput: "" };
      }

      return {
        ...prev,
        skills: [...prev.skills, value],
        customSkillInput: "",
      };
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFieldChange("portfolioFileName", file ? file.name : "");
  };

  const validateStep = (step, data) => {
    switch (step) {
      case 1: {
        if (!data.professionalField) {
          return "Please choose your professional field to continue.";
        }
        return "";
      }
      case 2: {
        if (!data.specialty) {
          return "Please select your specialty to continue.";
        }
        return "";
      }
      case 3: {
        if (!data.skills || data.skills.length === 0) {
          return "Add at least one skill before continuing.";
        }
        return "";
      }
      case 4: {
        if (!data.experience) {
          return "Please select your years of experience.";
        }
        return "";
      }
      case 5: {
        if (!data.portfolioWebsite.trim() || !data.linkedinProfile.trim()) {
          return "Please provide both your portfolio website and LinkedIn profile.";
        }
        return "";
      }
      case 6: {
        if (!data.termsAccepted) {
          return "You must agree to the Terms and Conditions to continue.";
        }
        return "";
      }
      case 7: {
        if (
          !data.fullName.trim() ||
          !data.email.trim() ||
          !data.password.trim() ||
          !data.location.trim()
        ) {
          return "Full name, email, password, and location are required.";
        }
        if (!data.email.includes("@")) {
          return "Please enter a valid email address.";
        }
        if (data.password.trim().length < 8) {
          return "Password must be at least 8 characters long.";
        }
        return "";
      }
      default:
        return "";
    }
  };

  const findFirstInvalidStep = (targetStep = totalSteps, data = formData) => {
    for (let step = 1; step <= targetStep; step += 1) {
      const message = validateStep(step, data);
      if (message) {
        return { step, message };
      }
    }
    return null;
  };

  const handleNext = () => {
    const validation = validateStep(currentStep, formData);
    if (validation) {
      setStepError(validation);
      toast.error(validation);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setStepError("");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setStepError("");
    }
  };

  const handleGoToStep = (targetStep) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      setStepError("");
      return;
    }

    const validation = findFirstInvalidStep(targetStep, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setCurrentStep(targetStep);
    setStepError("");
  };

  const handleSubmit = async () => {
    const validation = findFirstInvalidStep(totalSteps, formData);
    if (validation) {
      setCurrentStep(validation.step);
      setStepError(validation.message);
      toast.error(validation.message);
      return;
    }

    setIsSubmitting(true);
    setStepError("");

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const freelancerProfile = {
        category: formData.professionalField,
        specialty: formData.specialty,
        experience: formData.experience,
        skills: formData.skills,
        portfolio: {
          portfolioUrl: formData.portfolioWebsite,
          linkedinUrl: formData.linkedinProfile,
        },
        acceptedTerms: formData.termsAccepted,
        phone: formData.phone,
        location: formData.location,
      };

      const authPayload = await signup({
        fullName: formData.fullName.trim(),
        email: normalizedEmail,
        password: formData.password,
        role: "FREELANCER",
        freelancerProfile,
      });

      setAuthSession(authPayload?.user, authPayload?.accessToken);

      const profilePayload = {
        personal: {
          name: formData.fullName.trim(),
          email: normalizedEmail,
          phone: formData.phone.trim(),
          location: formData.location.trim(),
        },
        skills: Array.isArray(formData.skills)
          ? formData.skills.filter(Boolean)
          : [],
        workExperience: [],
        services: [formData.professionalField, formData.specialty].filter(
          Boolean
        ),
      };

      try {
        const baseUrl = API_BASE_URL || "/api";
        const response = await fetch(`${baseUrl}/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authPayload?.accessToken
              ? { Authorization: `Bearer ${authPayload.accessToken}` }
              : {}),
          },
          body: JSON.stringify(profilePayload),
        });

        if (!response.ok) {
          console.warn(
            "Unable to persist initial profile details",
            response.status
          );
        }
      } catch (error) {
        console.warn("Profile save during onboarding failed:", error);
      }

      toast.success("Your freelancer account has been created.");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      const message =
        error?.message || "Unable to create your freelancer account right now.";
      setStepError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpecialtyOptions =
    specialtyOptionsByField[formData.professionalField] ||
    fallbackSpecialtyOptions;

  const currentSpecialtySkills = SPECIALTY_SKILLS_MAP[formData.specialty] || [];

  const isLastStep = currentStep === totalSteps;
  const disableNext =
    isSubmitting || (currentStep === 6 && !formData.termsAccepted);

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <svg
          className="w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--grid-line-color)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Animated orbs in primary tone */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/25 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center relative z-10 mt-5">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Become a Freelancer
          </h1>
          <p className="text-sm md:text-base max-w-md mx-auto text-muted-foreground">
            Join our community and start earning from your expertise
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 px-1 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs font-semibold text-primary">
              {progress}% Complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-12 px-1 relative z-10">
          <div className="grid grid-cols-7 gap-2">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => handleGoToStep(step.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 group transition-all duration-300",
                    isActive || isCompleted
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm transition-all duration-300 transform shadow-sm",
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isActive
                        ? "bg-card text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center transition-all duration-300",
                      isActive || isCompleted
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 items-stretch">
          {/* Left Panel - Form Content */}
          <div className="lg:col-span-2">
            <Card className="border border-border bg-card text-card-foreground shadow-xl backdrop-blur-sm h-full min-h-[500px] lg:min-h-[540px]">
              <CardContent className="pt-8 pb-6 space-y-6 flex flex-col justify-between h-full">
                {/* Step Content */}
                <div className="space-y-6">
                  {currentStep === 1 && (
                    <StepProfessional
                      selectedField={formData.professionalField}
                      onSelectField={(value) =>
                        handleFieldChange("professionalField", value)
                      }
                    />
                  )}
                  {currentStep === 2 && (
                    <StepSpecialty
                      specialty={formData.specialty}
                      onChange={(value) =>
                        handleFieldChange("specialty", value)
                      }
                      options={currentSpecialtyOptions}
                    />
                  )}
                  {currentStep === 3 && (
                    <StepSkills
                      skills={formData.skills}
                      currentSpecialtySkills={currentSpecialtySkills}
                      customSkillInput={formData.customSkillInput}
                      onToggleSkill={toggleSkill}
                      onRemoveSkill={handleRemoveSkill}
                      onCustomInputChange={(value) =>
                        handleFieldChange("customSkillInput", value)
                      }
                      onAddCustomSkill={handleAddCustomSkill}
                      specialty={formData.specialty}
                    />
                  )}
                  {currentStep === 4 && (
                    <StepExperience
                      experience={formData.experience}
                      onSelectExperience={(value) =>
                        handleFieldChange("experience", value)
                      }
                    />
                  )}
                  {currentStep === 5 && (
                    <StepPortfolio
                      website={formData.portfolioWebsite}
                      linkedin={formData.linkedinProfile}
                      fileName={formData.portfolioFileName}
                      onWebsiteChange={(value) =>
                        handleFieldChange("portfolioWebsite", value)
                      }
                      onLinkedinChange={(value) =>
                        handleFieldChange("linkedinProfile", value)
                      }
                      onFileChange={handleFileChange}
                    />
                  )}
                  {currentStep === 6 && (
                    <StepTerms
                      accepted={formData.termsAccepted}
                      onToggle={(value) =>
                        handleFieldChange("termsAccepted", value)
                      }
                    />
                  )}
                  {currentStep === 7 && (
                    <StepPersonalInfo
                      fullName={formData.fullName}
                      email={formData.email}
                      password={formData.password}
                      phone={formData.phone}
                      location={formData.location}
                      onChange={handleFieldChange}
                    />
                  )}

                  {stepError && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/40">
                      <p className="text-sm text-destructive">{stepError}</p>
                    </div>
                  )}
                </div>
                <div className="md:hidden flex justify-center">

                <Button
                  type="button"
                  disabled={disableNext}
                  onClick={isLastStep ? handleSubmit : handleNext}
                >
                  <span className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2 justify-center">
                    {isSubmitting && isLastStep
                      ? "Submitting..."
                      : isLastStep
                      ? "Submit"
                      : "Next"}
                    {!isLastStep && !isSubmitting && (
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                  </span>
                </Button>
                </div>
              </CardContent>

            </Card>
          </div>

          {/* Right Visual Panel */}
          <div className="hidden lg:flex flex-col h-full items-center">
            <div className="sticky top-6 w-full pt-30 h-full min-h-[500px] lg:min-h-[540px] max-w-[420px] rounded-xl overflow-hidden border border-border bg-card shadow-xl flex flex-col gap-6 items-center p-6">
              <div className="w-full flex flex-col items-center justify-center text-center gap-4">
                <StepVisualPanel
                  currentStep={currentStep}
                  formData={formData}
                />
              </div>
              <div className="w-full text-center pt-10">
                {/* Login Link */}
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-primary hover:underline"
                  >
                    Login here
                  </a>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full">

                <Button
                  type="button"
                  disabled={disableNext}
                  onClick={isLastStep ? handleSubmit : handleNext}
                >
                  <span className="absolute inset-0 bg-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center gap-2 justify-center">
                    {isSubmitting && isLastStep
                      ? "Submitting..."
                      : isLastStep
                      ? "Submit"
                      : "Next"}
                    {!isLastStep && !isSubmitting && (
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepVisualPanel = ({ currentStep, formData }) => {
  const getVisualContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">
              {PROFESSIONAL_FIELD_ICONS[formData.professionalField] || "💼"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.professionalField
                  ? "Professional Field Selected"
                  : "Choose Your Field"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.professionalField
                  ? `You're ready to share your ${formData.professionalField}`
                  : "Pick a professional field that matches your expertise"}
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">🎯</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.specialty
                  ? "Specialty Confirmed"
                  : "Select Your Specialty"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.specialty
                  ? `Your specialty: ${formData.specialty}`
                  : "Narrow down your focus area to attract the right clients"}
              </p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex flex-wrap gap-2 justify-center">
              {formData.skills.slice(0, 3).map((skill, idx) => (
                <div
                  key={skill}
                  className="px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-semibold"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {skill}
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Skills Added: {formData.skills.length}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.skills.length > 0
                  ? "Great! Your skills make you stand out"
                  : "Add skills that match your specialty"}
              </p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">📈</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.experience
                  ? `${formData.experience} Years`
                  : "Experience Level"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.experience
                  ? `You bring ${formData.experience} years of expertise`
                  : "Tell us about your professional experience"}
              </p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">🎨</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                Portfolio Ready
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.portfolioWebsite && formData.linkedinProfile
                  ? "Your profile is looking professional!"
                  : "Link your portfolio and LinkedIn to showcase your work"}
              </p>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">
              {formData.termsAccepted ? "✅" : "📋"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.termsAccepted ? "Terms Accepted" : "Agree to Terms"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.termsAccepted
                  ? "You're all set with our terms!"
                  : "Review and accept our terms to proceed"}
              </p>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-6xl">👤</div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">
                {formData.fullName
                  ? "Profile Complete!"
                  : "Complete Your Profile"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {formData.fullName
                  ? `Welcome, ${formData.fullName}! Ready to launch your career`
                  : "Add your personal details to finalize your profile"}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return getVisualContent();
};

const StepProfessional = ({ selectedField, onSelectField }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Choose Your Professional Field
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the category that best describes your work.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PROFESSIONAL_FIELDS.map((field) => {
          const isActive = selectedField === field;
          const icon = PROFESSIONAL_FIELD_ICONS[field] || "💼";
          return (
            <button
              key={field}
              onClick={() => onSelectField(field)}
              className={cn(
                "w-full px-4 py-4 rounded-lg border text-left text-sm font-medium transition-all duration-300 transform hover:-translate-y-[1px] flex items-center gap-3 shadow-xs",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span className="text-xl">{icon}</span>
              <span>{field}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StepSpecialty = ({ specialty, onChange, options }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Select Your Specialty
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your specific skill within your professional field.
        </p>
      </div>

      <Select value={specialty} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-lg bg-background border border-input text-foreground font-medium focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
          <SelectValue placeholder="-- Select a specialty to continue --" />
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border">
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-foreground">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const StepSkills = ({
  skills,
  currentSpecialtySkills,
  customSkillInput,
  onToggleSkill,
  onRemoveSkill,
  onCustomInputChange,
  onAddCustomSkill,
  specialty,
}) => {
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onAddCustomSkill();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Select Your Skills
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the skills related to {specialty}. You can also add custom
          skills.
        </p>
      </div>

      {skills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
            Selected Skills ({skills.length})
          </p>
          <div className="flex flex-wrap gap-2 p-4 rounded-lg bg-muted border border-border min-h-12">
            {skills.map((skill, index) => (
              <div
                key={skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-primary text-sm font-medium"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSkill(skill)}
                  className="ml-1 hover:text-primary-foreground/80 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Recommended Skills for {specialty}
        </p>
        <div className="flex flex-wrap gap-2">
          {currentSpecialtySkills.map((skill) => {
            const isActive = skills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggleSkill(skill)}
                className={cn(
                  "px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300 transform hover:-translate-y-[1px]",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted text-foreground hover:bg-secondary"
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom skill input */}
      <div className="space-y-3">
        <Label className="text-sm text-foreground font-semibold">
          Add Custom Skill
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            value={customSkillInput}
            onChange={(event) => onCustomInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Add or Enter"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <Button
            type="button"
            onClick={onAddCustomSkill}
            className="h-11 rounded-lg bg-primary text-primary-foreground px-6 font-semibold hover:bg-primary/90"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const StepExperience = ({ experience, onSelectExperience }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Your Expertise Level
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Select your years of experience.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {EXPERIENCE_OPTIONS.map((option) => {
          const isActive = experience === option;
          return (
            <button
              key={option}
              onClick={() => onSelectExperience(option)}
              className={cn(
                "w-full px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-300 transform hover:-translate-y-[1px]",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {option} years
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StepPortfolio = ({
  website,
  linkedin,
  fileName,
  onWebsiteChange,
  onLinkedinChange,
  onFileChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Portfolio &amp; Online Presence
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Share your portfolio and professional profiles.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="portfolioWebsite"
            className="text-sm text-foreground font-semibold"
          >
            Portfolio Website
          </Label>
          <Input
            id="portfolioWebsite"
            type="url"
            value={website}
            onChange={(event) => onWebsiteChange(event.target.value)}
            placeholder="https://yourportfolio.com"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="linkedinProfile"
            className="text-sm text-foreground font-semibold"
          >
            LinkedIn Profile
          </Label>
          <Input
            id="linkedinProfile"
            type="url"
            value={linkedin}
            onChange={(event) => onLinkedinChange(event.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="portfolioFile"
            className="text-sm text-foreground font-semibold"
          >
            Upload PDF File (Optional)
          </Label>
          <Input
            id="portfolioFile"
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="h-11 cursor-pointer rounded-lg bg-background border border-input text-muted-foreground file:bg-transparent"
          />
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Selected: {fileName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const StepTerms = ({ accepted, onToggle }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Terms &amp; Conditions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please agree to the terms to complete your profile.
        </p>
      </div>

      <div className="space-y-4">
        <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-muted-foreground border border-border scrollbar-thin">
          <p className="font-semibold text-primary mb-3">
            Freelancer Terms &amp; Conditions – GoHypeMedia
          </p>
          <ol className="list-decimal space-y-2 ps-4">
            <li>
              <span className="font-semibold">Project Completion</span> –
              Payment will only be made upon successful completion and delivery
              of the assigned project as per the agreed scope, timeline, and
              quality standards.
            </li>
            <li>
              <span className="font-semibold">Professional Conduct</span> – You
              agree to maintain clear communication, meet deadlines, and deliver
              original, high-quality work.
            </li>
            <li>
              <span className="font-semibold">Confidentiality</span> – All
              client and project information must remain confidential.
            </li>
            <li>
              <span className="font-semibold">Payment Terms</span> – Payments
              are processed after approval of deliverables.
            </li>
          </ol>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border cursor-pointer hover:bg-secondary transition-colors">
          <Checkbox
            checked={accepted}
            onCheckedChange={(value) => onToggle(Boolean(value))}
            className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <span className="text-sm text-foreground">
            I agree to the Terms and Conditions
          </span>
        </label>
      </div>
    </div>
  );
};

const StepPersonalInfo = ({
  fullName,
  email,
  password,
  phone,
  location,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Personal Information
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This information will be used to create your account.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="fullName"
            className="text-sm text-foreground font-semibold"
          >
            Full Name *
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            placeholder="John Doe"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm text-foreground font-semibold"
          >
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm text-foreground font-semibold"
          >
            Password * (Min 8 characters)
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => onChange("password", event.target.value)}
            placeholder="••••••••"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-sm text-foreground font-semibold"
          >
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="+1 (555) 000-0000"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="location"
            className="text-sm text-foreground font-semibold"
          >
            Location *
          </Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="City, Country"
            className="h-11 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        </div>
      </div>
    </div>
  );
};

export default FreelancerMultiStepForm;
