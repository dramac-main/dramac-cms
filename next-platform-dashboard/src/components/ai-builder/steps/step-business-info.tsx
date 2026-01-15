import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BuilderFormData } from "../types";

interface StepBusinessInfoProps {
  data: BuilderFormData;
  onUpdate: (updates: Partial<BuilderFormData>) => void;
}

export function StepBusinessInfo({ data, onUpdate }: StepBusinessInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground">
          The more detail you provide, the better your website will match your vision.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder="e.g., Acme Web Design"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessDescription">
            What does your business do? *
            <span className="text-muted-foreground font-normal ml-2">
              (minimum 20 characters)
            </span>
          </Label>
          <Textarea
            id="businessDescription"
            value={data.businessDescription}
            onChange={(e) => onUpdate({ businessDescription: e.target.value })}
            placeholder="Describe your business, products, or services. For example: We are a digital marketing agency that helps small businesses grow their online presence through social media management, SEO, and paid advertising campaigns."
            rows={5}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {data.businessDescription.length}/20 characters minimum
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Who is your target audience?</Label>
          <Input
            id="targetAudience"
            value={data.targetAudience}
            onChange={(e) => onUpdate({ targetAudience: e.target.value })}
            placeholder="e.g., Small business owners, tech startups, local restaurants"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">
            Any additional information? (optional)
          </Label>
          <Textarea
            id="additionalInfo"
            value={data.additionalInfo}
            onChange={(e) => onUpdate({ additionalInfo: e.target.value })}
            placeholder="Special features, unique selling points, specific requirements..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>
    </div>
  );
}
