"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Calendar, Send, MessageSquare, ArrowRight } from "lucide-react";

interface SiteSocialTabProps {
  siteId: string;
}

export function SiteSocialTab({ siteId }: SiteSocialTabProps) {
  return (
    <div className="space-y-6">
      {/* Social Media Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Management</CardTitle>
          <CardDescription>
            Manage your social media presence across multiple platforms. Schedule posts, engage with your audience, and track performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/dashboard/sites/${siteId}/social`}>
            <Button size="lg" className="w-full sm:w-auto">
              Open Social Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Social Media Features Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Connected Accounts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect your social media accounts. Supports Facebook, Instagram, Twitter/X, LinkedIn, TikTok, and more.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Compose & Publish</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and publish content to multiple platforms at once. Customize posts for each platform.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Content Calendar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Plan and schedule your content in advance. Visualize your posting schedule across all platforms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Unified Inbox</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage all social interactions in one place. Reply to comments, messages, and mentions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supported Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported Platforms</CardTitle>
          <CardDescription>
            Connect and manage your presence on all major social media platforms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "Facebook",
              "Instagram",
              "Twitter/X",
              "LinkedIn",
              "TikTok",
              "YouTube",
              "Pinterest",
              "Threads",
              "Bluesky",
              "Mastodon",
            ].map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium"
              >
                {platform}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
