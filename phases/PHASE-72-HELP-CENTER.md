# Phase 72: Help Center - In-App Documentation and Guides

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 MEDIUM
>
> **Estimated Time**: 3-4 hours

---

## 🎯 Objective

Build a comprehensive in-app help center with documentation, tutorials, FAQs, and contextual help tooltips to reduce support burden and improve user self-service.

---

## 📋 Prerequisites

- [ ] Phase 71 Email Notifications completed
- [ ] MDX rendering capability
- [ ] Search functionality infrastructure
- [ ] Basic UI components ready

---

## 💼 Business Value

1. **Support Reduction** - Users find answers themselves
2. **User Onboarding** - Guided learning experience
3. **User Satisfaction** - Quick answers to questions
4. **Scalability** - Self-service scales infinitely
5. **SEO** - Public docs improve discoverability

---

## 📁 Files to Create

```
src/lib/help/
├── help-types.ts                # Type definitions
├── help-content.ts              # Help articles data
├── help-search.ts               # Search functionality

src/components/help/
├── help-center.tsx              # Main help center
├── help-article.tsx             # Article display
├── help-sidebar.tsx             # Navigation sidebar
├── help-search.tsx              # Search bar
├── help-category.tsx            # Category section
├── contextual-help.tsx          # In-context tooltips
├── quick-start-guide.tsx        # Onboarding guide
├── faq-section.tsx              # FAQ accordion

src/app/(dashboard)/help/
├── page.tsx                     # Help center home
├── [slug]/page.tsx              # Article page
├── search/page.tsx              # Search results

src/hooks/
├── use-help-search.ts           # Search hook
```

---

## ✅ Tasks

### Task 72.1: Help Types

**File: `src/lib/help/help-types.ts`**

```typescript
export type HelpCategory =
  | "getting-started"
  | "clients"
  | "sites"
  | "editor"
  | "ai-builder"
  | "publishing"
  | "billing"
  | "team"
  | "troubleshooting";

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: HelpCategory;
  content: string;
  tags: string[];
  relatedArticles?: string[];
  videoUrl?: string;
  readTime: number; // minutes
  updatedAt: Date;
  featured?: boolean;
}

export interface HelpCategory {
  id: HelpCategory;
  label: string;
  description: string;
  icon: string;
  order: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  order: number;
}

export interface SearchResult {
  article: HelpArticle;
  score: number;
  highlights: {
    title?: string;
    content?: string;
  };
}

export interface ContextualHelp {
  id: string;
  target: string; // CSS selector or component ID
  title: string;
  content: string;
  learnMoreSlug?: string;
}

export interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  completed?: boolean;
}
```

---

### Task 72.2: Help Content Data

**File: `src/lib/help/help-content.ts`**

```typescript
import type { HelpArticle, FAQ, ContextualHelp, QuickStartStep } from "./help-types";

export const HELP_CATEGORIES = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "Learn the basics of DRAMAC CMS",
    icon: "🚀",
    order: 1,
  },
  {
    id: "clients",
    label: "Client Management",
    description: "Managing your clients and their projects",
    icon: "👥",
    order: 2,
  },
  {
    id: "sites",
    label: "Site Management",
    description: "Creating and managing websites",
    icon: "🌐",
    order: 3,
  },
  {
    id: "editor",
    label: "Visual Editor",
    description: "Building pages with the drag-and-drop editor",
    icon: "✏️",
    order: 4,
  },
  {
    id: "ai-builder",
    label: "AI Builder",
    description: "Generating websites with AI",
    icon: "✨",
    order: 5,
  },
  {
    id: "publishing",
    label: "Publishing",
    description: "Going live with custom domains",
    icon: "📤",
    order: 6,
  },
  {
    id: "billing",
    label: "Billing & Subscriptions",
    description: "Managing payments and plans",
    icon: "💳",
    order: 7,
  },
  {
    id: "team",
    label: "Team & Collaboration",
    description: "Working with team members",
    icon: "👨‍👩‍👧‍👦",
    order: 8,
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    description: "Common issues and solutions",
    icon: "🔧",
    order: 9,
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  // Getting Started
  {
    id: "welcome",
    slug: "welcome-to-dramac",
    title: "Welcome to DRAMAC CMS",
    description: "An introduction to DRAMAC CMS and what you can do with it.",
    category: "getting-started",
    content: `
# Welcome to DRAMAC CMS

DRAMAC CMS is a powerful website builder designed for digital agencies. Build beautiful websites for your clients with our intuitive visual editor or generate them instantly with AI.

## What You Can Do

- **Create Unlimited Sites**: Build websites for all your clients from one dashboard
- **Visual Editor**: Drag-and-drop components to design pages
- **AI Generation**: Generate complete websites from a simple description
- **Custom Domains**: Connect your clients' domains with SSL
- **Team Collaboration**: Invite team members with different roles

## Quick Links

- [Create Your First Client](/help/create-first-client)
- [Build a Site with the Editor](/help/visual-editor-basics)
- [Generate a Site with AI](/help/ai-builder-guide)
    `,
    tags: ["introduction", "overview", "basics"],
    readTime: 2,
    updatedAt: new Date("2024-03-01"),
    featured: true,
  },
  {
    id: "create-first-client",
    slug: "create-first-client",
    title: "Create Your First Client",
    description: "Step-by-step guide to adding your first client.",
    category: "getting-started",
    content: `
# Create Your First Client

Clients in DRAMAC CMS represent your business customers. Each client can have multiple websites.

## Steps to Create a Client

1. Go to **Clients** in the sidebar
2. Click **Add Client**
3. Fill in the client details:
   - **Name**: The client's business name
   - **Email**: Primary contact email
   - **Industry**: Helps with AI suggestions
4. Click **Create Client**

## What's Next?

After creating a client, you can:
- Create sites for them
- Invite them to view their sites
- Manage their billing
    `,
    tags: ["client", "create", "first", "setup"],
    relatedArticles: ["visual-editor-basics", "ai-builder-guide"],
    readTime: 3,
    updatedAt: new Date("2024-03-05"),
    featured: true,
  },
  // Editor
  {
    id: "visual-editor-basics",
    slug: "visual-editor-basics",
    title: "Visual Editor Basics",
    description: "Learn how to use the drag-and-drop visual editor.",
    category: "editor",
    content: `
# Visual Editor Basics

The visual editor is your main tool for building website pages. It uses a drag-and-drop interface to add and arrange components.

## Editor Layout

- **Left Sidebar**: Component library
- **Center Canvas**: Your page preview
- **Right Panel**: Component settings

## Adding Components

1. Drag a component from the sidebar
2. Drop it onto the canvas
3. Click to select and edit

## Component Types

- **Layout**: Containers, grids, sections
- **Content**: Text, headings, images
- **Interactive**: Buttons, forms, accordions
- **Media**: Videos, galleries, icons

## Tips

- Use sections to organize your page
- Group related elements in containers
- Preview on different screen sizes
    `,
    tags: ["editor", "drag-drop", "components", "design"],
    videoUrl: "https://youtube.com/watch?v=example",
    readTime: 5,
    updatedAt: new Date("2024-03-10"),
    featured: true,
  },
  // AI Builder
  {
    id: "ai-builder-guide",
    slug: "ai-builder-guide",
    title: "AI Builder Guide",
    description: "Generate complete websites with AI in seconds.",
    category: "ai-builder",
    content: `
# AI Builder Guide

The AI Builder creates complete, professional websites from a simple text description.

## How It Works

1. Describe what you want
2. AI generates the structure
3. AI creates the content
4. Review and customize

## Writing Good Prompts

**Be specific about:**
- Business type
- Target audience
- Key features needed
- Style preferences

**Example prompt:**
> "A modern law firm website for Smith & Associates. They specialize in family law. Need pages for services, about the team, case results, and contact. Professional and trustworthy feel."

## After Generation

- Review all pages
- Customize colors and fonts
- Replace placeholder images
- Edit any text
- Add or remove sections
    `,
    tags: ["ai", "generate", "prompt", "automatic"],
    readTime: 4,
    updatedAt: new Date("2024-03-12"),
    featured: true,
  },
  // Publishing
  {
    id: "publishing-site",
    slug: "publishing-site",
    title: "Publishing Your Site",
    description: "How to make your site live on the web.",
    category: "publishing",
    content: `
# Publishing Your Site

Publishing makes your site accessible to the public on the internet.

## Publishing Options

### Subdomain (Free)
Every site gets a free subdomain:
\`yoursite.dramac.app\`

### Custom Domain
Connect your own domain:
\`www.yourclient.com\`

## How to Publish

1. Go to the site's **Settings**
2. Click **Publishing**
3. Choose your domain option
4. Click **Publish**

## Custom Domain Setup

1. Add your domain in settings
2. Follow DNS instructions
3. Wait for verification (up to 48h)
4. SSL is automatic

## Unpublishing

You can unpublish anytime to take the site offline.
    `,
    tags: ["publish", "domain", "live", "dns", "ssl"],
    readTime: 4,
    updatedAt: new Date("2024-03-08"),
  },
];

export const FAQS: FAQ[] = [
  {
    id: "faq-1",
    question: "How many websites can I create?",
    answer: "You can create unlimited websites. You only pay for client seats that are active.",
    category: "billing",
    order: 1,
  },
  {
    id: "faq-2",
    question: "Can I use my own domain?",
    answer: "Yes! You can connect any custom domain to your sites. SSL certificates are automatically provisioned.",
    category: "publishing",
    order: 1,
  },
  {
    id: "faq-3",
    question: "How does the AI builder work?",
    answer: "Our AI analyzes your description and generates a complete website structure with relevant content, images, and styling. You can then customize everything in the visual editor.",
    category: "ai-builder",
    order: 1,
  },
  {
    id: "faq-4",
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your sites will remain accessible until the end of your billing period.",
    category: "billing",
    order: 2,
  },
  {
    id: "faq-5",
    question: "Is there a free trial?",
    answer: "Yes! Start with a free trial to explore all features. No credit card required.",
    category: "billing",
    order: 3,
  },
];

export const CONTEXTUAL_HELP: ContextualHelp[] = [
  {
    id: "client-industry",
    target: "[data-help='client-industry']",
    title: "Why select an industry?",
    content: "Selecting an industry helps our AI generate more relevant content and suggest appropriate templates.",
    learnMoreSlug: "ai-builder-guide",
  },
  {
    id: "site-subdomain",
    target: "[data-help='site-subdomain']",
    title: "What is a subdomain?",
    content: "A subdomain is the free URL for your site (e.g., yoursite.dramac.app). You can add a custom domain later.",
    learnMoreSlug: "publishing-site",
  },
  {
    id: "page-seo",
    target: "[data-help='page-seo']",
    title: "SEO Settings",
    content: "SEO settings help search engines understand your page. Include relevant keywords in your title and description.",
  },
];

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    id: "create-agency",
    title: "Set up your agency",
    description: "Add your agency name and logo",
    action: { label: "Agency Settings", href: "/settings/agency" },
  },
  {
    id: "add-client",
    title: "Add your first client",
    description: "Create a client to start building sites",
    action: { label: "Add Client", href: "/clients/new" },
  },
  {
    id: "create-site",
    title: "Create a website",
    description: "Build a site for your client",
    action: { label: "New Site", href: "/sites/new" },
  },
  {
    id: "explore-editor",
    title: "Explore the editor",
    description: "Learn the visual editor basics",
    action: { label: "View Guide", href: "/help/visual-editor-basics" },
  },
  {
    id: "invite-team",
    title: "Invite team members",
    description: "Collaborate with your team",
    action: { label: "Team Settings", href: "/settings/team" },
  },
];

// Get article by slug
export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

// Get articles by category
export function getArticlesByCategory(category: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

// Get featured articles
export function getFeaturedArticles(): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.featured);
}

// Get FAQs by category
export function getFAQsByCategory(category: string): FAQ[] {
  return FAQS.filter((f) => f.category === category).sort((a, b) => a.order - b.order);
}
```

---

### Task 72.3: Help Search

**File: `src/lib/help/help-search.ts`**

```typescript
import { HELP_ARTICLES, FAQS } from "./help-content";
import type { HelpArticle, SearchResult, FAQ } from "./help-types";

// Simple text search scoring
function calculateScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);
  
  let score = 0;
  
  // Exact match bonus
  if (lowerText.includes(lowerQuery)) {
    score += 10;
  }
  
  // Word match scoring
  for (const word of words) {
    if (word.length < 2) continue;
    
    const regex = new RegExp(word, "gi");
    const matches = lowerText.match(regex);
    
    if (matches) {
      score += matches.length;
    }
  }
  
  return score;
}

// Highlight matching text
function highlightMatches(text: string, query: string): string {
  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  let result = text;
  
  for (const word of words) {
    const regex = new RegExp(`(${word})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }
  
  return result;
}

// Get snippet around match
function getSnippet(text: string, query: string, maxLength = 150): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) {
    return text.slice(0, maxLength) + "...";
  }
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 100);
  
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  
  return highlightMatches(snippet, query);
}

// Search articles
export function searchArticles(query: string): SearchResult[] {
  if (!query || query.length < 2) {
    return [];
  }
  
  const results: SearchResult[] = [];
  
  for (const article of HELP_ARTICLES) {
    // Score different fields with weights
    const titleScore = calculateScore(article.title, query) * 3;
    const descScore = calculateScore(article.description, query) * 2;
    const contentScore = calculateScore(article.content, query);
    const tagScore = article.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      ? 5
      : 0;
    
    const totalScore = titleScore + descScore + contentScore + tagScore;
    
    if (totalScore > 0) {
      results.push({
        article,
        score: totalScore,
        highlights: {
          title: titleScore > 0 ? highlightMatches(article.title, query) : undefined,
          content: contentScore > 0 ? getSnippet(article.content, query) : undefined,
        },
      });
    }
  }
  
  // Sort by score
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

// Search FAQs
export function searchFAQs(query: string): FAQ[] {
  if (!query || query.length < 2) {
    return [];
  }
  
  return FAQS.filter((faq) => {
    const qScore = calculateScore(faq.question, query);
    const aScore = calculateScore(faq.answer, query);
    return qScore + aScore > 0;
  });
}

// Combined search
export function searchHelp(query: string): {
  articles: SearchResult[];
  faqs: FAQ[];
} {
  return {
    articles: searchArticles(query),
    faqs: searchFAQs(query),
  };
}
```

---

### Task 72.4: Help Search Hook

**File: `src/hooks/use-help-search.ts`**

```typescript
"use client";

import { useState, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchHelp } from "@/lib/help/help-search";
import type { SearchResult, FAQ } from "@/lib/help/help-types";

export function useHelpSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return { articles: [], faqs: [] };
    }
    return searchHelp(debouncedQuery);
  }, [debouncedQuery]);
  
  const hasResults = results.articles.length > 0 || results.faqs.length > 0;
  
  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);
  
  return {
    query,
    setQuery,
    results,
    hasResults,
    isSearching: query !== debouncedQuery,
    clearSearch,
  };
}
```

---

### Task 72.5: Help Search Component

**File: `src/components/help/help-search.tsx`**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, HelpCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useHelpSearch } from "@/hooks/use-help-search";

export function HelpSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, hasResults, isSearching, clearSearch } = useHelpSearch();

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSelect = (slug: string) => {
    router.push(`/help/${slug}`);
    setOpen(false);
    clearSearch();
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search help articles..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-[400px] overflow-auto">
          {isSearching ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {/* Articles */}
              {results.articles.length > 0 && (
                <div className="mb-2">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    Articles
                  </p>
                  {results.articles.slice(0, 5).map((result) => (
                    <button
                      key={result.article.id}
                      onClick={() => handleSelect(result.article.slug)}
                      className="w-full flex items-start gap-3 p-2 hover:bg-muted rounded-md text-left"
                    >
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p
                          className="font-medium text-sm"
                          dangerouslySetInnerHTML={{
                            __html: result.highlights.title || result.article.title,
                          }}
                        />
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.article.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* FAQs */}
              {results.faqs.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    FAQs
                  </p>
                  {results.faqs.slice(0, 3).map((faq) => (
                    <div
                      key={faq.id}
                      className="flex items-start gap-3 p-2 hover:bg-muted rounded-md"
                    >
                      <HelpCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{faq.question}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Task 72.6: Help Sidebar Component

**File: `src/components/help/help-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HELP_CATEGORIES, getArticlesByCategory } from "@/lib/help/help-content";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HelpSidebar() {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").pop();

  return (
    <nav className="w-64 shrink-0">
      <div className="sticky top-20">
        <h2 className="font-semibold mb-4">Documentation</h2>
        <Accordion type="multiple" defaultValue={HELP_CATEGORIES.map((c) => c.id)}>
          {HELP_CATEGORIES.map((category) => {
            const articles = getArticlesByCategory(category.id);
            
            if (articles.length === 0) return null;
            
            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="text-sm py-2">
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 pl-6">
                    {articles.map((article) => (
                      <li key={article.id}>
                        <Link
                          href={`/help/${article.slug}`}
                          className={cn(
                            "block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
                            currentSlug === article.slug && "text-primary font-medium"
                          )}
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </nav>
  );
}
```

---

### Task 72.7: Help Article Component

**File: `src/components/help/help-article.tsx`**

```tsx
import { Calendar, Clock, ExternalLink, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HELP_CATEGORIES, getArticleBySlug } from "@/lib/help/help-content";
import type { HelpArticle } from "@/lib/help/help-types";
import Link from "next/link";

interface HelpArticleProps {
  article: HelpArticle;
}

export function HelpArticleContent({ article }: HelpArticleProps) {
  const category = HELP_CATEGORIES.find((c) => c.id === article.category);
  
  // Simple markdown-ish to HTML conversion
  const htmlContent = article.content
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 mt-8">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-3 mt-6">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-2 mt-4">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    .replace(/\n\n/g, "</p><p class='mb-4'>")
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-4">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');

  return (
    <article className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        {category && (
          <Badge variant="secondary" className="mb-3">
            {category.icon} {category.label}
          </Badge>
        )}
        <h1 className="text-4xl font-bold mb-3">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.description}</p>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Updated {article.updatedAt.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Video embed */}
      {article.videoUrl && (
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Video Tutorial</p>
                <p className="text-sm text-muted-foreground">
                  Watch the video guide for this topic
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={article.videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Watch
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <div
        className="prose prose-gray dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Tags */}
      <div className="mt-8 pt-8 border-t">
        <p className="text-sm text-muted-foreground mb-2">Tags:</p>
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Related articles */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <div className="mt-8 pt-8 border-t">
          <h3 className="font-semibold mb-4">Related Articles</h3>
          <div className="grid gap-3">
            {article.relatedArticles.map((slug) => {
              const related = getArticleBySlug(slug);
              if (!related) return null;
              
              return (
                <Link
                  key={slug}
                  href={`/help/${slug}`}
                  className="block p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium">{related.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {related.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
```

---

### Task 72.8: FAQ Section Component

**File: `src/components/help/faq-section.tsx`**

```tsx
"use client";

import { FAQS, HELP_CATEGORIES } from "@/lib/help/help-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FAQSectionProps {
  category?: string;
}

export function FAQSection({ category }: FAQSectionProps) {
  const categories = HELP_CATEGORIES.filter((c) =>
    FAQS.some((f) => f.category === c.id)
  );
  
  const filteredFaqs = category
    ? FAQS.filter((f) => f.category === category)
    : FAQS;

  if (category) {
    return (
      <Accordion type="single" collapsible className="w-full">
        {filteredFaqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  return (
    <Tabs defaultValue={categories[0]?.id}>
      <TabsList className="mb-4">
        {categories.map((cat) => (
          <TabsTrigger key={cat.id} value={cat.id}>
            {cat.icon} {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {categories.map((cat) => (
        <TabsContent key={cat.id} value={cat.id}>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.filter((f) => f.category === cat.id).map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

---

### Task 72.9: Quick Start Guide Component

**File: `src/components/help/quick-start-guide.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Circle, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUICK_START_STEPS } from "@/lib/help/help-content";

export function QuickStartGuide() {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("quickstart-completed");
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
    const isDismissed = localStorage.getItem("quickstart-dismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const toggleStep = (stepId: string) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];
    
    setCompletedSteps(newCompleted);
    localStorage.setItem("quickstart-completed", JSON.stringify(newCompleted));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("quickstart-dismissed", "true");
  };

  if (dismissed) return null;

  const progress = (completedSteps.length / QUICK_START_STEPS.length) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">Quick Start Guide</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Your progress</span>
            <span>{completedSteps.length}/{QUICK_START_STEPS.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <ul className="space-y-2">
          {QUICK_START_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            
            return (
              <li
                key={step.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="shrink-0"
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                
                {step.action && !isCompleted && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={step.action.href}>
                      {step.action.label}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
```

---

### Task 72.10: Help Center Page

**File: `src/app/(dashboard)/help/page.tsx`**

```tsx
import Link from "next/link";
import { HelpSearch } from "@/components/help/help-search";
import { FAQSection } from "@/components/help/faq-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HELP_CATEGORIES, getFeaturedArticles } from "@/lib/help/help-content";

export const metadata = {
  title: "Help Center | DRAMAC CMS",
  description: "Get help with DRAMAC CMS",
};

export default function HelpCenterPage() {
  const featuredArticles = getFeaturedArticles();

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Search our documentation or browse by category
        </p>
        <div className="max-w-md mx-auto">
          <HelpSearch />
        </div>
      </div>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {HELP_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/help?category=${category.id}`}
              className="block p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-2xl mb-2 block">{category.icon}</span>
              <h3 className="font-medium">{category.label}</h3>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured articles */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Popular Articles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {featuredArticles.map((article) => (
            <Card key={article.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Link href={`/help/${article.slug}`} className="hover:text-primary">
                    {article.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {article.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {article.readTime} min read
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        <FAQSection />
      </section>
    </div>
  );
}
```

---

### Task 72.11: Help Article Page

**File: `src/app/(dashboard)/help/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { HelpSidebar } from "@/components/help/help-sidebar";
import { HelpArticleContent } from "@/components/help/help-article";
import { getArticleBySlug, HELP_ARTICLES } from "@/lib/help/help-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  
  if (!article) {
    return { title: "Not Found" };
  }
  
  return {
    title: `${article.title} | Help Center`,
    description: article.description,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  
  if (!article) {
    notFound();
  }
  
  return (
    <div className="container py-8">
      <div className="flex gap-12">
        <HelpSidebar />
        <main className="flex-1 min-w-0">
          <HelpArticleContent article={article} />
        </main>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Search returns relevant results
- [ ] Score calculation works
- [ ] Highlight matching works
- [ ] Category filtering works

### Integration Tests
- [ ] Help pages load correctly
- [ ] Search results link correctly
- [ ] Navigation works
- [ ] Quick start state persists

### E2E Tests
- [ ] User can search help
- [ ] User can browse categories
- [ ] User can read articles
- [ ] Quick start guide works

---

## ✅ Completion Checklist

- [ ] Help types defined
- [ ] Help content created
- [ ] Search functionality working
- [ ] Search hook created
- [ ] Help search component created
- [ ] Help sidebar component created
- [ ] Help article component created
- [ ] FAQ section component created
- [ ] Quick start guide component created
- [ ] Help center page created
- [ ] Article page created
- [ ] Tests passing

---

**Next Phase**: Phase 73 - Keyboard Shortcuts
