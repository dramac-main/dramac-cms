import { defineModule } from '@dramac/sdk';

export default defineModule({
  id: '{{MODULE_ID}}',
  name: '{{MODULE_NAME}}',
  version: '1.0.0',
  description: 'Booking and appointment management module',
  category: 'booking',

  // Database tables
  tables: [
    {
      name: 'services',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'duration_minutes', type: 'integer', nullable: false, defaultValue: '60' },
        { name: 'price', type: 'numeric', nullable: false, defaultValue: '0' },
        { name: 'currency', type: 'text', defaultValue: "'USD'" },
        { name: 'color', type: 'text', defaultValue: "'#3b82f6'" },
        { name: 'is_active', type: 'boolean', defaultValue: 'true' },
        { name: 'max_bookings_per_slot', type: 'integer', defaultValue: '1' },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['is_active'] },
      ],
      rls: true,
    },
    {
      name: 'availability',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'day_of_week', type: 'integer', nullable: false }, // 0=Sunday, 6=Saturday
        { name: 'start_time', type: 'time', nullable: false },
        { name: 'end_time', type: 'time', nullable: false },
        { name: 'is_available', type: 'boolean', defaultValue: 'true' },
        { name: 'service_id', type: 'uuid', references: { table: 'services', column: 'id' }, nullable: true },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['day_of_week'] },
        { columns: ['service_id'] },
      ],
      rls: true,
    },
    {
      name: 'bookings',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'service_id', type: 'uuid', references: { table: 'services', column: 'id' } },
        { name: 'customer_name', type: 'text', nullable: false },
        { name: 'customer_email', type: 'text', nullable: false },
        { name: 'customer_phone', type: 'text', nullable: true },
        { name: 'start_time', type: 'timestamptz', nullable: false },
        { name: 'end_time', type: 'timestamptz', nullable: false },
        { name: 'status', type: 'text', defaultValue: "'pending'" }, // pending, confirmed, cancelled, completed
        { name: 'notes', type: 'text', nullable: true },
        { name: 'internal_notes', type: 'text', nullable: true },
        { name: 'cancelled_at', type: 'timestamptz', nullable: true },
        { name: 'cancellation_reason', type: 'text', nullable: true },
        { name: 'reminder_sent', type: 'boolean', defaultValue: 'false' },
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['service_id'] },
        { columns: ['start_time'] },
        { columns: ['status'] },
        { columns: ['customer_email'] },
      ],
      rls: true,
    },
    {
      name: 'blocked_times',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
        { name: 'start_time', type: 'timestamptz', nullable: false },
        { name: 'end_time', type: 'timestamptz', nullable: false },
        { name: 'reason', type: 'text', nullable: true },
        { name: 'is_recurring', type: 'boolean', defaultValue: 'false' },
        { name: 'recurrence_rule', type: 'text', nullable: true }, // RRULE format
        { name: 'site_id', type: 'uuid', references: { table: 'sites', column: 'id' } },
        { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
        { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
      ],
      indexes: [
        { columns: ['site_id'] },
        { columns: ['start_time', 'end_time'] },
      ],
      rls: true,
    },
  ],

  // Permissions
  permissions: [
    {
      id: 'module.view_bookings',
      name: 'View Bookings',
      description: 'View all bookings',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_bookings',
      name: 'Manage Bookings',
      description: 'Create, edit, and cancel bookings',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.view_services',
      name: 'View Services',
      description: 'View available services',
      roles: ['admin', 'site_admin', 'site_user'],
    },
    {
      id: 'module.manage_services',
      name: 'Manage Services',
      description: 'Create, edit, and delete services',
      roles: ['admin', 'site_admin'],
    },
    {
      id: 'module.manage_availability',
      name: 'Manage Availability',
      description: 'Configure availability and blocked times',
      roles: ['admin', 'site_admin'],
    },
  ],

  // Module settings schema
  settings: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        default: 'UTC',
        description: 'Default timezone for bookings',
      },
      bookingBuffer: {
        type: 'number',
        default: 15,
        description: 'Buffer time between bookings (minutes)',
      },
      minAdvanceBooking: {
        type: 'number',
        default: 60,
        description: 'Minimum advance booking time (minutes)',
      },
      maxAdvanceBooking: {
        type: 'number',
        default: 43200, // 30 days
        description: 'Maximum advance booking time (minutes)',
      },
      confirmationEmail: {
        type: 'boolean',
        default: true,
        description: 'Send confirmation emails',
      },
      reminderEmail: {
        type: 'boolean',
        default: true,
        description: 'Send reminder emails',
      },
      reminderHoursBefore: {
        type: 'number',
        default: 24,
        description: 'Hours before to send reminder',
      },
      cancellationPolicy: {
        type: 'string',
        default: '',
        description: 'Cancellation policy text',
      },
    },
  },

  // Entry points
  entryPoints: {
    dashboard: './src/Dashboard',
    settings: './src/Settings',
    embed: './src/BookingWidget',
  },

  // Event subscriptions
  events: {
    onBookingCreated: {
      description: 'Triggered when a new booking is created',
    },
    onBookingConfirmed: {
      description: 'Triggered when a booking is confirmed',
    },
    onBookingCancelled: {
      description: 'Triggered when a booking is cancelled',
    },
    onBookingReminder: {
      description: 'Triggered when a reminder should be sent',
    },
  },

  // Background jobs
  jobs: [
    {
      name: 'send-reminders',
      schedule: '0 * * * *', // Every hour
      description: 'Send booking reminders',
    },
    {
      name: 'mark-completed',
      schedule: '0 0 * * *', // Daily at midnight
      description: 'Mark past bookings as completed',
    },
  ],

  // Lifecycle hooks
  hooks: {
    onInstall: async (ctx) => {
      console.log('Booking module installed for site:', ctx.siteId);
      // Create default availability (Mon-Fri 9am-5pm)
    },
    onUninstall: async (ctx) => {
      console.log('Booking module uninstalled from site:', ctx.siteId);
    },
  },
});
