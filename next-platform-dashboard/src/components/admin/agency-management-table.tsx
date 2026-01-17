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
import { MoreHorizontal, Building2, Ban, CheckCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { AdminAgency } from "@/lib/admin/admin-service";

interface AgencyManagementTableProps {
  agencies: AdminAgency[];
  onStatusChange: (agencyId: string, newStatus: string) => void;
  onViewDetails?: (agencyId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  suspended: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function AgencyManagementTable({
  agencies,
  onStatusChange,
  onViewDetails,
}: AgencyManagementTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="text-center">Sites</TableHead>
            <TableHead className="text-center">Clients</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agencies.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No agencies found
              </TableCell>
            </TableRow>
          ) : (
            agencies.map((agency) => (
              <TableRow key={agency.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{agency.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{agency.ownerName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{agency.ownerEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[agency.status] || "bg-gray-100 dark:bg-gray-800"}>
                    {agency.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{agency.plan || "Free"}</Badge>
                </TableCell>
                <TableCell className="text-center">{agency.sitesCount}</TableCell>
                <TableCell className="text-center">{agency.clientsCount}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(agency.createdAt), { addSuffix: true })}
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
                        <DropdownMenuItem onClick={() => onViewDetails(agency.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(agency.id, "active")}
                        disabled={agency.status === "active"}
                      >
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Activate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(agency.id, "suspended")}
                        disabled={agency.status === "suspended"}
                      >
                        <Ban className="h-4 w-4 mr-2 text-amber-600" />
                        Suspend
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(agency.id, "cancelled")}
                        disabled={agency.status === "cancelled"}
                        className="text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
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
