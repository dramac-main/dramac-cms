"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  UserX,
  Shield,
  Key,
  Mail,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  impersonateUser,
  suspendUser,
  resetUserPassword,
  updateUserRole,
  type AdminUser,
} from "@/lib/actions/admin";
import { ROLE_LABELS, type UserRole } from "@/types/roles";

interface UsersTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  agency_owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  agency_admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  agency_member: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  client: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function UsersTable({ users, total, page, pageSize }: UsersTableProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleImpersonate = async (userId: string) => {
    setIsLoading(userId);
    try {
      const result = await impersonateUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Impersonation started. You are now viewing as this user.");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Failed to impersonate user");
    } finally {
      setIsLoading(null);
    }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    setIsLoading(userId);
    try {
      const result = await suspendUser(userId, !isSuspended);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isSuspended ? "User reactivated" : "User suspended");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update user status");
    } finally {
      setIsLoading(null);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    setIsLoading(userId);
    try {
      const result = await resetUserPassword(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password reset email sent");
      }
    } catch {
      toast.error("Failed to send reset email");
    } finally {
      setIsLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsLoading(userId);
    try {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User role updated");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update user role");
    } finally {
      setIsLoading(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (newPage: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("page", newPage.toString());
    router.push(`/admin/users?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.full_name || user.name || user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.full_name || user.name || "Unnamed"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={roleColors[user.role] || ""}
                    >
                      {ROLE_LABELS[user.role as UserRole] || user.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.agency_name || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[user.status] || ""}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_sign_in
                      ? format(new Date(user.last_sign_in), "MMM d, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading === user.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/admin/users/${user.id}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {user.role !== "super_admin" && (
                          <DropdownMenuItem
                            onClick={() => handleImpersonate(user.id)}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Impersonate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <UserCog className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(
                              ([role, label]) => (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleRoleChange(user.id, role)}
                                  disabled={user.role === role}
                                >
                                  {label}
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem
                          onClick={() =>
                            handleResetPassword(user.id, user.email)
                          }
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`mailto:${user.email}`)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {user.role !== "super_admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleSuspend(user.id, user.status === "suspended")
                              }
                              className={
                                user.status === "suspended"
                                  ? "text-green-600"
                                  : "text-destructive"
                              }
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              {user.status === "suspended"
                                ? "Reactivate"
                                : "Suspend"}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, total)} of {total} users
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
