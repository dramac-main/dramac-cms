"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Package, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  ToggleLeft, 
  ToggleRight,
  Building2,
  Users,
  Globe
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Database } from "@/types/database";

type DatabaseModule = Database["public"]["Tables"]["modules"]["Row"];

interface AdminModuleListProps {
  modules: DatabaseModule[];
}

export function AdminModuleList({ modules }: AdminModuleListProps) {
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleToggleStatus = async (module: DatabaseModule) => {
    setIsToggling(module.id);
    try {
      const newStatus = !module.is_active;
      const response = await fetch(`/api/modules/${module.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      toast.success(`Module ${newStatus ? 'activated' : 'deactivated'}`);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update module status");
    } finally {
      setIsToggling(null);
    }
  };

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-medium mb-1">No modules found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first module in the Module Studio
        </p>
        <Button asChild>
          <Link href="/admin/modules/studio">Create Module</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{module.icon || '📦'}</span>
                  <div>
                    <Link 
                      href={`/admin/modules/${module.id}`}
                      className="font-medium hover:underline"
                    >
                      {module.name}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {module.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{module.category}</Badge>
              </TableCell>
              <TableCell>
                {module.price_monthly === 0 
                  ? <span className="text-green-600 font-medium">Free</span>
                  : <span>${(module.price_monthly / 100).toFixed(2)}/mo</span>
                }
              </TableCell>
              <TableCell>
                <StatusBadge isActive={module.is_active} isFeatured={module.is_featured} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isToggling === module.id}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/modules/${module.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/modules/studio/${module.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Module
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(module)}>
                      {module.is_active ? (
                        <>
                          <ToggleLeft className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ isActive, isFeatured }: { isActive: boolean; isFeatured: boolean }) {
  if (isFeatured && isActive) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        Featured
      </span>
    );
  }
  
  if (isActive) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
      Inactive
    </span>
  );
}
