import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Plus, 
  Code, 
  Package, 
  Rocket, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getModuleSources } from "@/lib/modules/module-builder";
import { isSuperAdmin } from "@/lib/auth/permissions";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock,
  },
  testing: {
    label: "Testing",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Settings2,
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: Rocket,
  },
  deprecated: {
    label: "Deprecated",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

export default async function ModuleStudioPage() {
  // Check super admin access
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const modules = await getModuleSources();

  const draftCount = modules.filter((m) => m.status === "draft").length;
  const testingCount = modules.filter((m) => m.status === "testing").length;
  const publishedCount = modules.filter((m) => m.status === "published").length;
  const totalCount = modules.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            Module Development Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and deploy modules for the marketplace
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/modules/studio/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Module
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold mt-2">{totalCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-muted-foreground">Draft</span>
            </div>
            <p className="text-3xl font-bold mt-2">{draftCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Testing</span>
            </div>
            <p className="text-3xl font-bold mt-2">{testingCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <p className="text-3xl font-bold mt-2">{publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {totalCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/modules">
              <TrendingUp className="h-4 w-4 mr-2" />
              Module Analytics
            </Link>
          </Button>
        </div>
      )}

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Modules</CardTitle>
          <CardDescription>
            Modules you've created in the development studio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">No modules yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Create your first module to start building features for the marketplace
              </p>
              <Button asChild>
                <Link href="/admin/modules/studio/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Module
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Module</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => {
                    const status = statusConfig[module.status] || statusConfig.draft;
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={module.moduleId}>
                        <TableCell>
                          <Link 
                            href={`/admin/modules/studio/${module.moduleId}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <span className="text-2xl">{module.icon}</span>
                            <div>
                              <p className="font-medium">{module.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {module.slug}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{module.category}</span>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                            {module.latestVersion || "0.0.1"}
                          </code>
                          {module.publishedVersion && module.publishedVersion !== module.latestVersion && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (published: {module.publishedVersion})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`gap-1 ${status.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(module.updatedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/modules/studio/${module.moduleId}`}>
                              Edit
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
