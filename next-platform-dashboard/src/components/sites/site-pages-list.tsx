import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Plus, MoreVertical, Pencil, Trash2, Home, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Page {
  id: string;
  name: string;
  slug: string;
  is_homepage: boolean | null;
  created_at: string | null;
}

interface SitePagesListProps {
  siteId: string;
  pages: Page[];
}

export function SitePagesList({ siteId, pages }: SitePagesListProps) {
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No pages yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Create the first page for this site.
        </p>
        <Link href={`/dashboard/sites/${siteId}/pages/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Page
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Pages</h3>
          <Link href={`/dashboard/sites/${siteId}/pages/new`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {page.is_homepage ? (
                      <Home className="h-4 w-4 text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Link
                      href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}
                      className="font-medium hover:underline"
                    >
                      {page.name}
                    </Link>
                    {page.is_homepage && (
                      <Badge variant="outline" className="text-xs">
                        Homepage
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {page.slug}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {page.created_at 
                    ? formatDistanceToNow(new Date(page.created_at), { addSuffix: true })
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/sites/${siteId}/editor?page=${page.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {!page.is_homepage && (
                        <DropdownMenuItem className="text-danger">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
