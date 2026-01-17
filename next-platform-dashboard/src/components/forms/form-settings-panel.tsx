"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  Webhook, 
  Save, 
  Loader2,
  Plus,
  Trash2,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFormSettings,
  updateFormSettings,
  getFormWebhooks,
  createFormWebhook,
  updateFormWebhook,
  deleteFormWebhook,
  type FormSettings,
  type FormWebhook,
} from "@/lib/forms/submission-service";
import { toast } from "sonner";

interface FormSettingsPanelProps {
  siteId: string;
  formId: string;
  formName?: string;
  onClose?: () => void;
}

export function FormSettingsPanel({
  siteId,
  formId,
  formName,
  onClose,
}: FormSettingsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<FormSettings | null>(null);
  const [webhooks, setWebhooks] = useState<FormWebhook[]>([]);
  
  // Webhook dialog
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<FormWebhook | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMethod, setWebhookMethod] = useState<"POST" | "PUT">("POST");
  const [webhookSaving, setWebhookSaving] = useState(false);

  // Email input
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, formId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, webhooksData] = await Promise.all([
        getFormSettings(siteId, formId),
        getFormWebhooks(siteId),
      ]);
      
      if (settingsData) {
        setSettings(settingsData);
      }
      setWebhooks(webhooksData.filter(w => !w.formId || w.formId === formId));
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load form settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const result = await updateFormSettings(siteId, formId, settings);
      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = () => {
    if (!settings || !newEmail) return;
    
    // Validate email
    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (settings.notifyEmails.includes(newEmail)) {
      toast.error("This email is already added");
      return;
    }
    
    setSettings({
      ...settings,
      notifyEmails: [...settings.notifyEmails, newEmail],
    });
    setNewEmail("");
  };

  const handleRemoveEmail = (email: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notifyEmails: settings.notifyEmails.filter(e => e !== email),
    });
  };

  const handleOpenWebhookDialog = (webhook?: FormWebhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setWebhookUrl(webhook.url);
      setWebhookMethod(webhook.method as "POST" | "PUT");
    } else {
      setEditingWebhook(null);
      setWebhookUrl("");
      setWebhookMethod("POST");
    }
    setWebhookDialogOpen(true);
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }
    
    // Validate URL
    try {
      new URL(webhookUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    
    setWebhookSaving(true);
    try {
      if (editingWebhook) {
        const result = await updateFormWebhook(editingWebhook.id, {
          url: webhookUrl,
          method: webhookMethod,
        });
        if (result.success) {
          toast.success("Webhook updated");
          loadData();
        } else {
          toast.error(result.error || "Failed to update webhook");
        }
      } else {
        const result = await createFormWebhook(siteId, {
          formId,
          url: webhookUrl,
          method: webhookMethod,
        });
        if (result.success) {
          toast.success("Webhook created");
          loadData();
        } else {
          toast.error(result.error || "Failed to create webhook");
        }
      }
      setWebhookDialogOpen(false);
    } catch (error) {
      console.error("Webhook save error:", error);
      toast.error("Failed to save webhook");
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm("Delete this webhook?")) return;
    
    try {
      const result = await deleteFormWebhook(webhookId);
      if (result.success) {
        toast.success("Webhook deleted");
        setWebhooks(webhooks.filter(w => w.id !== webhookId));
      } else {
        toast.error(result.error || "Failed to delete webhook");
      }
    } catch (error) {
      console.error("Delete webhook error:", error);
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggleWebhook = async (webhook: FormWebhook) => {
    try {
      const result = await updateFormWebhook(webhook.id, {
        isActive: !webhook.isActive,
      });
      if (result.success) {
        setWebhooks(webhooks.map(w => 
          w.id === webhook.id ? { ...w, isActive: !w.isActive } : w
        ));
      } else {
        toast.error(result.error || "Failed to update webhook");
      }
    } catch (error) {
      console.error("Toggle webhook error:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Form Settings</h2>
          {formName && (
            <Badge variant="outline">{formName}</Badge>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            General
          </CardTitle>
          <CardDescription>
            Basic form configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="formName">Form Name</Label>
            <Input
              id="formName"
              value={settings.formName}
              onChange={(e) => setSettings({ ...settings, formName: e.target.value })}
              placeholder="Contact Form"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="successMessage">Success Message</Label>
            <Textarea
              id="successMessage"
              value={settings.successMessage}
              onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
              placeholder="Thank you for your submission!"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
            <Input
              id="redirectUrl"
              value={settings.redirectUrl || ""}
              onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value || null })}
              placeholder="https://example.com/thank-you"
            />
            <p className="text-xs text-muted-foreground">
              Redirect users to this URL after successful submission
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Get notified when someone submits this form
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Send emails when new submissions arrive
              </p>
            </div>
            <Switch
              checked={settings.notifyOnSubmission}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, notifyOnSubmission: checked })
              }
            />
          </div>
          
          {settings.notifyOnSubmission && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Notification Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                  />
                  <Button onClick={handleAddEmail} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {settings.notifyEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.notifyEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {settings.notifyEmails.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No email addresses added. Add at least one to receive notifications.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Spam Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Spam Protection
          </CardTitle>
          <CardDescription>
            Protect your form from spam and abuse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Spam Protection</Label>
              <p className="text-xs text-muted-foreground">
                Automatically filter suspicious submissions
              </p>
            </div>
            <Switch
              checked={settings.spamProtection}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, spamProtection: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Honeypot Field</Label>
              <p className="text-xs text-muted-foreground">
                Hidden field that catches bots
              </p>
            </div>
            <Switch
              checked={settings.honeypotEnabled}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, honeypotEnabled: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Max Submissions per Minute</Label>
            <Input
              id="rateLimit"
              type="number"
              min={1}
              max={100}
              value={settings.rateLimitPerMinute}
              onChange={(e) => setSettings({ 
                ...settings, 
                rateLimitPerMinute: parseInt(e.target.value) || 5 
              })}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Limit submissions per IP address to prevent abuse
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Send form data to external services (CRM, Zapier, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No webhooks configured. Add a webhook to send submissions to external services.
            </p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div 
                  key={webhook.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{webhook.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {webhook.method}
                      </Badge>
                      {webhook.lastStatusCode && (
                        <Badge 
                          variant={webhook.lastStatusCode < 400 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          Last: {webhook.lastStatusCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={() => handleToggleWebhook(webhook)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenWebhookDialog(webhook)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOpenWebhookDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Webhook Dialog */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? "Edit Webhook" : "Add Webhook"}
            </DialogTitle>
            <DialogDescription>
              Configure a webhook to send form submissions to external services.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhookMethod">HTTP Method</Label>
              <Select value={webhookMethod} onValueChange={(v) => setWebhookMethod(v as "POST" | "PUT")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWebhook} disabled={webhookSaving}>
              {webhookSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {editingWebhook ? "Update" : "Create"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
