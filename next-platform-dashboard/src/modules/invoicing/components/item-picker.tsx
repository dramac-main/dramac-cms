"use client";

import { useEffect, useState, useMemo } from "react";
import {
  getItems,
  getEcommerceProducts,
  getBookingServices,
} from "../actions/item-actions";
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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag, CalendarDays } from "lucide-react";

interface ItemPickerProps {
  siteId: string;
  onSelect: (item: Item) => void;
}

interface ExternalProduct {
  id: string;
  name: string;
  base_price: number;
  sku: string | null;
  description: string | null;
}

interface ExternalService {
  id: string;
  name: string;
  price: number | null;
  description: string | null;
  duration_minutes: number;
}

export function ItemPicker({ siteId, onSelect }: ItemPickerProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [ecomProducts, setEcomProducts] = useState<ExternalProduct[]>([]);
  const [bookingServices, setBookingServices] = useState<ExternalService[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getItems(siteId, { isActive: true })
      .then(setItems)
      .catch(() => setItems([]));
    getEcommerceProducts(siteId)
      .then(setEcomProducts)
      .catch(() => setEcomProducts([]));
    getBookingServices(siteId)
      .then(setBookingServices)
      .catch(() => setBookingServices([]));
  }, [siteId]);

  const q = search.toLowerCase();

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, search, q]);

  const filteredProducts = useMemo(() => {
    if (!search) return ecomProducts;
    return ecomProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
    );
  }, [ecomProducts, search, q]);

  const filteredServices = useMemo(() => {
    if (!search) return bookingServices;
    return bookingServices.filter((s) =>
      s.name.toLowerCase().includes(q),
    );
  }, [bookingServices, search, q]);

  const handleSelectProduct = (product: ExternalProduct) => {
    const asItem: Item = {
      id: `ecom-${product.id}`,
      siteId,
      name: product.name,
      description: product.description,
      type: "product",
      unitPrice: product.base_price,
      unit: null,
      sku: product.sku,
      taxRateId: null,
      category: "E-Commerce",
      sortOrder: 0,
      isActive: true,
      metadata: { source: "ecommerce", source_id: product.id },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSelect(asItem);
    setOpen(false);
  };

  const handleSelectService = (service: ExternalService) => {
    const asItem: Item = {
      id: `book-${service.id}`,
      siteId,
      name: service.name,
      description: service.description
        ? `${service.description} (${service.duration_minutes} min)`
        : `${service.duration_minutes} min service`,
      type: "service",
      unitPrice: service.price ?? 0,
      unit: null,
      sku: null,
      taxRateId: null,
      category: "Booking",
      sortOrder: 0,
      isActive: true,
      metadata: { source: "booking", source_id: service.id },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSelect(asItem);
    setOpen(false);
  };

  const totalResults =
    filteredItems.length + filteredProducts.length + filteredServices.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add from Catalog
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[440px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search items, products, services…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {totalResults === 0 && (
              <CommandEmpty>No items found.</CommandEmpty>
            )}

            {filteredItems.length > 0 && (
              <CommandGroup heading="Invoicing Items">
                {filteredItems.map((item) => (
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
            )}

            {filteredProducts.length > 0 && (
              <>
                {filteredItems.length > 0 && <CommandSeparator />}
                <CommandGroup heading="E-Commerce Products">
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={`ecom-${product.id}`}
                      onSelect={() => handleSelectProduct(product)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{product.name}</div>
                          {product.sku && (
                            <div className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium ml-2">
                        {formatInvoiceAmount(product.base_price)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredServices.length > 0 && (
              <>
                {(filteredItems.length > 0 || filteredProducts.length > 0) && (
                  <CommandSeparator />
                )}
                <CommandGroup heading="Booking Services">
                  {filteredServices.map((service) => (
                    <CommandItem
                      key={`book-${service.id}`}
                      onSelect={() => handleSelectService(service)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{service.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {service.duration_minutes} min
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium ml-2">
                        {formatInvoiceAmount(service.price ?? 0)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
