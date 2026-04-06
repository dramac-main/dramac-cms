/**
 * CRM Module - Studio Integration
 *
 * Registers CRM-connected components for the Studio/Website Builder.
 * These replace the static contact forms with fully functional forms
 * that create CRM contacts and trigger automations.
 *
 * Industry-leader pattern (HubSpot, GoHighLevel):
 * Website Form → API → CRM Contact → Lead Score → Automation Trigger
 */

import type { ModuleStudioExports } from "@/types/studio-module";
import {
  CRMContactFormRender,
  CRMLeadCaptureFormRender,
  CRMNewsletterFormRender,
  CRMCustomFormRender,
} from "./renders";

// =============================================================================
// STUDIO COMPONENTS — CRM-Connected Forms
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  CRMContactForm: {
    type: "CRMContactForm",
    label: "CRM Contact Form",
    category: "forms",
    icon: "UserPlus",
    description:
      "Contact form that creates CRM contacts and triggers automations",
    defaultProps: {
      title: "Contact Us",
      subtitle: "Fill out the form below and we'll get back to you shortly.",
      nameLabel: "Full Name",
      emailLabel: "Email Address",
      phoneLabel: "Phone Number",
      messageLabel: "Message",
      submitText: "Send Message",
      successMessage: "Thank you! We'll be in touch soon.",
      showPhone: true,
      showCompany: false,
      showSubject: true,
      backgroundColor: "#ffffff",
      buttonColor: "",
      buttonTextColor: "",
      borderRadius: "xl",
      shadow: "lg",
    },
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      nameLabel: { type: "text", label: "Name Label" },
      emailLabel: { type: "text", label: "Email Label" },
      phoneLabel: { type: "text", label: "Phone Label" },
      messageLabel: { type: "text", label: "Message Label" },
      submitText: { type: "text", label: "Button Text" },
      successMessage: { type: "text", label: "Success Message" },
      showPhone: { type: "toggle", label: "Show Phone" },
      showCompany: { type: "toggle", label: "Show Company" },
      showSubject: { type: "toggle", label: "Show Subject" },
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
      textColor: { type: "color", label: "Text Color" },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
    },
    render: CRMContactFormRender,
  },

  CRMLeadCaptureForm: {
    type: "CRMLeadCaptureForm",
    label: "Lead Capture Form",
    category: "forms",
    icon: "Target",
    description:
      "Minimal lead capture form for landing pages — creates CRM leads",
    defaultProps: {
      title: "Get Started",
      subtitle: "Enter your details to get a free consultation.",
      submitText: "Get Started",
      successMessage: "Thank you! We'll contact you shortly.",
      showPhone: true,
      showCompany: true,
      layout: "horizontal",
      backgroundColor: "#f8fafc",
      buttonColor: "",
      buttonTextColor: "",
    },
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      submitText: { type: "text", label: "Button Text" },
      successMessage: { type: "text", label: "Success Message" },
      showPhone: { type: "toggle", label: "Show Phone" },
      showCompany: { type: "toggle", label: "Show Company" },
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" },
          { value: "card", label: "Card" },
        ],
      },
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
    },
    render: CRMLeadCaptureFormRender,
  },

  CRMNewsletterForm: {
    type: "CRMNewsletterForm",
    label: "Newsletter Signup",
    category: "forms",
    icon: "Mail",
    description: "Email newsletter signup that adds subscribers to CRM",
    defaultProps: {
      title: "Stay Updated",
      subtitle: "Subscribe to our newsletter for the latest updates.",
      submitText: "Subscribe",
      successMessage: "You're subscribed! Check your inbox.",
      layout: "inline",
      backgroundColor: "transparent",
      buttonColor: "",
      buttonTextColor: "",
    },
    fields: {
      title: { type: "text", label: "Title" },
      subtitle: { type: "text", label: "Subtitle" },
      submitText: { type: "text", label: "Button Text" },
      successMessage: { type: "text", label: "Success Message" },
      layout: {
        type: "select",
        label: "Layout",
        options: [
          { value: "inline", label: "Inline" },
          { value: "stacked", label: "Stacked" },
          { value: "card", label: "Card" },
        ],
      },
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
    },
    render: CRMNewsletterFormRender,
  },

  CRMCustomForm: {
    type: "CRMCustomForm",
    label: "Custom CRM Form",
    category: "forms",
    icon: "FileEdit",
    description:
      "Render a custom form built in the CRM Form Builder — fully dynamic fields, contact mapping, and deal creation",
    defaultProps: {
      formSlug: "",
      title: "",
      subtitle: "",
      backgroundColor: "#ffffff",
      buttonColor: "",
      buttonTextColor: "",
      textColor: "#1e293b",
      borderRadius: "xl",
      shadow: "lg",
    },
    fields: {
      formSlug: {
        type: "text",
        label: "Form Slug",
        description: "Enter the slug of the form created in CRM → Forms",
      },
      title: {
        type: "text",
        label: "Title Override",
        description: "Leave empty to use the form's own title",
      },
      subtitle: { type: "text", label: "Subtitle Override" },
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
      textColor: { type: "color", label: "Text Color" },
      borderRadius: {
        type: "select",
        label: "Border Radius",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
      shadow: {
        type: "select",
        label: "Shadow",
        options: [
          { value: "none", label: "None" },
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
          { value: "xl", label: "Extra Large" },
        ],
      },
    },
    render: CRMCustomFormRender,
  },
};

// =============================================================================
// CUSTOM FIELDS (Module-specific field editors)
// =============================================================================

export const studioFields: ModuleStudioExports["studioFields"] = {
  // Can be extended for CRM-specific field types in forms
};

// =============================================================================
// METADATA
// =============================================================================

export const studioMetadata: ModuleStudioExports["studioMetadata"] = {
  name: "CRM",
  icon: "Users",
  category: "forms",
};

// Export as default for compatibility
export default {
  studioComponents,
  studioFields,
  studioMetadata,
};
