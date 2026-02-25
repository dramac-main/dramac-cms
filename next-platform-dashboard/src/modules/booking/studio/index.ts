/**
 * Booking Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 * These components appear in the Studio component library when
 * the Booking module is installed on a site.
 */

"use client";

import React, { useState, useEffect } from "react";
import type { ModuleStudioExports, CustomFieldEditorProps } from "@/types/studio-module";
import { getPublicServices, getPublicStaff } from "../actions/public-booking-actions";

// Import components
import { 
  BookingCalendarBlock, 
  bookingCalendarDefinition 
} from "./components/BookingCalendarBlock";
import { 
  ServiceSelectorBlock, 
  serviceSelectorDefinition 
} from "./components/ServiceSelectorBlock";
import { 
  BookingFormBlock, 
  bookingFormDefinition 
} from "./components/BookingFormBlock";
import { 
  StaffGridBlock, 
  staffGridDefinition 
} from "./components/StaffGridBlock";
import { 
  BookingWidgetBlock, 
  bookingWidgetDefinition 
} from "./components/BookingWidgetBlock";
import {
  BookingEmbedBlock,
  bookingEmbedDefinition,
} from "./components/BookingEmbedBlock";

// Re-export components for external use
export { BookingCalendarBlock } from "./components/BookingCalendarBlock";
export { ServiceSelectorBlock } from "./components/ServiceSelectorBlock";
export { BookingFormBlock } from "./components/BookingFormBlock";
export { StaffGridBlock } from "./components/StaffGridBlock";
export { BookingWidgetBlock } from "./components/BookingWidgetBlock";
export { BookingEmbedBlock } from "./components/BookingEmbedBlock";

// =============================================================================
// CUSTOM FIELD EDITORS
// =============================================================================

/**
 * Service Selector Field Editor
 * For selecting a service in the properties panel — fetches real services
 */
function ServiceSelectorField(props: CustomFieldEditorProps) {
  const { value, onChange, siteId } = props;
  const [services, setServices] = useState<{ id: string; name: string; price: number | null; duration_minutes: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getPublicServices(siteId)
      .then((data: any[]) => {
        setServices(data.map((s: any) => ({ id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  return React.createElement(
    "div",
    { className: "space-y-2" },
    React.createElement(
      "select",
      {
        value: (value as string) || "",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null),
        className: "w-full px-3 py-2 border rounded-md bg-background text-sm",
        disabled: loading,
      },
      React.createElement("option", { value: "" }, loading ? "Loading services..." : "All services (default)"),
      ...services.map((s) =>
        React.createElement(
          "option",
          { key: s.id, value: s.id },
          `${s.name} — ${s.duration_minutes}min${s.price != null ? ` · ${s.price}` : ''}`
        )
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      services.length > 0
        ? `${services.length} service${services.length !== 1 ? 's' : ''} available`
        : siteId ? "No services found — add services in Booking module" : "Save site first to load services"
    )
  );
}

/**
 * Staff Selector Field Editor
 * For selecting a staff member in the properties panel — fetches real staff
 */
function StaffSelectorField(props: CustomFieldEditorProps) {
  const { value, onChange, siteId } = props;
  const [staffList, setStaffList] = useState<{ id: string; name: string; email: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    getPublicStaff(siteId)
      .then((data: any[]) => {
        setStaffList(data.map((s: any) => ({ id: s.id, name: s.name, email: s.email })));
      })
      .catch(() => setStaffList([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  return React.createElement(
    "div",
    { className: "space-y-2" },
    React.createElement(
      "select",
      {
        value: (value as string) || "",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null),
        className: "w-full px-3 py-2 border rounded-md bg-background text-sm",
        disabled: loading,
      },
      React.createElement("option", { value: "" }, loading ? "Loading staff..." : "Any available staff"),
      ...staffList.map((s) =>
        React.createElement(
          "option",
          { key: s.id, value: s.id },
          `${s.name}${s.email ? ` (${s.email})` : ''}`
        )
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      staffList.length > 0
        ? `${staffList.length} staff member${staffList.length !== 1 ? 's' : ''} available`
        : siteId ? "No staff found — add staff in Booking module" : "Save site first to load staff"
    )
  );
}

// =============================================================================
// STUDIO COMPONENTS
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  // Complete Booking Widget - All-in-one booking flow
  BookingWidget: {
    ...bookingWidgetDefinition,
    render: BookingWidgetBlock,
  },
  
  // Booking Embed - Embeddable iframe widget for pages
  BookingEmbed: {
    ...bookingEmbedDefinition,
    render: BookingEmbedBlock,
  },
  
  // Booking Calendar - Date and time selection
  BookingCalendar: {
    ...bookingCalendarDefinition,
    render: BookingCalendarBlock,
    fields: {
      ...bookingCalendarDefinition.fields,
      serviceId: {
        type: "custom" as const,
        customType: "booking:service-selector",
        label: "Service",
        description: "Filter availability by service",
      },
      staffId: {
        type: "custom" as const,
        customType: "booking:staff-selector",
        label: "Staff Member",
        description: "Filter availability by staff member",
      },
    },
  },
  
  // Service Selector - Display bookable services
  BookingServiceSelector: {
    ...serviceSelectorDefinition,
    render: ServiceSelectorBlock,
  },
  
  // Booking Form - Customer details form
  BookingForm: {
    ...bookingFormDefinition,
    render: BookingFormBlock,
    fields: {
      ...bookingFormDefinition.fields,
      serviceId: {
        type: "custom" as const,
        customType: "booking:service-selector",
        label: "Service",
        description: "Pre-select a service",
      },
      staffId: {
        type: "custom" as const,
        customType: "booking:staff-selector",
        label: "Staff Member",
        description: "Pre-select a staff member",
      },
    },
  },
  
  // Staff Grid - Display team members
  BookingStaffGrid: {
    ...staffGridDefinition,
    render: StaffGridBlock,
  },
};

// =============================================================================
// CUSTOM FIELDS
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  "booking:service-selector": ServiceSelectorField,
  "booking:staff-selector": StaffSelectorField,
};

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "Booking",
  icon: "Calendar",
  category: "interactive",
};

// Export as default for compatibility
export default {
  studioComponents,
  studioFields,
  studioMetadata,
};
