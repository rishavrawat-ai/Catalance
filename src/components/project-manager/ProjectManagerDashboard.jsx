import React, { useEffect, useState } from "react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Video, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const ProjectManagerDashboardContent = () => {
    const { authFetch } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await authFetch("/disputes");
            const data = await res.json();
            if (res.ok) {
                setDisputes(data.data || []);
            } else {
                toast.error("Failed to load disputes");
            }
        } catch (e) {
            toast.error("Error loading disputes");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, [authFetch]);

    // Group disputes by status
    const openDisputes = disputes.filter(d => d.status === 'OPEN');
    const inProgressDisputes = disputes.filter(d => d.status === 'IN_PROGRESS');
    const resolvedDisputes = disputes.filter(d => d.status === 'RESOLVED');

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Manager Dashboard</h1>
                    <p className="text-muted-foreground mt-1">overview of project disputes and resolutions</p>
                </div>
                <Button onClick={fetchDisputes} variant="outline" size="sm" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Refresh Data
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
            ) : (
                <div className="space-y-8">
                    {/* Overview Section */}
                    <PMOverview disputes={disputes} />

                    <Separator />

                    {disputes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center border-dashed border-2 rounded-xl bg-muted/30">
                            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">All Clear</h3>
                            <p className="text-muted-foreground">No disputes found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            <h2 className="text-xl font-semibold">Active Disputes</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...openDisputes, ...inProgressDisputes].length > 0 ? (
                                    [...openDisputes, ...inProgressDisputes].map(dispute => (
                                        <DisputeCard
                                            key={dispute.id}
                                            dispute={dispute}
                                            onUpdate={fetchDisputes}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center p-10 text-muted-foreground bg-muted/20 rounded-lg">
                                        No active disputes.
                                    </div>
                                )}
                            </div>

                            {resolvedDisputes.length > 0 && (
                                <>
                                    <h2 className="text-xl font-semibold mt-4">Resolved History</h2>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80">
                                        {resolvedDisputes.map(dispute => (
                                            <DisputeCard
                                                key={dispute.id}
                                                dispute={dispute}
                                                onUpdate={fetchDisputes}
                                                readOnly={true}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const PMOverview = ({ disputes }) => {
    const upcomingMeetings = disputes
        .filter(d => d.meetingDate && new Date(d.meetingDate) > new Date())
        .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));

    const resolvedConflictsCount = disputes.filter(d => d.status === 'RESOLVED').length;
    const pendingConflictsCount = disputes.filter(d => ['OPEN', 'IN_PROGRESS'].includes(d.status)).length;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-500" />
                        Upcoming Meetings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingMeetings.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingMeetings.slice(0, 3).map(meet => (
                                <div key={meet.id} className="flex flex-col p-2 bg-background/50 rounded border text-sm">
                                    <div className="font-semibold truncate">{meet.project?.title || "Project Issue"}</div>
                                    <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                                        <span>{new Date(meet.meetingDate).toLocaleDateString()}</span>
                                        <span>{new Date(meet.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {meet.meetingLink && (
                                        <a href={meet.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-1 hover:underline">
                                            Join Meeting
                                        </a>
                                    )}
                                </div>
                            ))}
                            {upcomingMeetings.length > 3 && <p className="text-xs text-muted-foreground text-center">+{upcomingMeetings.length - 3} more</p>}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">No upcoming meetings scheduled.</div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        Pending Conflicts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{pendingConflictsCount}</div>
                    <p className="text-sm text-muted-foreground mt-1">Active disputes requiring attention</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Resolved Conflicts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{resolvedConflictsCount}</div>
                    <p className="text-sm text-muted-foreground mt-1">Successfully closed disputes</p>
                </CardContent>
            </Card>
        </div>
    );
};

const DisputeCard = ({ dispute, onUpdate, readOnly = false }) => {
    const { authFetch } = useAuth();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [meetingLink, setMeetingLink] = useState(dispute.meetingLink || "");
    const [meetingDate, setMeetingDate] = useState(dispute.meetingDate ? new Date(dispute.meetingDate).toISOString().slice(0, 16) : "");
    const [resolution, setResolution] = useState(dispute.resolutionNotes || "");
    const [status, setStatus] = useState(dispute.status);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/disputes/${dispute.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    meetingLink,
                    meetingDate: meetingDate ? new Date(meetingDate).toISOString() : null,
                    resolutionNotes: resolution,
                    status
                })
            });

            if (res.ok) {
                toast.success("Dispute updated successfully");
                setOpen(false);
                onUpdate();
            } else {
                toast.error("Failed to update dispute");
            }
        } catch (e) {
            toast.error("Error updating dispute");
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (s) => {
        switch (s) {
            case 'RESOLVED': return 'default'; // often dark/primary
            case 'IN_PROGRESS': return 'secondary'; // often grey/muted
            case 'OPEN': return 'destructive'; // red
            default: return 'outline';
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <Badge variant={getStatusVariant(dispute.status)}>
                        {dispute.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <CardTitle className="text-base leading-tight line-clamp-1">
                    {dispute.project?.title || "Unknown Project"}
                </CardTitle>
                <CardDescription className="text-xs">
                    Raised by <span className="font-semibold text-foreground">{dispute.raisedBy?.fullName}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 text-sm">
                <div className="bg-muted/30 p-2 rounded-md">
                    <p className="text-muted-foreground line-clamp-3 text-xs italic">
                        "{dispute.description}"
                    </p>
                </div>

                {dispute.meetingLink && (
                    <div className="p-2 bg-primary/5 border border-primary/20 rounded flex items-center gap-2">
                        <Video size={14} className="text-primary" />
                        <div className="flex flex-col">
                            <a href={dispute.meetingLink} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline truncate text-xs">
                                Join Meeting
                            </a>
                            {dispute.meetingDate && (
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(dispute.meetingDate).toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0 mt-auto">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant={readOnly ? "outline" : "default"} size="sm">
                            {readOnly ? "View Details" : "Manage Dispute"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Manage Dispute</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">Issue Description</h4>
                                <div className="text-sm text-foreground/90 p-3 bg-muted rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap">
                                    {dispute.description}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={status} onValueChange={setStatus} disabled={readOnly && status === 'RESOLVED'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Meeting Schedule (Optional)</label>
                                    <Input
                                        type="datetime-local"
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                        readOnly={readOnly}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-sm font-medium">Google Meet Link</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="https://meet.google.com/..."
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            readOnly={readOnly}
                                        />
                                        {!readOnly && (
                                            <Button size="icon" variant="ghost" type="button" onClick={() => window.open('https://meet.google.com/new', '_blank')} title="Create new meeting">
                                                <Video className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Resolution Notes</label>
                                <Textarea
                                    placeholder="Enter details about the resolution..."
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    rows={4}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setOpen(false)}>
                                {readOnly ? "Close" : "Cancel"}
                            </Button>
                            {!readOnly && (
                                <Button onClick={handleUpdate} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    );
};

const ProjectManagerDashboard = () => (
    <RoleAwareSidebar>
        <ProjectManagerDashboardContent />
    </RoleAwareSidebar>
);

export default ProjectManagerDashboard;
