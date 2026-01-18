"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Users,
  Globe,
  Building2,
} from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Pagination } from "@/components/ui/pagination";
import { deleteAgency, type AdminAgency } from "@/lib/actions/admin";

interface AgenciesTableProps {
  agencies: AdminAgency[];
  total: number;
  page: number;
  pageSize: number;
}

export function AgenciesTable({
  agencies,
  total,
  page,
  pageSize,
}: AgenciesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<AdminAgency | null>(null);

  const handleDelete = async () => {
    if (!agencyToDelete) return;

    setIsLoading(agencyToDelete.id);
    try {
      const result = await deleteAgency(agencyToDelete.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Agency deleted successfully");
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete agency");
    } finally {
      setIsLoading(null);
      setDeleteDialogOpen(false);
      setAgencyToDelete(null);
    }
  };

  const confirmDelete = (agency: AdminAgency) => {
    setAgencyToDelete(agency);
    setDeleteDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No agencies found
                  </TableCell>
                </TableRow>
              ) : (
                agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{agency.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agency.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agency.owner ? (
                        <div>
                          <p className="font-medium">
                            {agency.owner.full_name || "Unnamed"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {agency.owner.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {agency.client_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="w-3 h-3" />
                        {agency.site_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {agency.created_at ? format(new Date(agency.created_at), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isLoading === agency.id}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/agencies/${agency.id}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => confirmDelete(agency)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Agency
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

        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} agencies
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{agencyToDelete?.name}&rdquo;? This
              will also delete all clients, sites, and data associated with this
              agency. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Agency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
