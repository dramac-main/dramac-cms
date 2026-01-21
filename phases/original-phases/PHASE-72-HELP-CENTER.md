# Phase 72: Help Center - In-App Documentation

> **AI Model**: Claude Opus 4.5 (1x)
>
> **Priority**: 🟢 LOW
>
> **Estimated Time**: 2-3 hours

---

## ⚠️ SCHEMA WARNING - USE CORRECT TABLE NAMES!

| ❌ DO NOT USE | ✅ USE INSTEAD |
|---------------|----------------|
| `site_modules` | `site_module_installations` |
| `modules` | `modules_v2` |

---

## 🎯 Objective

Create an in-app help center with searchable documentation, FAQs, and contextual help tooltips to reduce support burden.

---

## 📋 Prerequisites

- [ ] Phase 71 completed
- [ ] Dashboard navigation exists
- [ ] shadcn/ui Dialog and Sheet components available

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
  | "team";

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: HelpCategory;
  content: string;
  tags: string[];
  readTime: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
}

export const HELP_CATEGORIES: { id: HelpCategory; label: string; icon: string }[] = [
  { id: "getting-started", label: "Getting Started", icon: "🚀" },
  { id: "clients", label: "Client Management", icon: "👥" },
  { id: "sites", label: "Site Building", icon: "🌐" },
  { id: "editor", label: "Visual Editor", icon: "🎨" },
  { id: "ai-builder", label: "AI Builder", icon: "🤖" },
  { id: "publishing", label: "Publishing", icon: "📤" },
  { id: "billing", label: "Billing", icon: "💳" },
  { id: "team", label: "Team", icon: "👥" },
];
```

---

### Task 72.2: Help Content Data

**File: `src/lib/help/help-content.ts`**

```typescript
import type { HelpArticle, FAQ } from "./help-types";

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "1",
    slug: "quick-start",
    title: "Quick Start Guide",
    description: "Get up and running with Dramac in 5 minutes",
    category: "getting-started",
    content: `
# Quick Start Guide

Welcome to Dramac! This guide will help you create your first website.

## Step 1: Create a Client

1. Go to **Clients** in the sidebar
2. Click **Add Client**
3. Enter the client's name and contact info
4. Click **Create**

## Step 2: Create a Site

1. Click **Add Site** on the client page
2. Enter a name and subdomain
3. Choose to start from scratch or use AI Builder

## Step 3: Build Your Page

Use the visual editor to drag and drop components:
- **Hero sections** for headlines
- **Features** to showcase benefits
- **Testimonials** for social proof
- **Contact** for inquiries

## Step 4: Publish

When ready, click **Publish** in the editor toolbar!
    `,
    tags: ["start", "first", "begin", "tutorial"],
    readTime: 5,
  },
  {
    id: "2",
    slug: "using-ai-builder",
    title: "Using the AI Builder",
    description: "Generate complete websites with AI",
    category: "ai-builder",
    content: `
# Using the AI Builder

The AI Builder can generate a complete website from a simple description.

## How to Use

1. Click **Build with AI** when creating a new site
2. Describe your business in a few sentences
3. Select an industry category
4. Click **Generate**

## Tips for Better Results

- Be specific about your business type
- Mention key features or services
- Include your target audience
- Specify your brand tone (professional, friendly, etc.)

## After Generation

Review and edit the generated content:
- Click on any text to modify it
- Use AI regeneration for specific sections
- Add or remove sections as needed
    `,
    tags: ["ai", "generate", "builder", "automatic"],
    readTime: 3,
  },
  // Add more articles...
];

export const FAQS: FAQ[] = [
  {
    id: "1",
    question: "How do I connect a custom domain?",
    answer: "Go to Site Settings > Domain, enter your domain, then add the CNAME record to your DNS provider pointing to your Dramac subdomain.",
    category: "publishing",
  },
  {
    id: "2",
    question: "Can I export my site?",
    answer: "Yes! Go to Site Settings > Export to download a JSON backup of your site including all pages and content.",
    category: "sites",
  },
  {
    id: "3",
    question: "How does billing work?",
    answer: "We use LemonSqueezy for billing. You can manage your subscription, update payment methods, and view invoices from Settings > Billing.",
    category: "billing",
  },
  {
    id: "4",
    question: "Can I collaborate with my team?",
    answer: "Yes! Go to Settings > Team to invite team members. You can set different roles (Admin, Editor, Viewer) for each member.",
    category: "team",
  },
  // Add more FAQs...
];

export function searchHelp(query: string): HelpArticle[] {
  const q = query.toLowerCase();
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.includes(q)) ||
      a.content.toLowerCase().includes(q)
  );
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category);
}

export function getFAQsByCategory(category: string): FAQ[] {
  return FAQS.filter((f) => f.category === category);
}
```

---

### Task 72.3: Help Command Palette

**File: `src/components/help/help-command.tsx`**

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Book, HelpCircle, ExternalLink } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { HELP_ARTICLES, FAQS } from "@/lib/help/help-content";

interface HelpCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCommand({ open, onOpenChange }: HelpCommandProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredArticles = search
    ? HELP_ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.tags.some((t) => t.includes(search.toLowerCase()))
      )
    : HELP_ARTICLES.slice(0, 5);

  const filteredFAQs = search
    ? FAQS.filter((f) =>
        f.question.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 3)
    : [];

  function handleSelect(articleSlug: string) {
    router.push(`/help/${articleSlug}`);
    onOpenChange(false);
  }

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search help articles..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Articles">
          {filteredArticles.map((article) => (
            <CommandItem
              key={article.id}
              onSelect={() => handleSelect(article.slug)}
            >
              <Book className="mr-2 h-4 w-4" />
              <div className="flex-1">
                <span>{article.title}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {article.readTime} min read
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {filteredFAQs.length > 0 && (
          <CommandGroup heading="FAQs">
            {filteredFAQs.map((faq) => (
              <CommandItem key={faq.id}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span className="truncate">{faq.question}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Links">
          <CommandItem onSelect={() => router.push("/help")}>
            <Book className="mr-2 h-4 w-4" />
            Browse All Articles
          </CommandItem>
          <CommandItem
            onSelect={() => window.open("mailto:support@dramac.app")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Contact Support
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

---

### Task 72.4: Help Button in Header

**File: `src/components/help/help-button.tsx`**

```typescript
"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpCommand } from "./help-command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(true)}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help (⌘/)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <HelpCommand open={open} onOpenChange={setOpen} />
    </>
  );
}
```

---

### Task 72.5: Help Page

**File: `src/app/(dashboard)/help/page.tsx`**

```typescript
import Link from "next/link";
import { Book, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HELP_CATEGORIES } from "@/lib/help/help-types";
import { HELP_ARTICLES, getArticlesByCategory } from "@/lib/help/help-content";

export default function HelpPage() {
  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground">
          Find answers and learn how to use Dramac
        </p>
      </div>

      {/* Categories */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {HELP_CATEGORIES.map((category) => {
          const articles = getArticlesByCategory(category.id);
          return (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {articles.slice(0, 3).map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/help/${article.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Book className="h-3 w-3" />
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {articles.length > 3 && (
                  <Link
                    href={`/help?category=${category.id}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Popular Articles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
        <div className="space-y-2">
          {HELP_ARTICLES.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              href={`/help/${article.slug}`}
              className="block p-4 rounded-lg border hover:bg-accent transition-colors"
            >
              <h3 className="font-medium">{article.title}</h3>
              <p className="text-sm text-muted-foreground">
                {article.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 72.6: Article Page

**File: `src/app/(dashboard)/help/[slug]/page.tsx`**

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getArticleBySlug, HELP_ARTICLES } from "@/lib/help/help-content";
import { HELP_CATEGORIES } from "@/lib/help/help-types";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const category = HELP_CATEGORIES.find((c) => c.id === article.category);

  return (
    <div className="container py-6 max-w-3xl">
      <Link
        href="/help"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Help Center
      </Link>

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{category?.icon}</span>
            <span>{category?.label}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{article.readTime} min read</span>
          </div>
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {article.description}
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* In production, use MDX or a markdown renderer */}
          <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }} />
        </div>
      </article>
    </div>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Help types and categories defined
- [ ] Help content data created (at least 5 articles)
- [ ] Help command palette working
- [ ] Help button in header
- [ ] Help page with categories
- [ ] Article detail page
- [ ] Keyboard shortcut (Cmd+/) working
- [ ] Search filtering works

---

## 📝 Notes for AI Agent

1. **STATIC CONTENT** - Help articles are static data, no database needed
2. **SEARCHABLE** - Ensure search covers title, description, and tags
3. **KEYBOARD SHORTCUT** - Cmd+/ should open help command
4. **EXPANDABLE** - Design for easy article additions
5. **MARKDOWN** - Consider adding MDX support for rich content later
