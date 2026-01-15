"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Shield, User, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { removeTeamMember, updateMemberRole } from "@/lib/actions/team";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface TeamMembersListProps {
  members: TeamMember[];
}

const roleColors: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-gray-100 text-gray-800",
};

export function TeamMembersList({ members }: TeamMembersListProps) {
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  const handleRemove = async () => {
    if (!memberToRemove) return;

    try {
      const result = await removeTeamMember(memberToRemove.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team member removed");
      }
    } catch (error) {
      toast.error("Failed to remove team member");
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const result = await updateMemberRole(memberId, newRole);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No team members yet. Invite someone to get started.
      </div>
    );
  }

  return (
    <>
      <div className="divide-y">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback>
                  {(member.full_name || member.email)
                    .charAt(0)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.full_name || "Unnamed"}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary" className={roleColors[member.role]}>
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>

              {member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, "admin")}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Make Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(member.id, "member")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Make Member
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setMemberToRemove(member)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {memberToRemove?.full_name || memberToRemove?.email}
              </strong>{" "}
              from your team? They will lose access to all agency resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
