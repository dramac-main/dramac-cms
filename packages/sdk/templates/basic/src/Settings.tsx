import React from 'react';
import { useModuleSettings, useModuleAuth } from '@dramac/sdk';
import { z } from 'zod';

const settingsSchema = z.object({
  defaultPageSize: z.number().min(5).max(100).default(20),
  enableNotifications: z.boolean().default(true),
});

type SettingsType = z.infer<typeof settingsSchema>;

export function Settings() {
  const { hasPermission } = useModuleAuth();
  const { settings, updateSettings, loading, saving } = useModuleSettings<SettingsType>({
    schema: settingsSchema,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await updateSettings({
      defaultPageSize: Number(formData.get('defaultPageSize')),
      enableNotifications: formData.get('enableNotifications') === 'on',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Configure your module settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">General Settings</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Default Page Size
            </label>
            <input
              type="number"
              name="defaultPageSize"
              min="5"
              max="100"
              defaultValue={settings?.defaultPageSize ?? 20}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-gray-500 text-sm mt-1">
              Number of items to show per page (5-100)
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="enableNotifications"
                defaultChecked={settings?.enableNotifications ?? true}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">Enable Notifications</span>
            </label>
            <p className="text-gray-500 text-sm mt-1 ml-6">
              Send notifications when items are created or updated
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
