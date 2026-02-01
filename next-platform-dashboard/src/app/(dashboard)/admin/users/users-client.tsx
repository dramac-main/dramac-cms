"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { getAdminUsers, updateUserRole, deleteAdminUser, type AdminUser } from "@/lib/admin/admin-service";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { promoteToSuperAdmin } from "@/lib/admin/admin-service";
import { PageHeader } from "@/components/layout/page-header";

const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export default function AdminUsersPageClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminUsers({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success("Role updated successfully");
      loadUsers();
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    const result = await deleteAdminUser(userId);
    if (result.success) {
      toast.success("User deleted successfully");
      loadUsers();
    } else {
      toast.error(result.error || "Failed to delete user");
    }
  };

  const handlePromoteAdmin = async () => {
    if (!promoteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setPromoting(true);
    try {
      const result = await promoteToSuperAdmin(promoteEmail.trim());
      if (result.success) {
        toast.success("User promoted to Super Admin successfully");
        setPromoteDialogOpen(false);
        setPromoteEmail("");
        loadUsers();
      } else {
        toast.error(result.error || "Failed to promote user");
      }
    } catch (error) {
      toast.error("An error occurred while promoting user");
    } finally {
      setPromoting(false);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`${total} total users`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setPromoteDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Promote Admin
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
        <Select 
          value={roleFilter} 
          onValueChange={(value) => {
            setRoleFilter(value);
            setPage(1); // Reset to first page on filter change
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          Loading users...
        </div>
      ) : (
        <UserManagementTable
          users={users}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Promote Admin Dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote User to Super Admin</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to promote to Super Admin.
              This will give them full platform access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromoteAdmin} disabled={promoting}>
              {promoting ? "Promoting..." : "Promote to Super Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
