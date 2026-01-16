"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  User,
  ChevronRight,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { updateProfileAction, updateAgencyAction, checkOnboardingStatus } from "@/lib/actions/onboarding";
import { createClient } from "@/lib/supabase/client";

const steps = [
  { id: "profile", title: "Your Profile", icon: User },
  { id: "agency", title: "Agency Setup", icon: Building2 },
  { id: "complete", title: "All Set!", icon: CheckCircle },
];

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  jobTitle: z.string().optional(),
});

const agencySchema = z.object({
  agencyName: z.string().min(2, "Agency name must be at least 2 characters"),
  agencyDescription: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;
type AgencyValues = z.infer<typeof agencySchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", jobTitle: "" },
  });

  const agencyForm = useForm<AgencyValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: { agencyName: "", agencyDescription: "", website: "" },
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Check if user needs onboarding
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }

        const result = await checkOnboardingStatus();
        
        if (!result.needsOnboarding) {
          // Already completed onboarding, redirect to dashboard
          router.push("/dashboard");
          return;
        }

        // Pre-fill name from auth metadata or profile
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (userName) {
          profileForm.setValue("fullName", userName);
        }

        // Fetch profile to get existing name and job_title
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, full_name, job_title, agency_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          // Pre-fill profile form with existing data
          if (profile.full_name || profile.name) {
            profileForm.setValue("fullName", profile.full_name || profile.name || "");
          }
          if (profile.job_title) {
            profileForm.setValue("jobTitle", profile.job_title);
          }

          // If user has an agency, fetch and pre-fill agency data
          if (profile.agency_id) {
            const { data: agency } = await supabase
              .from("agencies")
              .select("name, description, website")
              .eq("id", profile.agency_id)
              .single();

            if (agency) {
              agencyForm.setValue("agencyName", agency.name || "");
              if (agency.description) {
                agencyForm.setValue("agencyDescription", agency.description);
              }
              if (agency.website) {
                agencyForm.setValue("website", agency.website);
              }
            }
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [router, profileForm, agencyForm]);

  const handleProfileSubmit = async (values: ProfileValues) => {
    setIsLoading(true);
    try {
      const result = await updateProfileAction(values);
      if (result.error) throw new Error(result.error);
      setCurrentStep(1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgencySubmit = async (values: AgencyValues) => {
    setIsLoading(true);
    try {
      const result = await updateAgencyAction(values);
      if (result.error) throw new Error(result.error);
      setCurrentStep(2);
      toast.success("Setup complete!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update agency";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  index <= currentStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : index === currentStep 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Profile */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome! Let&apos;s get started</CardTitle>
              <p className="text-muted-foreground">
                Tell us a bit about yourself
              </p>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Founder, Developer, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Agency */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Set up your agency</CardTitle>
              <p className="text-muted-foreground">
                This is where you&apos;ll manage clients and sites
              </p>
            </CardHeader>
            <CardContent>
              <Form {...agencyForm}>
                <form
                  onSubmit={agencyForm.handleSubmit(handleAgencySubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={agencyForm.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Agency" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="agencyDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your agency do?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(0)}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Complete */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">You&apos;re all set!</h1>
              <p className="text-muted-foreground mb-8">
                Your account is ready. Let&apos;s start building amazing websites.
              </p>
              <Button onClick={handleComplete} size="lg" className="w-full max-w-xs">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
