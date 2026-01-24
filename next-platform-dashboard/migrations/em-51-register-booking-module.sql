-- =============================================================
-- Phase EM-51: Register Booking Module in modules_v2
-- =============================================================
-- This inserts the booking module into the database so it can be
-- subscribed to by agencies and installed on sites.
-- =============================================================

-- Insert booking module into modules_v2
INSERT INTO public.modules_v2 (
  slug,
  name,
  description,
  long_description,
  icon,
  category,
  tags,
  install_level,
  pricing_type,
  wholesale_price_monthly,
  wholesale_price_yearly,
  suggested_retail_monthly,
  suggested_retail_yearly,
  status,
  features,
  provided_hooks,
  author_name,
  author_verified,
  is_featured,
  is_premium,
  settings_schema,
  default_settings,
  manifest
) VALUES (
  'booking',
  'Booking & Scheduling',
  'Complete appointment scheduling and calendar management system',
  'Full-featured booking system for service-based businesses. Perfect for salons, spas, consultants, medical offices, and any business that takes appointments.

## Features
- Service management with pricing and duration
- Staff scheduling and availability  
- Customer appointment booking
- Calendar views (week, day, month)
- Automated reminders (email/SMS ready)
- Payment integration ready
- Analytics and reporting
- Customer management

## Perfect For
- Salons & Spas
- Medical & Dental Offices
- Consultants & Coaches
- Fitness Studios
- Event Venues
- Professional Services',
  '📅',
  'business',
  ARRAY['booking', 'appointments', 'calendar', 'scheduling', 'reservations', 'services', 'crm'],
  'site', -- Site-level installation
  'monthly',
  2999, -- $29.99/month wholesale (what agencies pay)
  29990, -- $299.90/year wholesale
  4999, -- $49.99/month suggested retail
  49990, -- $499.90/year suggested retail
  'active',
  ARRAY[
    'Service management',
    'Staff scheduling',
    'Calendar booking',
    'Appointment management',
    'Email/SMS reminders',
    'Customer portal',
    'Analytics dashboard',
    'Payment ready',
    'Availability rules',
    'Buffer time settings'
  ],
  ARRAY['site:dashboard:tab', 'dashboard:site:tab'],
  'DRAMAC',
  true,
  true, -- Featured
  true, -- Premium
  '{
    "type": "object",
    "properties": {
      "timezone": {
        "type": "string",
        "title": "Timezone",
        "default": "America/New_York"
      },
      "bookingAdvanceDays": {
        "type": "number",
        "title": "Booking Advance Days",
        "description": "How many days in advance customers can book",
        "default": 30
      },
      "requireConfirmation": {
        "type": "boolean",
        "title": "Require Confirmation",
        "description": "Require staff to confirm bookings",
        "default": false
      },
      "enableReminders": {
        "type": "boolean",
        "title": "Enable Reminders",
        "description": "Send automated email reminders",
        "default": true
      },
      "reminderHoursBefore": {
        "type": "number",
        "title": "Reminder Hours Before",
        "description": "Hours before appointment to send reminder",
        "default": 24
      }
    }
  }'::jsonb,
  '{
    "timezone": "America/New_York",
    "bookingAdvanceDays": 30,
    "requireConfirmation": false,
    "enableReminders": true,
    "reminderHoursBefore": 24
  }'::jsonb,
  '{
    "version": "1.0.0",
    "shortId": "bookmod01",
    "routes": [
      {
        "path": "/dashboard/[siteId]/booking",
        "component": "BookingDashboard"
      }
    ],
    "permissions": [
      "booking.view",
      "booking.manage.services",
      "booking.manage.staff",
      "booking.manage.appointments",
      "booking.view.analytics"
    ]
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Booking module registered successfully in modules_v2';
  RAISE NOTICE 'Module ID: bookmod01';
  RAISE NOTICE 'Install level: site';
  RAISE NOTICE 'Pricing: $29.99/month wholesale';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Agency needs to subscribe to this module (marketplace or direct insert)';
  RAISE NOTICE '2. Once subscribed, it will appear in site Modules tab';
  RAISE NOTICE '3. Toggle it on for a site to enable booking';
END $$;
