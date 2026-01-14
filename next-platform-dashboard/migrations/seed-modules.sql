-- Insert initial modules
INSERT INTO public.modules (slug, name, description, long_description, icon, category, price_monthly, price_yearly, is_featured, features) VALUES
-- Analytics Module
(
  'analytics',
  'Advanced Analytics',
  'Detailed visitor analytics and insights',
  'Get deep insights into your website visitors with real-time analytics, conversion tracking, heatmaps, and detailed reports. Understand user behavior and optimize your site for better performance.',
  'BarChart3',
  'analytics',
  9.99,
  99.99,
  true,
  '["Real-time visitor tracking", "Conversion funnels", "Heatmaps", "A/B testing", "Custom reports", "Export to CSV"]'::jsonb
),
-- SEO Module
(
  'seo-pro',
  'SEO Pro',
  'Advanced SEO tools and optimization',
  'Boost your search engine rankings with our comprehensive SEO toolkit. Includes keyword research, on-page optimization, XML sitemaps, schema markup, and competitor analysis.',
  'Search',
  'seo',
  14.99,
  149.99,
  true,
  '["Keyword research", "On-page SEO analyzer", "XML sitemap generator", "Schema markup", "Meta tag optimization", "Competitor tracking"]'::jsonb
),
-- Forms Module
(
  'forms-pro',
  'Forms Pro',
  'Advanced form builder and submissions',
  'Create powerful forms with conditional logic, multi-step layouts, file uploads, and integrations. Manage submissions with a built-in CRM-like interface.',
  'FileText',
  'forms',
  7.99,
  79.99,
  false,
  '["Conditional logic", "Multi-step forms", "File uploads", "Payment integration", "Email notifications", "Submission management"]'::jsonb
),
-- E-commerce Module
(
  'ecommerce',
  'E-commerce',
  'Full online store capabilities',
  'Turn your website into a full-featured online store. Product management, shopping cart, checkout, inventory tracking, and order management included.',
  'ShoppingCart',
  'ecommerce',
  24.99,
  249.99,
  true,
  '["Product catalog", "Shopping cart", "Secure checkout", "Inventory management", "Order tracking", "Discount codes"]'::jsonb
),
-- Blog Module
(
  'blog',
  'Blog Engine',
  'Full-featured blog and content management',
  'Add a professional blog to your website with categories, tags, comments, RSS feeds, and SEO optimization built-in.',
  'Newspaper',
  'content',
  4.99,
  49.99,
  false,
  '["WYSIWYG editor", "Categories & tags", "Comment system", "RSS feeds", "Social sharing", "Scheduled posts"]'::jsonb
),
-- Multilingual Module
(
  'multilingual',
  'Multilingual',
  'Multi-language support for your site',
  'Reach a global audience with automatic and manual translations. Support for RTL languages, language switcher, and SEO-friendly URLs for each language.',
  'Globe',
  'localization',
  12.99,
  129.99,
  false,
  '["Unlimited languages", "Auto-translation (AI)", "RTL support", "Language switcher", "SEO-friendly URLs", "Translation management"]'::jsonb
),
-- Members Module
(
  'members',
  'Member Portal',
  'User accounts and member areas',
  'Create exclusive member-only content, user registration, login systems, and subscription-based access control.',
  'Users',
  'membership',
  19.99,
  199.99,
  false,
  '["User registration", "Member directories", "Gated content", "User profiles", "Email verification", "Social login"]'::jsonb
),
-- Booking Module
(
  'booking',
  'Booking System',
  'Appointment and reservation management',
  'Let visitors book appointments, classes, or services directly from your website. Calendar integration, reminders, and payment collection.',
  'Calendar',
  'scheduling',
  14.99,
  149.99,
  true,
  '["Online scheduling", "Calendar sync", "Email reminders", "Payment collection", "Staff management", "Buffer times"]'::jsonb
);
