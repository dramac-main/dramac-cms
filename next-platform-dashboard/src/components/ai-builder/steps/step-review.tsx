import { Check } from "lucide-react";
import type { BuilderFormData } from "../types";

interface StepReviewProps {
  data: BuilderFormData;
}

export function StepReview({ data }: StepReviewProps) {
  const formatIndustry = (industryId: string) => {
    return industryId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Review your choices</h2>
        <p className="text-muted-foreground">
          Make sure everything looks correct before generating your website.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewItem
          label="Business Name"
          value={data.businessName || "Not specified"}
        />
        <ReviewItem
          label="Business Description"
          value={data.businessDescription}
        />
        <ReviewItem
          label="Target Audience"
          value={data.targetAudience || "Not specified"}
        />
        <ReviewItem
          label="Industry"
          value={formatIndustry(data.industryId)}
        />
        <ReviewItem
          label="Tone"
          value={data.tone.charAt(0).toUpperCase() + data.tone.slice(1)}
        />
        <ReviewItem
          label="Color Preference"
          value={data.colorPreference ? data.colorPreference.charAt(0).toUpperCase() + data.colorPreference.slice(1) : "AI will choose"}
        />
        <ReviewItem
          label="Sections"
          value={`${data.sections.length} sections selected`}
        />
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Check className="w-5 h-5" />
          <span className="font-medium">Ready to generate!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Click &quot;Generate Website&quot; below to create your AI-powered website.
          This usually takes about 30-60 seconds.
        </p>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start border-b pb-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium max-w-[60%]">{value}</span>
    </div>
  );
}
