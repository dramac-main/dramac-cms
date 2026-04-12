/**
 * SMS & WhatsApp Settings Component
 * Phase MKT-08: SMS & WhatsApp Channel Foundation
 *
 * Configure Twilio SMS and Meta WhatsApp provider credentials.
 */
"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Smartphone,
  MessageCircle,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getSMSWhatsAppSettings,
  updateSMSSettings,
  updateWhatsAppSettings,
} from "../../actions/sms-actions";

interface SMSWhatsAppSettingsProps {
  siteId: string;
}

export function SMSWhatsAppSettings({ siteId }: SMSWhatsAppSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    smsConfigured: boolean;
    whatsappConfigured: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SMS fields
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [showSmsToken, setShowSmsToken] = useState(false);

  // WhatsApp fields
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waBusinessAccountId, setWaBusinessAccountId] = useState("");
  const [showWaToken, setShowWaToken] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [siteId]);

  async function loadSettings() {
    try {
      const result = await getSMSWhatsAppSettings(siteId);
      setStatus({
        smsConfigured: result.smsConfigured,
        whatsappConfigured: result.whatsappConfigured,
      });
    } catch {
      // No settings yet
    }
  }

  function handleSaveSMS() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateSMSSettings(siteId, {
          twilioAccountSid: twilioAccountSid,
          twilioAuthToken: twilioAuthToken,
          twilioPhoneNumber: twilioFromNumber,
        });
        if (result.success) {
          setSuccess("SMS settings saved successfully");
          setTwilioAuthToken("");
          loadSettings();
        } else {
          setError(result.error || "Failed to save SMS settings");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save SMS settings");
      }
    });
  }

  function handleSaveWhatsApp() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await updateWhatsAppSettings(siteId, {
          accessToken: waAccessToken,
          phoneNumberId: waPhoneNumberId,
          businessAccountId: waBusinessAccountId,
        });
        if (result.success) {
          setSuccess("WhatsApp settings saved successfully");
          setWaAccessToken("");
          loadSettings();
        } else {
          setError(result.error || "Failed to save WhatsApp settings");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save WhatsApp settings");
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 text-sm rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <Tabs defaultValue="sms">
        <TabsList>
          <TabsTrigger value="sms" className="gap-2">
            <Smartphone className="h-4 w-4" />
            SMS (Twilio)
            {status?.smsConfigured && (
              <Badge
                variant="outline"
                className="ml-1 text-green-600 border-green-300"
              >
                Active
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            WhatsApp (Meta)
            {status?.whatsappConfigured && (
              <Badge
                variant="outline"
                className="ml-1 text-green-600 border-green-300"
              >
                Active
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* SMS Tab */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Twilio SMS Configuration
              </CardTitle>
              <CardDescription>
                Connect your Twilio account to send SMS campaigns. Find your
                credentials at{" "}
                <span className="font-mono text-xs">console.twilio.com</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="twilio-sid">Account SID</Label>
                <Input
                  id="twilio-sid"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <Label htmlFor="twilio-token">Auth Token</Label>
                <div className="relative">
                  <Input
                    id="twilio-token"
                    type={showSmsToken ? "text" : "password"}
                    value={twilioAuthToken}
                    onChange={(e) => setTwilioAuthToken(e.target.value)}
                    placeholder={
                      status?.smsConfigured
                        ? "••••••••••••••• (already set)"
                        : "Your Twilio Auth Token"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowSmsToken(!showSmsToken)}
                  >
                    {showSmsToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="twilio-from">From Phone Number</Label>
                <Input
                  id="twilio-from"
                  value={twilioFromNumber}
                  onChange={(e) => setTwilioFromNumber(e.target.value)}
                  placeholder="+1234567890"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be a Twilio phone number or verified Sender ID
                </p>
              </div>
              <Button
                onClick={handleSaveSMS}
                disabled={isPending || !twilioAccountSid || !twilioFromNumber}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save SMS Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Meta WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Connect via the Meta Cloud API to send WhatsApp template
                messages. Set up at{" "}
                <span className="font-mono text-xs">business.facebook.com</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                <Input
                  id="wa-phone-id"
                  value={waPhoneNumberId}
                  onChange={(e) => setWaPhoneNumberId(e.target.value)}
                  placeholder="Your WhatsApp Phone Number ID"
                />
              </div>
              <div>
                <Label htmlFor="wa-biz-id">Business Account ID</Label>
                <Input
                  id="wa-biz-id"
                  value={waBusinessAccountId}
                  onChange={(e) => setWaBusinessAccountId(e.target.value)}
                  placeholder="Your WhatsApp Business Account ID"
                />
              </div>
              <div>
                <Label htmlFor="wa-token">Access Token</Label>
                <div className="relative">
                  <Input
                    id="wa-token"
                    type={showWaToken ? "text" : "password"}
                    value={waAccessToken}
                    onChange={(e) => setWaAccessToken(e.target.value)}
                    placeholder={
                      status?.whatsappConfigured
                        ? "••••••••••••••• (already set)"
                        : "Your Meta API Access Token"
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowWaToken(!showWaToken)}
                  >
                    {showWaToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSaveWhatsApp}
                disabled={isPending || !waPhoneNumberId}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save WhatsApp Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
