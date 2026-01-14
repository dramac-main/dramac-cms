"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface GenerationSettingsData {
  tone: "professional" | "friendly" | "playful" | "luxurious" | "minimal";
  targetAudience: string;
  includeNavigation: boolean;
  includeFooter: boolean;
  includeCTA: boolean;
  includeTestimonials: boolean;
  includeContact: boolean;
  includeNewsletter: boolean;
}

interface GenerationSettingsProps {
  settings: GenerationSettingsData;
  onChange: (settings: GenerationSettingsData) => void;
}

export function GenerationSettings({ settings, onChange }: GenerationSettingsProps) {
  const updateSetting = <K extends keyof GenerationSettingsData>(
    key: K,
    value: GenerationSettingsData[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Generation Settings</h3>
        <p className="text-sm text-muted-foreground">
          Customize how your website will be generated
        </p>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label>Tone of Voice</Label>
        <Select
          value={settings.tone}
          onValueChange={(value: GenerationSettingsData["tone"]) =>
            updateSetting("tone", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly & Approachable</SelectItem>
            <SelectItem value="playful">Playful & Creative</SelectItem>
            <SelectItem value="luxurious">Luxurious & Premium</SelectItem>
            <SelectItem value="minimal">Minimal & Clean</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Target Audience (optional)</Label>
        <Input
          id="targetAudience"
          value={settings.targetAudience}
          onChange={(e) => updateSetting("targetAudience", e.target.value)}
          placeholder="e.g., Small business owners, Tech enthusiasts"
        />
      </div>

      {/* Sections to Include */}
      <div className="space-y-4">
        <Label>Sections to Include</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Navigation</span>
            <Switch
              checked={settings.includeNavigation}
              onCheckedChange={(checked) => updateSetting("includeNavigation", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Footer</span>
            <Switch
              checked={settings.includeFooter}
              onCheckedChange={(checked) => updateSetting("includeFooter", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Call to Action</span>
            <Switch
              checked={settings.includeCTA}
              onCheckedChange={(checked) => updateSetting("includeCTA", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Testimonials</span>
            <Switch
              checked={settings.includeTestimonials}
              onCheckedChange={(checked) => updateSetting("includeTestimonials", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Contact Form</span>
            <Switch
              checked={settings.includeContact}
              onCheckedChange={(checked) => updateSetting("includeContact", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Newsletter</span>
            <Switch
              checked={settings.includeNewsletter}
              onCheckedChange={(checked) => updateSetting("includeNewsletter", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const defaultGenerationSettings: GenerationSettingsData = {
  tone: "professional",
  targetAudience: "",
  includeNavigation: true,
  includeFooter: true,
  includeCTA: true,
  includeTestimonials: true,
  includeContact: true,
  includeNewsletter: false,
};
