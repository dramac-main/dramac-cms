import { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  MessageCircle,
  Book,
  Mail,
  ExternalLink,
  FileQuestion,
  Lightbulb,
  Youtube,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Help & Support | DRAMAC",
  description: "Get help with DRAMAC CMS",
};

const supportOptions = [
  {
    title: "Documentation",
    description: "Read guides and tutorials to learn how to use DRAMAC",
    icon: Book,
    href: "/docs",
    external: false,
  },
  {
    title: "FAQ",
    description: "Find answers to frequently asked questions",
    icon: FileQuestion,
    href: "/docs/faq",
    external: false,
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    icon: Youtube,
    href: "https://youtube.com/@dramac",
    external: true,
  },
  {
    title: "Community",
    description: "Join our Discord community for help and discussions",
    icon: MessageCircle,
    href: "https://discord.gg/dramac",
    external: true,
  },
];

const quickLinks = [
  {
    title: "Getting Started",
    description: "New to DRAMAC? Start here",
    href: "/docs/getting-started",
  },
  {
    title: "Creating Your First Site",
    description: "Learn how to create and customize sites",
    href: "/docs/creating-sites",
  },
  {
    title: "Using the Visual Editor",
    description: "Master the drag-and-drop editor",
    href: "/docs/visual-editor",
  },
  {
    title: "AI Site Builder",
    description: "Generate sites with AI assistance",
    href: "/docs/ai-builder",
  },
];

export default function SupportPage() {
  return (
    <DashboardShell className="max-w-5xl">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Get help with DRAMAC CMS. Find answers, read documentation, or contact our support team.
        </p>
      </div>

      {/* Support Options Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {supportOptions.map((option) => (
          <Card key={option.title} className="hover:border-primary transition-colors group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <option.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
                </div>
                {option.external && (
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {option.external ? (
                <a href={option.href} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    Open
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </a>
              ) : (
                <Link href={option.href}>
                  <Button variant="outline" className="w-full">
                    View
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Quick Links</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="block p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors"
            >
              <h3 className="font-medium">{link.title}</h3>
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Contact Support Card */}
      <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Still need help?
          </CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <a href="mailto:support@dramac.io">
            <Button className="w-full sm:w-auto">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </a>
          <a href="https://discord.gg/dramac" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full sm:w-auto">
              <MessageCircle className="w-4 h-4 mr-2" />
              Join Discord
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Response Time Notice */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Email support typically responds within 24-48 hours during business days.
      </p>
    </DashboardShell>
  );
}
