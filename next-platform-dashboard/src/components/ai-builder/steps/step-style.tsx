import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { BuilderFormData } from "../types";

interface StepStyleProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

const tones = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean, trustworthy, corporate feel",
    colors: ["#1e40af", "#3b82f6", "#f8fafc"],
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Warm, approachable, welcoming",
    colors: ["#059669", "#34d399", "#fef3c7"],
  },
  {
    id: "luxury",
    name: "Luxury",
    description: "Elegant, sophisticated, premium",
    colors: ["#1f2937", "#d4af37", "#fafaf9"],
  },
  {
    id: "playful",
    name: "Playful",
    description: "Fun, energetic, creative",
    colors: ["#7c3aed", "#f472b6", "#fef9c3"],
  },
];

const colorSchemes = [
  { id: "blue", colors: ["#1e40af", "#3b82f6", "#93c5fd"] },
  { id: "green", colors: ["#166534", "#22c55e", "#86efac"] },
  { id: "purple", colors: ["#6b21a8", "#a855f7", "#d8b4fe"] },
  { id: "orange", colors: ["#c2410c", "#f97316", "#fed7aa"] },
  { id: "pink", colors: ["#9d174d", "#ec4899", "#f9a8d4"] },
  { id: "teal", colors: ["#115e59", "#14b8a6", "#5eead4"] },
];

export function StepStyle({ data, onUpdate }: StepStyleProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Choose your style</h2>
        <p className="text-muted-foreground">
          Select the tone and color scheme that best represents your brand.
        </p>
      </div>

      {/* Tone Selection */}
      <div className="space-y-4">
        <Label>Brand Tone</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tones.map((tone) => {
            const isSelected = data.tone === tone.id;

            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => onUpdate({ tone: tone.id as BuilderFormData["tone"] })}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex gap-1 shrink-0">
                  {tone.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div>
                  <p className="font-medium">{tone.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {tone.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Preference */}
      <div className="space-y-4">
        <Label>Color Preference (optional)</Label>
        <div className="flex flex-wrap gap-4">
          {colorSchemes.map((scheme) => {
            const isSelected = data.colorPreference === scheme.id;

            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() =>
                  onUpdate({
                    colorPreference: isSelected ? "" : scheme.id,
                  })
                }
                className={cn(
                  "flex gap-1 p-2 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                )}
              >
                {scheme.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Leave empty to let AI choose based on your industry and tone.
        </p>
      </div>
    </div>
  );
}
