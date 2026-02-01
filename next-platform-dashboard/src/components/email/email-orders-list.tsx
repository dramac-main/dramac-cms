"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Mail, 
  MoreHorizontal, 
  ExternalLink, 
  Settings, 
  Users, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { EmailOrder } from "@/lib/resellerclub/email/types";

interface EmailOrdersListProps {
  orders: (EmailOrder & {
    domain?: { id: string; domain_name: string; status: string } | null;
    client?: { id: string; name: string } | null;
  })[];
}

export function EmailOrdersList({ orders }: EmailOrdersListProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Email Orders</h3>
          <p className="text-muted-foreground text-center mb-4">
            Purchase business email to add professional email addresses to your domains.
          </p>
          <Button asChild>
            <Link href="/dashboard/email/purchase">Purchase Email</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {orders.map((order) => (
        <EmailOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function EmailOrderCard({ order }: { order: EmailOrdersListProps['orders'][0] }) {
  const accountUsage = (order.used_accounts / order.number_of_accounts) * 100;
  const expiryDate = new Date(order.expiry_date);
  const isExpiringSoon = expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const isExpired = expiryDate < new Date();

  const getStatusBadge = () => {
    switch (order.status) {
      case 'Active':
        if (isExpired) {
          return <Badge variant="destructive">Expired</Badge>;
        }
        if (isExpiringSoon) {
          return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expiring Soon</Badge>;
        }
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'Suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{order.status}</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  href={`/dashboard/email/${order.id}`}
                  className="text-lg font-medium hover:underline"
                >
                  {order.domain_name}
                </Link>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {order.client && (
                  <span>Client: {order.client.name}</span>
                )}
                <span>Plan: Business Email</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/email/${order.id}`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/email/${order.id}/accounts`}>
                  <Users className="h-4 w-4 mr-2" />
                  Accounts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a 
                  href="https://mail.titan.email" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Webmail
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          {/* Accounts Usage */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email Accounts</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {order.used_accounts} / {order.number_of_accounts}
              </span>
            </div>
            <Progress value={accountUsage} className="h-1 mt-1" />
          </div>

          {/* Expiry */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Expires</p>
            <div className="flex items-center gap-1">
              {isExpired ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : isExpiringSoon ? (
                <Clock className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span className="font-medium">
                {format(expiryDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
            <p className="font-medium">
              ${(order.retail_price / 12).toFixed(2)}/mo
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/email/${order.id}/accounts`}>
                <Users className="h-4 w-4 mr-1" />
                Accounts
              </Link>
            </Button>
            {isExpiringSoon && (
              <Button size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Renew
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
