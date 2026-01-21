import React from 'react';
import { useModuleAuth, usePaginatedData } from '@dramac/sdk';
import { PermissionGuard } from '@dramac/sdk/auth';

interface Item {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

export function Dashboard() {
  const { user, hasPermission } = useModuleAuth();
  const { data, loading, error, refetch, page, totalPages, nextPage, prevPage } = usePaginatedData<Item>({
    table: 'items',
    pageSize: 20,
    orderBy: { column: 'created_at', direction: 'desc' },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Manage your items</p>
        </div>
        <PermissionGuard permission="module.manage_items">
          <button
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={() => {/* Open create modal */}}
          >
            Add Item
          </button>
        </PermissionGuard>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow">
        {data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No items yet. Create your first item to get started.
          </div>
        ) : (
          <ul className="divide-y">
            {data.map((item) => (
              <li key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                    <PermissionGuard permission="module.manage_items">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Delete
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <button
              onClick={prevPage}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
