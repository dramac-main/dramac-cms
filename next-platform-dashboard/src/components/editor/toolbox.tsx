"use client";

import { useEditor, Element } from "@craftjs/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { componentRegistry } from "./resolver";
import { Container } from "./user-components/container";
import { Text } from "./user-components/text";
import { ButtonComponent } from "./user-components/button-component";
import { ImageComponent } from "./user-components/image-component";
import { HeroSection } from "./user-components/hero-section";
import { FeatureGrid } from "./user-components/feature-grid";
import { Testimonials } from "./user-components/testimonials";
import { CTASection } from "./user-components/cta-section";
import { ContactForm } from "./user-components/contact-form";
import { Newsletter } from "./user-components/newsletter";
import { Navigation } from "./user-components/navigation";
import { Footer } from "./user-components/footer";
import { Gallery } from "./user-components/gallery";
import { FAQ } from "./user-components/faq";
import { Team } from "./user-components/team";
import { Stats } from "./user-components/stats";
import {
  LayoutGrid,
  Type,
  MousePointer,
  Image as ImageIcon,
  GripVertical,
  LayoutTemplate,
  Grid3X3,
  Quote,
  Megaphone,
  Images,
  HelpCircle,
  Users,
  TrendingUp,
  Mail,
  Inbox,
  Menu,
  PanelBottom,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  Type,
  MousePointer,
  Image: ImageIcon,
  LayoutTemplate,
  Grid3X3,
  Quote,
  Megaphone,
  Images,
  HelpCircle,
  Users,
  TrendingUp,
  Mail,
  Inbox,
  Menu,
  PanelBottom,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentMap: Record<string, React.ComponentType<any>> = {
  Container,
  Text,
  Button: ButtonComponent,
  Image: ImageComponent,
  HeroSection,
  FeatureGrid,
  Testimonials,
  CTASection,
  ContactForm,
  Newsletter,
  Navigation,
  Footer,
  Gallery,
  FAQ,
  Team,
  Stats,
};

// Group components by category
const categories = ["navigation", "layout", "sections", "forms", "typography", "buttons", "media"];

const categoryLabels: Record<string, string> = {
  navigation: "Navigation",
  layout: "Layout",
  sections: "Sections",
  forms: "Forms",
  typography: "Typography",
  buttons: "Buttons",
  media: "Media",
};

export function EditorToolbox() {
  const { connectors } = useEditor();

  return (
    <div className="w-64 border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Components</h2>
        <p className="text-sm text-muted-foreground">Drag to add</p>
      </div>
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-6">
          {categories.map((category) => {
            const items = componentRegistry.filter((c) => c.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutGrid;
                    const Component = componentMap[item.name];

                    return (
                      <div
                        key={item.name}
                        ref={(ref) => {
                          if (ref) {
                            connectors.create(
                              ref,
                              item.name === "Container" ? (
                                <Element is={Container} canvas />
                              ) : (
                                <Component />
                              )
                            );
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          "cursor-move hover:bg-muted transition-colors",
                          "select-none"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.displayName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
