"use client";

// src/components/domains/settings/domain-branding-config.tsx
// White-label Branding Configuration for Domain Services

import { useState } from "react";
import { Save, Palette, Mail, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { AgencyDomainPricing } from "@/types/domain-pricing";

interface DomainBrandingConfigProps {
  config: Partial<AgencyDomainPricing>;
}

export function DomainBrandingConfig({ config }: DomainBrandingConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [termsUrl, setTermsUrl] = useState(config.custom_terms_url || '');
  const [supportEmail, setSupportEmail] = useState(config.custom_support_email || '');
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate email if provided
      if (supportEmail && !supportEmail.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Validate URL if provided
      if (termsUrl && !termsUrl.startsWith('http')) {
        toast.error('Terms URL must start with http:// or https://');
        return;
      }
      
      const result = await updateAgencyPricingConfig({
        custom_terms_url: termsUrl || null,
        custom_support_email: supportEmail || null,
      });
      
      if (result.success) {
        toast.success('Branding settings saved');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Support Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Support Contact
          </CardTitle>
          <CardDescription>
            Customize the support email shown to clients for domain-related inquiries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email Address</Label>
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@youragency.com"
            />
            <p className="text-sm text-muted-foreground">
              This email will be shown to clients when they need help with domains
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Terms & Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms & Policies
          </CardTitle>
          <CardDescription>
            Link to your custom terms of service for domain registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termsUrl">Terms of Service URL</Label>
            <Input
              id="termsUrl"
              type="url"
              value={termsUrl}
              onChange={(e) => setTermsUrl(e.target.value)}
              placeholder="https://youragency.com/domain-terms"
            />
            <p className="text-sm text-muted-foreground">
              Clients will see this link during domain registration checkout
            </p>
          </div>
          
          {termsUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={termsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Terms Page
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
      
      {/* Branding Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding Preview
          </CardTitle>
          <CardDescription>
            See how your branding will appear to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-6 rounded-lg">
            <div className="border-b pb-4 mb-4">
              <h4 className="font-semibold">Domain Registration</h4>
              <p className="text-sm text-muted-foreground">
                Register your perfect domain name
              </p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Support:</span>
                <span className="font-medium">
                  {supportEmail || 'support@dramac.app (default)'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Terms:</span>
                {termsUrl ? (
                  <a 
                    href={termsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Your Terms of Service
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    Default platform terms
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </div>
  );
}
