"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const requestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(50, "Please provide more detail (50+ characters)"),
  useCase: z.string().min(20, "Explain the use case (20+ characters)"),
  targetAudience: z.string().min(10, "Who would use this?"),
  suggestedInstallLevel: z.enum(["agency", "client", "site"]),
  suggestedCategory: z.string(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  budgetRange: z.string(),
  willingToFund: z.boolean(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function ModuleRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      useCase: "",
      targetAudience: "",
      suggestedInstallLevel: "client",
      suggestedCategory: "productivity",
      priority: "normal",
      budgetRange: "free",
      willingToFund: false,
    },
  });

  const onSubmit = async (data: RequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/modules/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      toast.success("Module request submitted!", {
        description: "Our team will review your request soon.",
      });
      
      router.push("/dashboard/modules/requests");
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tips Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Tips for a Great Request
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Be specific about what problem it solves</li>
              <li>Explain who would benefit from it</li>
              <li>Include any similar tools you&apos;ve seen</li>
              <li>Higher priority requests get faster review</li>
            </ul>
          </CardContent>
        </Card>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module Name / Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Grant Proposal Writer" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                A short, descriptive name for the module
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this module should do, its features, and how it would work..."
                  rows={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Use Case */}
        <FormField
          control={form.control}
          name="useCase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Use Case / Problem</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What problem does this solve? Why do you or your clients need it?"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Target Audience */}
        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Audience</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Nonprofits, small businesses, marketing agencies"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Who would use this module?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Install Level */}
          <FormField
            control={form.control}
            name="suggestedInstallLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suggested Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="agency">
                      Agency Tool (for your agency)
                    </SelectItem>
                    <SelectItem value="client">
                      Client App (standalone, no site needed)
                    </SelectItem>
                    <SelectItem value="site">
                      Site Module (website enhancement)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="suggestedCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low - Nice to have</SelectItem>
                    <SelectItem value="normal">Normal - Would be helpful</SelectItem>
                    <SelectItem value="high">High - Really need this</SelectItem>
                    <SelectItem value="urgent">Urgent - Critical for business</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget */}
          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Price Range</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="K25-650">K25-650/month</SelectItem>
                    <SelectItem value="K650-1300">K650-1,300/month</SelectItem>
                    <SelectItem value="K1300-2600">K1,300-2,600/month</SelectItem>
                    <SelectItem value="K2600+">K2,600+/month</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Willing to Fund */}
        <FormField
          control={form.control}
          name="willingToFund"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I&apos;m willing to help fund development
                </FormLabel>
                <FormDescription>
                  Funded requests are prioritized and may get exclusive early access
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
