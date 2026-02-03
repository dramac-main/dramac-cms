/**
 * DRAMAC Studio Device Selector
 * 
 * Dropdown for selecting device presets.
 * Created in PHASE-STUDIO-18.
 */

'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Smartphone, Tablet, Laptop, Monitor, Settings } from 'lucide-react';
import { useUIStore } from '@/lib/studio/store/ui-store';
import { DEVICE_PRESETS, getPresetsByCategory } from '@/lib/studio/data/device-presets';

// =============================================================================
// CONSTANTS
// =============================================================================

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
  custom: Settings,
};

const categoryLabels: Record<string, string> = {
  phone: 'Phones',
  tablet: 'Tablets',
  laptop: 'Laptops',
  desktop: 'Desktops',
  custom: 'Custom',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function DeviceSelector() {
  const selectedDeviceId = useUIStore((s) => s.selectedDeviceId);
  const viewportWidth = useUIStore((s) => s.viewportWidth);
  const viewportHeight = useUIStore((s) => s.viewportHeight);
  const setDevice = useUIStore((s) => s.setDevice);
  
  const presetsByCategory = useMemo(() => getPresetsByCategory(), []);
  
  const selectedPreset = DEVICE_PRESETS.find(d => d.id === selectedDeviceId);
  const SelectedIcon = selectedPreset 
    ? categoryIcons[selectedPreset.category] || Monitor
    : Monitor;
  
  const handleValueChange = (deviceId: string) => {
    const preset = DEVICE_PRESETS.find(d => d.id === deviceId);
    if (preset && preset.id !== 'custom') {
      setDevice(deviceId, preset.width, preset.height);
    } else {
      setDevice('custom', viewportWidth, viewportHeight);
    }
  };
  
  return (
    <Select value={selectedDeviceId} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <div className="flex items-center gap-2">
          <SelectedIcon className="h-3.5 w-3.5" />
          <SelectValue placeholder="Select device" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(presetsByCategory).map(([category, presets]) => {
          const CategoryIcon = categoryIcons[category] || Monitor;
          return (
            <SelectGroup key={category}>
              <SelectLabel className="flex items-center gap-2 text-xs">
                <CategoryIcon className="h-3 w-3" />
                {categoryLabels[category]}
              </SelectLabel>
              {presets.map((preset) => (
                <SelectItem 
                  key={preset.id} 
                  value={preset.id}
                  className="pl-6 text-xs"
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>{preset.name}</span>
                    {preset.id !== 'custom' && (
                      <span className="text-[10px] text-muted-foreground">
                        {preset.width}×{preset.height}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
