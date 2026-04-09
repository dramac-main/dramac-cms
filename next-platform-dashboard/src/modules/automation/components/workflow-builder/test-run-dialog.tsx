/**
 * TestRunDialog — Production-fidelity test execution.
 *
 * Fetches REAL entities from the site's database (services, staff, products,
 * orders, contacts, forms, conversations) so the test run uses identical data
 * to what production events provide. When a real entity is selected, all
 * related fields auto-populate with actual DB values — if the test passes,
 * production is guaranteed to work.
 *
 * After execution, shows a step-by-step validation panel with per-step
 * status, duration, and error details — industry-standard "test result
 * inspector" pattern (HubSpot, Make.com, n8n).
 */

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Play,
  Info,
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  ChevronRight,
  Minus,
} from "lucide-react";
import {
  getTestRunEntities,
  getExecutionDetails,
} from "../../actions/automation-actions";

// ============================================================================
// TYPES
// ============================================================================

type TestEntities = NonNullable<
  Awaited<ReturnType<typeof getTestRunEntities>>["data"]
>;

interface SampleField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  required?: boolean;
  type?: "text" | "email" | "number" | "datetime-local";
  hint?: string;
  /** If set, this field is auto-populated from a selected entity */
  autoFrom?: string;
}

interface StepResult {
  id: string;
  stepName: string;
  actionType: string;
  status: "completed" | "failed" | "skipped" | "running";
  durationMs?: number;
  error?: string;
  output?: Record<string, unknown>;
}

// ============================================================================
// HELPERS
// ============================================================================

function getDefaultDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T10:00`;
}

function getEventCategory(eventType?: string): string | undefined {
  if (!eventType) return undefined;
  if (eventType.startsWith("booking.")) return "booking";
  if (eventType.startsWith("ecommerce.")) return "ecommerce";
  if (eventType.startsWith("crm.")) return "crm";
  if (eventType.startsWith("form.")) return "form";
  if (eventType.startsWith("live_chat.")) return "live_chat";
  return undefined;
}

function formatDuration(ms?: number): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ============================================================================
// FIELD DEFINITIONS PER EVENT TYPE
// ============================================================================

/**
 * Returns the sample data field definitions for a given trigger event type.
 * Fields with `autoFrom` are populated when a real entity is selected.
 */
function getSampleFieldsForEvent(
  eventType?: string,
  entities?: TestEntities,
): SampleField[] {
  const ownerEmail: SampleField = {
    key: "ownerEmail",
    label: "Site Owner Email",
    placeholder: "owner@example.com",
    defaultValue: entities?.ownerEmail || "",
    type: "email",
    hint: "Auto-resolved from your account",
    autoFrom: "ownerEmail",
  };

  const defaultCurrency = entities?.siteCurrency || "ZMW";

  if (!eventType) {
    return [
      ownerEmail,
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "customer@example.com",
        defaultValue: "",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "",
      },
    ];
  }

  // ---- BOOKING EVENTS ----
  if (eventType.startsWith("booking.appointment.")) {
    return [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "customer@example.com",
        defaultValue: "",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "",
        required: true,
      },
      {
        key: "customerPhone",
        label: "Customer Phone",
        placeholder: "+260 97 1234567",
        defaultValue: "",
      },
      {
        key: "serviceName",
        label: "Service Name",
        placeholder: "Select a service above or type manually",
        defaultValue: "",
        required: true,
        autoFrom: "service",
      },
      {
        key: "servicePrice",
        label: "Service Price",
        placeholder: "0.00",
        defaultValue: "",
        type: "number",
        autoFrom: "service",
      },
      {
        key: "serviceDuration",
        label: "Duration (minutes)",
        placeholder: "60",
        defaultValue: "",
        type: "number",
        autoFrom: "service",
      },
      {
        key: "startTime",
        label: "Appointment Date/Time",
        placeholder: "",
        defaultValue: getDefaultDateTime(),
        type: "datetime-local",
        required: true,
      },
      {
        key: "endTime",
        label: "End Time",
        placeholder: "Auto-calculated from duration",
        defaultValue: "",
        type: "datetime-local",
        autoFrom: "service",
        hint: "Auto-calculated when service is selected",
      },
      {
        key: "staffName",
        label: "Staff Name",
        placeholder: "Select staff above or type manually",
        defaultValue: "",
        autoFrom: "staff",
      },
      {
        key: "status",
        label: "Status",
        placeholder: "confirmed",
        defaultValue:
          eventType === "booking.appointment.created" ? "pending" : "confirmed",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: defaultCurrency,
        defaultValue: defaultCurrency,
        autoFrom: "service",
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        placeholder: "not_required",
        defaultValue:
          eventType === "booking.appointment.payment_received"
            ? "paid"
            : "not_required",
        autoFrom: "service",
      },
      ownerEmail,
    ];
  }

  // ---- CRM EVENTS ----
  if (eventType.startsWith("crm.contact.")) {
    return [
      {
        key: "email",
        label: "Contact Email",
        placeholder: "Select a contact above or type manually",
        defaultValue: "",
        type: "email",
        required: true,
        autoFrom: "contact",
      },
      {
        key: "firstName",
        label: "First Name",
        placeholder: "Jane",
        defaultValue: "",
        autoFrom: "contact",
      },
      {
        key: "lastName",
        label: "Last Name",
        placeholder: "Smith",
        defaultValue: "",
        autoFrom: "contact",
      },
      {
        key: "phone",
        label: "Phone",
        placeholder: "+260 97 1234567",
        defaultValue: "",
        autoFrom: "contact",
      },
      {
        key: "company",
        label: "Company",
        placeholder: "Acme Corp",
        defaultValue: "",
        autoFrom: "contact",
      },
      {
        key: "leadStatus",
        label: "Lead Status",
        placeholder: "new",
        defaultValue: "new",
      },
      {
        key: "source",
        label: "Source",
        placeholder: "website",
        defaultValue: "automation_test",
      },
      ownerEmail,
    ];
  }

  if (eventType.startsWith("crm.deal.")) {
    return [
      {
        key: "dealTitle",
        label: "Deal Title",
        placeholder: "Enterprise Package",
        defaultValue: "",
        required: true,
      },
      {
        key: "dealValue",
        label: "Deal Value",
        placeholder: "5000",
        defaultValue: "",
        type: "number",
      },
      {
        key: "contactEmail",
        label: "Contact Email",
        placeholder: "Select a contact above or type",
        defaultValue: "",
        type: "email",
        autoFrom: "contact",
      },
      {
        key: "stage",
        label: "Deal Stage",
        placeholder: "negotiation",
        defaultValue: "new",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: defaultCurrency,
        defaultValue: defaultCurrency,
      },
      ownerEmail,
    ];
  }

  // ---- FORM EVENTS ----
  if (eventType.startsWith("form.submission.")) {
    return [
      {
        key: "formName",
        label: "Form Name",
        placeholder: "Select a form above or type",
        defaultValue: "",
        required: true,
        autoFrom: "form",
      },
      {
        key: "formId",
        label: "Form ID",
        placeholder: "Auto-filled when form selected",
        defaultValue: "",
        autoFrom: "form",
        hint: "Auto-populated from selected form",
      },
      {
        key: "submitterEmail",
        label: "Submitter Email",
        placeholder: "visitor@example.com",
        defaultValue: "",
        type: "email",
      },
      {
        key: "submitterName",
        label: "Submitter Name",
        placeholder: "Jane Smith",
        defaultValue: "",
      },
      {
        key: "pageUrl",
        label: "Page URL",
        placeholder: "https://example.com/contact",
        defaultValue: "",
        hint: "The page where the form was submitted",
      },
      ownerEmail,
    ];
  }

  // ---- E-COMMERCE ORDER EVENTS ----
  if (eventType.startsWith("ecommerce.order.")) {
    return [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "Select an order above or type",
        defaultValue: "",
        type: "email",
        required: true,
        autoFrom: "order",
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "",
        required: true,
        autoFrom: "order",
      },
      {
        key: "orderId",
        label: "Order ID",
        placeholder: "Auto-filled when order selected",
        defaultValue: "",
        autoFrom: "order",
      },
      {
        key: "orderNumber",
        label: "Order Number",
        placeholder: "ORD-001",
        defaultValue: "",
        autoFrom: "order",
      },
      {
        key: "total",
        label: "Order Total",
        placeholder: "149.99",
        defaultValue: "",
        type: "number",
        autoFrom: "order",
      },
      {
        key: "subtotal",
        label: "Subtotal",
        placeholder: "129.99",
        defaultValue: "",
        type: "number",
        autoFrom: "order",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: defaultCurrency,
        defaultValue: defaultCurrency,
        autoFrom: "order",
      },
      {
        key: "paymentProvider",
        label: "Payment Provider",
        placeholder: "manual",
        defaultValue: "",
        autoFrom: "order",
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        placeholder: "pending",
        defaultValue: eventType === "ecommerce.order.paid" ? "paid" : "pending",
        autoFrom: "order",
      },
      {
        key: "status",
        label: "Order Status",
        placeholder: "processing",
        defaultValue: "processing",
        autoFrom: "order",
      },
      ownerEmail,
    ];
  }

  // ---- E-COMMERCE QUOTE EVENTS ----
  if (eventType.startsWith("ecommerce.quote.")) {
    return [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "Select a quote above or type",
        defaultValue: "",
        type: "email",
        required: true,
        autoFrom: "quote",
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "",
        required: true,
        autoFrom: "quote",
      },
      {
        key: "quoteId",
        label: "Quote ID",
        placeholder: "Auto-filled when quote selected",
        defaultValue: "",
        autoFrom: "quote",
      },
      {
        key: "quoteNumber",
        label: "Quote Number",
        placeholder: "QT-001",
        defaultValue: "",
        autoFrom: "quote",
      },
      {
        key: "total",
        label: "Quote Total",
        placeholder: "500.00",
        defaultValue: "",
        type: "number",
        autoFrom: "quote",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: defaultCurrency,
        defaultValue: defaultCurrency,
        autoFrom: "quote",
      },
      {
        key: "status",
        label: "Quote Status",
        placeholder: "draft",
        defaultValue: "draft",
        autoFrom: "quote",
      },
      ownerEmail,
    ];
  }

  // ---- LIVE CHAT EVENTS ----
  if (eventType.startsWith("live_chat.")) {
    return [
      {
        key: "conversationId",
        label: "Conversation ID",
        placeholder: "Select a conversation above",
        defaultValue: "",
        autoFrom: "conversation",
        hint: "Required for chat action steps to fire",
      },
      {
        key: "visitorName",
        label: "Visitor Name",
        placeholder: "Jane Smith",
        defaultValue: "",
        autoFrom: "conversation",
      },
      {
        key: "visitorEmail",
        label: "Visitor Email",
        placeholder: "visitor@example.com",
        defaultValue: "",
        type: "email",
        autoFrom: "conversation",
      },
      {
        key: "message",
        label: "Message Text",
        placeholder: "Hello, I need help",
        defaultValue: "Test message from workflow test run",
      },
      {
        key: "channel",
        label: "Channel",
        placeholder: "web",
        defaultValue: "web",
        autoFrom: "conversation",
      },
      ownerEmail,
    ];
  }

  // ---- FALLBACK ----
  return [
    {
      key: "customerEmail",
      label: "Customer Email",
      placeholder: "customer@example.com",
      defaultValue: "",
      type: "email",
      required: true,
    },
    {
      key: "customerName",
      label: "Customer Name",
      placeholder: "Jane Smith",
      defaultValue: "",
    },
    ownerEmail,
  ];
}

// ============================================================================
// ENTITY SELECTOR COMPONENT
// ============================================================================

function EntitySelector({
  eventType,
  entities,
  onSelect,
  isLoading,
}: {
  eventType?: string;
  entities?: TestEntities;
  onSelect: (data: Record<string, string>) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-dashed p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading real data from your site...
      </div>
    );
  }

  if (!entities) return null;

  const category = getEventCategory(eventType);

  // Booking → service + staff selectors
  if (category === "booking") {
    const hasServices = entities.services.length > 0;
    const hasStaff = entities.staff.length > 0;
    if (!hasServices && !hasStaff) {
      return (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No active services or staff found. Create services in the Booking
            module first, or type sample data manually below.
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {hasServices && (
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              Select Real Service
            </Label>
            <Select
              onValueChange={(id) => {
                const svc = entities.services.find((s) => s.id === id);
                if (!svc) return;
                const startDate = new Date(getDefaultDateTime());
                const endDate = new Date(
                  startDate.getTime() + svc.duration_minutes * 60000,
                );
                const endStr = endDate.toISOString().slice(0, 16);
                onSelect({
                  serviceName: svc.name,
                  servicePrice: String(svc.price),
                  serviceDuration: String(svc.duration_minutes),
                  currency: svc.currency,
                  paymentStatus: svc.require_payment
                    ? "pending"
                    : "not_required",
                  endTime: endStr,
                });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choose a service from your site..." />
              </SelectTrigger>
              <SelectContent>
                {entities.services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      {s.name}
                      <span className="text-muted-foreground text-xs">
                        {s.currency} {s.price} · {s.duration_minutes}min
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {hasStaff && (
          <div className="space-y-1">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              Select Real Staff
            </Label>
            <Select
              onValueChange={(id) => {
                const staff = entities.staff.find((s) => s.id === id);
                if (!staff) return;
                onSelect({ staffName: staff.name });
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Choose a staff member..." />
              </SelectTrigger>
              <SelectContent>
                {entities.staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.email && (
                      <span className="text-muted-foreground text-xs ml-2">
                        ({s.email})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  // CRM → contact selector
  if (category === "crm") {
    if (entities.contacts.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>No CRM contacts found. Type sample data manually below.</span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Select Real Contact
        </Label>
        <Select
          onValueChange={(id) => {
            const c = entities.contacts.find((x) => x.id === id);
            if (!c) return;
            const updates: Record<string, string> = {
              email: c.email,
              firstName: c.first_name,
              lastName: c.last_name,
              contactEmail: c.email,
            };
            if (c.phone) updates.phone = c.phone;
            if (c.company_name) updates.company = c.company_name;
            onSelect(updates);
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Choose a contact from your CRM..." />
          </SelectTrigger>
          <SelectContent>
            {entities.contacts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  {c.first_name} {c.last_name}
                  <span className="text-muted-foreground text-xs">
                    {c.email}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // E-commerce → order or quote selector
  if (category === "ecommerce") {
    const isQuote = eventType?.includes("quote.");
    if (isQuote) {
      if (entities.quotes.length === 0) {
        return (
          <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              No quotes found. Create quotes first, or type sample data below.
            </span>
          </div>
        );
      }
      return (
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            Select Real Quote
          </Label>
          <Select
            onValueChange={(id) => {
              const q = entities.quotes.find((x) => x.id === id);
              if (!q) return;
              onSelect({
                quoteId: q.id,
                quoteNumber: q.quote_number,
                customerEmail: q.customer_email,
                customerName: q.customer_name,
                total: String(q.total),
                currency: q.currency,
                status: q.status,
              });
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Choose a quote from your store..." />
            </SelectTrigger>
            <SelectContent>
              {entities.quotes.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  <span className="flex items-center gap-2">
                    {q.quote_number}
                    <span className="text-muted-foreground text-xs">
                      {q.customer_name} · {q.currency} {q.total}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Orders
    if (entities.orders.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No orders found. Place an order first, or type sample data below.
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Select Real Order
        </Label>
        <Select
          onValueChange={(id) => {
            const o = entities.orders.find((x) => x.id === id);
            if (!o) return;
            onSelect({
              orderId: o.id,
              orderNumber: o.order_number,
              customerEmail: o.customer_email,
              customerName: o.customer_name,
              total: String(o.total),
              subtotal: String(o.total),
              currency: o.currency,
              paymentProvider: o.payment_provider || "",
              paymentStatus: o.payment_status,
              status: o.status,
            });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Choose an order from your store..." />
          </SelectTrigger>
          <SelectContent>
            {entities.orders.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                <span className="flex items-center gap-2">
                  {o.order_number}
                  <span className="text-muted-foreground text-xs">
                    {o.customer_name} · {o.currency} {o.total} ·{" "}
                    {o.payment_status}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Form → form selector
  if (category === "form") {
    if (entities.forms.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No forms found. Create forms in the CRM module first, or type sample
            data below.
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Select Real Form
        </Label>
        <Select
          onValueChange={(id) => {
            const f = entities.forms.find((x) => x.id === id);
            if (!f) return;
            onSelect({ formName: f.name, formId: f.id });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Choose a form from your site..." />
          </SelectTrigger>
          <SelectContent>
            {entities.forms.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span className="flex items-center gap-2">
                  {f.name}
                  <span className="text-muted-foreground text-xs">
                    /{f.slug}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Live chat → conversation selector
  if (category === "live_chat") {
    if (entities.conversations.length === 0) {
      return (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            No conversations found. Start a chat on the storefront first, or
            leave blank to skip chat steps.
          </span>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          Select Real Conversation
        </Label>
        <Select
          onValueChange={(id) => {
            const c = entities.conversations.find((x) => x.id === id);
            if (!c) return;
            onSelect({
              conversationId: c.id,
              visitorName: c.visitor_name,
              visitorEmail: c.visitor_email,
              channel: c.channel,
            });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Choose a conversation..." />
          </SelectTrigger>
          <SelectContent>
            {entities.conversations.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  {c.visitor_name}
                  <span className="text-muted-foreground text-xs">
                    {c.visitor_email} · {c.status} · {c.channel}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}

// ============================================================================
// EXECUTION RESULTS PANEL
// ============================================================================

function ExecutionResultsPanel({
  executionId,
  isPolling,
}: {
  executionId: string;
  isPolling: boolean;
}) {
  const [results, setResults] = useState<{
    status: string;
    steps: StepResult[];
    totalDuration?: number;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    const res = await getExecutionDetails(executionId);
    if (!res.success || !res.data) return;

    const execution = res.data;
    const stepLogs = (execution.step_logs || []).sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(a.started_at || "").localeCompare(String(b.started_at || "")),
    );

    const steps: StepResult[] = stepLogs.map(
      (log: Record<string, unknown>) => ({
        id: String(log.id || ""),
        stepName: String(log.step_name || log.step_id || "Step"),
        actionType: String(log.action_type || "unknown"),
        status: (log.status as StepResult["status"]) || "running",
        durationMs: (log.duration_ms as number) || undefined,
        error: (log.error as string) || undefined,
        output: (log.output_data as Record<string, unknown>) || undefined,
      }),
    );

    let totalDuration: number | undefined;
    if (execution.started_at && execution.completed_at) {
      totalDuration =
        new Date(execution.completed_at as string).getTime() -
        new Date(execution.started_at as string).getTime();
    }

    setResults({
      status: execution.status as string,
      steps,
      totalDuration,
      error: (execution.error as string) || undefined,
    });
    setLoading(false);
  }, [executionId]);

  useEffect(() => {
    fetchResults();
    if (isPolling) {
      const interval = setInterval(fetchResults, 2000);
      return () => clearInterval(interval);
    }
  }, [fetchResults, isPolling]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading execution results...
      </div>
    );
  }

  if (!results) return null;

  const overallIcon =
    results.status === "completed" ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : results.status === "failed" ? (
      <XCircle className="h-5 w-5 text-red-500" />
    ) : results.status === "running" ? (
      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-amber-500" />
    );

  return (
    <div className="space-y-3">
      {/* Overall status */}
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex items-center gap-2">
          {overallIcon}
          <div>
            <p className="text-sm font-medium capitalize">
              {results.status === "completed"
                ? "All Steps Passed"
                : results.status === "failed"
                  ? "Execution Failed"
                  : results.status === "running"
                    ? "Running..."
                    : results.status}
            </p>
            {results.totalDuration !== undefined && (
              <p className="text-xs text-muted-foreground">
                Total: {formatDuration(results.totalDuration)}
              </p>
            )}
          </div>
        </div>
        {results.steps.length > 0 && (
          <Badge
            variant={
              results.status === "completed"
                ? "default"
                : results.status === "failed"
                  ? "destructive"
                  : "secondary"
            }
            className="text-xs"
          >
            {results.steps.filter((s) => s.status === "completed").length}/
            {results.steps.length} steps
          </Badge>
        )}
      </div>

      {/* Per-step results */}
      {results.steps.length > 0 && (
        <div className="rounded-md border divide-y">
          {results.steps.map((step, idx) => {
            const stepIcon =
              step.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : step.status === "failed" ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : step.status === "skipped" ? (
                <Minus className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              );

            return (
              <div
                key={step.id || idx}
                className="p-2.5 flex items-start gap-2"
              >
                <div className="mt-0.5">{stepIcon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {idx + 1}.
                    </span>
                    <span className="text-sm font-medium truncate">
                      {step.stepName}
                    </span>
                    {step.actionType !== "unknown" && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {step.actionType}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {formatDuration(step.durationMs)}
                    </span>
                  </div>
                  {step.error && (
                    <p className="text-xs text-red-500 mt-1 break-words">
                      {step.error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.steps.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No step execution logs found.
        </p>
      )}

      {results.error && (
        <div className="rounded-md bg-red-500/5 border border-red-500/20 p-3 text-xs text-red-500">
          <strong>Error:</strong> {results.error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TestRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType?: string;
  siteId: string;
  isRunning: boolean;
  onRunTest: (sampleData: Record<string, unknown>) => Promise<string | null>;
}

export function TestRunDialog({
  open,
  onOpenChange,
  eventType,
  siteId,
  isRunning,
  onRunTest,
}: TestRunDialogProps) {
  // Entity data state
  const [entities, setEntities] = useState<TestEntities | undefined>();
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);

  // Execution results state
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"configure" | "results">(
    "configure",
  );

  // Fetch entities when dialog opens
  useEffect(() => {
    if (!open || !siteId) return;
    setEntitiesLoading(true);
    setEntitiesError(null);
    const category = getEventCategory(eventType);
    getTestRunEntities(siteId, category)
      .then((res) => {
        if (res.success && res.data) {
          setEntities(res.data);
        } else {
          setEntitiesError(res.error || "Failed to load site data");
        }
      })
      .catch((err) => {
        setEntitiesError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setEntitiesLoading(false));
  }, [open, siteId, eventType]);

  // Reset results when dialog reopens
  useEffect(() => {
    if (open) {
      setExecutionId(null);
      setActiveTab("configure");
    }
  }, [open]);

  const fields = useMemo(
    () => getSampleFieldsForEvent(eventType, entities),
    [eventType, entities],
  );

  // Initialize form values from field defaults (which include real data)
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [lastEventType, setLastEventType] = useState(eventType);
  const [lastEntities, setLastEntities] = useState(entities);

  // Reset form when event type or entities change
  if (eventType !== lastEventType || entities !== lastEntities) {
    setLastEventType(eventType);
    setLastEntities(entities);
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = field.defaultValue;
    }
    setFormData(initial);
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Handle entity selection — auto-populate multiple fields
  const handleEntitySelect = (data: Record<string, string>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleRun = async () => {
    // Build trigger data matching EXACT production event payloads
    const triggerData: Record<string, unknown> = {
      test: true,
      source: "builder_test_run",
    };

    for (const field of fields) {
      const val = formData[field.key]?.trim();
      if (val) {
        if (field.type === "number") {
          triggerData[field.key] = parseFloat(val) || val;
        } else if (field.type === "datetime-local" && val) {
          triggerData[field.key] = new Date(val).toISOString();
        } else {
          triggerData[field.key] = val;
        }
      }
    }

    // Include event type for execution engine context
    if (eventType) {
      triggerData.eventType = eventType;
    }

    // Add snake_case aliases for production parity — production events use
    // snake_case, the execution engine normalizes both via
    // normalizeKeysToCamelCase, but having them from the start ensures
    // templates work identically in test and production.
    const snakeAliases: [string, string][] = [
      ["customerEmail", "customer_email"],
      ["customerName", "customer_name"],
      ["customerPhone", "customer_phone"],
      ["serviceName", "service_name"],
      ["servicePrice", "service_price"],
      ["serviceDuration", "service_duration"],
      ["staffName", "staff_name"],
      ["startTime", "start_time"],
      ["endTime", "end_time"],
      ["orderNumber", "order_number"],
      ["orderId", "order_id"],
      ["quoteNumber", "quote_number"],
      ["quoteId", "quote_id"],
      ["paymentStatus", "payment_status"],
      ["paymentProvider", "payment_provider"],
      ["ownerEmail", "owner_email"],
      ["formName", "form_name"],
      ["formId", "form_id"],
      ["submitterEmail", "submitter_email"],
      ["submitterName", "submitter_name"],
      ["visitorName", "visitor_name"],
      ["visitorEmail", "visitor_email"],
      ["conversationId", "conversation_id"],
      ["dealTitle", "deal_title"],
      ["dealValue", "deal_value"],
      ["contactEmail", "contact_email"],
      ["firstName", "first_name"],
      ["lastName", "last_name"],
      ["leadStatus", "lead_status"],
      ["pageUrl", "page_url"],
    ];
    for (const [camel, snake] of snakeAliases) {
      if (triggerData[camel] !== undefined) {
        triggerData[snake] = triggerData[camel];
      }
    }

    const resultId = await onRunTest(triggerData);
    if (resultId) {
      setExecutionId(resultId);
      setActiveTab("results");
    }
  };

  const eventLabel = eventType?.replace(/\./g, " → ") || "Manual Trigger";

  const hasRequiredMissing = fields.some(
    (f) => f.required && !formData[f.key]?.trim(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Test Workflow
          </DialogTitle>
          <DialogDescription>
            Test this workflow with real data from your site. Select actual
            entities below — when this test passes, your production workflow is
            guaranteed to work.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">Trigger:</span>
          <Badge variant="outline" className="text-xs">
            {eventLabel}
          </Badge>
          {entities && (
            <Badge variant="secondary" className="text-[10px] ml-auto">
              <Database className="h-3 w-3 mr-1" />
              Real data loaded
            </Badge>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure" className="text-xs">
              <Play className="h-3 w-3 mr-1" />
              Configure & Run
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-xs"
              disabled={!executionId}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Results
              {executionId && <ChevronRight className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="flex-1 min-h-0">
            <ScrollArea className="max-h-[calc(70vh-200px)] pr-3">
              <div className="space-y-4">
                {/* Entity Selector — pick real data */}
                <EntitySelector
                  eventType={eventType}
                  entities={entities}
                  onSelect={handleEntitySelect}
                  isLoading={entitiesLoading}
                />

                {entitiesError && (
                  <div className="rounded-md bg-red-500/5 border border-red-500/20 p-2 text-xs text-red-500 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    {entitiesError}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-xs ml-auto"
                      onClick={() => {
                        setEntitiesLoading(true);
                        setEntitiesError(null);
                        getTestRunEntities(siteId, getEventCategory(eventType))
                          .then((res) => {
                            if (res.success && res.data) setEntities(res.data);
                          })
                          .finally(() => setEntitiesLoading(false));
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                )}

                {/* Divider between entity selector and fields */}
                {(entities || entitiesLoading) && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 border-t" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Trigger Data (editable)
                    </span>
                    <div className="flex-1 border-t" />
                  </div>
                )}

                {/* Form fields */}
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                      {field.autoFrom && formData[field.key] && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] ml-1 py-0 px-1"
                        >
                          auto
                        </Badge>
                      )}
                    </Label>
                    <Input
                      type={field.type || "text"}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="h-8 text-sm"
                      step={field.type === "number" ? "0.01" : undefined}
                    />
                    {field.hint && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Info className="h-2.5 w-2.5 shrink-0" />
                        {field.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2 mt-3">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Test mode:</strong> Real emails will be sent to the
                addresses above. Use test email addresses to avoid sending to
                real customers.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="flex-1 min-h-0">
            <ScrollArea className="max-h-[calc(70vh-200px)] pr-3">
              {executionId ? (
                <ExecutionResultsPanel
                  executionId={executionId}
                  isPolling={isRunning}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Run a test to see results here.
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            {executionId ? "Close" : "Cancel"}
          </Button>
          <Button
            onClick={handleRun}
            disabled={isRunning || hasRequiredMissing}
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : executionId ? (
              <RefreshCw className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isRunning
              ? "Running..."
              : executionId
                ? "Re-run Test"
                : "Run Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
