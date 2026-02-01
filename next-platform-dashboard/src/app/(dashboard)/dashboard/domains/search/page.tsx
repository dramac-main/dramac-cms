import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DomainSearchClient } from "./domain-search-client";

export const metadata = {
  title: "Search Domains | DRAMAC CMS",
  description: "Search and register domain names for your websites",
};

export default function DomainSearchPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Search Domains</h1>
          <p className="text-muted-foreground">
            Find and register the perfect domain for your website
          </p>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-8 md:p-12">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Your Online Identity Starts Here
          </h2>
          <p className="text-muted-foreground text-lg">
            Search millions of available domains. Register instantly with WHOIS privacy included.
          </p>
        </div>
      </div>
      
      {/* Search Component */}
      <DomainSearchClient />
      
      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Free WHOIS Privacy</h3>
          <p className="text-sm text-muted-foreground">
            Protect your personal information with free privacy protection on all domains.
          </p>
        </div>
        
        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Instant Activation</h3>
          <p className="text-sm text-muted-foreground">
            Your domain goes live immediately after registration. No waiting required.
          </p>
        </div>
        
        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Easy DNS Management</h3>
          <p className="text-sm text-muted-foreground">
            Full DNS control with one-click setup for websites, email, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
