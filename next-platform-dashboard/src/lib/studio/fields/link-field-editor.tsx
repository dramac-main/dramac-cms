// src/lib/studio/fields/link-field-editor.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LinkFieldEditorProps, LinkValue } from '@/types/studio';
import { 
  FileText, 
  Link2, 
  Mail, 
  Phone, 
  ExternalLink,
  Loader2 
} from 'lucide-react';

// Default empty link value
const DEFAULT_LINK: LinkValue = {
  href: '',
  target: '_self',
  type: 'url',
};

// Mock pages data - in production, fetch from API
const useSitePages = (siteId?: string) => {
  const [pages, setPages] = React.useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (!siteId) {
      // Default mock pages for development
      setPages([
        { id: 'home', title: 'Home', slug: '/' },
        { id: 'about', title: 'About', slug: '/about' },
        { id: 'services', title: 'Services', slug: '/services' },
        { id: 'contact', title: 'Contact', slug: '/contact' },
        { id: 'blog', title: 'Blog', slug: '/blog' },
      ]);
      return;
    }
    
    // Fetch actual pages
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/sites/${siteId}/pages`);
        if (response.ok) {
          const data = await response.json();
          setPages(data.pages || []);
        }
      } catch {
        // Use mock data on error
        setPages([
          { id: 'home', title: 'Home', slug: '/' },
          { id: 'about', title: 'About', slug: '/about' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPages();
  }, [siteId]);
  
  return { pages, isLoading };
};

export function LinkFieldEditor({
  value = DEFAULT_LINK,
  onChange,
  label,
  description,
  disabled = false,
  allowedTypes = ['page', 'url', 'email', 'phone'],
  siteId,
}: LinkFieldEditorProps) {
  const { pages, isLoading: pagesLoading } = useSitePages(siteId);
  const [activeTab, setActiveTab] = React.useState<string>(value?.type || 'url');
  
  // Sync active tab with value type
  React.useEffect(() => {
    if (value?.type && allowedTypes.includes(value.type)) {
      setActiveTab(value.type);
    }
  }, [value?.type, allowedTypes]);
  
  // Handle tab change
  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab);
    onChange({
      ...value,
      href: '',
      type: newTab as LinkValue['type'],
      pageId: undefined,
    });
  }, [value, onChange]);
  
  // Handle page select
  const handlePageSelect = React.useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    onChange({
      ...value,
      href: page?.slug || '/',
      pageId,
      type: 'page',
    });
  }, [pages, value, onChange]);
  
  // Handle URL input
  const handleUrlChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      href: e.target.value,
      type: 'url',
    });
  }, [value, onChange]);
  
  // Handle email input
  const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    onChange({
      ...value,
      href: email ? `mailto:${email.replace('mailto:', '')}` : '',
      type: 'email',
    });
  }, [value, onChange]);
  
  // Handle phone input
  const handlePhoneChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    onChange({
      ...value,
      href: phone ? `tel:${phone.replace('tel:', '')}` : '',
      type: 'phone',
    });
  }, [value, onChange]);
  
  // Handle target toggle
  const handleTargetToggle = React.useCallback((checked: boolean) => {
    onChange({
      ...value,
      target: checked ? '_blank' : '_self',
    });
  }, [value, onChange]);
  
  // Extract email from mailto:
  const getEmail = (): string => {
    if (!value?.href) return '';
    return value.href.replace('mailto:', '');
  };
  
  // Extract phone from tel:
  const getPhone = (): string => {
    if (!value?.href) return '';
    return value.href.replace('tel:', '');
  };

  // Filter allowed tabs
  const tabs = [
    { id: 'page', label: 'Page', icon: FileText },
    { id: 'url', label: 'URL', icon: Link2 },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone', icon: Phone },
  ].filter(tab => allowedTypes.includes(tab.id as NonNullable<LinkValue['type']>));

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={cn(
          "grid w-full h-8"
        )} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className="text-xs gap-1"
              disabled={disabled}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* Page Tab */}
        {allowedTypes.includes('page') && (
          <TabsContent value="page" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Select Page</Label>
              <Select
                value={value?.pageId || ''}
                onValueChange={handlePageSelect}
                disabled={disabled || pagesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={pagesLoading ? "Loading pages..." : "Choose a page"} />
                </SelectTrigger>
                <SelectContent>
                  {pages.map(page => (
                    <SelectItem key={page.id} value={page.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span>{page.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{page.slug}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pagesLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading pages...
              </div>
            )}
          </TabsContent>
        )}
        
        {/* URL Tab */}
        {allowedTypes.includes('url') && (
          <TabsContent value="url" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={value?.type === 'url' ? value?.href || '' : ''}
                onChange={handleUrlChange}
                placeholder="https://example.com"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
        
        {/* Email Tab */}
        {allowedTypes.includes('email') && (
          <TabsContent value="email" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                value={value?.type === 'email' ? getEmail() : ''}
                onChange={handleEmailChange}
                placeholder="hello@example.com"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
        
        {/* Phone Tab */}
        {allowedTypes.includes('phone') && (
          <TabsContent value="phone" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phone Number</Label>
              <Input
                type="tel"
                value={value?.type === 'phone' ? getPhone() : ''}
                onChange={handlePhoneChange}
                placeholder="+1 (555) 000-0000"
                disabled={disabled}
                className="text-sm"
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Open in new tab toggle */}
      {(activeTab === 'url' || activeTab === 'page') && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm cursor-pointer" htmlFor="link-target">
              Open in new tab
            </Label>
          </div>
          <Switch
            id="link-target"
            checked={value?.target === '_blank'}
            onCheckedChange={handleTargetToggle}
            disabled={disabled}
          />
        </div>
      )}
      
      {/* Link preview */}
      {value?.href && (
        <div className="text-xs text-muted-foreground truncate p-2 bg-muted rounded">
          {value.href}
        </div>
      )}
    </div>
  );
}

export default LinkFieldEditor;
