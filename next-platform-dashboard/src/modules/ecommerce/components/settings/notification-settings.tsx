/**
 * Notification Settings Component
 *
 * Phase ECOM-03: Settings & Configuration Center
 * Phase MSG-TEMPLATES: Full email template customization for all 38 template types
 *
 * Email templates and notification configuration. Site owners can customize
 * subject/body for every automated email using merge variables ({{var}}).
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Save,
  Edit2,
  Mail,
  Package,
  CreditCard,
  RotateCcw,
  ShoppingCart,
  AlertTriangle,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  HelpCircle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import type {
  NotificationSettings,
  NotificationTemplate,
  NotificationTemplateType,
  NotificationTemplateCategory,
  NotificationTemplateConfig,
  NotificationChannels,
} from "../../types/ecommerce-types";
import {
  getSettingsTab,
  updateNotificationSettings,
} from "../../actions/settings-actions";

interface NotificationSettingsFormProps {
  siteId: string;
  agencyId: string;
}

// ============================================================================
// TEMPLATE CONFIGURATIONS — all 38 customizable email types
// ============================================================================

const TEMPLATE_CONFIGS: Record<
  NotificationTemplateType,
  NotificationTemplateConfig
> = {
  // Booking
  booking_confirmation_customer: {
    label: "Booking Confirmation (Customer)",
    description: "Sent to customer when a booking is placed",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      { key: "time", label: "Booking Time", example: "10:00 AM" },
      { key: "staff_name", label: "Staff Name", example: "Sarah" },
      { key: "price", label: "Price", example: "K 250.00" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_confirmation_owner: {
    label: "Booking Confirmation (Owner)",
    description: "Sent to business owner when a booking is placed",
    category: "booking",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "customer_email",
        label: "Customer Email",
        example: "john@example.com",
      },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      { key: "time", label: "Booking Time", example: "10:00 AM" },
      { key: "staff_name", label: "Staff Name", example: "Sarah" },
      { key: "price", label: "Price", example: "K 250.00" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_cancelled_customer: {
    label: "Booking Cancelled (Customer)",
    description: "Sent to customer when their booking is cancelled",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      {
        key: "reason",
        label: "Cancellation Reason",
        example: "Schedule conflict",
      },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_cancelled_owner: {
    label: "Booking Cancelled (Owner)",
    description: "Sent to business owner when a booking is cancelled",
    category: "booking",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      {
        key: "reason",
        label: "Cancellation Reason",
        example: "Schedule conflict",
      },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_confirmed_customer: {
    label: "Booking Confirmed (Customer)",
    description: "Sent to customer when booking is confirmed by staff",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      { key: "time", label: "Booking Time", example: "10:00 AM" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_confirmed_owner: {
    label: "Booking Confirmed (Owner)",
    description: "Sent to business owner when a booking is confirmed",
    category: "booking",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      { key: "time", label: "Booking Time", example: "10:00 AM" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_completed_customer: {
    label: "Booking Completed (Customer)",
    description: "Sent to customer when their appointment is marked complete",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_completed_owner: {
    label: "Booking Completed (Owner)",
    description: "Sent to business owner when a booking is completed",
    category: "booking",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_no_show_customer: {
    label: "Booking No-Show (Customer)",
    description: "Sent to customer when they miss their appointment",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "date", label: "Booking Date", example: "15 Jan 2026" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_payment_received_customer: {
    label: "Booking Payment Received (Customer)",
    description: "Sent to customer when booking payment is confirmed",
    category: "booking",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "amount", label: "Payment Amount", example: "K 250.00" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },
  booking_payment_received_owner: {
    label: "Booking Payment Received (Owner)",
    description: "Sent to business owner when booking payment is received",
    category: "booking",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "service_name",
        label: "Service Name",
        example: "Deep Tissue Massage",
      },
      { key: "amount", label: "Payment Amount", example: "K 250.00" },
      { key: "store_name", label: "Business Name", example: "Jesto Spa" },
    ],
  },

  // E-Commerce Orders
  order_confirmation_customer: {
    label: "Order Confirmation (Customer)",
    description: "Sent to customer when an order is placed",
    category: "orders",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "order_total", label: "Order Total", example: "K 1,250.00" },
      {
        key: "order_details",
        label: "Order Items Summary",
        example: "2x Widget, 1x Gadget",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  order_confirmation_owner: {
    label: "Order Confirmation (Owner)",
    description: "Sent to store owner when a new order is placed",
    category: "orders",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "customer_email",
        label: "Customer Email",
        example: "john@example.com",
      },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "order_total", label: "Order Total", example: "K 1,250.00" },
      {
        key: "order_details",
        label: "Order Items Summary",
        example: "2x Widget, 1x Gadget",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  order_shipped_customer: {
    label: "Order Shipped",
    description: "Sent to customer when order is shipped",
    category: "orders",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      {
        key: "tracking_number",
        label: "Tracking Number",
        example: "TRK123456",
      },
      {
        key: "tracking_url",
        label: "Tracking URL",
        example: "https://track.example.com/TRK123456",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  order_delivered_customer: {
    label: "Order Delivered",
    description: "Sent to customer when order is delivered",
    category: "orders",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  order_cancelled_customer: {
    label: "Order Cancelled (Customer)",
    description: "Sent to customer when their order is cancelled",
    category: "orders",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "reason", label: "Cancellation Reason", example: "Out of stock" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  order_cancelled_owner: {
    label: "Order Cancelled (Owner)",
    description: "Sent to store owner when an order is cancelled",
    category: "orders",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      {
        key: "reason",
        label: "Cancellation Reason",
        example: "Customer request",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },

  // Payments
  payment_received_customer: {
    label: "Payment Received",
    description: "Sent to customer when payment is confirmed",
    category: "payments",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "amount", label: "Payment Amount", example: "K 1,250.00" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  payment_proof_uploaded_owner: {
    label: "Payment Proof Uploaded",
    description: "Sent to store owner when customer uploads payment proof",
    category: "payments",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "amount", label: "Order Total", example: "K 1,250.00" },
      { key: "file_name", label: "Proof File Name", example: "receipt.jpg" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  payment_proof_rejected_customer: {
    label: "Payment Proof Rejected",
    description: "Sent to customer when their payment proof is rejected",
    category: "payments",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      {
        key: "rejection_reason",
        label: "Rejection Reason",
        example: "Image too blurry",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  refund_issued_customer: {
    label: "Refund Issued",
    description: "Sent to customer when a refund is processed",
    category: "payments",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "order_number", label: "Order Number", example: "ORD-001" },
      { key: "refund_amount", label: "Refund Amount", example: "K 500.00" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },

  // Stock & Cart
  low_stock_admin: {
    label: "Low Stock Alert",
    description: "Sent to store owner when product stock is low",
    category: "stock",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "product_name", label: "Product Name", example: "Premium Widget" },
      { key: "current_stock", label: "Current Stock", example: "3" },
      { key: "threshold", label: "Low Stock Threshold", example: "5" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  back_in_stock_customer: {
    label: "Back in Stock",
    description: "Sent to customers when a product they wanted is restocked",
    category: "stock",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "product_name", label: "Product Name", example: "Premium Widget" },
      {
        key: "product_url",
        label: "Product URL",
        example: "https://store.example.com/widget",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  abandoned_cart_customer: {
    label: "Abandoned Cart",
    description: "Sent to customer when they leave items in cart",
    category: "stock",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "cart_items",
        label: "Cart Items Summary",
        example: "2x Widget, 1x Gadget",
      },
      { key: "cart_total", label: "Cart Total", example: "K 750.00" },
      {
        key: "cart_url",
        label: "Cart URL",
        example: "https://store.example.com/cart",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },

  // Quotes
  quote_sent_customer: {
    label: "Quote Sent (Customer)",
    description: "Sent to customer when a quote is ready",
    category: "quotes",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "quote_total", label: "Quote Total", example: "K 5,000.00" },
      { key: "expiry_date", label: "Expiry Date", example: "30 Jan 2026" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_request_customer: {
    label: "Quote Request Received (Customer)",
    description:
      "Confirmation sent to customer after submitting a quote request",
    category: "quotes",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "item_count", label: "Number of Items", example: "3" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_reminder_customer: {
    label: "Quote Reminder",
    description: "Reminder sent to customer about a pending quote",
    category: "quotes",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "quote_total", label: "Quote Total", example: "K 5,000.00" },
      { key: "expiry_date", label: "Expiry Date", example: "30 Jan 2026" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_request_owner: {
    label: "Quote Request (Owner)",
    description: "Sent to store owner when a customer requests a quote",
    category: "quotes",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      {
        key: "customer_email",
        label: "Customer Email",
        example: "john@example.com",
      },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "item_count", label: "Number of Items", example: "3" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_accepted_owner: {
    label: "Quote Accepted (Owner)",
    description: "Sent to store owner when a customer accepts a quote",
    category: "quotes",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "quote_total", label: "Quote Total", example: "K 5,000.00" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_accepted_customer: {
    label: "Quote Accepted (Customer)",
    description: "Confirmation sent to customer when their quote is accepted",
    category: "quotes",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "quote_total", label: "Quote Total", example: "K 5,000.00" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },
  quote_rejected_owner: {
    label: "Quote Rejected (Owner)",
    description: "Sent to store owner when a customer rejects a quote",
    category: "quotes",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "quote_number", label: "Quote Number", example: "QT-001" },
      { key: "reason", label: "Rejection Reason", example: "Too expensive" },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },

  // Forms
  form_submission_owner: {
    label: "Form Submission",
    description: "Sent to site owner when a form is submitted",
    category: "forms",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "form_name", label: "Form Name", example: "Contact Form" },
      { key: "submitter_name", label: "Submitter Name", example: "John Doe" },
      {
        key: "submitter_email",
        label: "Submitter Email",
        example: "john@example.com",
      },
      {
        key: "form_data",
        label: "Form Fields Summary",
        example: "Name: John...",
      },
      { key: "store_name", label: "Site Name", example: "My Site" },
    ],
  },

  // Reviews
  review_request_customer: {
    label: "Review Request",
    description: "Sent to customer asking for a product review",
    category: "reviews",
    defaultSendTo: "customer",
    mergeVariables: [
      { key: "customer_name", label: "Customer Name", example: "John Doe" },
      { key: "product_name", label: "Product Name", example: "Premium Widget" },
      {
        key: "review_url",
        label: "Review URL",
        example: "https://store.example.com/review",
      },
      { key: "store_name", label: "Store Name", example: "My Store" },
    ],
  },

  // Chat
  chat_transcript: {
    label: "Chat Transcript",
    description: "Chat conversation transcript sent to customer/agent",
    category: "chat",
    defaultSendTo: "both",
    mergeVariables: [
      { key: "visitor_name", label: "Visitor Name", example: "John Doe" },
      {
        key: "transcript",
        label: "Chat Transcript",
        example: "[conversation text]",
      },
      { key: "store_name", label: "Site Name", example: "My Site" },
    ],
  },
  chat_missed_notification: {
    label: "Missed Chat",
    description: "Sent to site owner when a chat was missed",
    category: "chat",
    defaultSendTo: "admin",
    mergeVariables: [
      { key: "visitor_name", label: "Visitor Name", example: "John Doe" },
      {
        key: "visitor_message",
        label: "Visitor Message",
        example: "Hi, I need help...",
      },
      { key: "store_name", label: "Site Name", example: "My Site" },
    ],
  },
};

// Category display configuration
const CATEGORY_CONFIG: Record<
  NotificationTemplateCategory,
  { label: string; icon: typeof Mail; description: string }
> = {
  booking: {
    label: "Booking",
    icon: Calendar,
    description: "Appointment and booking notifications",
  },
  orders: {
    label: "Orders",
    icon: Package,
    description: "Order lifecycle notifications",
  },
  payments: {
    label: "Payments",
    icon: CreditCard,
    description: "Payment and refund notifications",
  },
  stock: {
    label: "Stock & Cart",
    icon: ShoppingCart,
    description: "Inventory and cart notifications",
  },
  quotes: {
    label: "Quotes",
    icon: FileText,
    description: "Quotation notifications",
  },
  forms: {
    label: "Forms",
    icon: HelpCircle,
    description: "Form submission notifications",
  },
  reviews: {
    label: "Reviews",
    icon: Star,
    description: "Review request notifications",
  },
  chat: {
    label: "Live Chat",
    icon: MessageSquare,
    description: "Chat-related email notifications",
  },
};

// Build default templates for ALL types
const DEFAULT_CHANNELS: NotificationChannels = {
  email: true,
  inapp: true,
  chat: true,
};

const DEFAULT_TEMPLATES: NotificationTemplate[] = (
  Object.keys(TEMPLATE_CONFIGS) as NotificationTemplateType[]
).map((type) => ({
  id: `template-${type}`,
  type,
  enabled: true,
  subject: TEMPLATE_CONFIGS[type].label,
  body: `Hi {{customer_name}},\n\n{{store_name}} notification.\n\nBest regards,\n{{store_name}}`,
  send_to: TEMPLATE_CONFIGS[type].defaultSendTo,
  channels: { ...DEFAULT_CHANNELS },
}));

/** Group templates by category */
function groupByCategory(
  templates: NotificationTemplate[],
): Record<NotificationTemplateCategory, NotificationTemplate[]> {
  const groups: Record<NotificationTemplateCategory, NotificationTemplate[]> = {
    booking: [],
    orders: [],
    payments: [],
    stock: [],
    quotes: [],
    forms: [],
    reviews: [],
    chat: [],
  };

  for (const t of templates) {
    const config = TEMPLATE_CONFIGS[t.type];
    if (config) {
      groups[config.category].push(t);
    }
  }

  return groups;
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NotificationTemplate | null;
  onSave: (template: NotificationTemplate) => void;
}

function TemplateDialog({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateDialogProps) {
  const [formData, setFormData] = useState<Partial<NotificationTemplate>>(() =>
    template
      ? {
          ...template,
          channels: template.channels
            ? { ...template.channels }
            : { ...DEFAULT_CHANNELS },
        }
      : {
          subject: "",
          body: "",
          send_to: "customer" as const,
          enabled: true,
          channels: { ...DEFAULT_CHANNELS },
        },
  );

  const handleSave = () => {
    if (!template || !formData.subject || !formData.body) {
      toast.error("Please fill in all fields");
      return;
    }

    onSave({
      ...template,
      subject: formData.subject || "",
      body: formData.body || "",
      send_to: formData.send_to || "customer",
      enabled: formData.enabled ?? true,
      channels: formData.channels || { ...DEFAULT_CHANNELS },
    });
    onOpenChange(false);
  };

  const config = template ? TEMPLATE_CONFIGS[template.type] : null;
  const mergeVars = config?.mergeVariables || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {config?.label} Template</DialogTitle>
          <DialogDescription>{config?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Enable this notification</Label>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enabled: checked })
              }
            />
          </div>

          {/* Delivery Channels */}
          <div className="space-y-2">
            <Label>Delivery Channels</Label>
            <p className="text-xs text-muted-foreground">
              Choose which channels this notification is sent through
            </p>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.channels?.email ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      channels: {
                        ...(formData.channels || DEFAULT_CHANNELS),
                        email: !!checked,
                      },
                    })
                  }
                />
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.channels?.inapp ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      channels: {
                        ...(formData.channels || DEFAULT_CHANNELS),
                        inapp: !!checked,
                      },
                    })
                  }
                />
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">In-App</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.channels?.chat ?? true}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      channels: {
                        ...(formData.channels || DEFAULT_CHANNELS),
                        chat: !!checked,
                      },
                    })
                  }
                />
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Chat</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="send_to">Send To</Label>
            <Select
              value={formData.send_to}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  send_to: value as NotificationTemplate["send_to"],
                })
              }
            >
              <SelectTrigger id="send_to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer Only</SelectItem>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="both">Both Customer & Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder={`e.g. ${config?.label} - {{order_number}}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              placeholder="Email content with {{merge_variables}}..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Merge Variables Reference */}
          {mergeVars.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">Available Merge Variables</p>
              <p className="text-xs text-muted-foreground mb-2">
                Use these in your subject and body. They will be replaced with
                actual values when sent.
              </p>
              <div className="grid gap-1.5">
                {mergeVars.map((v) => (
                  <div key={v.key} className="flex items-center gap-2 text-xs">
                    <code className="bg-background px-1.5 py-0.5 rounded border font-mono text-primary">{`{{${v.key}}}`}</code>
                    <span className="text-muted-foreground">{v.label}</span>
                    <span className="text-muted-foreground/60 ml-auto">
                      e.g. {v.example}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotificationSettingsForm({
  siteId,
  agencyId,
}: NotificationSettingsFormProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettingsTab<NotificationSettings>(
          siteId,
          "notifications",
        );
        // Merge saved templates with default templates to ensure all types exist
        const savedTemplateMap = new Map(
          (data.templates || []).map((t) => [t.type, t]),
        );
        data.templates = DEFAULT_TEMPLATES.map((defaultT) => {
          const saved = savedTemplateMap.get(defaultT.type);
          return saved ? { ...defaultT, ...saved } : defaultT;
        });
        setSettings(data);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load notification settings");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [siteId]);

  const updateField = <K extends keyof NotificationSettings>(
    field: K,
    value: NotificationSettings[K],
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const updateAdminNotification = (key: string, value: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      admin_notifications: { ...settings.admin_notifications, [key]: value },
    });
    setHasChanges(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = (template: NotificationTemplate) => {
    if (!settings) return;
    setSettings({
      ...settings,
      templates: settings.templates.map((t) =>
        t.id === template.id ? template : t,
      ),
    });
    setHasChanges(true);
  };

  const toggleTemplate = (templateId: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      templates: settings.templates.map((t) =>
        t.id === templateId ? { ...t, enabled: !t.enabled } : t,
      ),
    });
    setHasChanges(true);
  };

  const toggleChannel = (
    templateId: string,
    channel: keyof NotificationChannels,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      templates: settings.templates.map((t) => {
        if (t.id !== templateId) return t;
        const channels = t.channels || { ...DEFAULT_CHANNELS };
        return {
          ...t,
          channels: { ...channels, [channel]: !channels[channel] },
        };
      }),
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const result = await updateNotificationSettings(
        siteId,
        agencyId,
        settings,
      );
      if (result.success) {
        toast.success("Notification settings saved successfully");
        setHasChanges(false);
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure your store email settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.email_from_name}
                onChange={(e) => updateField("email_from_name", e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_address">From Email</Label>
              <Input
                id="from_address"
                type="email"
                value={settings.email_from_address}
                onChange={(e) =>
                  updateField("email_from_address", e.target.value)
                }
                placeholder="noreply@mystore.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="header_logo">Header Logo URL</Label>
            <Input
              id="header_logo"
              value={settings.email_header_logo || ""}
              onChange={(e) => updateField("email_header_logo", e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={settings.email_footer_text}
              onChange={(e) => updateField("email_footer_text", e.target.value)}
              placeholder="© 2026 My Store. All rights reserved."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>Get notified about store activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Order</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a new order is placed
              </p>
            </div>
            <Switch
              checked={settings.admin_notifications.new_order}
              onCheckedChange={(checked) =>
                updateAdminNotification("new_order", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock</Label>
              <p className="text-sm text-muted-foreground">
                Notify when products are running low
              </p>
            </div>
            <Switch
              checked={settings.admin_notifications.low_stock}
              onCheckedChange={(checked) =>
                updateAdminNotification("low_stock", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Review</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a product review is submitted
              </p>
            </div>
            <Switch
              checked={settings.admin_notifications.new_review}
              onCheckedChange={(checked) =>
                updateAdminNotification("new_review", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Refund Request</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a refund is requested
              </p>
            </div>
            <Switch
              checked={settings.admin_notifications.refund_request}
              onCheckedChange={(checked) =>
                updateAdminNotification("refund_request", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Templates — Grouped by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize all automated email notifications. Use{" "}
            {`{{merge_variables}}`} to personalize content. Changes here
            override the default templates — disable a template to stop that
            email from sending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {(
              Object.entries(groupByCategory(settings.templates)) as [
                NotificationTemplateCategory,
                NotificationTemplate[],
              ][]
            ).map(([category, templates]) => {
              if (templates.length === 0) return null;
              const catConfig = CATEGORY_CONFIG[category];
              const CatIcon = catConfig.icon;
              const enabledCount = templates.filter((t) => t.enabled).length;

              return (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <CatIcon className="h-4 w-4" />
                      <span>{catConfig.label}</span>
                      <Badge variant="outline" className="ml-1">
                        {enabledCount}/{templates.length}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {catConfig.description}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {templates.map((template) => {
                        const tConfig = TEMPLATE_CONFIGS[template.type];
                        return (
                          <div
                            key={template.id}
                            className="flex items-center justify-between rounded-lg border px-4 py-3"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {tConfig.label}
                                </p>
                                <Badge
                                  variant={
                                    template.enabled ? "default" : "secondary"
                                  }
                                  className="shrink-0"
                                >
                                  {template.enabled ? "Active" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tConfig.description}
                              </p>
                              {template.subject &&
                                template.subject !== tConfig.label && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-medium">
                                      Subject:
                                    </span>{" "}
                                    {template.subject}
                                  </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <TooltipProvider delayDuration={200}>
                                <div className="flex items-center gap-1 mr-2 border-r pr-3">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleChannel(template.id, "email")
                                        }
                                        className={`p-1 rounded transition-colors ${
                                          (template.channels?.email ?? true)
                                            ? "text-primary hover:text-primary/80"
                                            : "text-muted-foreground/30 hover:text-muted-foreground/50"
                                        }`}
                                      >
                                        <Mail className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>
                                        Email{" "}
                                        {(template.channels?.email ?? true)
                                          ? "ON"
                                          : "OFF"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleChannel(template.id, "inapp")
                                        }
                                        className={`p-1 rounded transition-colors ${
                                          (template.channels?.inapp ?? true)
                                            ? "text-primary hover:text-primary/80"
                                            : "text-muted-foreground/30 hover:text-muted-foreground/50"
                                        }`}
                                      >
                                        <Bell className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>
                                        In-App{" "}
                                        {(template.channels?.inapp ?? true)
                                          ? "ON"
                                          : "OFF"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleChannel(template.id, "chat")
                                        }
                                        className={`p-1 rounded transition-colors ${
                                          (template.channels?.chat ?? true)
                                            ? "text-primary hover:text-primary/80"
                                            : "text-muted-foreground/30 hover:text-muted-foreground/50"
                                        }`}
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>
                                        Chat{" "}
                                        {(template.channels?.chat ?? true)
                                          ? "ON"
                                          : "OFF"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                              <Switch
                                checked={template.enabled}
                                onCheckedChange={() =>
                                  toggleTemplate(template.id)
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <TemplateDialog
        key={editingTemplate?.id || "new"}
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
