"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Ticket,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAgencyTickets,
  type AgencyTicket,
} from "@/lib/support/ticket-service";
import { formatDistanceToNow } from "date-fns";

interface TicketsDashboardProps {
  initialTickets: AgencyTicket[];
  stats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Clock;
  }
> = {
  open: { label: "Open", variant: "destructive", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "default", icon: Clock },
  resolved: { label: "Resolved", variant: "secondary", icon: CheckCircle2 },
  closed: { label: "Closed", variant: "outline", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "text-foreground" },
  high: {
    label: "High",
    className: "text-orange-600 dark:text-orange-400 font-medium",
  },
  urgent: {
    label: "Urgent",
    className: "text-red-600 dark:text-red-400 font-bold",
  },
};

export function TicketsDashboard({
  initialTickets,
  stats,
}: TicketsDashboardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFilter(
    newStatus?: string,
    newPriority?: string,
    newSearch?: string,
  ) {
    const s = newStatus ?? statusFilter;
    const p = newPriority ?? priorityFilter;
    const q = newSearch ?? search;

    startTransition(async () => {
      const { tickets: filtered } = await getAgencyTickets({
        status: s !== "all" ? s : undefined,
        priority: p !== "all" ? p : undefined,
        search: q || undefined,
        limit: 50,
      });
      setTickets(filtered);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="h-6 w-6" />
          Support Tickets
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to client support requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-500" />
              Open
            </CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {stats.open}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              In Progress
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
              {stats.inProgress}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Resolved
            </CardDescription>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">
              {stats.resolved}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Closed
            </CardDescription>
            <CardTitle className="text-2xl">{stats.closed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject or ticket number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilter(undefined, undefined, e.target.value);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            handleFilter(v);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            handleFilter(undefined, v);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      <div className="space-y-2">
        {isPending && (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        )}
        {!isPending && tickets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No tickets found</h3>
              <p className="text-muted-foreground text-sm">
                {statusFilter !== "all" || priorityFilter !== "all" || search
                  ? "Try adjusting your filters."
                  : "When clients submit support tickets, they will appear here."}
              </p>
            </CardContent>
          </Card>
        )}
        {!isPending &&
          tickets.map((ticket) => {
            const statusInfo =
              statusConfig[ticket.status || "open"] || statusConfig.open;
            const priorityInfo =
              priorityConfig[ticket.priority || "normal"] ||
              priorityConfig.normal;
            const StatusIcon = statusInfo.icon;

            return (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          {ticket.ticketNumber}
                        </span>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        <span className={`text-xs ${priorityInfo.className}`}>
                          {priorityInfo.label}
                        </span>
                      </div>
                      <h3 className="font-medium truncate">{ticket.subject}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.clientName || "Unknown Client"}
                        </span>
                        {ticket.siteName && <span>{ticket.siteName}</span>}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.messageCount}
                        </span>
                        {ticket.createdAt && (
                          <span>
                            {formatDistanceToNow(new Date(ticket.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    {ticket.assignedToName && (
                      <div className="text-xs text-muted-foreground hidden md:block">
                        <span className="block text-right">Assigned to</span>
                        <span className="block text-right font-medium text-foreground">
                          {ticket.assignedToName}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
