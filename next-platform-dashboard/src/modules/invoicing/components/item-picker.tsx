"use client";

import { useEffect, useState, useMemo } from "react";
import { getItems } from "../actions/item-actions";
import type { Item } from "../types";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { ITEM_TYPE_LABELS } from "../lib/invoicing-constants";
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
import { Plus } from "lucide-react";

interface ItemPickerProps {
  siteId: string;
  onSelect: (item: Item) => void;
}

export function ItemPicker({ siteId, onSelect }: ItemPickerProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getItems(siteId, { isActive: true })
      .then(setItems)
      .catch(() => setItems([]));
  }, [siteId]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add from Catalog
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search items…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>{ITEM_TYPE_LABELS[item.type]}</span>
                      {item.sku && <span>SKU: {item.sku}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-medium ml-2">
                    {formatInvoiceAmount(item.unitPrice)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
