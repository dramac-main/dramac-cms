"use client";

// src/components/domains/transfer/transfer-wizard.tsx
// Multi-step domain transfer wizard

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Key,
  User,
  Shield,
  Loader2,
  Globe,
} from "lucide-react";
import { initiateTransferIn } from "@/lib/actions/transfers";
import { checkDomainAvailability } from "@/lib/actions/domains";
import { toast } from "sonner";

const STEPS = [
  { id: 'domain', title: 'Domain', description: 'Enter domain to transfer' },
  { id: 'auth', title: 'Authorization', description: 'Provide auth code' },
  { id: 'contacts', title: 'Contacts', description: 'Verify contact info' },
  { id: 'options', title: 'Options', description: 'Choose options' },
  { id: 'confirm', title: 'Confirm', description: 'Review and submit' },
];

const formSchema = z.object({
  domainName: z.string()
    .min(1, "Domain name is required")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/, "Invalid domain format (e.g., example.com)"),
  authCode: z.string().min(1, "Auth code is required"),
  registrantContactId: z.string().optional(),
  purchasePrivacy: z.boolean(),
  autoRenew: z.boolean(),
  confirmTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type FormValues = z.infer<typeof formSchema>;

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface TransferWizardProps {
  contacts?: Contact[];
}

export function TransferWizard({ contacts = [] }: TransferWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isChecking, setIsChecking] = useState(false);
  const [domainStatus, setDomainStatus] = useState<'checking' | 'available' | 'unavailable' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domainName: "",
      authCode: "",
      registrantContactId: contacts[0]?.id || "",
      purchasePrivacy: true,
      autoRenew: true,
      confirmTerms: false,
    },
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  async function checkDomain() {
    const domain = form.getValues('domainName');
    if (!domain) {
      form.setError('domainName', { message: 'Please enter a domain name' });
      return;
    }

    setIsChecking(true);
    setDomainStatus('checking');

    try {
      const result = await checkDomainAvailability(domain);

      // For transfer, we want the domain to be UNAVAILABLE (already registered elsewhere)
      if (result.success && result.data) {
        // If domain is "available" for registration, it can't be transferred
        setDomainStatus(result.data.available ? 'unavailable' : 'available');
      } else {
        setDomainStatus('unavailable');
      }
    } catch {
      setDomainStatus('unavailable');
    } finally {
      setIsChecking(false);
    }
  }

  function nextStep() {
    // Validate current step
    if (currentStep === 0) {
      const domainValue = form.getValues('domainName');
      if (!domainValue) {
        form.setError('domainName', { message: 'Domain name is required' });
        return;
      }
    }

    if (currentStep === 1) {
      const authValue = form.getValues('authCode');
      if (!authValue) {
        form.setError('authCode', { message: 'Auth code is required' });
        return;
      }
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.append('domainName', values.domainName);
    formData.append('authCode', values.authCode);
    formData.append('registrantContactId', values.registrantContactId || '');
    formData.append('purchasePrivacy', String(values.purchasePrivacy));
    formData.append('autoRenew', String(values.autoRenew));

    startTransition(async () => {
      const result = await initiateTransferIn(formData);

      if (result.success) {
        toast.success("Transfer initiated successfully!", {
          description: "You'll receive an email to approve the transfer."
        });
        router.push('/dashboard/domains/transfer');
      } else {
        toast.error(result.error || "Failed to initiate transfer");
      }
    });
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Domain
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="domainName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domain Name</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="example.com"
                        {...field}
                        className="font-mono"
                        onChange={(e) => {
                          field.onChange(e);
                          setDomainStatus(null);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkDomain}
                      disabled={isChecking}
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Check'
                      )}
                    </Button>
                  </div>
                  <FormDescription>
                    Enter the domain you want to transfer to your account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {domainStatus === 'available' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  This domain is registered and can be transferred to your account.
                </AlertDescription>
              </Alert>
            )}

            {domainStatus === 'unavailable' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This domain appears to be available for registration, not transfer.
                  If you want to register a new domain, go to{" "}
                  <a href="/dashboard/domains/search" className="underline">Domain Search</a>.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 1: // Auth Code
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Key className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Authorization Code Required</p>
                <p className="text-sm text-muted-foreground">
                  Get this code from your current domain registrar
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="authCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Code (EPP Code)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter auth code"
                      {...field}
                      className="font-mono"
                      type="password"
                    />
                  </FormControl>
                  <FormDescription>
                    This code authorizes the transfer. It&apos;s case-sensitive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Alert>
              <AlertDescription>
                <strong>Before transferring:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                  <li>Unlock your domain at your current registrar</li>
                  <li>Disable WHOIS privacy protection temporarily</li>
                  <li>Ensure domain is not within 60 days of registration/previous transfer</li>
                  <li>Confirm admin email address is accessible</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2: // Contacts
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Contact Information</p>
                <p className="text-sm text-muted-foreground">
                  Select the contact to use for this domain
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="registrantContactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrant Contact</FormLabel>
                  <FormControl>
                    {contacts.length > 0 ? (
                      <select
                        {...field}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {contacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} ({contact.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                          No contacts configured. The default agency contact will be used.
                        </p>
                      </div>
                    )}
                  </FormControl>
                  <FormDescription>
                    This contact will be used for all contact types (registrant, admin, tech, billing)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3: // Options
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="purchasePrivacy"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      WHOIS Privacy Protection
                    </FormLabel>
                    <FormDescription>
                      Hide your personal information from public WHOIS lookups (recommended)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoRenew"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Enable Auto-Renewal
                    </FormLabel>
                    <FormDescription>
                      Automatically renew this domain before it expires to prevent losing it
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        );

      case 4: // Confirm
        const values = form.getValues();
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-mono font-medium">{values.domainName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auth Code</span>
                <span className="font-mono">••••••••</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WHOIS Privacy</span>
                <span>{values.purchasePrivacy ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-Renewal</span>
                <span>{values.autoRenew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="confirmTerms"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I confirm that I am authorized to transfer this domain and accept the terms of service
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Alert>
              <AlertDescription>
                <strong>Important:</strong> Domain transfers typically take 5-7 days to complete.
                You&apos;ll receive an email at the admin contact address to approve the transfer.
                The domain will be extended by one year upon successful transfer.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 ${i <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      i < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : i === currentStep
                          ? 'border-2 border-primary text-primary'
                          : 'border-2 border-muted text-muted-foreground'
                    }`}
                  >
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="hidden md:inline text-sm">{step.title}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-1" />
            <CardTitle className="mt-4">{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent className="min-h-[300px]">
            {renderStepContent()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0 || isPending}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || !form.getValues('confirmTerms')}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initiating Transfer...
                  </>
                ) : (
                  'Start Transfer'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
