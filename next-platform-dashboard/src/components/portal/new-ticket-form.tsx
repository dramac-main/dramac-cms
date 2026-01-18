"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createTicket } from "@/lib/portal/support-service";
import type { PortalUser } from "@/lib/portal/portal-auth";
import type { PortalSite } from "@/lib/portal/portal-service";

interface NewTicketFormProps {
  user: PortalUser;
  sites: PortalSite[];
}

export function NewTicketForm({ user, sites }: NewTicketFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "normal",
    siteId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setIsSubmitting(true);

    const result = await createTicket(
      user.clientId,
      {
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        category: formData.category as "general" | "bug" | "feature" | "billing" | "content",
        priority: formData.priority as "low" | "normal" | "high" | "urgent",
        siteId: formData.siteId || undefined,
      },
      user.fullName
    );

    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Ticket created successfully!`);
      router.push(`/portal/support/${result.ticketId}`);
    } else {
      toast.error(result.error || "Failed to create ticket");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/support">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
          <CardDescription>
            Describe your issue and we'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Question</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="content">Content Change</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Site (optional) */}
            {sites.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="site">Related Site (optional)</Label>
                <Select
                  value={formData.siteId}
                  onValueChange={(value) => setFormData({ ...formData, siteId: value })}
                >
                  <SelectTrigger id="site">
                    <SelectValue placeholder="Select a site (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific site</SelectItem>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe your issue in detail. Include any relevant information such as steps to reproduce, expected behavior, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" asChild>
                <Link href="/portal/support">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
