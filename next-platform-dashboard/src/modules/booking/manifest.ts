/**
 * Booking Module Manifest
 * 
 * Phase EM-51: Booking Module
 * 
 * This manifest defines the module's metadata, capabilities,
 * database schema, and configuration.
 * 
 * Following CRM (EM-50) pattern exactly
 */

import type { ModuleManifest } from '../_types'

export const BookingModuleManifest: ModuleManifest = {
  // ==========================================================================
  // IDENTIFICATION
  // ==========================================================================
  
  id: 'booking',
  shortId: 'bookmod01',  // CRITICAL: Used for table prefix (mod_bookmod01_)
  name: 'Booking',
  displayName: 'Booking & Scheduling',
  description: 'Appointment scheduling, calendar management, and online booking widget with CRM integration',
  version: '1.0.0',
  
  // ==========================================================================
  // CLASSIFICATION
  // ==========================================================================
  
  type: 'enterprise',
  category: 'operations',
  
  // ==========================================================================
  // AUTHOR & LICENSE
  // ==========================================================================
  
  author: {
    name: 'DRAMAC CMS',
    email: 'support@dramac.dev',
    url: 'https://dramac.dev'
  },
  license: 'proprietary',
  
  // ==========================================================================
  // COMPATIBILITY
  // ==========================================================================
  
  minPlatformVersion: '1.0.0',
  dependencies: [],
  peerDependencies: [
    'crm'  // Optional: For CRM contact integration
  ],
  
  // ==========================================================================
  // DATABASE SCHEMA
  // ==========================================================================
  
  schema: {
    prefix: 'mod_bookmod01',  // CRITICAL: All tables use mod_bookmod01_tablename
    
    tables: [
      'services',
      'staff',
      'staff_services',
      'calendars',
      'availability',
      'appointments',
      'reminders',
      'settings'
    ],
    
    migrations: [
      'em-51-booking-module-schema.sql'
    ]
  },
  
  // ==========================================================================
  // FEATURES
  // ==========================================================================
  
  features: [
    {
      id: 'services-management',
      name: 'Services Management',
      description: 'Create and manage bookable services with pricing and duration',
      enabled: true
    },
    {
      id: 'staff-management',
      name: 'Staff Management',
      description: 'Manage staff members who provide services',
      enabled: true
    },
    {
      id: 'calendar-management',
      name: 'Calendar & Availability',
      description: 'Set working hours and availability rules',
      enabled: true
    },
    {
      id: 'appointment-booking',
      name: 'Appointment Booking',
      description: 'Book appointments with conflict detection',
      enabled: true
    },
    {
      id: 'reminders',
      name: 'Appointment Reminders',
      description: 'Automated email/SMS reminders',
      enabled: true,
      requiresSetup: true
    },
    {
      id: 'booking-widget',
      name: 'Embeddable Booking Widget',
      description: 'Public booking widget for websites',
      enabled: true
    },
    {
      id: 'crm-integration',
      name: 'CRM Integration',
      description: 'Link appointments to CRM contacts',
      enabled: true,
      requiresSetup: true
    },
    {
      id: 'analytics',
      name: 'Booking Analytics',
      description: 'Reports and insights on bookings',
      enabled: true
    }
  ],
  
  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================
  
  permissions: [
    // Services
    {
      id: 'booking.services.view',
      name: 'View Services',
      description: 'View all services'
    },
    {
      id: 'booking.services.create',
      name: 'Create Services',
      description: 'Create new services'
    },
    {
      id: 'booking.services.edit',
      name: 'Edit Services',
      description: 'Edit existing services'
    },
    {
      id: 'booking.services.delete',
      name: 'Delete Services',
      description: 'Delete services'
    },
    // Staff
    {
      id: 'booking.staff.view',
      name: 'View Staff',
      description: 'View all staff members'
    },
    {
      id: 'booking.staff.manage',
      name: 'Manage Staff',
      description: 'Create, edit, delete staff'
    },
    // Appointments
    {
      id: 'booking.appointments.view',
      name: 'View Appointments',
      description: 'View all appointments'
    },
    {
      id: 'booking.appointments.create',
      name: 'Create Appointments',
      description: 'Book appointments'
    },
    {
      id: 'booking.appointments.edit',
      name: 'Edit Appointments',
      description: 'Edit appointments'
    },
    {
      id: 'booking.appointments.cancel',
      name: 'Cancel Appointments',
      description: 'Cancel appointments'
    },
    // Settings
    {
      id: 'booking.settings.view',
      name: 'View Settings',
      description: 'View booking settings'
    },
    {
      id: 'booking.settings.edit',
      name: 'Edit Settings',
      description: 'Modify booking settings'
    },
    // Analytics
    {
      id: 'booking.analytics.view',
      name: 'View Analytics',
      description: 'View booking analytics'
    },
    // Admin
    {
      id: 'booking.admin',
      name: 'Booking Admin',
      description: 'Full administrative access to booking module'
    }
  ],
  
  // ==========================================================================
  // SETTINGS SCHEMA
  // ==========================================================================
  
  settings: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        title: 'Default Timezone',
        description: 'Default timezone for appointments',
        default: 'UTC'
      },
      time_format: {
        type: 'string',
        title: 'Time Format',
        description: 'Time display format',
        default: '12h',
        enum: ['12h', '24h']
      },
      slot_interval_minutes: {
        type: 'number',
        title: 'Slot Interval',
        description: 'Time slot interval in minutes',
        default: 30,
        enum: [15, 30, 60]
      },
      min_booking_notice_hours: {
        type: 'number',
        title: 'Minimum Booking Notice',
        description: 'Minimum hours before appointment can be booked',
        default: 24
      },
      max_booking_advance_days: {
        type: 'number',
        title: 'Maximum Advance Booking',
        description: 'Maximum days in advance for booking',
        default: 90
      },
      cancellation_notice_hours: {
        type: 'number',
        title: 'Cancellation Notice',
        description: 'Hours required for cancellation notice',
        default: 24
      },
      auto_confirm: {
        type: 'boolean',
        title: 'Auto-Confirm Bookings',
        description: 'Automatically confirm new bookings',
        default: false
      },
      confirmation_email_enabled: {
        type: 'boolean',
        title: 'Send Confirmation Emails',
        description: 'Send email confirmations to customers',
        default: true
      },
      auto_create_crm_contact: {
        type: 'boolean',
        title: 'Auto-Create CRM Contact',
        description: 'Automatically create CRM contact for new customers',
        default: true
      },
      accent_color: {
        type: 'string',
        title: 'Accent Color',
        description: 'Primary color for booking widget',
        default: '#3B82F6'
      }
    }
  },
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  navigation: {
    mainMenu: {
      label: 'Booking',
      icon: 'Calendar',
      href: '/dashboard/[siteId]/booking',
      order: 35  // After CRM (30)
    },
    subMenu: [
      {
        label: 'Appointments',
        href: '/dashboard/[siteId]/booking?view=appointments',
        icon: 'CalendarCheck'
      },
      {
        label: 'Calendar',
        href: '/dashboard/[siteId]/booking?view=calendar',
        icon: 'CalendarDays'
      },
      {
        label: 'Services',
        href: '/dashboard/[siteId]/booking?view=services',
        icon: 'Briefcase'
      },
      {
        label: 'Staff',
        href: '/dashboard/[siteId]/booking?view=staff',
        icon: 'Users'
      },
      {
        label: 'Analytics',
        href: '/dashboard/[siteId]/booking?view=analytics',
        icon: 'BarChart3'
      }
    ]
  },
  
  // ==========================================================================
  // API (for embed widget)
  // ==========================================================================
  
  api: {
    prefix: '/api/modules/booking',
    routes: [
      {
        method: 'GET',
        path: '/services',
        handler: 'getServices'
      },
      {
        method: 'GET',
        path: '/staff',
        handler: 'getStaff'
      },
      {
        method: 'GET',
        path: '/availability',
        handler: 'getAvailability'
      },
      {
        method: 'POST',
        path: '/appointments',
        handler: 'createAppointment'
      },
      {
        method: 'GET',
        path: '/appointments',
        handler: 'getAppointments'
      },
      {
        method: 'PUT',
        path: '/appointments/:id',
        handler: 'updateAppointment'
      },
      {
        method: 'DELETE',
        path: '/appointments/:id',
        handler: 'cancelAppointment'
      }
    ]
  },
  
  // ==========================================================================
  // WEBHOOKS
  // ==========================================================================
  
  webhooks: [
    {
      event: 'booking.appointment.created',
      description: 'Triggered when an appointment is booked'
    },
    {
      event: 'booking.appointment.confirmed',
      description: 'Triggered when an appointment is confirmed'
    },
    {
      event: 'booking.appointment.cancelled',
      description: 'Triggered when an appointment is cancelled'
    },
    {
      event: 'booking.appointment.completed',
      description: 'Triggered when an appointment is marked complete'
    },
    {
      event: 'booking.appointment.no_show',
      description: 'Triggered when customer is marked as no-show'
    },
    {
      event: 'booking.appointment.rescheduled',
      description: 'Triggered when an appointment is rescheduled'
    },
    {
      event: 'booking.reminder.sent',
      description: 'Triggered when a reminder is sent'
    }
  ],
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  lifecycle: {
    onInstall: 'booking/lifecycle/onInstall',
    onUninstall: 'booking/lifecycle/onUninstall',
    onEnable: 'booking/lifecycle/onEnable',
    onDisable: 'booking/lifecycle/onDisable'
  },
  
  // ==========================================================================
  // COMPONENTS
  // ==========================================================================
  
  components: {
    dashboard: 'BookingDashboard',
    settings: 'BookingSettingsDialog'
  },
  
  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  keywords: ['booking', 'appointments', 'scheduling', 'calendar', 'services', 'staff'],
  
  screenshots: [
    {
      url: '/screenshots/booking/calendar-view.png',
      title: 'Calendar View',
      description: 'Calendar view with appointments'
    },
    {
      url: '/screenshots/booking/services.png',
      title: 'Services Management',
      description: 'Services management interface'
    },
    {
      url: '/screenshots/booking/booking-widget.png',
      title: 'Booking Widget',
      description: 'Embeddable booking widget'
    }
  ],
  
  pricing: {
    type: 'subscription',
    plans: [
      {
        id: 'booking-starter',
        name: 'Starter',
        price: 19,
        limits: {
          appointments_per_month: 100,
          staff_members: 1,
          services: 10
        }
      },
      {
        id: 'booking-professional',
        name: 'Professional',
        price: 49,
        limits: {
          appointments_per_month: -1,  // Unlimited
          staff_members: 10,
          services: -1
        }
      },
      {
        id: 'booking-business',
        name: 'Business',
        price: 99,
        limits: {
          appointments_per_month: -1,
          staff_members: -1,
          services: -1
        }
      }
    ]
  }
}

export default BookingModuleManifest
