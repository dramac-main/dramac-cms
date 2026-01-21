// src/lib/modules/module-categories.ts
// Extended category definitions for marketplace enhancement

export type ModuleCategory = 
  // Business
  | 'crm'
  | 'sales'
  | 'marketing'
  | 'analytics'
  | 'billing'
  | 'invoicing'
  
  // Operations
  | 'scheduling'
  | 'booking'
  | 'inventory'
  | 'hr'
  | 'project-management'
  
  // Communication
  | 'email'
  | 'chat'
  | 'notifications'
  | 'social-media'
  
  // Content
  | 'forms'
  | 'blog'
  | 'gallery'
  | 'video'
  | 'documents'
  
  // E-commerce
  | 'ecommerce'
  | 'payments'
  | 'shipping'
  | 'subscriptions'
  
  // Technical
  | 'seo'
  | 'security'
  | 'performance'
  | 'integrations'
  | 'developer-tools'
  
  // Industry
  | 'healthcare'
  | 'hospitality'
  | 'real-estate'
  | 'education'
  | 'fitness'
  | 'food-beverage'
  
  // Legacy compatibility
  | 'social'
  | 'communication'
  | 'content'
  | 'utilities'
  | 'other';

export interface CategoryInfo {
  slug: ModuleCategory;
  label: string;
  icon: string;
  description: string;
  parent?: string;
  color: string;
}

export const MODULE_CATEGORIES: Record<ModuleCategory, CategoryInfo> = {
  // Business
  crm: {
    slug: 'crm',
    label: 'CRM',
    icon: 'Users',
    description: 'Customer relationship management',
    color: '#3B82F6'
  },
  sales: {
    slug: 'sales',
    label: 'Sales',
    icon: 'TrendingUp',
    description: 'Sales pipelines and tracking',
    color: '#10B981'
  },
  marketing: {
    slug: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Marketing automation and campaigns',
    color: '#8B5CF6'
  },
  analytics: {
    slug: 'analytics',
    label: 'Analytics',
    icon: 'BarChart3',
    description: 'Data visualization and reporting',
    color: '#F59E0B'
  },
  billing: {
    slug: 'billing',
    label: 'Billing',
    icon: 'CreditCard',
    description: 'Payment processing and billing',
    color: '#EF4444'
  },
  invoicing: {
    slug: 'invoicing',
    label: 'Invoicing',
    icon: 'Receipt',
    description: 'Invoice generation and tracking',
    color: '#06B6D4'
  },
  
  // Operations
  scheduling: {
    slug: 'scheduling',
    label: 'Scheduling',
    icon: 'Calendar',
    description: 'Appointment and calendar management',
    color: '#EC4899'
  },
  booking: {
    slug: 'booking',
    label: 'Booking',
    icon: 'CalendarCheck',
    description: 'Reservation systems',
    color: '#14B8A6'
  },
  inventory: {
    slug: 'inventory',
    label: 'Inventory',
    icon: 'Package',
    description: 'Stock and inventory management',
    color: '#F97316'
  },
  hr: {
    slug: 'hr',
    label: 'HR & Team',
    icon: 'UserCog',
    description: 'Human resources and team management',
    color: '#6366F1'
  },
  'project-management': {
    slug: 'project-management',
    label: 'Project Management',
    icon: 'Kanban',
    description: 'Tasks, projects, and workflows',
    color: '#84CC16'
  },
  
  // Communication
  email: {
    slug: 'email',
    label: 'Email',
    icon: 'Mail',
    description: 'Email marketing and automation',
    color: '#0EA5E9'
  },
  chat: {
    slug: 'chat',
    label: 'Live Chat',
    icon: 'MessageCircle',
    description: 'Real-time customer support',
    color: '#22C55E'
  },
  notifications: {
    slug: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    description: 'Push and in-app notifications',
    color: '#A855F7'
  },
  'social-media': {
    slug: 'social-media',
    label: 'Social Media',
    icon: 'Share2',
    description: 'Social media management',
    color: '#E11D48'
  },
  
  // Content
  forms: {
    slug: 'forms',
    label: 'Forms',
    icon: 'FileText',
    description: 'Form builders and data collection',
    color: '#7C3AED'
  },
  blog: {
    slug: 'blog',
    label: 'Blog',
    icon: 'Newspaper',
    description: 'Blog and content publishing',
    color: '#2563EB'
  },
  gallery: {
    slug: 'gallery',
    label: 'Gallery',
    icon: 'Image',
    description: 'Image galleries and portfolios',
    color: '#DB2777'
  },
  video: {
    slug: 'video',
    label: 'Video',
    icon: 'Video',
    description: 'Video hosting and streaming',
    color: '#DC2626'
  },
  documents: {
    slug: 'documents',
    label: 'Documents',
    icon: 'FileStack',
    description: 'Document management',
    color: '#059669'
  },
  
  // E-commerce
  ecommerce: {
    slug: 'ecommerce',
    label: 'E-commerce',
    icon: 'ShoppingCart',
    description: 'Online stores and shops',
    color: '#7C3AED'
  },
  payments: {
    slug: 'payments',
    label: 'Payments',
    icon: 'Wallet',
    description: 'Payment gateways and processing',
    color: '#16A34A'
  },
  shipping: {
    slug: 'shipping',
    label: 'Shipping',
    icon: 'Truck',
    description: 'Shipping and logistics',
    color: '#CA8A04'
  },
  subscriptions: {
    slug: 'subscriptions',
    label: 'Subscriptions',
    icon: 'Repeat',
    description: 'Recurring billing and memberships',
    color: '#9333EA'
  },
  
  // Technical
  seo: {
    slug: 'seo',
    label: 'SEO',
    icon: 'Search',
    description: 'Search engine optimization',
    color: '#65A30D'
  },
  security: {
    slug: 'security',
    label: 'Security',
    icon: 'Shield',
    description: 'Security and compliance',
    color: '#1D4ED8'
  },
  performance: {
    slug: 'performance',
    label: 'Performance',
    icon: 'Zap',
    description: 'Speed and optimization',
    color: '#EA580C'
  },
  integrations: {
    slug: 'integrations',
    label: 'Integrations',
    icon: 'Plug',
    description: 'Third-party service connectors',
    color: '#0891B2'
  },
  'developer-tools': {
    slug: 'developer-tools',
    label: 'Developer Tools',
    icon: 'Code',
    description: 'APIs and developer utilities',
    color: '#4F46E5'
  },
  
  // Industry
  healthcare: {
    slug: 'healthcare',
    label: 'Healthcare',
    icon: 'Heart',
    description: 'Medical and health services',
    color: '#DC2626'
  },
  hospitality: {
    slug: 'hospitality',
    label: 'Hospitality',
    icon: 'Hotel',
    description: 'Hotels and accommodation',
    color: '#0D9488'
  },
  'real-estate': {
    slug: 'real-estate',
    label: 'Real Estate',
    icon: 'Building',
    description: 'Property management',
    color: '#B45309'
  },
  education: {
    slug: 'education',
    label: 'Education',
    icon: 'GraduationCap',
    description: 'Learning and courses',
    color: '#7C3AED'
  },
  fitness: {
    slug: 'fitness',
    label: 'Fitness',
    icon: 'Dumbbell',
    description: 'Gyms and fitness centers',
    color: '#F97316'
  },
  'food-beverage': {
    slug: 'food-beverage',
    label: 'Food & Beverage',
    icon: 'UtensilsCrossed',
    description: 'Restaurants and cafes',
    color: '#EF4444'
  },
  
  // Legacy compatibility categories
  social: {
    slug: 'social',
    label: 'Social',
    icon: 'Share2',
    description: 'Social features and integrations',
    color: '#E11D48'
  },
  communication: {
    slug: 'communication',
    label: 'Communication',
    icon: 'MessageSquare',
    description: 'Communication tools',
    color: '#0EA5E9'
  },
  content: {
    slug: 'content',
    label: 'Content',
    icon: 'FileText',
    description: 'Content management',
    color: '#7C3AED'
  },
  utilities: {
    slug: 'utilities',
    label: 'Utilities',
    icon: 'Wrench',
    description: 'Utility modules and helpers',
    color: '#6B7280'
  },
  other: {
    slug: 'other',
    label: 'Other',
    icon: 'MoreHorizontal',
    description: 'Other modules',
    color: '#9CA3AF'
  }
};

// Category group definitions
export const CATEGORY_GROUPS = {
  'Business': ['crm', 'sales', 'marketing', 'analytics', 'billing', 'invoicing'] as ModuleCategory[],
  'Operations': ['scheduling', 'booking', 'inventory', 'hr', 'project-management'] as ModuleCategory[],
  'Communication': ['email', 'chat', 'notifications', 'social-media'] as ModuleCategory[],
  'Content': ['forms', 'blog', 'gallery', 'video', 'documents'] as ModuleCategory[],
  'E-commerce': ['ecommerce', 'payments', 'shipping', 'subscriptions'] as ModuleCategory[],
  'Technical': ['seo', 'security', 'performance', 'integrations', 'developer-tools'] as ModuleCategory[],
  'Industry': ['healthcare', 'hospitality', 'real-estate', 'education', 'fitness', 'food-beverage'] as ModuleCategory[]
};

/**
 * Get categories grouped by type
 */
export function getCategoryGroups(): Record<string, CategoryInfo[]> {
  const groups: Record<string, CategoryInfo[]> = {};
  
  for (const [groupName, categorySlugs] of Object.entries(CATEGORY_GROUPS)) {
    groups[groupName] = categorySlugs.map(slug => MODULE_CATEGORIES[slug]);
  }
  
  return groups;
}

/**
 * Get a category by slug
 */
export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return MODULE_CATEGORIES[slug as ModuleCategory];
}

/**
 * Get all category slugs
 */
export function getAllCategorySlugs(): ModuleCategory[] {
  return Object.keys(MODULE_CATEGORIES) as ModuleCategory[];
}

/**
 * Get featured/main categories for display
 */
export function getMainCategories(): CategoryInfo[] {
  const mainCategorySlugs: ModuleCategory[] = [
    'crm', 'analytics', 'ecommerce', 'forms', 'blog', 'seo',
    'scheduling', 'email', 'payments', 'integrations', 'marketing', 'security'
  ];
  
  return mainCategorySlugs.map(slug => MODULE_CATEGORIES[slug]);
}
