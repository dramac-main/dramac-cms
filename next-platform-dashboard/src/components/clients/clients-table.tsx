import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ClientActions } from "./client-actions";
import type { ClientFilters, ClientStatus, ClientWithSiteCount } from "@/types/client";
import { formatDistanceToNow } from "date-fns";

interface ClientsTableProps {
  filters?: Partial<ClientFilters>;
}

const statusColors: Record<ClientStatus, string> = {
  active: "bg-success text-success-foreground",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-danger text-danger-foreground",
};

export async function ClientsTable({ filters }: ClientsTableProps) {
  const clients = await getClients(filters);

  if (!clients || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-lg font-semibold">No clients yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Get started by creating your first client.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sites</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const initials = client.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <TableRow key={client.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      {client.email && (
                        <div className="text-sm text-muted-foreground">
                          {client.email}
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  {client.company || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[client.status as ClientStatus]}>
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell>{client.site_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <ClientActions client={client} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
