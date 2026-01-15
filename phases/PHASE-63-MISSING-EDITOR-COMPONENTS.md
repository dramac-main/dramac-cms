# Phase 63: Missing Editor Components

> **AI Model**: Claude Opus 4.5 (2x)
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and complete Phase 62

---

## 🎯 Objective

Implement the 4 missing section components from original platform:
1. Gallery Component - Image gallery with lightbox
2. FAQ Component - Accordion FAQ sections
3. Team Component - Team member cards
4. Stats Component - Animated statistics counters

---

## 📋 Prerequisites

- [ ] Phase 62 completed
- [ ] Craft.js editor working
- [ ] Existing components as reference

---

## ✅ Tasks

### Task 60.1: Gallery Component

**File: `src/components/editor/components/gallery.tsx`**

```tsx
"use client";

import { useNode, Element } from "@craftjs/core";
import { Image, Grid } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  columns: 2 | 3 | 4;
  gap: "sm" | "md" | "lg";
  showCaptions: boolean;
  lightbox: boolean;
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
}

const defaultProps: GalleryProps = {
  images: [
    { id: "1", src: "https://placehold.co/400x300", alt: "Gallery image 1" },
    { id: "2", src: "https://placehold.co/400x300", alt: "Gallery image 2" },
    { id: "3", src: "https://placehold.co/400x300", alt: "Gallery image 3" },
    { id: "4", src: "https://placehold.co/400x300", alt: "Gallery image 4" },
  ],
  columns: 3,
  gap: "md",
  showCaptions: false,
  lightbox: true,
  borderRadius: "md",
};

export function GalleryComponent(props: Partial<GalleryProps>) {
  const { images, columns, gap, showCaptions, borderRadius } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const radiusClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-xl",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className={`py-12 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer"
              onClick={() => setLightboxImage(image.src)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className={`w-full h-48 object-cover ${radiusClasses[borderRadius]} transition-transform group-hover:scale-105`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-inherit flex items-center justify-center">
                <Image className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" />
              </div>
              {showCaptions && image.caption && (
                <p className="mt-2 text-sm text-center text-muted-foreground">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Lightbox"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}

// Settings Panel
function GallerySettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as GalleryProps,
  }));

  const [newImageUrl, setNewImageUrl] = useState("");

  const addImage = () => {
    if (newImageUrl) {
      setProp((props: GalleryProps) => {
        props.images = [
          ...props.images,
          {
            id: Date.now().toString(),
            src: newImageUrl,
            alt: `Gallery image ${props.images.length + 1}`,
          },
        ];
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (id: string) => {
    setProp((props: GalleryProps) => {
      props.images = props.images.filter((img) => img.id !== id);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns.toString()}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Gap</Label>
        <Select
          value={props.gap}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.gap = v as "sm" | "md" | "lg"))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Border Radius</Label>
        <Select
          value={props.borderRadius}
          onValueChange={(v) =>
            setProp((p: GalleryProps) => (p.borderRadius = v as GalleryProps["borderRadius"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="sm">Small</SelectItem>
            <SelectItem value="md">Medium</SelectItem>
            <SelectItem value="lg">Large</SelectItem>
            <SelectItem value="full">Full</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showCaptions"
          checked={props.showCaptions}
          onChange={(e) =>
            setProp((p: GalleryProps) => (p.showCaptions = e.target.checked))
          }
        />
        <Label htmlFor="showCaptions">Show Captions</Label>
      </div>

      <div className="space-y-2">
        <Label>Add Image</Label>
        <div className="flex gap-2">
          <Input
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="Image URL"
          />
          <Button onClick={addImage} size="sm">
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Images ({props.images.length})</Label>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {props.images.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-2 p-2 bg-muted rounded"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-12 h-12 object-cover rounded"
              />
              <span className="flex-1 text-xs truncate">{img.alt}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeImage(img.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

GalleryComponent.craft = {
  props: defaultProps,
  related: {
    settings: GallerySettings,
  },
  displayName: "Gallery",
};
```

### Task 60.2: FAQ Component

**File: `src/components/editor/components/faq.tsx`**

```tsx
"use client";

import { useNode } from "@craftjs/core";
import { HelpCircle, Plus, Minus, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  subtitle: string;
  items: FAQItem[];
  columns: 1 | 2;
  style: "accordion" | "cards";
  backgroundColor: string;
}

const defaultProps: FAQProps = {
  title: "Frequently Asked Questions",
  subtitle: "Find answers to common questions about our services",
  items: [
    {
      id: "1",
      question: "What services do you offer?",
      answer: "We offer a comprehensive range of services including web design, development, SEO optimization, and digital marketing solutions tailored to your business needs.",
    },
    {
      id: "2",
      question: "How long does a typical project take?",
      answer: "Project timelines vary based on complexity. A simple website typically takes 2-4 weeks, while more complex projects may take 2-3 months. We'll provide a detailed timeline during our initial consultation.",
    },
    {
      id: "3",
      question: "Do you offer ongoing support?",
      answer: "Yes! We offer various support and maintenance packages to ensure your website stays updated, secure, and performing optimally after launch.",
    },
    {
      id: "4",
      question: "What is your pricing structure?",
      answer: "Our pricing is project-based and depends on your specific requirements. We offer transparent quotes with no hidden fees. Contact us for a free consultation and custom quote.",
    },
  ],
  columns: 1,
  style: "accordion",
  backgroundColor: "#f8fafc",
};

export function FAQComponent(props: Partial<FAQProps>) {
  const { title, subtitle, items, columns, style, backgroundColor } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const columnClasses = {
    1: "max-w-3xl",
    2: "grid md:grid-cols-2 gap-6 max-w-5xl",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className={`py-16 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {style === "accordion" ? (
          <div className={`mx-auto ${columnClasses[columns]}`}>
            {columns === 1 ? (
              <Accordion type="single" collapsible className="w-full">
                {items.map((item, index) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <>
                <div className="space-y-4">
                  {items.slice(0, Math.ceil(items.length / 2)).map((item) => (
                    <Accordion key={item.id} type="single" collapsible>
                      <AccordionItem value={item.id}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
                <div className="space-y-4">
                  {items.slice(Math.ceil(items.length / 2)).map((item) => (
                    <Accordion key={item.id} type="single" collapsible>
                      <AccordionItem value={item.id}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`mx-auto ${columnClasses[columns]}`}>
            {columns === 1 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-6 shadow-sm border"
                  >
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {item.question}
                    </h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-6 shadow-sm border"
                >
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground">{item.answer}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Settings Panel
function FAQSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as FAQProps,
  }));

  const [editingId, setEditingId] = useState<string | null>(null);

  const addItem = () => {
    setProp((props: FAQProps) => {
      props.items = [
        ...props.items,
        {
          id: Date.now().toString(),
          question: "New question?",
          answer: "Add your answer here...",
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setProp((props: FAQProps) => {
      props.items = props.items.filter((item) => item.id !== id);
    });
  };

  const updateItem = (id: string, field: "question" | "answer", value: string) => {
    setProp((props: FAQProps) => {
      const item = props.items.find((i) => i.id === id);
      if (item) {
        item[field] = value;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input
          value={props.title}
          onChange={(e) => setProp((p: FAQProps) => (p.title = e.target.value))}
        />
      </div>

      <div>
        <Label>Subtitle</Label>
        <Textarea
          value={props.subtitle}
          onChange={(e) => setProp((p: FAQProps) => (p.subtitle = e.target.value))}
          rows={2}
        />
      </div>

      <div>
        <Label>Style</Label>
        <div className="flex gap-2">
          {(["accordion", "cards"] as const).map((style) => (
            <Button
              key={style}
              variant={props.style === style ? "default" : "outline"}
              size="sm"
              onClick={() => setProp((p: FAQProps) => (p.style = style))}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Columns</Label>
        <div className="flex gap-2">
          {([1, 2] as const).map((col) => (
            <Button
              key={col}
              variant={props.columns === col ? "default" : "outline"}
              size="sm"
              onClick={() => setProp((p: FAQProps) => (p.columns = col))}
            >
              {col} Column{col > 1 ? "s" : ""}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label>Background Color</Label>
        <Input
          type="color"
          value={props.backgroundColor}
          onChange={(e) =>
            setProp((p: FAQProps) => (p.backgroundColor = e.target.value))
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>FAQ Items ({props.items.length})</Label>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {props.items.map((item, index) => (
            <div key={item.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  FAQ {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.question}
                onChange={(e) => updateItem(item.id, "question", e.target.value)}
                placeholder="Question"
              />
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(item.id, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

FAQComponent.craft = {
  props: defaultProps,
  related: {
    settings: FAQSettings,
  },
  displayName: "FAQ",
};
```

### Task 60.3: Team Component

**File: `src/components/editor/components/team.tsx`**

```tsx
"use client";

import { useNode } from "@craftjs/core";
import { Users, Plus, Minus, Twitter, Linkedin, Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
}

interface TeamProps {
  title: string;
  subtitle: string;
  members: TeamMember[];
  columns: 2 | 3 | 4;
  style: "cards" | "minimal" | "bordered";
  showSocial: boolean;
  showBio: boolean;
}

const defaultProps: TeamProps = {
  title: "Meet Our Team",
  subtitle: "The passionate people behind our success",
  members: [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "With over 15 years of industry experience, Sarah leads our vision and strategy.",
      image: "https://placehold.co/300x300?text=SJ",
      linkedin: "#",
      twitter: "#",
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "CTO",
      bio: "Michael brings technical excellence and innovation to everything we build.",
      image: "https://placehold.co/300x300?text=MC",
      linkedin: "#",
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      role: "Design Director",
      bio: "Emily transforms ideas into beautiful, user-centered designs.",
      image: "https://placehold.co/300x300?text=ER",
      linkedin: "#",
      twitter: "#",
    },
  ],
  columns: 3,
  style: "cards",
  showSocial: true,
  showBio: true,
};

export function TeamComponent(props: Partial<TeamProps>) {
  const { title, subtitle, members, columns, style, showSocial, showBio } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  const cardStyles = {
    cards: "bg-white rounded-xl shadow-sm p-6 text-center",
    minimal: "text-center",
    bordered: "border rounded-xl p-6 text-center",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className={`py-16 px-4 ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {members.map((member) => (
            <div key={member.id} className={cardStyles[style]}>
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary font-medium mb-2">{member.role}</p>
              
              {showBio && (
                <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
              )}
              
              {showSocial && (
                <div className="flex justify-center gap-3">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {member.twitter && (
                    <a
                      href={member.twitter}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Settings Panel
function TeamSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as TeamProps,
  }));

  const addMember = () => {
    setProp((props: TeamProps) => {
      props.members = [
        ...props.members,
        {
          id: Date.now().toString(),
          name: "New Team Member",
          role: "Role Title",
          bio: "Add a brief bio here...",
          image: "https://placehold.co/300x300?text=NEW",
        },
      ];
    });
  };

  const removeMember = (id: string) => {
    setProp((props: TeamProps) => {
      props.members = props.members.filter((m) => m.id !== id);
    });
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    setProp((props: TeamProps) => {
      const member = props.members.find((m) => m.id === id);
      if (member) {
        (member as Record<string, string>)[field] = value;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title</Label>
        <Input
          value={props.title}
          onChange={(e) => setProp((p: TeamProps) => (p.title = e.target.value))}
        />
      </div>

      <div>
        <Label>Subtitle</Label>
        <Textarea
          value={props.subtitle}
          onChange={(e) => setProp((p: TeamProps) => (p.subtitle = e.target.value))}
          rows={2}
        />
      </div>

      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns.toString()}
          onValueChange={(v) =>
            setProp((p: TeamProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Style</Label>
        <Select
          value={props.style}
          onValueChange={(v) =>
            setProp((p: TeamProps) => (p.style = v as TeamProps["style"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showBio"
          checked={props.showBio}
          onChange={(e) => setProp((p: TeamProps) => (p.showBio = e.target.checked))}
        />
        <Label htmlFor="showBio">Show Bio</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showSocial"
          checked={props.showSocial}
          onChange={(e) =>
            setProp((p: TeamProps) => (p.showSocial = e.target.checked))
          }
        />
        <Label htmlFor="showSocial">Show Social Links</Label>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Team Members ({props.members.length})</Label>
          <Button size="sm" onClick={addMember}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-3">
          {props.members.map((member, index) => (
            <div key={member.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  Member {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={member.name}
                onChange={(e) => updateMember(member.id, "name", e.target.value)}
                placeholder="Name"
              />
              <Input
                value={member.role}
                onChange={(e) => updateMember(member.id, "role", e.target.value)}
                placeholder="Role"
              />
              <Input
                value={member.image}
                onChange={(e) => updateMember(member.id, "image", e.target.value)}
                placeholder="Image URL"
              />
              <Textarea
                value={member.bio}
                onChange={(e) => updateMember(member.id, "bio", e.target.value)}
                placeholder="Bio"
                rows={2}
              />
              <Input
                value={member.linkedin || ""}
                onChange={(e) => updateMember(member.id, "linkedin", e.target.value)}
                placeholder="LinkedIn URL"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

TeamComponent.craft = {
  props: defaultProps,
  related: {
    settings: TeamSettings,
  },
  displayName: "Team",
};
```

### Task 60.4: Stats Component

**File: `src/components/editor/components/stats.tsx`**

```tsx
"use client";

import { useNode } from "@craftjs/core";
import { TrendingUp, Plus, Minus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";

interface StatItem {
  id: string;
  value: number;
  suffix: string;
  prefix: string;
  label: string;
}

interface StatsProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  columns: 2 | 3 | 4;
  style: "default" | "bordered" | "gradient";
  animate: boolean;
  backgroundColor: string;
  textColor: string;
}

const defaultProps: StatsProps = {
  title: "",
  subtitle: "",
  stats: [
    { id: "1", value: 500, suffix: "+", prefix: "", label: "Happy Clients" },
    { id: "2", value: 1200, suffix: "", prefix: "", label: "Projects Completed" },
    { id: "3", value: 98, suffix: "%", prefix: "", label: "Client Satisfaction" },
    { id: "4", value: 15, suffix: "+", prefix: "", label: "Years Experience" },
  ],
  columns: 4,
  style: "default",
  animate: true,
  backgroundColor: "#1f2937",
  textColor: "#ffffff",
};

// Animated counter hook
function useCountUp(target: number, duration: number = 2000, animate: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) {
      setCount(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [target, duration, animate, hasAnimated]);

  return { count, ref };
}

function StatCounter({ stat, animate }: { stat: StatItem; animate: boolean }) {
  const { count, ref } = useCountUp(stat.value, 2000, animate);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold mb-2">
        {stat.prefix}
        {count.toLocaleString()}
        {stat.suffix}
      </div>
      <div className="text-sm opacity-80">{stat.label}</div>
    </div>
  );
}

export function StatsComponent(props: Partial<StatsProps>) {
  const { title, subtitle, stats, columns, style, animate, backgroundColor, textColor } = {
    ...defaultProps,
    ...props,
  };
  
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const styleClasses = {
    default: "",
    bordered: "border-t border-b border-white/20",
    gradient: "bg-gradient-to-r from-primary to-primary/70",
  };

  return (
    <section
      ref={(ref) => connect(drag(ref!))}
      className={`py-16 px-4 ${styleClasses[style]} ${selected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={{ 
        backgroundColor: style !== "gradient" ? backgroundColor : undefined,
        color: textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {subtitle && (
              <p className="opacity-80 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {stats.map((stat) => (
            <StatCounter key={stat.id} stat={stat} animate={animate} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Settings Panel
function StatsSettings() {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as StatsProps,
  }));

  const addStat = () => {
    setProp((props: StatsProps) => {
      props.stats = [
        ...props.stats,
        {
          id: Date.now().toString(),
          value: 100,
          suffix: "",
          prefix: "",
          label: "New Stat",
        },
      ];
    });
  };

  const removeStat = (id: string) => {
    setProp((props: StatsProps) => {
      props.stats = props.stats.filter((s) => s.id !== id);
    });
  };

  const updateStat = (id: string, field: keyof StatItem, value: string | number) => {
    setProp((props: StatsProps) => {
      const stat = props.stats.find((s) => s.id === id);
      if (stat) {
        if (field === "value") {
          stat.value = parseInt(value as string) || 0;
        } else {
          (stat as Record<string, string | number>)[field] = value;
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Section Title (optional)</Label>
        <Input
          value={props.title}
          onChange={(e) => setProp((p: StatsProps) => (p.title = e.target.value))}
          placeholder="Our Impact"
        />
      </div>

      <div>
        <Label>Subtitle (optional)</Label>
        <Input
          value={props.subtitle}
          onChange={(e) => setProp((p: StatsProps) => (p.subtitle = e.target.value))}
          placeholder="Numbers that speak for themselves"
        />
      </div>

      <div>
        <Label>Columns</Label>
        <Select
          value={props.columns.toString()}
          onValueChange={(v) =>
            setProp((p: StatsProps) => (p.columns = parseInt(v) as 2 | 3 | 4))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Style</Label>
        <Select
          value={props.style}
          onValueChange={(v) =>
            setProp((p: StatsProps) => (p.style = v as StatsProps["style"]))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="bordered">Bordered</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Background</Label>
          <Input
            type="color"
            value={props.backgroundColor}
            onChange={(e) =>
              setProp((p: StatsProps) => (p.backgroundColor = e.target.value))
            }
          />
        </div>
        <div>
          <Label>Text Color</Label>
          <Input
            type="color"
            value={props.textColor}
            onChange={(e) =>
              setProp((p: StatsProps) => (p.textColor = e.target.value))
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="animate"
          checked={props.animate}
          onChange={(e) =>
            setProp((p: StatsProps) => (p.animate = e.target.checked))
          }
        />
        <Label htmlFor="animate">Animate Numbers on Scroll</Label>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Stats ({props.stats.length})</Label>
          <Button size="sm" onClick={addStat}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-3">
          {props.stats.map((stat, index) => (
            <div key={stat.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-muted-foreground">
                  Stat {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStat(stat.id)}
                  disabled={props.stats.length <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={stat.prefix}
                  onChange={(e) => updateStat(stat.id, "prefix", e.target.value)}
                  placeholder="Prefix"
                />
                <Input
                  type="number"
                  value={stat.value}
                  onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                  placeholder="Value"
                />
                <Input
                  value={stat.suffix}
                  onChange={(e) => updateStat(stat.id, "suffix", e.target.value)}
                  placeholder="Suffix"
                />
              </div>
              <Input
                value={stat.label}
                onChange={(e) => updateStat(stat.id, "label", e.target.value)}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

StatsComponent.craft = {
  props: defaultProps,
  related: {
    settings: StatsSettings,
  },
  displayName: "Stats",
};
```

### Task 60.5: Register New Components

**Update: `src/components/editor/components/index.ts`**

```typescript
// Add exports for new components
export { GalleryComponent } from "./gallery";
export { FAQComponent } from "./faq";
export { TeamComponent } from "./team";
export { StatsComponent } from "./stats";
```

### Task 60.6: Add to Component Toolbar

**Update component toolbar to include new components:**

```typescript
// In the component list/toolbar
const sectionComponents = [
  { name: "Hero", component: HeroComponent, icon: Layout },
  { name: "Features", component: FeatureGridComponent, icon: Grid },
  { name: "Testimonials", component: TestimonialsComponent, icon: Quote },
  { name: "CTA", component: CTAComponent, icon: Megaphone },
  { name: "Contact", component: ContactFormComponent, icon: Mail },
  // NEW COMPONENTS
  { name: "Gallery", component: GalleryComponent, icon: Image },
  { name: "FAQ", component: FAQComponent, icon: HelpCircle },
  { name: "Team", component: TeamComponent, icon: Users },
  { name: "Stats", component: StatsComponent, icon: TrendingUp },
];
```

### Task 60.7: Renderer Components

**File: `src/components/renderer/components/render-gallery.tsx`**

```tsx
interface GalleryData {
  images: Array<{ src: string; alt: string; caption?: string }>;
  columns: 2 | 3 | 4;
  gap: string;
  borderRadius: string;
  showCaptions: boolean;
}

export function RenderGallery({ props }: { props: GalleryData }) {
  const { images, columns, gap, borderRadius, showCaptions } = props;

  const columnClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className={`grid ${columnClasses[columns]} gap-${gap === "lg" ? "6" : gap === "md" ? "4" : "2"}`}>
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={image.src}
                alt={image.alt}
                className={`w-full h-48 object-cover rounded-${borderRadius}`}
              />
              {showCaptions && image.caption && (
                <p className="mt-2 text-sm text-center text-gray-600">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**File: `src/components/renderer/components/render-faq.tsx`**

```tsx
"use client";

import { useState } from "react";

interface FAQData {
  title: string;
  subtitle: string;
  items: Array<{ question: string; answer: string }>;
  backgroundColor: string;
}

export function RenderFAQ({ props }: { props: FAQData }) {
  const { title, subtitle, items, backgroundColor } = props;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-4" style={{ backgroundColor }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                className="w-full px-6 py-4 text-left font-medium flex justify-between items-center"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {item.question}
                <span className="text-2xl">{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**File: `src/components/renderer/components/render-team.tsx`**

```tsx
interface TeamData {
  title: string;
  subtitle: string;
  members: Array<{
    name: string;
    role: string;
    bio: string;
    image: string;
    linkedin?: string;
    twitter?: string;
  }>;
  columns: 2 | 3 | 4;
  showBio: boolean;
  showSocial: boolean;
}

export function RenderTeam({ props }: { props: TeamData }) {
  const { title, subtitle, members, columns, showBio, showSocial } = props;

  const columnClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <div className={`grid ${columnClasses[columns]} gap-8`}>
          {members.map((member, index) => (
            <div key={index} className="text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-primary font-medium mb-2">{member.role}</p>
              {showBio && (
                <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
              )}
              {showSocial && (
                <div className="flex justify-center gap-4">
                  {member.linkedin && (
                    <a href={member.linkedin} className="text-gray-400 hover:text-primary">
                      LinkedIn
                    </a>
                  )}
                  {member.twitter && (
                    <a href={member.twitter} className="text-gray-400 hover:text-primary">
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**File: `src/components/renderer/components/render-stats.tsx`**

```tsx
interface StatsData {
  title: string;
  subtitle: string;
  stats: Array<{
    value: number;
    prefix: string;
    suffix: string;
    label: string;
  }>;
  backgroundColor: string;
  textColor: string;
}

export function RenderStats({ props }: { props: StatsData }) {
  const { title, subtitle, stats, backgroundColor, textColor } = props;

  return (
    <section className="py-16 px-4" style={{ backgroundColor, color: textColor }}>
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="opacity-80">{subtitle}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {stat.prefix}
                {stat.value.toLocaleString()}
                {stat.suffix}
              </div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 🧪 Testing

### Test Gallery
- Add multiple images
- Change column count
- Toggle captions
- Verify lightbox opens

### Test FAQ
- Add/remove questions
- Test accordion functionality
- Switch between accordion and cards
- Test 2-column layout

### Test Team
- Add team members with images
- Toggle bio and social links
- Change column layouts
- Test different styles

### Test Stats
- Verify number animation on scroll
- Test different column counts
- Change background/text colors
- Add prefix/suffix

---

## ✅ Verification Checklist

- [ ] Gallery component renders with lightbox
- [ ] FAQ accordion expands/collapses correctly
- [ ] Team members display with social links
- [ ] Stats animate when scrolled into view
- [ ] All components appear in editor toolbar
- [ ] Settings panels work for all components
- [ ] Renderer components work correctly
- [ ] Mobile responsive layouts work

---

## 📁 Files Created

1. `src/components/editor/components/gallery.tsx`
2. `src/components/editor/components/faq.tsx`
3. `src/components/editor/components/team.tsx`
4. `src/components/editor/components/stats.tsx`
5. `src/components/renderer/components/render-gallery.tsx`
6. `src/components/renderer/components/render-faq.tsx`
7. `src/components/renderer/components/render-team.tsx`
8. `src/components/renderer/components/render-stats.tsx`

---

## ⏭️ Next Phase

Continue to **Phase 47: Site Management Complete** for feature fixes.
