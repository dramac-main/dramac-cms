"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User, Building2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name?: string | null;
  address?: string | null;
}

interface ContactInvoicePickerProps {
  siteId: string;
  value?: string | null;
  onSelect: (contact: {
    contactId: string;
    clientName: string;
    clientEmail: string | null;
    clientPhone: string | null;
    clientAddress: string | null;
  }) => void;
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
          .select("id, name, email, phone, company_name, address")
          .eq("site_id", siteId)
          .order("name", { ascending: true })
          .limit(200);
        setContacts((data as Contact[]) || []);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    }
    loadContacts();
  }, [siteId]);

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
      <PopoverContent className="w-[400px] p-0" align="start">
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
            <CommandGroup>
              {filtered.map((contact) => (
                <CommandItem
                  key={contact.id}
                  onSelect={() => {
                    setSelectedName(contact.name);
                    onSelect({
                      contactId: contact.id,
                      clientName: contact.name,
                      clientEmail: contact.email,
                      clientPhone: contact.phone,
                      clientAddress: contact.address || null,
                    });
                    setOpen(false);
                  }}
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
