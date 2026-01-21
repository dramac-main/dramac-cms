/**
 * Module Template Registry
 * Phase EM-22: Module Templates Library
 *
 * Defines the template registry with all available module templates
 * organized by category (basic, business, industry).
 */

export interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  category: "basic" | "business" | "industry";
  tags: string[];

  // Preview
  thumbnail: string;
  screenshots: string[];

  // Contents
  files: TemplateFile[];
  dependencies: string[];

  // Customization
  variables: TemplateVariable[];

  // Metadata
  complexity: "beginner" | "intermediate" | "advanced";
  estimatedSetupTime: string;
  features: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: "static" | "template";
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "select" | "boolean" | "number";
  default?: string | number | boolean;
  options?: { label: string; value: string | number | boolean }[];
  required?: boolean;
  description?: string;
}

export const MODULE_TEMPLATES: ModuleTemplate[] = [
  // ============= BASIC TEMPLATES =============
  {
    id: "blank",
    name: "Blank Module",
    description: "Start from scratch with minimal setup",
    category: "basic",
    tags: ["starter", "minimal"],
    thumbnail: "/templates/modules/blank.png",
    screenshots: [],
    complexity: "beginner",
    estimatedSetupTime: "5 minutes",
    features: ["Basic config", "Empty dashboard"],
    dependencies: ["@dramac/sdk"],
    variables: [
      { name: "moduleName", label: "Module Name", type: "text", required: true },
      { name: "description", label: "Description", type: "text" },
    ],
    files: [], // Defined in templates/blank/
  },

  {
    id: "data-list",
    name: "Data List",
    description: "CRUD interface for managing a list of items",
    category: "basic",
    tags: ["crud", "list", "table"],
    thumbnail: "/templates/modules/data-list.png",
    screenshots: [
      "/templates/modules/data-list-1.png",
      "/templates/modules/data-list-2.png",
    ],
    complexity: "beginner",
    estimatedSetupTime: "10 minutes",
    features: ["Data table", "Search", "Pagination", "Add/Edit/Delete"],
    dependencies: ["@dramac/sdk", "@tanstack/react-table"],
    variables: [
      { name: "moduleName", label: "Module Name", type: "text", required: true },
      {
        name: "itemName",
        label: "Item Name (singular)",
        type: "text",
        required: true,
        default: "item",
      },
      {
        name: "itemNamePlural",
        label: "Item Name (plural)",
        type: "text",
        required: true,
        default: "items",
      },
      {
        name: "fields",
        label: "Custom Fields",
        type: "text",
        description: "Comma-separated field names",
        default: "name,description,status",
      },
    ],
    files: [],
  },

  {
    id: "form",
    name: "Form Builder",
    description: "Dynamic form with validation and submission handling",
    category: "basic",
    tags: ["form", "input", "validation"],
    thumbnail: "/templates/modules/form.png",
    screenshots: [],
    complexity: "beginner",
    estimatedSetupTime: "10 minutes",
    features: ["Form builder", "Validation", "Submit handling", "Field types"],
    dependencies: ["@dramac/sdk", "react-hook-form", "zod"],
    variables: [
      { name: "moduleName", label: "Module Name", type: "text", required: true },
      {
        name: "formFields",
        label: "Form Fields",
        type: "text",
        description: "Comma-separated field names",
        default: "name,email,message",
      },
    ],
    files: [],
  },

  {
    id: "dashboard",
    name: "Analytics Dashboard",
    description: "Charts and metrics display",
    category: "basic",
    tags: ["analytics", "charts", "metrics"],
    thumbnail: "/templates/modules/dashboard.png",
    screenshots: [],
    complexity: "intermediate",
    estimatedSetupTime: "15 minutes",
    features: ["Charts", "KPI cards", "Date filters", "Export"],
    dependencies: ["@dramac/sdk", "recharts", "date-fns"],
    variables: [
      { name: "moduleName", label: "Module Name", type: "text", required: true },
      {
        name: "chartTypes",
        label: "Chart Types",
        type: "select",
        options: [
          { label: "Line Charts", value: "line" },
          { label: "Bar Charts", value: "bar" },
          { label: "Pie Charts", value: "pie" },
          { label: "All", value: "all" },
        ],
        default: "all",
      },
    ],
    files: [],
  },

  {
    id: "crud",
    name: "Full CRUD",
    description: "Complete CRUD operations with advanced features",
    category: "basic",
    tags: ["crud", "database", "api"],
    thumbnail: "/templates/modules/crud.png",
    screenshots: [],
    complexity: "intermediate",
    estimatedSetupTime: "15 minutes",
    features: [
      "Create/Read/Update/Delete",
      "Soft delete",
      "Audit trail",
      "Bulk operations",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table"],
    variables: [
      { name: "moduleName", label: "Module Name", type: "text", required: true },
      {
        name: "entityName",
        label: "Entity Name",
        type: "text",
        required: true,
        default: "record",
      },
      {
        name: "enableSoftDelete",
        label: "Enable Soft Delete",
        type: "boolean",
        default: true,
      },
      {
        name: "enableAudit",
        label: "Enable Audit Trail",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  // ============= BUSINESS TEMPLATES =============
  {
    id: "crm",
    name: "CRM System",
    description: "Full customer relationship management",
    category: "business",
    tags: ["crm", "contacts", "deals", "sales"],
    thumbnail: "/templates/modules/crm.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "30 minutes",
    features: [
      "Contact management",
      "Company management",
      "Deal pipeline",
      "Activity tracking",
      "Email integration",
      "Reporting",
    ],
    dependencies: [
      "@dramac/sdk",
      "recharts",
      "@tanstack/react-table",
      "date-fns",
    ],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "CRM",
      },
      {
        name: "enableDeals",
        label: "Enable Deals/Pipeline",
        type: "boolean",
        default: true,
      },
      {
        name: "enableCompanies",
        label: "Enable Companies",
        type: "boolean",
        default: true,
      },
      {
        name: "enableActivities",
        label: "Enable Activities",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "booking",
    name: "Booking System",
    description: "Appointment scheduling and calendar",
    category: "business",
    tags: ["booking", "scheduling", "calendar", "appointments"],
    thumbnail: "/templates/modules/booking.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "25 minutes",
    features: [
      "Service management",
      "Staff scheduling",
      "Calendar view",
      "Online booking widget",
      "Reminders",
      "Payment integration",
    ],
    dependencies: ["@dramac/sdk", "date-fns", "@fullcalendar/react"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Booking",
      },
      {
        name: "enablePayments",
        label: "Enable Payments",
        type: "boolean",
        default: false,
      },
      {
        name: "enableStaff",
        label: "Multi-staff support",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "ecommerce",
    name: "E-commerce Store",
    description: "Product catalog and shopping cart",
    category: "business",
    tags: ["ecommerce", "shop", "products", "cart"],
    thumbnail: "/templates/modules/ecommerce.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "35 minutes",
    features: [
      "Product catalog",
      "Shopping cart",
      "Checkout",
      "Order management",
      "Inventory sync",
      "Payment processing",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table", "stripe"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Store",
      },
      {
        name: "enableCart",
        label: "Enable Shopping Cart",
        type: "boolean",
        default: true,
      },
      {
        name: "enableCheckout",
        label: "Enable Checkout",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "inventory",
    name: "Inventory Management",
    description: "Track products and stock levels",
    category: "business",
    tags: ["inventory", "stock", "products", "warehouse"],
    thumbnail: "/templates/modules/inventory.png",
    screenshots: [],
    complexity: "intermediate",
    estimatedSetupTime: "20 minutes",
    features: [
      "Product catalog",
      "Stock tracking",
      "Low stock alerts",
      "Barcode support",
      "Multiple locations",
      "Stock adjustments",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Inventory",
      },
      {
        name: "enableLocations",
        label: "Multiple Locations",
        type: "boolean",
        default: false,
      },
      {
        name: "enableBarcodes",
        label: "Barcode Support",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "invoicing",
    name: "Invoicing System",
    description: "Create and manage invoices and payments",
    category: "business",
    tags: ["invoicing", "billing", "payments", "accounting"],
    thumbnail: "/templates/modules/invoicing.png",
    screenshots: [],
    complexity: "intermediate",
    estimatedSetupTime: "25 minutes",
    features: [
      "Invoice creation",
      "Payment tracking",
      "Client management",
      "Recurring invoices",
      "PDF export",
      "Email sending",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table", "date-fns"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Invoicing",
      },
      {
        name: "enableRecurring",
        label: "Recurring Invoices",
        type: "boolean",
        default: true,
      },
      {
        name: "enablePayments",
        label: "Online Payments",
        type: "boolean",
        default: false,
      },
    ],
    files: [],
  },

  {
    id: "helpdesk",
    name: "Helpdesk / Ticketing",
    description: "Support ticket management system",
    category: "business",
    tags: ["helpdesk", "tickets", "support", "customer service"],
    thumbnail: "/templates/modules/helpdesk.png",
    screenshots: [],
    complexity: "intermediate",
    estimatedSetupTime: "20 minutes",
    features: [
      "Ticket management",
      "Priority levels",
      "Assignment",
      "SLA tracking",
      "Knowledge base",
      "Canned responses",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Helpdesk",
      },
      {
        name: "enableSLA",
        label: "Enable SLA Tracking",
        type: "boolean",
        default: true,
      },
      {
        name: "enableKnowledgeBase",
        label: "Knowledge Base",
        type: "boolean",
        default: false,
      },
    ],
    files: [],
  },

  // ============= INDUSTRY TEMPLATES =============
  {
    id: "restaurant",
    name: "Restaurant Management",
    description: "Menu, orders, and reservations",
    category: "industry",
    tags: ["restaurant", "food", "menu", "orders", "reservations"],
    thumbnail: "/templates/modules/restaurant.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "30 minutes",
    features: [
      "Menu management",
      "Table reservations",
      "Order taking",
      "Kitchen display",
      "Bill splitting",
      "Reporting",
    ],
    dependencies: ["@dramac/sdk", "date-fns"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Restaurant",
      },
      {
        name: "enableOnlineOrders",
        label: "Online Orders",
        type: "boolean",
        default: true,
      },
      {
        name: "enableReservations",
        label: "Reservations",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "real-estate",
    name: "Real Estate Listings",
    description: "Property listings and management",
    category: "industry",
    tags: ["real estate", "property", "listings", "agents"],
    thumbnail: "/templates/modules/real-estate.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "30 minutes",
    features: [
      "Property listings",
      "Agent management",
      "Lead capture",
      "Property search",
      "Virtual tours",
      "Comparison tool",
    ],
    dependencies: ["@dramac/sdk", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Properties",
      },
      {
        name: "propertyTypes",
        label: "Property Types",
        type: "text",
        default: "house,apartment,condo,land",
      },
    ],
    files: [],
  },

  {
    id: "healthcare",
    name: "Healthcare Practice",
    description: "Patient management and appointments",
    category: "industry",
    tags: ["healthcare", "medical", "patients", "appointments"],
    thumbnail: "/templates/modules/healthcare.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "35 minutes",
    features: [
      "Patient records",
      "Appointment scheduling",
      "Medical history",
      "Prescription management",
      "Billing integration",
      "HIPAA compliance",
    ],
    dependencies: ["@dramac/sdk", "date-fns", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Practice",
      },
      {
        name: "enablePrescriptions",
        label: "Prescriptions",
        type: "boolean",
        default: true,
      },
      {
        name: "enableBilling",
        label: "Billing Integration",
        type: "boolean",
        default: false,
      },
    ],
    files: [],
  },

  {
    id: "education",
    name: "Education / LMS",
    description: "Courses, students, and learning management",
    category: "industry",
    tags: ["education", "lms", "courses", "students", "learning"],
    thumbnail: "/templates/modules/education.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "35 minutes",
    features: [
      "Course management",
      "Student enrollment",
      "Lesson tracking",
      "Quizzes",
      "Progress reports",
      "Certificates",
    ],
    dependencies: ["@dramac/sdk", "date-fns", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Learning",
      },
      {
        name: "enableQuizzes",
        label: "Enable Quizzes",
        type: "boolean",
        default: true,
      },
      {
        name: "enableCertificates",
        label: "Enable Certificates",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "fitness",
    name: "Fitness Studio",
    description: "Classes, memberships, and trainers",
    category: "industry",
    tags: ["fitness", "gym", "classes", "memberships", "trainers"],
    thumbnail: "/templates/modules/fitness.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "25 minutes",
    features: [
      "Class scheduling",
      "Membership management",
      "Trainer profiles",
      "Check-in system",
      "Progress tracking",
      "Payment integration",
    ],
    dependencies: ["@dramac/sdk", "date-fns", "@fullcalendar/react"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Fitness",
      },
      {
        name: "enableMemberships",
        label: "Memberships",
        type: "boolean",
        default: true,
      },
      {
        name: "enableTrainers",
        label: "Personal Trainers",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },

  {
    id: "legal",
    name: "Legal Practice",
    description: "Case management and client tracking",
    category: "industry",
    tags: ["legal", "law", "cases", "clients", "documents"],
    thumbnail: "/templates/modules/legal.png",
    screenshots: [],
    complexity: "advanced",
    estimatedSetupTime: "30 minutes",
    features: [
      "Case management",
      "Client records",
      "Document storage",
      "Time tracking",
      "Billing",
      "Court dates",
    ],
    dependencies: ["@dramac/sdk", "date-fns", "@tanstack/react-table"],
    variables: [
      {
        name: "moduleName",
        label: "Module Name",
        type: "text",
        required: true,
        default: "Legal",
      },
      {
        name: "enableTimeTracking",
        label: "Time Tracking",
        type: "boolean",
        default: true,
      },
      {
        name: "enableBilling",
        label: "Billing",
        type: "boolean",
        default: true,
      },
    ],
    files: [],
  },
];

/**
 * Get a template by its ID
 */
export function getTemplateById(id: string): ModuleTemplate | undefined {
  return MODULE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all templates in a category
 */
export function getTemplatesByCategory(
  category: "basic" | "business" | "industry"
): ModuleTemplate[] {
  return MODULE_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): ModuleTemplate[] {
  const lowerQuery = query.toLowerCase();
  return MODULE_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get templates by complexity level
 */
export function getTemplatesByComplexity(
  complexity: "beginner" | "intermediate" | "advanced"
): ModuleTemplate[] {
  return MODULE_TEMPLATES.filter((t) => t.complexity === complexity);
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): ModuleTemplate[] {
  const lowerTag = tag.toLowerCase();
  return MODULE_TEMPLATES.filter((t) =>
    t.tags.some((t) => t.toLowerCase() === lowerTag)
  );
}

/**
 * Get all unique tags from templates
 */
export function getAllTemplateTags(): string[] {
  const tags = new Set<string>();
  MODULE_TEMPLATES.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Get template count by category
 */
export function getTemplateCountByCategory(): Record<string, number> {
  return {
    basic: MODULE_TEMPLATES.filter((t) => t.category === "basic").length,
    business: MODULE_TEMPLATES.filter((t) => t.category === "business").length,
    industry: MODULE_TEMPLATES.filter((t) => t.category === "industry").length,
  };
}
