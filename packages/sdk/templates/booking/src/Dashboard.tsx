import React, { useState } from 'react';
import { useModuleAuth, usePaginatedData } from '@dramac/sdk';
import { PermissionGuard } from '@dramac/sdk/auth';

interface Booking {
  id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  service?: {
    name: string;
    color: string;
  };
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  currency: string;
  color: string;
  is_active: boolean;
}

type View = 'calendar' | 'list' | 'services';

export function Dashboard() {
  const [view, setView] = useState<View>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-gray-500">Manage appointments and availability</p>
        </div>
        <PermissionGuard permission="module.manage_bookings">
          <button className="px-4 py-2 bg-primary text-white rounded-md">
            New Booking
          </button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Bookings" value="0" />
        <StatCard title="Pending" value="0" />
        <StatCard title="This Week" value="0" />
        <StatCard title="Revenue" value="$0" />
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        <ViewButton active={view === 'calendar'} onClick={() => setView('calendar')}>
          📅 Calendar
        </ViewButton>
        <ViewButton active={view === 'list'} onClick={() => setView('list')}>
          📋 List
        </ViewButton>
        <ViewButton active={view === 'services'} onClick={() => setView('services')}>
          🛠️ Services
        </ViewButton>
      </div>

      {/* Content */}
      {view === 'calendar' && <CalendarView date={selectedDate} onDateChange={setSelectedDate} />}
      {view === 'list' && <ListView />}
      {view === 'services' && <ServicesView />}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md transition-colors ${
        active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function CalendarView({ date, onDateChange }: { date: Date; onDateChange: (date: Date) => void }) {
  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8am - 5pm

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => onDateChange(new Date(date.getTime() - 86400000))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <h2 className="font-semibold">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        <button
          onClick={() => onDateChange(new Date(date.getTime() + 86400000))}
          className="p-2 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>

      {/* Time Grid */}
      <div className="divide-y">
        {hours.map((hour) => (
          <div key={hour} className="flex">
            <div className="w-20 p-2 text-right text-sm text-gray-500 border-r">
              {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
            </div>
            <div className="flex-1 p-2 min-h-[60px] hover:bg-gray-50 cursor-pointer">
              {/* Bookings would be rendered here */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListView() {
  const { data, loading, error } = usePaginatedData<Booking>({
    table: 'bookings',
    pageSize: 20,
    orderBy: { column: 'start_time', direction: 'asc' },
    filter: { status: 'confirmed' },
  });

  if (loading) return <div className="p-4">Loading bookings...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {data.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No bookings yet.
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Service</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date & Time</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-sm text-gray-500">{booking.customer_email}</div>
                </td>
                <td className="px-4 py-3">{booking.service?.name || '-'}</td>
                <td className="px-4 py-3">
                  {new Date(booking.start_time).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[booking.status]}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                  <PermissionGuard permission="module.manage_bookings">
                    <button className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ServicesView() {
  const { data, loading, error, refetch } = usePaginatedData<Service>({
    table: 'services',
    pageSize: 50,
    orderBy: { column: 'name', direction: 'asc' },
  });

  if (loading) return <div className="p-4">Loading services...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Services</h2>
        <PermissionGuard permission="module.manage_services">
          <button className="px-4 py-2 bg-primary text-white rounded-md text-sm">
            Add Service
          </button>
        </PermissionGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No services yet. Add your first service to start accepting bookings.
          </div>
        ) : (
          data.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                    <h3 className="font-medium">{service.name}</h3>
                  </div>
                  {service.description && (
                    <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">{service.duration_minutes} min</span>
                <span className="font-medium">
                  {service.currency} {service.price.toFixed(2)}
                </span>
              </div>
              <PermissionGuard permission="module.manage_services">
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </PermissionGuard>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;
