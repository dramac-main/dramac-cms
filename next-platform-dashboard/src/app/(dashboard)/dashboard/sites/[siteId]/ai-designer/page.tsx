"use client";

import { use, useState, useCallback } from "react";
import { Sparkles, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PreviewRenderer } from "@/components/studio/website-designer";
import type { PreviewState, PreviewPage } from "@/lib/ai/website-designer/preview/types";
import type { AppliedDesignSystem } from "@/lib/ai/website-designer/types";

interface AIDesignerPageProps {
  params: Promise<{ siteId: string }>;
}

const INDUSTRY_OPTIONS = [
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "retail", label: "Retail / E-Commerce" },
  { value: "professional_services", label: "Professional Services" },
  { value: "healthcare", label: "Healthcare / Medical" },
  { value: "fitness", label: "Fitness / Gym" },
  { value: "salon", label: "Salon / Beauty" },
  { value: "education", label: "Education / Training" },
  { value: "real_estate", label: "Real Estate" },
  { value: "hospitality", label: "Hospitality / Hotel" },
  { value: "automotive", label: "Automotive" },
  { value: "creative", label: "Creative / Agency" },
  { value: "nonprofit", label: "Non-Profit" },
];

export default function AIDesignerPage({ params }: AIDesignerPageProps) {
  const { siteId } = use(params);
  
  // Form state
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);

  // Generate initial preview state from form data
  const generatePreviewState = useCallback((
    name: string,
    ind: string,
    desc: string,
    feat: string,
    color: string
  ): PreviewState => {
    const parsedFeatures = parseFeatures(feat);
    
    const pages: PreviewPage[] = [
      {
        id: "home",
        name: "Home",
        slug: "/",
        title: `${name} - Home`,
        description: desc.slice(0, 160),
        isHomepage: true,
        order: 0,
        seo: {
          title: `${name} - Home`,
          description: desc.slice(0, 160),
        },
        components: [
          {
            id: "hero-1",
            type: "HeroBlock",
            renderKey: "hero-1-key",
            props: {
              headline: `Welcome to ${name}`,
              subheadline: desc.slice(0, 100) + (desc.length > 100 ? "..." : ""),
              primaryButtonText: "Get Started",
              primaryButtonLink: "/contact",
              backgroundType: "gradient",
              gradientFrom: color,
              gradientTo: adjustColor(color, 20),
            },
          },
          {
            id: "features-1",
            type: "FeaturesGridBlock",
            renderKey: "features-1-key",
            props: {
              title: "Why Choose Us",
              subtitle: `${name} offers the best ${ind.replace("_", " ")} experience`,
              columns: 3,
              features: parsedFeatures,
            },
          },
          {
            id: "cta-1",
            type: "CTABlock",
            renderKey: "cta-1-key",
            props: {
              title: "Ready to Get Started?",
              description: `Join hundreds of satisfied customers at ${name}`,
              buttonText: "Contact Us",
              buttonLink: "/contact",
              backgroundColor: color,
            },
          },
        ],
      },
      {
        id: "about",
        name: "About",
        slug: "/about",
        title: `About ${name}`,
        description: `Learn about ${name}`,
        isHomepage: false,
        order: 1,
        seo: {
          title: `About ${name}`,
          description: `Learn about ${name} and our mission`,
        },
        components: [
          {
            id: "about-hero",
            type: "HeroBlock",
            renderKey: "about-hero-key",
            props: {
              headline: `About ${name}`,
              subheadline: "Learn more about our story and mission",
              size: "small",
            },
          },
          {
            id: "about-content",
            type: "ContentBlock",
            renderKey: "about-content-key",
            props: {
              title: "Our Story",
              content: desc,
              layout: "text-left",
            },
          },
        ],
      },
      {
        id: "services",
        name: "Services",
        slug: "/services",
        title: `Services - ${name}`,
        description: `Discover what ${name} has to offer`,
        isHomepage: false,
        order: 2,
        seo: {
          title: `Services - ${name}`,
          description: `Explore our services at ${name}`,
        },
        components: [
          {
            id: "services-hero",
            type: "HeroBlock",
            renderKey: "services-hero-key",
            props: {
              headline: "Our Services",
              subheadline: `Discover what ${name} has to offer`,
              size: "small",
            },
          },
          {
            id: "services-grid",
            type: "ServicesGridBlock",
            renderKey: "services-grid-key",
            props: {
              title: "What We Offer",
              services: parsedFeatures.map((f, i) => ({
                id: `service-${i}`,
                title: f.title,
                description: f.description,
                icon: f.icon,
                price: `From ZK ${(i + 1) * 500}`,
              })),
            },
          },
        ],
      },
      {
        id: "contact",
        name: "Contact",
        slug: "/contact",
        title: `Contact ${name}`,
        description: "Get in touch with us",
        isHomepage: false,
        order: 3,
        seo: {
          title: `Contact ${name}`,
          description: "Get in touch with us",
        },
        components: [
          {
            id: "contact-hero",
            type: "HeroBlock",
            renderKey: "contact-hero-key",
            props: {
              headline: "Contact Us",
              subheadline: "We'd love to hear from you",
              size: "small",
            },
          },
          {
            id: "contact-form",
            type: "ContactFormBlock",
            renderKey: "contact-form-key",
            props: {
              title: "Get In Touch",
              fields: ["name", "email", "phone", "message"],
              submitButtonText: "Send Message",
              showMap: true,
              mapAddress: "Lusaka, Zambia",
            },
          },
        ],
      },
    ];

    // Create design system
    const designSystem: AppliedDesignSystem = {
      colors: {
        primary: color,
        secondary: adjustColor(color, -30),
        accent: adjustColor(color, 40),
        background: "#ffffff",
        text: "#1e293b",
      },
      typography: {
        headingFont: "Inter, system-ui, sans-serif",
        bodyFont: "Inter, system-ui, sans-serif",
        scale: "1rem",
      },
      spacing: {
        scale: "4px",
      },
      borders: {
        radius: "0.5rem",
      },
      shadows: {
        style: "medium",
      },
    };

    return {
      id: `preview-${Date.now()}`,
      siteId,
      version: 1,
      generatedAt: new Date(),
      pages,
      designSystem,
      status: "preview",
      iterations: [],
      currentIteration: 0,
    };
  }, [siteId]);

  // Demo generation - simulates AI generating pages
  const handleGenerate = useCallback(async () => {
    if (!businessName || !industry || !description) {
      toast.error("Please fill in the business name, industry, and description.");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate preview state
    const state = generatePreviewState(businessName, industry, description, features, primaryColor);
    setPreviewState(state);
    setShowPreview(true);
    setIsGenerating(false);
    
    toast.success(`${state.pages.length} pages generated for ${businessName}!`);
  }, [businessName, industry, description, features, primaryColor, generatePreviewState]);

  // Handle saving the design
  const handleSave = useCallback(() => {
    toast.success("Your AI-generated website has been saved!");
  }, []);

  // Handle approving the final design
  const handleApprove = useCallback(async (state: PreviewState) => {
    toast.success("Design approved! Redirecting to the page builder...");
    // In a real implementation, this would save to the database and redirect
    setTimeout(() => {
      window.location.href = `/dashboard/sites/${siteId}/builder`;
    }, 1500);
  }, [siteId]);

  // Handle discarding the design
  const handleDiscard = useCallback(() => {
    setShowPreview(false);
    setPreviewState(null);
    toast.info("Design discarded. Start fresh!");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container flex h-16 items-center gap-4">
          <Link href={`/dashboard/sites/${siteId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Site
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Website Designer
            </h1>
          </div>
          {showPreview && (
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Design
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {!showPreview || !previewState ? (
          /* Input Form */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Tell us about your business</h2>
              <p className="text-muted-foreground">
                Our AI will create a custom website tailored to your needs
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Provide details about your business to generate a personalized website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g., Lusaka Motors, Café Zambezi"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Business Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your business does, your unique selling points, and what makes you special..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Features/Services */}
                <div className="space-y-2">
                  <Label htmlFor="features">Key Features/Services</Label>
                  <Textarea
                    id="features"
                    placeholder={"List your main services or features, one per line:\n- Fast delivery\n- 24/7 support\n- Free consultation"}
                    rows={4}
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                  />
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Brand Color</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  className="w-full gap-2" 
                  size="lg"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-5 w-5 animate-spin" />
                      Generating Your Website...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Website with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Preview Renderer */
          <PreviewRenderer
            initialState={previewState}
            onApprove={handleApprove}
            onDiscard={handleDiscard}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to parse features from text input
function parseFeatures(text: string): Array<{ title: string; description: string; icon: string }> {
  if (!text.trim()) {
    return [
      { title: "Quality Service", description: "We deliver exceptional quality in everything we do", icon: "star" },
      { title: "Expert Team", description: "Our experienced team is here to help you succeed", icon: "users" },
      { title: "Fast Results", description: "Quick turnaround without compromising on quality", icon: "zap" },
    ];
  }

  const lines = text.split("\n").filter((line) => line.trim());
  const icons = ["star", "shield", "zap", "users", "heart", "check", "award", "clock"];
  
  return lines.slice(0, 6).map((line, index) => {
    const cleaned = line.replace(/^[-•*]\s*/, "").trim();
    return {
      title: cleaned,
      description: `${cleaned} - providing excellent value for our customers`,
      icon: icons[index % icons.length],
    };
  });
}

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
