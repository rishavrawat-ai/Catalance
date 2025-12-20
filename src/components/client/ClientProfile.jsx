"use client";

import React, { useState, useEffect } from "react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, User, Building2, MapPin, Globe, Mail, Phone, Camera } from "lucide-react";

const ClientProfileContent = () => {
    const { user, authFetch, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        bio: "",
        companyName: "",
        phoneNumber: "",
        location: "",
        website: ""
    });

    useEffect(() => {
        if (user) {
            let parsedBio = {};
            let bioText = user.bio || "";

            // Attempt to parse bio if it looks like JSON
            if (bioText && typeof bioText === 'string' && (bioText.startsWith('{') || bioText.startsWith('['))) {
                try {
                    const parsed = JSON.parse(bioText);
                    // If parsing succeeds, check if it has known keys
                    if (parsed && typeof parsed === 'object') {
                        parsedBio = parsed;
                        // specific logic: if the parsed object has a 'bio' field, that is the real bio text
                        if (parsed.bio !== undefined) {
                            bioText = parsed.bio;
                        } else {
                            // If no 'bio' key, but it was JSON, maybe the whole thing is metadata? 
                            // user probably doesn't want to see JSON in the bio box anyway.
                            bioText = ""; 
                        }
                    }
                } catch (e) {
                    // Not valid JSON, treat as normal string
                    console.log("Bio is not JSON", e);
                }
            }

            setFormData({
                fullName: user.fullName || user.name || parsedBio.fullName || "",
                email: user.email || parsedBio.email || "",
                bio: bioText,
                companyName: user.companyName || parsedBio.companyName || "",
                phoneNumber: user.phoneNumber || parsedBio.phone || parsedBio.phoneNumber || "",
                location: user.location || parsedBio.location || "",
                website: user.website || parsedBio.website || ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Pack extra fields into bio to support legacy/backend limitation
            // preserving the "Store extra details in bio" pattern
            const extraDetails = {
                bio: formData.bio,
                location: formData.location,
                website: formData.website,
                companyName: formData.companyName,
                phoneNumber: formData.phoneNumber,
                // We also include phone/company here just in case, 
                // though we send them separately too if the backend supports them.
            };

            const payload = {
                ...formData,
                bio: JSON.stringify(extraDetails)
            };

            const response = await authFetch("/profile", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update profile");
            }

            toast.success("Profile updated successfully");
            await refreshUser();
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };
    
    // Background style (Dotted Noise)
    const backgroundStyle = {
        backgroundImage: `radial-gradient(var(--grid-line-color) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
    };

    return (
        <div className="relative min-h-screen w-full bg-background overflow-x-hidden">
             {/* Background Texture */}
             <div
                className="pointer-events-none absolute inset-0 opacity-[0.15]"
                style={backgroundStyle}
            />

            <div className="relative z-10 space-y-8 p-6 lg:p-10 w-full max-w-7xl mx-auto">
                <ClientTopBar />
                
                <div className="grid gap-8 lg:grid-cols-[280px_1fr] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Left Column: Identity Card */}
                    <div className="space-y-6">
                        <Card className="border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center relative z-10">
                                <div className="relative mb-4 group/avatar cursor-pointer">
                                    <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl transition-transform duration-300 group-hover/avatar:scale-105">
                                        <AvatarImage src={user?.avatar} alt={formData.fullName} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                                            {formData.fullName?.[0] || "C"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg ring-2 ring-background opacity-0 translate-y-2 group-hover/avatar:opacity-100 group-hover/avatar:translate-y-0 transition-all duration-300">
                                        <Camera className="h-4 w-4" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-1">{formData.fullName || "User"}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{formData.email}</p>
                                
                                <div className="w-full space-y-2 text-sm text-left mt-4 bg-muted/30 p-4 rounded-xl">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Building2 className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{formData.companyName || "No Company"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{formData.location || "No Location"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Edit Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h2>
                            <p className="text-muted-foreground">Manage your personal information and preferences.</p>
                        </div>

                        <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Personal Information
                                </CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input 
                                            id="fullName" 
                                            value={formData.fullName} 
                                            onChange={handleChange} 
                                            className="bg-background/50 focus:bg-background transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="email" 
                                                value={formData.email} 
                                                disabled 
                                                className="pl-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="phoneNumber" 
                                                value={formData.phoneNumber} 
                                                onChange={handleChange} 
                                                placeholder="+1 (555) 000-0000"
                                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                       <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="location" 
                                                value={formData.location} 
                                                onChange={handleChange} 
                                                placeholder="New York, USA"
                                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                            />
                                       </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea 
                                        id="bio" 
                                        value={formData.bio} 
                                        onChange={handleChange} 
                                        placeholder="Tell us about yourself..."
                                        className="min-h-[100px] bg-background/50 focus:bg-background transition-colors resize-y"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Company Details
                                </CardTitle>
                                <CardDescription>Manage your business information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Company Name</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="companyName" 
                                                value={formData.companyName} 
                                                onChange={handleChange} 
                                                placeholder="Acme Inc."
                                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="website" 
                                                value={formData.website} 
                                                onChange={handleChange} 
                                                placeholder="https://example.com"
                                                className="pl-9 bg-background/50 focus:bg-background transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end gap-4 sticky bottom-6 z-20">
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                size="lg" 
                                className="min-w-[150px] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ClientProfile = () => {
  return (
    <RoleAwareSidebar>
      <ClientProfileContent />
    </RoleAwareSidebar>
  );
};

export default ClientProfile;
