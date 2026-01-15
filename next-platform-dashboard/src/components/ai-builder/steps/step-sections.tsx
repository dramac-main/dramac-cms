import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Star,
  Layout,
  Users,
  MessageSquare,
  Megaphone,
  Menu,
  FileText,
  MapPin,
  Phone,
  Image,
  Video,
  Award,
} from "lucide-react";
import type { BuilderFormData } from "../types";

interface StepSectionsProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const availableSections = [
  { id: "hero", name: "Hero Section", icon: Star, required: true, description: "Main banner with headline and CTA" },
  { id: "navbar", name: "Navigation", icon: Menu, required: true, description: "Site navigation menu" },
  { id: "about", name: "About Us", icon: Users, description: "Tell your story" },
  { id: "features", name: "Features/Services", icon: Layout, description: "Highlight what you offer" },
  { id: "testimonials", name: "Testimonials", icon: MessageSquare, description: "Customer reviews and quotes" },
  { id: "cta", name: "Call to Action", icon: Megaphone, description: "Encourage user action" },
  { id: "gallery", name: "Image Gallery", icon: Image, description: "Showcase your work" },
  { id: "video", name: "Video Section", icon: Video, description: "Embed a video" },
  { id: "team", name: "Team Members", icon: Users, description: "Introduce your team" },
  { id: "pricing", name: "Pricing", icon: Award, description: "Display your pricing plans" },
  { id: "contact", name: "Contact Form", icon: Phone, description: "Let visitors reach you" },
  { id: "map", name: "Location Map", icon: MapPin, description: "Show your location" },
  { id: "footer", name: "Footer", icon: FileText, required: true, description: "Site footer with links" },
];

export function StepSections({ data, onUpdate }: StepSectionsProps) {
  const toggleSection = (sectionId: string) => {
    const section = availableSections.find((s) => s.id === sectionId);
    if (section?.required) return; // Can't toggle required sections

    const newSections = data.sections.includes(sectionId)
      ? data.sections.filter((id: string) => id !== sectionId)
      : [...data.sections, sectionId];
    
    onUpdate({ sections: newSections });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose your sections</h2>
        <p className="text-muted-foreground">
          Select the sections you want on your homepage. Required sections are pre-selected.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableSections.map((section) => {
          const Icon = section.icon;
          const isSelected = data.sections.includes(section.id);
          const isRequired = section.required;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              disabled={isRequired}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isRequired && "opacity-80 cursor-not-allowed"
              )}
            >
              <Checkbox
                checked={isSelected}
                disabled={isRequired}
                className="mt-0.5"
              />
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="font-medium cursor-pointer">
                    {section.name}
                  </Label>
                  {isRequired && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground">
        Selected: {data.sections.length} sections (minimum 3 required)
      </p>
    </div>
  );
}
