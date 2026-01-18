"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@craftjs/core";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Search, Layout, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type DbTemplate = Database["public"]["Tables"]["templates"]["Row"];

interface Template extends Omit<DbTemplate, "content"> {
  content: Record<string, unknown>;
}

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
}

export function TemplateLibrary({
  open,
  onOpenChange,
  agencyId,
}: TemplateLibraryProps) {
  const { actions } = useEditor();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, agencyId]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      // Load agency templates
      const { data: agencyTemplates } = await supabase
        .from("templates")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      // Load public templates
      const { data: pubTemplates } = await supabase
        .from("templates")
        .select("*")
        .eq("is_public", true)
        .neq("agency_id", agencyId)
        .order("created_at", { ascending: false });

      setTemplates((agencyTemplates as Template[]) || []);
      setPublicTemplates((pubTemplates as Template[]) || []);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = async (template: Template) => {
    setApplying(template.id);

    try {
      // Deserialize and apply template content
      actions.deserialize(JSON.stringify(template.content));
      toast.success(`Applied template: ${template.name}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to apply template");
    } finally {
      setApplying(null);
    }
  };

  const filterTemplates = (list: Template[]) => {
    if (!search) return list;
    const lower = search.toLowerCase();
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.description?.toLowerCase().includes(lower) ||
        t.category.toLowerCase().includes(lower)
    );
  };

  const TemplateGrid = ({ templates }: { templates: Template[] }) => (
    <div className="grid grid-cols-2 gap-4">
      {templates.length === 0 ? (
        <div className="col-span-2 py-8 text-center text-muted-foreground">
          No templates found
        </div>
      ) : (
        templates.map((template) => (
          <div
            key={template.id}
            className="border rounded-lg overflow-hidden group cursor-pointer"
            onClick={() => applyTemplate(template)}
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted flex items-center justify-center relative">
              {template.thumbnail_url ? (
                <img
                  src={template.thumbnail_url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Layout className="w-8 h-8 text-muted-foreground" />
              )}
              {applying === template.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <h4 className="font-medium truncate">{template.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
                {template.is_public && (
                  <Badge variant="outline" className="text-xs">
                    Public
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Template Library</SheetTitle>
          <SheetDescription>
            Choose a template to start your design
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="my-templates">
            <TabsList className="w-full">
              <TabsTrigger value="my-templates" className="flex-1">
                My Templates ({templates.length})
              </TabsTrigger>
              <TabsTrigger value="public" className="flex-1">
                Public ({publicTemplates.length})
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <TabsContent value="my-templates" className="mt-4">
                  <TemplateGrid templates={filterTemplates(templates)} />
                </TabsContent>
                <TabsContent value="public" className="mt-4">
                  <TemplateGrid templates={filterTemplates(publicTemplates)} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
