/**
 * Form Builder Component
 * Phase MKT-06: Landing Pages & Opt-In Forms
 *
 * Visual builder for creating and editing opt-in forms with
 * drag-and-drop field management, trigger configuration, and embed code.
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createForm,
  updateForm,
  getFormEmbedCode,
} from "../../actions/form-actions";
import type {
  MarketingForm,
  FormField,
  FormTrigger,
  SuccessAction,
  FormType,
} from "../../types";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "hidden", label: "Hidden" },
] as const;

const FORM_TYPES: { value: FormType; label: string }[] = [
  { value: "inline", label: "Inline (embedded in page)" },
  { value: "popup", label: "Popup (modal overlay)" },
  { value: "slide_in", label: "Slide-in (corner widget)" },
  { value: "floating_bar", label: "Floating Bar (top/bottom)" },
  { value: "exit_intent", label: "Exit Intent (on leave)" },
];

interface FormBuilderProps {
  siteId: string;
  form?: MarketingForm | null;
  defaultTab?: string;
}

export function FormBuilder({ siteId, form, defaultTab }: FormBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState(form?.name || "");
  const [formType, setFormType] = useState<FormType>(form?.formType || "inline");
  const [description, setDescription] = useState(form?.description || "");
  const [buttonText, setButtonText] = useState(form?.buttonText || "Submit");
  const [buttonColor, setButtonColor] = useState(
    form?.buttonColor || "#2563eb"
  );
  const [fields, setFields] = useState<FormField[]>(form?.fields || []);
  const [trigger, setTrigger] = useState<FormTrigger | null>(
    form?.trigger || null
  );
  const [successAction, setSuccessAction] = useState<SuccessAction>(
    form?.successAction || { type: "message", message: "Thank you!" }
  );

  const isEdit = !!form;

  // Warn before navigating away with unsaved work
  const hasUnsavedChanges = !!(name || description || fields.length > 0);
  useUnsavedChanges(hasUnsavedChanges && !isEdit);

  // ─── Field Management ──────────────────────────────────────

  function addField() {
    const newField: FormField = {
      id: crypto.randomUUID(),
      name: `field_${fields.length + 1}`,
      type: "text",
      label: `Field ${fields.length + 1}`,
      placeholder: "",
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  }

  function addEmailField() {
    const newField: FormField = {
      id: crypto.randomUUID(),
      name: "email",
      type: "email",
      label: "Email Address",
      placeholder: "Enter your email",
      required: true,
      order: fields.length,
    };
    setFields([...fields, newField]);
  }

  function addPhoneOptInField() {
    const phoneField: FormField = {
      id: crypto.randomUUID(),
      name: "phone",
      type: "phone",
      label: "Phone Number",
      placeholder: "+1 (555) 000-0000",
      required: false,
      order: fields.length,
    };
    const smsOptIn: FormField = {
      id: crypto.randomUUID(),
      name: "sms_opt_in",
      type: "checkbox",
      label: "I agree to receive SMS messages",
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, phoneField, smsOptIn]);
  }

  function removeField(fieldId: string) {
    setFields(fields.filter((f) => f.id !== fieldId));
  }

  function updateField(fieldId: string, updates: Partial<FormField>) {
    setFields(
      fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  }

  function moveField(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  }

  // ─── Save ──────────────────────────────────────────────────

  async function handleSave() {
    setError(null);

    if (!name.trim()) {
      setError("Form name is required");
      return;
    }
    if (fields.length === 0) {
      setError("Add at least one field");
      return;
    }

    startTransition(async () => {
      if (isEdit && form) {
        const result = await updateForm(form.id, {
          name,
          formType,
          description,
          fields,
          trigger,
          successAction,
          buttonText,
          buttonColor,
        });
        if (result.error) {
          setError(result.error);
        } else {
          router.refresh();
        }
      } else {
        const result = await createForm({
          siteId,
          name,
          formType,
          fields,
          trigger: trigger || undefined,
          successAction,
          buttonText,
          buttonColor,
          description,
        });
        if (result.error) {
          setError(result.error);
        } else if (result.form) {
          router.push(
            `/dashboard/sites/${siteId}/marketing/forms/${result.form.id}`
          );
        }
      }
    });
  }

  // ─── Embed Code ────────────────────────────────────────────

  async function handleGetEmbedCode() {
    if (!form) return;
    const code = await getFormEmbedCode(
      form.id,
      typeof window !== "undefined" ? window.location.origin : ""
    );
    setEmbedCode(code);
  }

  function handleCopyEmbed() {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {isEdit ? "Edit Form" : "Create Form"}
          </h2>
          {isEdit && form && (
            <Badge variant="secondary" className="mt-1">
              {form.status}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Tabs defaultValue={defaultTab || "details"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          {isEdit && <TabsTrigger value="embed">Embed</TabsTrigger>}
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Form Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Newsletter Signup"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formType">Form Type</Label>
                <Select
                  value={formType}
                  onValueChange={(v) => setFormType(v as FormType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Internal description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="btnText">Button Text</Label>
                  <Input
                    id="btnText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Submit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="btnColor">Button Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="btnColor"
                      type="color"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No fields yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Add fields to your form
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addEmailField}>
                    Quick: Email Field
                  </Button>
                  <Button size="sm" variant="secondary" onClick={addPhoneOptInField}>
                    Quick: Phone + SMS Opt-In
                  </Button>
                  <Button variant="outline" size="sm" onClick={addField}>
                    Custom Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                      <span className="text-sm font-medium flex-1">
                        {field.label || "Untitled Field"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveField(index, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveField(index, "down")}
                        disabled={index === fields.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            updateField(field.id, { type: v })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          className="h-8 text-xs"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          className="h-8 text-xs"
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(field.id, {
                              placeholder: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end gap-2 pb-0.5">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) =>
                              updateField(field.id, { required: checked })
                            }
                          />
                          <Label
                            htmlFor={`required-${field.id}`}
                            className="text-xs"
                          >
                            Required
                          </Label>
                        </div>
                      </div>
                    </div>
                    {field.type === "select" && (
                      <div className="space-y-1 ml-6">
                        <Label className="text-xs">
                          Options (one per line)
                        </Label>
                        <Textarea
                          className="text-xs"
                          rows={3}
                          value={(field.options || []).join("\n")}
                          onChange={(e) =>
                            updateField(field.id, {
                              options: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            })
                          }
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
            <Button variant="outline" size="sm" onClick={addEmailField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Email Field
            </Button>
            <Button variant="outline" size="sm" onClick={addPhoneOptInField}>
              <Plus className="mr-2 h-4 w-4" />
              Phone + SMS Opt-In
            </Button>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          {/* Trigger */}
          {(formType === "popup" ||
            formType === "slide_in" ||
            formType === "exit_intent") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Display Trigger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select
                    value={trigger?.type || "time_delay"}
                    onValueChange={(v) =>
                      setTrigger({
                        type: v as FormTrigger["type"],
                        delay: trigger?.delay,
                        scrollPercent: trigger?.scrollPercent,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_delay">Time Delay</SelectItem>
                      <SelectItem value="scroll_percent">
                        Scroll Percentage
                      </SelectItem>
                      <SelectItem value="exit_intent">Exit Intent</SelectItem>
                      <SelectItem value="click">On Click</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {trigger?.type === "time_delay" && (
                  <div className="space-y-2">
                    <Label>Delay (seconds)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={trigger.delay || 5}
                      onChange={(e) =>
                        setTrigger({
                          ...trigger,
                          delay: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                )}
                {trigger?.type === "scroll_percent" && (
                  <div className="space-y-2">
                    <Label>Scroll Percentage</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={trigger.scrollPercent || 50}
                      onChange={(e) =>
                        setTrigger({
                          ...trigger,
                          scrollPercent: parseInt(e.target.value) || 50,
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Success Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">After Submission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={successAction.type}
                  onValueChange={(v) =>
                    setSuccessAction({
                      ...successAction,
                      type: v as SuccessAction["type"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="message">Show Message</SelectItem>
                    <SelectItem value="redirect">Redirect to URL</SelectItem>
                    <SelectItem value="hide">Hide Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {successAction.type === "message" && (
                <div className="space-y-2">
                  <Label>Success Message</Label>
                  <Input
                    value={successAction.message || ""}
                    onChange={(e) =>
                      setSuccessAction({
                        ...successAction,
                        message: e.target.value,
                      })
                    }
                    placeholder="Thank you for subscribing!"
                  />
                </div>
              )}
              {successAction.type === "redirect" && (
                <div className="space-y-2">
                  <Label>Redirect URL</Label>
                  <Input
                    value={successAction.redirectUrl || ""}
                    onChange={(e) =>
                      setSuccessAction({
                        ...successAction,
                        redirectUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/thank-you"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        {isEdit && (
          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Embed Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Copy and paste this code into your website to embed this form.
                </p>
                {!embedCode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetEmbedCode}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Generate Embed Code
                  </Button>
                ) : (
                  <>
                    <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                      {embedCode}
                    </pre>
                    <Button size="sm" onClick={handleCopyEmbed}>
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy to Clipboard
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
