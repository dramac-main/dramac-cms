"use client";

import { useState, useEffect } from "react";
import {
  getBookingServices,
  importBookingServices,
} from "../actions/item-actions";
import { AmountDisplay } from "./amount-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarDays, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportBookingServicesProps {
  siteId: string;
  onImported?: () => void;
}

export function ImportBookingServices({
  siteId,
  onImported,
}: ImportBookingServicesProps) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<
    {
      id: string;
      name: string;
      price: number | null;
      description: string | null;
      duration_minutes: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getBookingServices(siteId)
      .then((data) => {
        setServices(data);
        setSelected(new Set());
        setSearch("");
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [open, siteId]);

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const result = await importBookingServices(siteId, [...selected]);
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`${result.imported} imported`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped (duplicate)`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} errors`);
      toast.success(`Import complete: ${parts.join(", ")}`);
      setOpen(false);
      onImported?.();
    } catch {
      toast.error("Failed to import services");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarDays className="h-4 w-4 mr-1.5" />
          Import from Bookings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Booking Services</DialogTitle>
          <DialogDescription>
            Select services to add to your invoice items catalog.
            Already-imported services will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 max-h-[400px] border rounded-md p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {services.length === 0
                ? "No active booking services found."
                : "No services match your search."}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2 py-1 border-b mb-1">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Select all ({filtered.length})
                </span>
              </div>
              {filtered.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(service.id)}
                    onCheckedChange={() => toggle(service.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {service.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.duration_minutes} min
                      {service.description ? ` · ${service.description}` : ""}
                    </p>
                  </div>
                  <AmountDisplay amount={service.price ?? 0} />
                </label>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
              >
                {importing && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Import {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
