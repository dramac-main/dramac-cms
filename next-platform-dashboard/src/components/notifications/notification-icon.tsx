"use client";

import {
  Rocket,
  Pencil,
  User,
  Mail,
  PartyPopper,
  Hand,
  CreditCard,
  AlertTriangle,
  RefreshCw,
  CircleX,
  MessageCircle,
  AtSign,
  Lock,
  Megaphone,
  Calendar,
  CircleCheck,
  Ban,
  ShoppingCart,
  Package,
  FileText,
  Check,
  Info,
  Handshake,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Maps notification types to Lucide icon components.
 * Replaces the old emoji-based notification icons.
 */
const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  site_published: Rocket,
  site_updated: Pencil,
  client_created: User,
  client_updated: User,
  team_invite: Mail,
  team_joined: Handshake,
  team_left: Hand,
  payment_success: CreditCard,
  payment_failed: AlertTriangle,
  subscription_renewed: RefreshCw,
  subscription_cancelled: CircleX,
  comment_added: MessageCircle,
  mention: AtSign,
  security_alert: Lock,
  system: Megaphone,
  // Booking & E-Commerce
  new_booking: Calendar,
  booking_confirmed: CircleCheck,
  booking_cancelled: Ban,
  new_order: ShoppingCart,
  order_shipped: Package,
  order_delivered: Check,
  form_submission: FileText,
  info: Info,
};

interface NotificationIconProps {
  type: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const containerSizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

/**
 * Renders a proper Lucide line icon for a notification type,
 * inside a subtle rounded container.
 */
export function NotificationIcon({ type, className, size = "md" }: NotificationIconProps) {
  const Icon = NOTIFICATION_ICONS[type] || Bell;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-muted shrink-0",
        containerSizes[size],
        className
      )}
    >
      <Icon className={cn(sizeClasses[size], "text-muted-foreground")} strokeWidth={1.5} />
    </div>
  );
}

/**
 * Returns the Lucide icon component for a notification type.
 * For use when only the icon component is needed (no container).
 */
export function getNotificationIcon(type: string): LucideIcon {
  return NOTIFICATION_ICONS[type] || Bell;
}
