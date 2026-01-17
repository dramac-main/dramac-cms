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
  ExternalLink
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
import { InstallLevelBadge } from "@/components/modules/shared/install-level-badge";

// Module type for v2 modules table
interface ModuleV2 {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  install_level: string;
  status: string;
  wholesale_price_monthly: number;
  install_count: number;
  is_featured: boolean;
  created_at: string;
}

interface AdminModuleListProps {
  modules: ModuleV2[];
}

export function AdminModuleList({ modules }: AdminModuleListProps) {
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const handleToggleStatus = async (module: ModuleV2) => {
    setIsToggling(module.id);
    try {
      const newStatus = module.status === "active" ? "draft" : "active";
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      toast.success(`Module ${newStatus === "active" ? 'activated' : 'deactivated'}`);
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

  const getStatusBadge = (status: string, isFeatured: boolean) => {
    if (isFeatured && status === "active") {
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          Featured
        </Badge>
      );
    }
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      deprecated: "destructive",
      disabled: "outline",
      review: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}/mo`;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Install Level</TableHead>
            <TableHead>Wholesale</TableHead>
            <TableHead>Installs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{module.icon || "📦"}</span>
                  <div>
                    <Link 
                      href={`/admin/modules/${module.id}`}
                      className="font-medium hover:underline"
                    >
                      {module.name}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {module.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline">{module.category}</Badge>
              </TableCell>
              
              <TableCell>
                <InstallLevelBadge level={module.install_level} />
              </TableCell>
              
              <TableCell>
                <span className="font-medium">
                  {formatPrice(module.wholesale_price_monthly || 0)}
                </span>
              </TableCell>
              
              <TableCell>
                <span className="font-medium">{module.install_count || 0}</span>
              </TableCell>
              
              <TableCell>
                {getStatusBadge(module.status, module.is_featured)}
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
                    <DropdownMenuItem asChild>
                      <Link href={`/marketplace/${module.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View in Marketplace
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(module)}>
                      {module.status === "active" ? (
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Module
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
