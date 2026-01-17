"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AdminUser } from "@/lib/admin/admin-service";

interface UserManagementTableProps {
  users: AdminUser[];
  onRoleChange: (userId: string, newRole: string) => void;
  onDelete?: (userId: string) => void;
  onViewDetails?: (userId: string) => void;
}

const ROLES = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  member: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function UserManagementTable({
  users,
  onRoleChange,
  onDelete,
  onViewDetails,
}: UserManagementTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{user.fullName || "—"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={ROLE_COLORS[user.role || "member"]}>
                    {user.role || "member"}
                  </Badge>
                </TableCell>
                <TableCell>{user.agencyName || "—"}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {user.lastSignIn
                    ? formatDistanceToNow(new Date(user.lastSignIn), { addSuffix: true })
                    : "Never"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => onViewDetails(user.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      {ROLES.map((role) => (
                        <DropdownMenuItem
                          key={role.value}
                          onClick={() => onRoleChange(user.id, role.value)}
                          disabled={user.role === role.value}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {role.label}
                        </DropdownMenuItem>
                      ))}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(user.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
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
  );
}
