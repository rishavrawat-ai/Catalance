import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { AdminTopBar } from "./AdminTopBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Search, Eye, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import UserDetailsDialog from "./UserDetailsDialog";

const AdminUsers = ({ roleFilter }) => {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const pageTitle = roleFilter 
    ? (roleFilter === "CLIENT" ? "Clients" : roleFilter === "PROJECT_MANAGER" ? "Project Managers" : "Freelancers")
    : "Users";

  const pageDescription = roleFilter
    ? `Manage your platform's ${roleFilter === "PROJECT_MANAGER" ? "project managers" : roleFilter.toLowerCase() + "s"}.`
    : "Manage your platform's users.";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        ...(roleFilter && { role: roleFilter })
      });
      const res = await authFetch(`/admin/users?${queryParams}`);
      const data = await res.json();
      if (data?.data?.users) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceId = setTimeout(fetchUsers, 500);
    return () => clearTimeout(debounceId);
  }, [authFetch, search, roleFilter]);

  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(userId);
    try {
      const res = await authFetch(`/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (userId) => {
    setSelectedUserId(userId);
    setDetailsDialogOpen(true);
  };

  return (
    <>
    <AdminLayout>
      <div className="relative flex flex-col gap-6 p-6">
        <AdminTopBar label={pageTitle} />

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground mt-2">{pageDescription}</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${pageTitle.toLowerCase()}...`}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No {pageTitle.toLowerCase()} found.</TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          user.role === 'CLIENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          user.role === 'PROJECT_MANAGER' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {user.role === 'PROJECT_MANAGER' ? 'PM' : user.role}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'SUSPENDED' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {user.status === 'SUSPENDED' ? 'Suspended' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(user.id)}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.status === 'SUSPENDED' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              disabled={actionLoading === user.id}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              title="Activate"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                              disabled={actionLoading === user.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              title="Suspend"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
    
    <UserDetailsDialog
      userId={selectedUserId}
      open={detailsDialogOpen}
      onOpenChange={setDetailsDialogOpen}
    />
    </>
  );
};

export default AdminUsers;
