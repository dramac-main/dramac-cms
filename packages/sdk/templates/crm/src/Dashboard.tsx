import React, { useState } from 'react';
import { useModuleAuth, usePaginatedData } from '@dramac/sdk';
import { PermissionGuard } from '@dramac/sdk/auth';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  created_at: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  created_at: string;
}

type Tab = 'contacts' | 'deals' | 'activities';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const { hasPermission } = useModuleAuth();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM Dashboard</h1>
          <p className="text-gray-500">Manage your contacts and deals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Contacts" value="0" icon="👥" />
        <StatCard title="Open Deals" value="0" icon="💼" />
        <StatCard title="Pipeline Value" value="K0" icon="💰" />
        <StatCard title="Won This Month" value="K0" icon="🎉" />
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          <TabButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')}>
            Contacts
          </TabButton>
          <TabButton active={activeTab === 'deals'} onClick={() => setActiveTab('deals')}>
            Deals
          </TabButton>
          <TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')}>
            Activities
          </TabButton>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'contacts' && <ContactsTab />}
      {activeTab === 'deals' && <DealsTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 border-b-2 transition-colors ${
        active
          ? 'border-primary text-primary font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function ContactsTab() {
  const { data, loading, error } = usePaginatedData<Contact>({
    table: 'contacts',
    pageSize: 20,
    orderBy: { column: 'created_at', direction: 'desc' },
  });

  if (loading) {
    return <div className="p-4">Loading contacts...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold">Contacts</h2>
        <PermissionGuard permission="module.manage_contacts">
          <button className="px-4 py-2 bg-primary text-white rounded-md text-sm">
            Add Contact
          </button>
        </PermissionGuard>
      </div>
      {data.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No contacts yet. Add your first contact to get started.
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{contact.first_name} {contact.last_name}</td>
                <td className="px-4 py-3">{contact.email || '-'}</td>
                <td className="px-4 py-3">{contact.company || '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {contact.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DealsTab() {
  const { data, loading, error } = usePaginatedData<Deal>({
    table: 'deals',
    pageSize: 20,
    orderBy: { column: 'created_at', direction: 'desc' },
  });

  if (loading) {
    return <div className="p-4">Loading deals...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  const stages = ['qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Pipeline</h2>
        <PermissionGuard permission="module.manage_deals">
          <button className="px-4 py-2 bg-primary text-white rounded-md text-sm">
            Add Deal
          </button>
        </PermissionGuard>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage} className="bg-gray-100 rounded-lg p-4 min-w-[280px]">
            <h3 className="font-medium capitalize mb-3">{stage.replace('_', ' ')}</h3>
            <div className="space-y-2">
              {data
                .filter((deal) => deal.stage === stage)
                .map((deal) => (
                  <div key={deal.id} className="bg-white rounded p-3 shadow-sm">
                    <p className="font-medium">{deal.title}</p>
                    <p className="text-green-600 text-sm">
                      {deal.currency} {deal.value.toLocaleString()}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitiesTab() {
  return (
    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
      Activities timeline coming soon...
    </div>
  );
}

export default Dashboard;
