"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TwoFactorSetup() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      // Simulate API call - in production, this would call a server action
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (isEnabled) {
        setIsEnabled(false);
        toast.success("Two-factor authentication disabled");
      } else {
        // In production, this would show a QR code setup flow
        setIsEnabled(true);
        toast.success("Two-factor authentication enabled");
      }
    } catch (error) {
      toast.error("Failed to update two-factor authentication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isEnabled ? "bg-green-100" : "bg-muted"}`}>
          {isEnabled ? (
            <ShieldCheck className="w-6 h-6 text-green-600" />
          ) : (
            <Shield className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">Two-Factor Authentication</p>
            {isEnabled ? (
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEnabled
              ? "Your account is protected with two-factor authentication"
              : "Add an extra layer of security to your account"}
          </p>
        </div>
      </div>

      <Button
        variant={isEnabled ? "outline" : "default"}
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isEnabled ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
