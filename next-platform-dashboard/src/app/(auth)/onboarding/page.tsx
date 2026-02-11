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
  ChevronLeft,
  CircleCheck,
  Briefcase,
  Target,
  Users,
  Sparkles,
  Rocket,
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
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { IndustrySelector } from "@/components/onboarding/industry-selector";
import { GoalCards } from "@/components/onboarding/goal-cards";
import {
  updateProfileAction,
  updateAgencyAction,
  createFirstClientAction,
  completeOnboardingAction,
  skipOnboardingAction,
  checkOnboardingStatus,
} from "@/lib/actions/onboarding";
import type { IndustryId } from "@/lib/constants/onboarding";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: "profile", title: "Your Profile", icon: User },
  { id: "agency", title: "Agency", icon: Building2 },
  { id: "goals", title: "Goals", icon: Target },
  { id: "industry", title: "Industry", icon: Briefcase },
  { id: "client", title: "First Client", icon: Users },
  { id: "complete", title: "All Set!", icon: CircleCheck },
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

const clientSchema = z.object({
  clientName: z.string().min(2, "Client name required"),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;
type AgencyValues = z.infer<typeof agencySchema>;
type ClientValues = z.infer<typeof clientSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Additional state for goals/industry
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | undefined>();
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", jobTitle: "" },
  });

  const agencyForm = useForm<AgencyValues>({
    resolver: zodResolver(agencySchema),
    defaultValues: { agencyName: "", agencyDescription: "", website: "" },
  });

  const clientForm = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { clientName: "", clientEmail: "" },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Check onboarding status on mount
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
          router.push("/dashboard");
          return;
        }

        // Pre-fill name from auth metadata
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (userName) {
          profileForm.setValue("fullName", userName);
        }

        // Fetch existing profile data
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, full_name, job_title, agency_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.full_name || profile.name) {
            profileForm.setValue("fullName", profile.full_name || profile.name || "");
          }
          if (profile.job_title) {
            profileForm.setValue("jobTitle", profile.job_title);
          }

          // If user has an agency, fetch and pre-fill agency data
          if (profile.agency_id) {
            setAgencyId(profile.agency_id);
            // Query basic fields that exist - new fields from migration are optional
            const { data: agency } = await supabase
              .from("agencies")
              .select("*")
              .eq("id", profile.agency_id)
              .single();

            if (agency) {
              // Type assertion for agency since new columns may not be in types yet
              const agencyData = agency as {
                name?: string | null;
                description?: string | null;
                website?: string | null;
                industry?: string | null;
                team_size?: string | null;
                goals?: string[] | null;
              };
              
              agencyForm.setValue("agencyName", agencyData.name || "");
              if (agencyData.description) {
                agencyForm.setValue("agencyDescription", agencyData.description);
              }
              if (agencyData.website) {
                agencyForm.setValue("website", agencyData.website);
              }
              if (agencyData.industry) {
                setSelectedIndustry(agencyData.industry as IndustryId);
              }
              if (agencyData.team_size) {
                setTeamSize(agencyData.team_size);
              }
              if (agencyData.goals && Array.isArray(agencyData.goals)) {
                setSelectedGoals(agencyData.goals);
              }
            }
          }
        }

        // Resume from where they left off
        if (result.hasProfile && result.hasAgency) {
          setCurrentStep(2); // Goals step
        } else if (result.hasProfile) {
          setCurrentStep(1); // Agency step
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
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgencySubmit = async (values: AgencyValues) => {
    setIsLoading(true);
    try {
      const result = await updateAgencyAction({
        ...values,
        industry: selectedIndustry,
        teamSize,
        goals: selectedGoals,
      });
      if (result.error) throw new Error(result.error);
      if (result.agencyId) setAgencyId(result.agencyId);
      setCurrentStep(2);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create agency");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalsNext = async () => {
    // Save goals and team size to agency
    if (agencyId) {
      setIsLoading(true);
      try {
        const result = await updateAgencyAction({
          agencyName: agencyForm.getValues("agencyName"),
          agencyDescription: agencyForm.getValues("agencyDescription"),
          website: agencyForm.getValues("website"),
          industry: selectedIndustry,
          teamSize,
          goals: selectedGoals,
        });
        if (result.error) throw new Error(result.error);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to save goals");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setCurrentStep(3);
  };

  const handleIndustryNext = async () => {
    // Save industry to agency
    if (agencyId) {
      setIsLoading(true);
      try {
        const result = await updateAgencyAction({
          agencyName: agencyForm.getValues("agencyName"),
          agencyDescription: agencyForm.getValues("agencyDescription"),
          website: agencyForm.getValues("website"),
          industry: selectedIndustry,
          teamSize,
          goals: selectedGoals,
        });
        if (result.error) throw new Error(result.error);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to save industry");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setCurrentStep(4);
  };

  const handleClientSubmit = async (values: ClientValues) => {
    if (!agencyId) {
      // Skip client creation if no agency
      setCurrentStep(5);
      return;
    }

    setIsLoading(true);
    try {
      const result = await createFirstClientAction(agencyId, {
        clientName: values.clientName,
        clientEmail: values.clientEmail || undefined,
        clientIndustry: selectedIndustry,
      });
      if (result.error) throw new Error(result.error);
      setCurrentStep(5);
      toast.success("Client created!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipClient = () => {
    setCurrentStep(5);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await completeOnboardingAction();
      router.push("/dashboard?tour=true");
    } catch (_error) {
      toast.error("Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipAll = async () => {
    setIsLoading(true);
    try {
      await skipOnboardingAction();
      router.push("/dashboard");
    } catch (_error) {
      toast.error("Failed to skip onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step 1: Profile */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Welcome to DRAMAC CMS!
              </CardTitle>
              <CardDescription>
                Let&apos;s set up your account. This will only take a minute.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
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
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Agency Owner, Designer, etc." {...field} />
                        </FormControl>
                        <FormDescription>Optional but helps us personalize your experience</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="ghost" onClick={handleSkipAll}>
                      Skip for now
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Agency */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Set Up Your Agency
              </CardTitle>
              <CardDescription>
                Tell us about your agency so we can customize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...agencyForm}>
                <form onSubmit={agencyForm.handleSubmit(handleAgencySubmit)} className="space-y-4">
                  <FormField
                    control={agencyForm.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name *</FormLabel>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What does your agency do?"
                            className="resize-none"
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
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://myagency.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Goals */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Goals
              </CardTitle>
              <CardDescription>
                Help us understand what you want to achieve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalCards
                selectedGoals={selectedGoals}
                onGoalsChange={setSelectedGoals}
                teamSize={teamSize}
                onTeamSizeChange={setTeamSize}
              />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleGoalsNext} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Industry */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Primary Industry
              </CardTitle>
              <CardDescription>
                What industry do most of your clients belong to? This helps our AI generate better content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndustrySelector value={selectedIndustry} onChange={setSelectedIndustry} />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleIndustryNext} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: First Client */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Your First Client
              </CardTitle>
              <CardDescription>
                Create your first client to get started building websites. You can skip this and add clients later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(handleClientSubmit)} className="space-y-4">
                  <FormField
                    control={clientForm.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client/Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={clientForm.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input placeholder="client@example.com" type="email" {...field} />
                        </FormControl>
                        <FormDescription>Optional - for sending invites later</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={handleSkipClient}>
                        Skip
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Client
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Complete */}
        {currentStep === 5 && (
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <CircleCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
              <CardDescription className="text-base">
                Your agency is ready. Start building amazing websites for your clients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
                <div className="p-4 rounded-lg bg-muted/50">
                  <Rocket className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium">Visual Editor</p>
                  <p className="text-xs text-muted-foreground">Drag & drop builder</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium">AI Builder</p>
                  <p className="text-xs text-muted-foreground">Generate sites instantly</p>
                </div>
              </div>
              <Button size="lg" onClick={handleComplete} disabled={isLoading} className="mt-6">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
