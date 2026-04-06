/**
 * CRM Forms View — Combined Form Builder + Form Captures
 *
 * Contains two sub-views:
 * 1. Form Builder — create/edit/manage custom form definitions
 * 2. Form Captures — view submissions from all forms
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useCRM } from "../../context/crm-context";
import { FormCapturesView } from "./form-captures-view";
import {
  getCRMForms,
  createCRMForm,
  updateCRMForm,
  deleteCRMForm,
  duplicateCRMForm,
} from "../../actions/crm-form-actions";
import type {
  CRMFormDefinition,
  CRMFormField,
  CRMFormFieldType,
} from "../../types/crm-types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FileText,
  Inbox,
  MoreHorizontal,
  Copy,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  GripVertical,
  X,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Main Forms View
// ============================================================================

export function FormsView() {
  const [subTab, setSubTab] = useState("builder");

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={subTab}
        onValueChange={setSubTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-6 pt-2">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger value="builder" className="gap-2 text-sm">
              <Settings2 className="h-3.5 w-3.5" />
              Form Builder
            </TabsTrigger>
            <TabsTrigger value="captures" className="gap-2 text-sm">
              <Inbox className="h-3.5 w-3.5" />
              Form Captures
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="builder" className="flex-1 m-0">
          <FormBuilderView />
        </TabsContent>
        <TabsContent value="captures" className="flex-1 m-0">
          <FormCapturesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Form Builder View
// ============================================================================

function FormBuilderView() {
  const { siteId } = useCRM();
  const [forms, setForms] = useState<CRMFormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<CRMFormDefinition | null>(
    null,
  );

  const loadForms = useCallback(async () => {
    setLoading(true);
    const data = await getCRMForms(siteId);
    setForms(data);
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreate = () => {
    setEditingForm(null);
    setEditorOpen(true);
  };

  const handleEdit = (form: CRMFormDefinition) => {
    setEditingForm(form);
    setEditorOpen(true);
  };

  const handleDuplicate = async (form: CRMFormDefinition) => {
    const result = await duplicateCRMForm(siteId, form.id);
    if (result.success) {
      toast.success("Form duplicated");
      loadForms();
    } else {
      toast.error(result.error || "Failed to duplicate form");
    }
  };

  const handleDelete = async (form: CRMFormDefinition) => {
    const result = await deleteCRMForm(siteId, form.id);
    if (result.success) {
      toast.success("Form archived");
      loadForms();
    } else {
      toast.error(result.error || "Failed to delete form");
    }
  };

  const handleToggleStatus = async (form: CRMFormDefinition) => {
    const newStatus = form.status === "active" ? "inactive" : "active";
    const result = await updateCRMForm(siteId, form.id, { status: newStatus });
    if (result.success) {
      toast.success(
        `Form ${newStatus === "active" ? "activated" : "deactivated"}`,
      );
      loadForms();
    }
  };

  const handleSave = async () => {
    setEditorOpen(false);
    loadForms();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Forms</h3>
          <p className="text-sm text-muted-foreground">
            Create custom forms for your website. Forms auto-appear in the
            Studio builder.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h4 className="text-lg font-medium mb-1">No Custom Forms Yet</h4>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create custom lead capture forms with any fields you need. They'll
              automatically become available as components in the Studio builder
              and will feed submissions directly into your CRM.
            </p>
            <Button onClick={handleCreate} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow
                  key={form.id}
                  className="cursor-pointer"
                  onClick={() => handleEdit(form)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{form.name}</div>
                      {form.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {form.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {form.fields.length} fields
                    </Badge>
                  </TableCell>
                  <TableCell>{form.submission_count}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        form.status === "active" ? "default" : "secondary"
                      }
                      className={
                        form.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : ""
                      }
                    >
                      {form.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(form.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(form)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(form)}
                        >
                          {form.status === "active" ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(form)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Editor Dialog */}
      <FormEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        form={editingForm}
        siteId={siteId}
        onSave={handleSave}
      />
    </div>
  );
}

// ============================================================================
// Form Editor Dialog
// ============================================================================

const FIELD_TYPES: Array<{ value: CRMFormFieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "hidden", label: "Hidden" },
];

const CONTACT_FIELD_MAPPINGS = [
  { value: "", label: "None (custom)" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "mobile", label: "Mobile" },
  { value: "job_title", label: "Job Title" },
  { value: "company", label: "Company Name" },
  { value: "website_url", label: "Website" },
  { value: "address_line_1", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "postal_code", label: "Postal Code" },
  { value: "country", label: "Country" },
];

interface FormEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CRMFormDefinition | null;
  siteId: string;
  onSave: () => void;
}

function FormEditorDialog({
  open,
  onOpenChange,
  form,
  siteId,
  onSave,
}: FormEditorDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<CRMFormField[]>([]);
  const [submitText, setSubmitText] = useState("Submit");
  const [successMessage, setSuccessMessage] = useState(
    "Thank you! We'll be in touch.",
  );
  const [redirectUrl, setRedirectUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [autoCreateDeal, setAutoCreateDeal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"fields" | "settings">(
    "fields",
  );

  // Populate form data when editing
  useEffect(() => {
    if (form) {
      setName(form.name);
      setDescription(form.description || "");
      setFields(form.fields || []);
      setSubmitText(form.settings?.submit_button_text || "Submit");
      setSuccessMessage(
        form.settings?.success_message || "Thank you! We'll be in touch.",
      );
      setRedirectUrl(form.settings?.redirect_url || "");
      setNotifyEmail(form.settings?.notify_email || "");
      setAutoCreateDeal(form.settings?.auto_create_deal || false);
    } else {
      // New form defaults
      setName("");
      setDescription("");
      setFields([
        createDefaultField(
          "first_name",
          "First Name",
          "text",
          0,
          true,
          "first_name",
          "half",
        ),
        createDefaultField(
          "last_name",
          "Last Name",
          "text",
          1,
          true,
          "last_name",
          "half",
        ),
        createDefaultField("email", "Email Address", "email", 2, true, "email"),
        createDefaultField("phone", "Phone Number", "phone", 3, false, "phone"),
        createDefaultField("message", "Message", "textarea", 4, false),
      ]);
      setSubmitText("Submit");
      setSuccessMessage("Thank you! We'll be in touch.");
      setRedirectUrl("");
      setNotifyEmail("");
      setAutoCreateDeal(false);
    }
    setActiveSection("fields");
  }, [form, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Form name is required");
      return;
    }
    if (fields.length === 0) {
      toast.error("Form must have at least one field");
      return;
    }

    setSaving(true);
    const formData = {
      name: name.trim(),
      description: description.trim() || null,
      fields,
      status: form?.status || ("active" as const),
      slug: "",
      settings: {
        submit_button_text: submitText,
        success_message: successMessage,
        redirect_url: redirectUrl || undefined,
        notify_email: notifyEmail || undefined,
        auto_create_deal: autoCreateDeal,
      },
    };

    let result;
    if (form) {
      result = await updateCRMForm(siteId, form.id, formData);
    } else {
      result = await createCRMForm(siteId, formData);
    }

    setSaving(false);

    if (result.success) {
      toast.success(form ? "Form updated" : "Form created");
      onOpenChange(false);
      onSave();
    } else {
      toast.error(result.error || "Failed to save form");
    }
  };

  const addField = () => {
    const newField = createDefaultField(
      `field_${Date.now()}`,
      "New Field",
      "text",
      fields.length,
    );
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<CRMFormField>) => {
    setFields(fields.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    const temp = newFields[index];
    newFields[index] = newFields[newIndex];
    newFields[newIndex] = temp;
    // Update positions
    setFields(newFields.map((f, i) => ({ ...f, position: i })));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{form ? "Edit Form" : "Create New Form"}</DialogTitle>
          <DialogDescription>
            {form
              ? "Update your form fields and settings."
              : "Design a custom form that will appear in the Studio builder and capture leads into your CRM."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Form Name & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Form Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Request a Demo"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description for internal use"
              />
            </div>
          </div>

          {/* Section Switcher */}
          <div className="flex gap-2 border-b">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === "fields"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveSection("fields")}
            >
              Fields ({fields.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveSection("settings")}
            >
              Settings
            </button>
          </div>

          {activeSection === "fields" ? (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  total={fields.length}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                  onMove={(dir) => moveField(index, dir)}
                />
              ))}

              <Button
                variant="outline"
                onClick={addField}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Submit Button Text</Label>
                  <Input
                    value={submitText}
                    onChange={(e) => setSubmitText(e.target.value)}
                    placeholder="Submit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notification Email</Label>
                  <Input
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="alert@example.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Success Message</Label>
                <Textarea
                  value={successMessage}
                  onChange={(e) => setSuccessMessage(e.target.value)}
                  placeholder="Thank you! We'll be in touch."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Redirect URL (optional)</Label>
                <Input
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/thank-you"
                  type="url"
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Switch
                  checked={autoCreateDeal}
                  onCheckedChange={setAutoCreateDeal}
                />
                <div>
                  <div className="text-sm font-medium">Auto-create Deal</div>
                  <div className="text-xs text-muted-foreground">
                    Automatically create a CRM deal when this form is submitted
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : form ? "Save Changes" : "Create Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Field Editor (single row)
// ============================================================================

interface FieldEditorProps {
  field: CRMFormField;
  index: number;
  total: number;
  onUpdate: (updates: Partial<CRMFormField>) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
}

function FieldEditor({
  field,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const needsOptions = ["select", "multi_select", "radio"].includes(
    field.field_type,
  );

  return (
    <Card className="relative group">
      <CardContent className="p-3">
        {/* Compact row */}
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

          <div className="flex-1 grid grid-cols-12 gap-2 items-center">
            {/* Label */}
            <div className="col-span-3">
              <Input
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Field label"
                className="h-8 text-sm"
              />
            </div>

            {/* Type */}
            <div className="col-span-2">
              <Select
                value={field.field_type}
                onValueChange={(v) =>
                  onUpdate({ field_type: v as CRMFormFieldType })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Map to contact field */}
            <div className="col-span-2">
              <Select
                value={field.map_to_contact_field || ""}
                onValueChange={(v) =>
                  onUpdate({ map_to_contact_field: v || undefined })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Map to..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_FIELD_MAPPINGS.map((m) => (
                    <SelectItem
                      key={m.value || "_none"}
                      value={m.value || "_none"}
                    >
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Width */}
            <div className="col-span-2">
              <Select
                value={field.width}
                onValueChange={(v) => onUpdate({ width: v as "full" | "half" })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half Width</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Required toggle */}
            <div className="col-span-1 flex justify-center">
              <Switch
                checked={field.is_required}
                onCheckedChange={(checked) =>
                  onUpdate({ is_required: checked })
                }
              />
            </div>

            {/* Actions */}
            <div className="col-span-2 flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(!expanded)}
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMove("up")}
                disabled={index === 0}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMove("down")}
                disabled={index === total - 1}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={onRemove}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded settings */}
        {expanded && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placeholder</Label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="h-8 text-sm"
                placeholder="Placeholder text"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Default Value</Label>
              <Input
                value={field.default_value || ""}
                onChange={(e) => onUpdate({ default_value: e.target.value })}
                className="h-8 text-sm"
                placeholder="Default value"
              />
            </div>
            {needsOptions && (
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Options (one per line)</Label>
                <Textarea
                  value={(field.options || []).join("\n")}
                  onChange={(e) =>
                    onUpdate({
                      options: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="text-sm"
                  rows={3}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Field Key</Label>
              <Input
                value={field.field_key}
                onChange={(e) =>
                  onUpdate({
                    field_key: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "_"),
                  })
                }
                className="h-8 text-sm font-mono"
                placeholder="field_key"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function createDefaultField(
  key: string,
  label: string,
  type: CRMFormFieldType,
  position: number,
  isRequired: boolean = false,
  mapTo?: string,
  width: "full" | "half" = "full",
): CRMFormField {
  return {
    id: crypto.randomUUID(),
    field_key: key,
    label,
    field_type: type,
    is_required: isRequired,
    width,
    position,
    map_to_contact_field: mapTo,
  };
}
