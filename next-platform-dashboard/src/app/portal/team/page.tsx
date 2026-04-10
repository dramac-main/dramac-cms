"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserX,
  Clock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  getPortalTeamMembers,
  getPortalTeamStats,
  getPortalTeamDepartments,
  createPortalTeamMember,
  updatePortalTeamMember,
  deletePortalTeamMember,
  type PortalTeamMember,
  type CreateTeamMemberInput,
} from "@/lib/portal/portal-team-service";

const statusConfig: Record<
  string,
  { label: string; variant: string; icon: typeof UserCheck }
> = {
  active: {
    label: "Active",
    variant:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: UserCheck,
  },
  invited: {
    label: "Invited",
    variant: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    variant: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: UserX,
  },
};

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const permissionGroups = [
  {
    label: "Content & Analytics",
    permissions: [
      { key: "canViewAnalytics", label: "View Analytics" },
      { key: "canEditContent", label: "Edit Content (Pages, Blog, Media)" },
    ],
  },
  {
    label: "Operations",
    permissions: [
      { key: "canManageOrders", label: "Manage Orders" },
      { key: "canManageProducts", label: "Manage Products" },
      { key: "canManageBookings", label: "Manage Bookings" },
      { key: "canManageQuotes", label: "Manage Quotes" },
      { key: "canManageCustomers", label: "Manage Customers" },
    ],
  },
  {
    label: "Communication",
    permissions: [
      { key: "canManageLiveChat", label: "Manage Live Chat" },
      { key: "canManageAgents", label: "Manage Chat Agents" },
      { key: "canManageCrm", label: "Manage CRM" },
      { key: "canManageAutomation", label: "Manage Automation" },
    ],
  },
  {
    label: "Finance",
    permissions: [{ key: "canViewInvoices", label: "View Invoices" }],
  },
];

const defaultPermissions: Record<string, boolean> = {
  canViewAnalytics: false,
  canEditContent: false,
  canViewInvoices: false,
  canManageLiveChat: false,
  canManageOrders: false,
  canManageProducts: false,
  canManageBookings: false,
  canManageCrm: false,
  canManageAutomation: false,
  canManageQuotes: false,
  canManageAgents: false,
  canManageCustomers: false,
};

export default function PortalTeamPage() {
  const [members, setMembers] = useState<PortalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    invited: 0,
    inactive: 0,
  });

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<PortalTeamMember | null>(
    null,
  );
  const [deletingMember, setDeletingMember] = useState<PortalTeamMember | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<
    CreateTeamMemberInput & Record<string, unknown>
  >({
    name: "",
    email: "",
    role: "member",
    phone: "",
    jobTitle: "",
    department: "",
    notes: "",
    ...defaultPermissions,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersResult, statsResult, deptResult] = await Promise.all([
        getPortalTeamMembers({
          search: search || undefined,
          status: statusFilter,
        }),
        getPortalTeamStats(),
        getPortalTeamDepartments(),
      ]);
      setMembers(membersResult.members);
      setStats(statsResult);
      setDepartments(deptResult);
    } catch (error) {
      console.error("Failed to load team data:", error);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "member",
      phone: "",
      jobTitle: "",
      department: "",
      notes: "",
      ...defaultPermissions,
    });
  };

  const openAddDialog = () => {
    resetForm();
    setEditingMember(null);
    setShowAddDialog(true);
  };

  const openEditDialog = (member: PortalTeamMember) => {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || "",
      jobTitle: member.jobTitle || "",
      department: member.department || "",
      notes: member.notes || "",
      canViewAnalytics: member.canViewAnalytics,
      canEditContent: member.canEditContent,
      canViewInvoices: member.canViewInvoices,
      canManageLiveChat: member.canManageLiveChat,
      canManageOrders: member.canManageOrders,
      canManageProducts: member.canManageProducts,
      canManageBookings: member.canManageBookings,
      canManageCrm: member.canManageCrm,
      canManageAutomation: member.canManageAutomation,
      canManageQuotes: member.canManageQuotes,
      canManageAgents: member.canManageAgents,
      canManageCustomers: member.canManageCustomers,
    });
    setEditingMember(member);
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setSaving(true);
    try {
      if (editingMember) {
        const result = await updatePortalTeamMember(editingMember.id, {
          name: formData.name as string,
          email: formData.email as string,
          role: formData.role as string,
          phone: formData.phone as string,
          jobTitle: formData.jobTitle as string,
          department: formData.department as string,
          notes: formData.notes as string,
          canViewAnalytics: formData.canViewAnalytics as boolean,
          canEditContent: formData.canEditContent as boolean,
          canViewInvoices: formData.canViewInvoices as boolean,
          canManageLiveChat: formData.canManageLiveChat as boolean,
          canManageOrders: formData.canManageOrders as boolean,
          canManageProducts: formData.canManageProducts as boolean,
          canManageBookings: formData.canManageBookings as boolean,
          canManageCrm: formData.canManageCrm as boolean,
          canManageAutomation: formData.canManageAutomation as boolean,
          canManageQuotes: formData.canManageQuotes as boolean,
          canManageAgents: formData.canManageAgents as boolean,
          canManageCustomers: formData.canManageCustomers as boolean,
        });
        if (result.success) {
          toast.success("Team member updated");
          setShowAddDialog(false);
          loadData();
        } else {
          toast.error(result.error || "Failed to update team member");
        }
      } else {
        const result = await createPortalTeamMember({
          name: formData.name as string,
          email: formData.email as string,
          role: formData.role as string,
          phone: formData.phone as string,
          jobTitle: formData.jobTitle as string,
          department: formData.department as string,
          notes: formData.notes as string,
          status: "active",
          canViewAnalytics: formData.canViewAnalytics as boolean,
          canEditContent: formData.canEditContent as boolean,
          canViewInvoices: formData.canViewInvoices as boolean,
          canManageLiveChat: formData.canManageLiveChat as boolean,
          canManageOrders: formData.canManageOrders as boolean,
          canManageProducts: formData.canManageProducts as boolean,
          canManageBookings: formData.canManageBookings as boolean,
          canManageCrm: formData.canManageCrm as boolean,
          canManageAutomation: formData.canManageAutomation as boolean,
          canManageQuotes: formData.canManageQuotes as boolean,
          canManageAgents: formData.canManageAgents as boolean,
          canManageCustomers: formData.canManageCustomers as boolean,
        });
        if (result.success) {
          toast.success("Team member added");
          setShowAddDialog(false);
          loadData();
        } else {
          toast.error(result.error || "Failed to add team member");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    setSaving(true);
    try {
      const result = await deletePortalTeamMember(deletingMember.id);
      if (result.success) {
        toast.success("Team member removed");
        setDeletingMember(null);
        loadData();
      } else {
        toast.error(result.error || "Failed to remove team member");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    member: PortalTeamMember,
    newStatus: "active" | "inactive",
  ) => {
    const result = await updatePortalTeamMember(member.id, {
      status: newStatus,
    });
    if (result.success) {
      toast.success(
        `${member.name} ${newStatus === "active" ? "activated" : "deactivated"}`,
      );
      loadData();
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const selectAllPermissions = (value: boolean) => {
    const update: Record<string, unknown> = {};
    permissionGroups.forEach((group) => {
      group.permissions.forEach((p) => {
        update[p.key] = value;
      });
    });
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const permissionCount = (member: PortalTeamMember) => {
    let count = 0;
    if (member.canViewAnalytics) count++;
    if (member.canEditContent) count++;
    if (member.canViewInvoices) count++;
    if (member.canManageLiveChat) count++;
    if (member.canManageOrders) count++;
    if (member.canManageProducts) count++;
    if (member.canManageBookings) count++;
    if (member.canManageCrm) count++;
    if (member.canManageAutomation) count++;
    if (member.canManageQuotes) count++;
    if (member.canManageAgents) count++;
    if (member.canManageCustomers) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team and their permissions
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.invited}
            </div>
            <p className="text-xs text-muted-foreground">Invited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-gray-500">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {search || statusFilter !== "all"
                ? "No members match your filters"
                : "No Team Members Yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first team member to start managing who can do what."}
            </p>
            {!search && statusFilter === "all" && (
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const status = statusConfig[member.status] || statusConfig.active;
            const StatusIcon = status.icon;
            return (
              <Card
                key={member.id}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {member.name}
                        </h3>
                        <Badge className={status.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {member.email}
                        </span>
                        {member.jobTitle && (
                          <span className="hidden sm:inline truncate">
                            {member.jobTitle}
                          </span>
                        )}
                        {member.department && (
                          <Badge
                            variant="secondary"
                            className="text-xs hidden sm:inline-flex"
                          >
                            {member.department}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {permissionCount(member)} permissions
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(member)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {member.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(member, "inactive")
                            }
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(member, "active")}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeletingMember(member)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-dvh sm:max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update team member details and permissions."
                : "Add a new team member and assign their permissions."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Full name"
                    value={(formData.name as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={(formData.email as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={(formData.role as string) || "member"}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, role: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    value={(formData.phone as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Front Desk Manager"
                    value={(formData.jobTitle as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        jobTitle: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g. Operations, Marketing"
                    value={(formData.department as string) || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    list="department-suggestions"
                  />
                  {departments.length > 0 && (
                    <datalist id="department-suggestions">
                      {departments.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              <Separator />

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permissions
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Control what this team member can access
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllPermissions(true)}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllPermissions(false)}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {permissionGroups.map((group) => (
                    <div key={group.label}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        {group.label}
                      </h4>
                      <div className="space-y-3">
                        {group.permissions.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-center justify-between"
                          >
                            <Label
                              htmlFor={perm.key}
                              className="text-sm cursor-pointer"
                            >
                              {perm.label}
                            </Label>
                            <Switch
                              id={perm.key}
                              checked={!!formData[perm.key]}
                              onCheckedChange={(v) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [perm.key]: v,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Optional notes about this team member..."
                  value={(formData.notes as string) || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMember ? "Update Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMember}
        onOpenChange={() => setDeletingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deletingMember?.name}</strong> from your team? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
