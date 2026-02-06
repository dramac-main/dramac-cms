/**
 * Booking Module - Studio Integration
 * 
 * Exports Studio components and custom fields for the visual editor.
 * These components appear in the Studio component library when
 * the Booking module is installed on a site.
 */

import React from "react";
import type { ModuleStudioExports, CustomFieldEditorProps } from "@/types/studio-module";

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
 * For selecting a service in the properties panel
 */
function ServiceSelectorField(props: CustomFieldEditorProps) {
  const { value, onChange, siteId } = props;
  
  // Simple select for now - would be enhanced with actual service data
  return React.createElement(
    "div",
    { className: "space-y-2" },
    React.createElement(
      "select",
      {
        value: (value as string) || "",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null),
        className: "w-full px-3 py-2 border rounded-md bg-background",
      },
      React.createElement("option", { value: "" }, "Select a service..."),
      React.createElement(
        "option",
        { value: "placeholder" },
        siteId ? `Site: ${siteId.slice(0, 8)}…` : "No site selected"
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      "Choose a service to pre-select for this block"
    )
  );
}

/**
 * Staff Selector Field Editor
 * For selecting a staff member in the properties panel
 */
function StaffSelectorField(props: CustomFieldEditorProps) {
  const { value, onChange, siteId } = props;
  
  // Simple select for now - would be enhanced with actual staff data
  return React.createElement(
    "div",
    { className: "space-y-2" },
    React.createElement(
      "select",
      {
        value: (value as string) || "",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null),
        className: "w-full px-3 py-2 border rounded-md bg-background",
      },
      React.createElement("option", { value: "" }, "Any available staff"),
      React.createElement(
        "option",
        { value: "placeholder" },
        siteId ? `Site: ${siteId.slice(0, 8)}…` : "No site selected"
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      "Choose a staff member to pre-select for this block"
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
