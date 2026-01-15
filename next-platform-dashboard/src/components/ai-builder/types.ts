export interface BuilderFormData {
  businessName: string;
  businessDescription: string;
  targetAudience: string;
  industryId: string;
  tone: "professional" | "friendly" | "luxury" | "playful";
  colorPreference: string;
  sections: string[];
  additionalInfo: string;
}
