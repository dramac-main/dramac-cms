"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeSettings } from "@/lib/renderer/theme";
import { getPopularFonts } from "@/lib/renderer/fonts";

interface ThemeSettingsEditorProps {
  theme: ThemeSettings;
  customCSS: string;
  fonts: string[];
  onChange: (update: {
    theme?: ThemeSettings;
    customCSS?: string;
    fonts?: string[];
  }) => void;
}

export function ThemeSettingsEditor({
  theme,
  customCSS,
  fonts,
  onChange,
}: ThemeSettingsEditorProps) {
  const popularFonts = getPopularFonts();

  const updateTheme = (key: keyof ThemeSettings, value: string) => {
    onChange({ theme: { ...theme, [key]: value } });
  };

  const addFont = (font: string) => {
    if (!fonts.includes(font)) {
      onChange({ fonts: [...fonts, font] });
    }
  };

  const removeFont = (font: string) => {
    onChange({ fonts: fonts.filter((f) => f !== font) });
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <div>
        <h3 className="font-semibold mb-4">Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.primaryColor || "#3b82f6"}
                onChange={(e) => updateTheme("primaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.primaryColor || "#3b82f6"}
                onChange={(e) => updateTheme("primaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.secondaryColor || "#64748b"}
                onChange={(e) => updateTheme("secondaryColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.secondaryColor || "#64748b"}
                onChange={(e) => updateTheme("secondaryColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.backgroundColor || "#ffffff"}
                onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.backgroundColor || "#ffffff"}
                onChange={(e) => updateTheme("backgroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={theme.foregroundColor || "#0f172a"}
                onChange={(e) => updateTheme("foregroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                type="text"
                value={theme.foregroundColor || "#0f172a"}
                onChange={(e) => updateTheme("foregroundColor", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <h3 className="font-semibold mb-4">Typography</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Body Font</Label>
            <Select
              value={fonts[0] || ""}
              onValueChange={(value) => {
                const newFonts = [...fonts];
                newFonts[0] = value;
                onChange({ fonts: newFonts, theme: { ...theme, fontFamily: `"${value}", sans-serif` } });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                {popularFonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Heading Font</Label>
            <Select
              value={fonts[1] || fonts[0] || ""}
              onValueChange={(value) => {
                const newFonts = [...fonts];
                if (newFonts.length < 2) newFonts.push(value);
                else newFonts[1] = value;
                onChange({ fonts: newFonts, theme: { ...theme, headingFontFamily: `"${value}", sans-serif` } });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Same as body" />
              </SelectTrigger>
              <SelectContent>
                {popularFonts.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <h3 className="font-semibold mb-4">Styling</h3>
        <div className="space-y-2">
          <Label>Border Radius</Label>
          <Select
            value={theme.borderRadius || "0.5rem"}
            onValueChange={(value) => updateTheme("borderRadius", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="0.25rem">Small</SelectItem>
              <SelectItem value="0.5rem">Medium</SelectItem>
              <SelectItem value="0.75rem">Large</SelectItem>
              <SelectItem value="1rem">Extra Large</SelectItem>
              <SelectItem value="9999px">Full</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom CSS */}
      <div>
        <h3 className="font-semibold mb-4">Custom CSS</h3>
        <Textarea
          value={customCSS}
          onChange={(e) => onChange({ customCSS: e.target.value })}
          placeholder=".my-class { color: red; }"
          className="font-mono text-sm"
          rows={8}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Add custom CSS to style your site. Changes apply to all pages.
        </p>
      </div>
    </div>
  );
}
