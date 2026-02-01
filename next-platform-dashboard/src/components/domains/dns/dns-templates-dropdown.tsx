"use client";

import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Wand2, 
  Globe, 
  Mail, 
  Building2, 
} from "lucide-react";
import { setupSiteDns, setupEmailDns } from "@/lib/actions/dns";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  records: string[];
  action: 'site' | 'titan' | 'google';
}

const TEMPLATES: Template[] = [
  {
    id: 'site',
    name: 'DRAMAC Site',
    description: 'Configure DNS for hosting your site on DRAMAC',
    icon: Globe,
    records: ['A @ → Platform IP', 'CNAME www → domain'],
    action: 'site',
  },
  {
    id: 'titanEmail',
    name: 'Business Email (Titan)',
    description: 'MX records for Titan Mail',
    icon: Mail,
    records: ['MX mx1.titan.email (priority 10)', 'MX mx2.titan.email (priority 20)', 'TXT SPF record'],
    action: 'titan',
  },
  {
    id: 'googleWorkspace',
    name: 'Google Workspace',
    description: 'MX records for Google Workspace',
    icon: Building2,
    records: ['MX Google servers (5 records)', 'TXT SPF record'],
    action: 'google',
  },
];

interface DnsTemplatesDropdownProps {
  domainId: string;
}

export function DnsTemplatesDropdown({ domainId }: DnsTemplatesDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  function handleApplyTemplate() {
    if (!selectedTemplate) return;

    startTransition(async () => {
      let result;
      
      if (selectedTemplate.action === 'site') {
        result = await setupSiteDns(domainId);
      } else if (selectedTemplate.action === 'titan') {
        result = await setupEmailDns(domainId, 'titan');
      } else if (selectedTemplate.action === 'google') {
        result = await setupEmailDns(domainId, 'google');
      } else {
        toast.error("Unknown template type");
        setSelectedTemplate(null);
        return;
      }
      
      if (result.success && result.data) {
        toast.success(`Applied ${selectedTemplate.name} template`, {
          description: `Created ${result.data.recordsCreated} DNS records`,
        });
      } else {
        toast.error(result.error || "Failed to apply template");
      }
      setSelectedTemplate(null);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Wand2 className="h-4 w-4 mr-2" />
            Quick Setup
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end">
          <DropdownMenuLabel>DNS Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {TEMPLATES.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="flex flex-col items-start gap-1 py-3 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <template.icon className="h-4 w-4" />
                  <span className="font-medium">{template.name}</span>
                </div>
                <span className="text-xs text-muted-foreground pl-6">
                  {template.description}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply {selectedTemplate?.name} Template?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">This will add the following DNS records to your domain:</p>
                <ul className="space-y-1">
                  {selectedTemplate?.records.map((record, i) => (
                    <li key={i} className="font-mono text-sm">• {record}</li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyTemplate} disabled={isPending}>
              {isPending ? "Applying..." : "Apply Template"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
