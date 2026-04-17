"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building2, ChevronsUpDown, Check, UserPlus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInvoiceAmount } from "../lib/invoicing-utils";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name?: string | null;
  address?: string | null;
  // Enriched fields from CRM
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  custom_fields?: Record<string, unknown> | null;
  // Outstanding balance from invoices
  outstanding?: number;
}

export interface ContactInvoiceData {
  contactId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  clientTaxId: string | null;
  preferredCurrency: string | null;
  paymentTerms: string | null;
}

interface ContactInvoicePickerProps {
  siteId: string;
  value?: string | null;
  onSelect: (contact: ContactInvoiceData) => void;
}

export function ContactInvoicePicker({
  siteId,
  value,
  onSelect,
}: ContactInvoicePickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await (supabase as any)
          .from("mod_crmmod01_contacts")
          .select(
            "id, name, email, phone, company_name, address, address_line_1, address_line_2, city, state, postal_code, country, custom_fields",
          )
          .eq("site_id", siteId)
          .order("name", { ascending: true })
          .limit(200);
        const contactList = (data as Contact[]) || [];

        // Fetch outstanding balances per contact
        if (contactList.length > 0) {
          const contactIds = contactList.map((c) => c.id);
          const { data: invoices } = await (supabase as any)
            .from("mod_invmod01_invoices")
            .select("contact_id, amount_due")
            .in("contact_id", contactIds)
            .in("status", ["sent", "viewed", "partial", "overdue"]);

          if (invoices) {
            const balanceMap = new Map<string, number>();
            for (const inv of invoices as { contact_id: string; amount_due: number }[]) {
              balanceMap.set(
                inv.contact_id,
                (balanceMap.get(inv.contact_id) || 0) + (inv.amount_due || 0),
              );
            }
            for (const c of contactList) {
              c.outstanding = balanceMap.get(c.id) || 0;
            }
          }
        }

        setContacts(contactList);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [siteId]);

  // Recent contacts: those with outstanding invoices, sorted by amount
  const recentContacts = useMemo(
    () =>
      contacts
        .filter((c) => (c.outstanding || 0) > 0)
        .sort((a, b) => (b.outstanding || 0) - (a.outstanding || 0))
        .slice(0, 5),
    [contacts],
  );

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company_name?.toLowerCase().includes(q),
    );
  }, [contacts, search]);

  const handleSelect = (contact: Contact) => {
    setSelectedName(contact.name);

    // Build structured address from CRM fields
    const addressParts = [
      contact.address_line_1,
      contact.address_line_2,
      [contact.city, contact.state, contact.postal_code]
        .filter(Boolean)
        .join(", "),
      contact.country,
    ].filter(Boolean);
    const fullAddress =
      addressParts.length > 0
        ? addressParts.join("\n")
        : contact.address || null;

    // Extract invoice-relevant fields from custom_fields
    const cf = contact.custom_fields || {};
    const taxId =
      (cf.tax_id as string) ||
      (cf.tpin as string) ||
      (cf.vat_number as string) ||
      null;
    const preferredCurrency = (cf.preferred_currency as string) || null;
    const paymentTerms = (cf.payment_terms as string) || null;

    onSelect({
      contactId: contact.id,
      clientName: contact.name,
      clientEmail: contact.email,
      clientPhone: contact.phone,
      clientAddress: fullAddress,
      clientTaxId: taxId,
      preferredCurrency,
      paymentTerms,
    });
    setOpen(false);
  };

  const renderContactItem = (contact: Contact) => (
    <CommandItem
      key={contact.id}
      onSelect={() => handleSelect(contact)}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === contact.id ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium truncate">
            {contact.name}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
          {contact.email && <span>{contact.email}</span>}
          {contact.company_name && (
            <span className="flex items-center gap-0.5">
              <Building2 className="h-3 w-3" />
              {contact.company_name}
            </span>
          )}
        </div>
      </div>
      {(contact.outstanding || 0) > 0 && (
        <Badge variant="outline" className="ml-2 text-xs shrink-0 gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          {formatInvoiceAmount(contact.outstanding!)}
        </Badge>
      )}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selectedName || value || "Select a contact…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[440px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search contacts…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading…" : "No contacts found."}
            </CommandEmpty>
            {/* Recent contacts with outstanding balances */}
            {!search && recentContacts.length > 0 && (
              <>
                <CommandGroup heading="Outstanding Invoices">
                  {recentContacts.map(renderContactItem)}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            <CommandGroup heading={search ? "Results" : "All Contacts"}>
              {filtered.map(renderContactItem)}
            </CommandGroup>
            {/* Create New Contact link */}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  window.open(
                    `/dashboard/sites/${siteId}/crm/contacts/new`,
                    "_blank",
                  );
                  setOpen(false);
                }}
                className="text-primary"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create New Contact
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
