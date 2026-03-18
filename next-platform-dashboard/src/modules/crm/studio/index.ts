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

import type { ComponentType } from "react";
import type { ModuleStudioExports } from "@/types/studio-module";

// Placeholder render — CRM form components are rendered via module integration
const CRMFormPlaceholder: ComponentType<Record<string, unknown>> = () => null;

// =============================================================================
// STUDIO COMPONENTS — CRM-Connected Forms
// =============================================================================

export const studioComponents: ModuleStudioExports["studioComponents"] = {
  CRMContactForm: {
    type: "CRMContactForm",
    label: "CRM Contact Form",
    category: "forms",
    icon: "UserPlus",
    description: "Contact form that creates CRM contacts and triggers automations",
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
      borderRadius: { type: "select", label: "Border Radius", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
      shadow: { type: "select", label: "Shadow", options: [
        { value: "none", label: "None" },
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
        { value: "xl", label: "Extra Large" },
      ]},
    },
    render: CRMFormPlaceholder,
  },

  CRMLeadCaptureForm: {
    type: "CRMLeadCaptureForm",
    label: "Lead Capture Form",
    category: "forms",
    icon: "Target",
    description: "Minimal lead capture form for landing pages — creates CRM leads",
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
      layout: { type: "select", label: "Layout", options: [
        { value: "horizontal", label: "Horizontal" },
        { value: "vertical", label: "Vertical" },
        { value: "card", label: "Card" },
      ]},
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
    },
    render: CRMFormPlaceholder,
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
      layout: { type: "select", label: "Layout", options: [
        { value: "inline", label: "Inline" },
        { value: "stacked", label: "Stacked" },
        { value: "card", label: "Card" },
      ]},
      backgroundColor: { type: "color", label: "Background" },
      buttonColor: { type: "color", label: "Button Color" },
      buttonTextColor: { type: "color", label: "Button Text" },
    },
    render: CRMFormPlaceholder,
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
