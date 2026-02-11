'use client';

/**
 * Phase EM-32: Domain Settings UI Component
 * Manages custom domains for modules with verification, SSL, and white-label settings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Switch,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Separator,
  Skeleton
} from '@/components/ui';
import { 
  Globe, 
  Shield, 
  Palette, 
  Plus, 
  CircleCheck, 
  AlertTriangle,
  Loader2,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink,
  Settings,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

// ================================================================
// Types
// ================================================================

interface Domain {
  id: string;
  domain: string;
  status: string;
  verification_method: string;
  verification_value: string;
  verification_token: string;
  verified_at: string | null;
  ssl_status: string;
  ssl_expires_at: string | null;
  config: DomainConfig;
  white_label: WhiteLabelConfig;
  total_requests: number;
  bandwidth_bytes: number;
  created_at: string;
}

interface DomainConfig {
  redirect_to_https?: boolean;
  force_www?: boolean;
  custom_headers?: Record<string, string>;
  cache_ttl?: number;
  enable_cdn?: boolean;
}

interface WhiteLabelConfig {
  logo_url?: string;
  favicon_url?: string;
  brand_name?: string;
  brand_colors?: {
    primary?: string;
    secondary?: string;
  };
  hide_powered_by?: boolean;
  custom_css?: string;
}

interface DNSRecord {
  record_type: string;
  host: string;
  value: string;
  is_verified: boolean;
}

interface DomainSettingsProps {
  siteModuleId: string;
}

// ================================================================
// Helper Functions
// ================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ================================================================
// Main Component
// ================================================================

export function DomainSettings({ siteModuleId }: DomainSettingsProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains`);
      if (!response.ok) throw new Error('Failed to load domains');
      const data = await response.json();
      setDomains(data.domains || []);
    } catch (error) {
      console.error('Failed to load domains:', error);
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  }, [siteModuleId]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  async function addDomain() {
    if (!newDomain.trim()) return;
    
    setAdding(true);
    
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to add domain');
      }
      
      setDomains(prev => [data.domain, ...prev]);
      setAddDialogOpen(false);
      setNewDomain('');
      toast.success('Domain added successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add domain';
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }

  async function verifyDomain(domainId: string) {
    setVerifying(domainId);
    
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains/${domainId}/verify`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.verified) {
        toast.success('Domain verified! SSL provisioning started.');
        await loadDomains();
      } else {
        toast.error('Verification failed. Please check your DNS settings and try again.');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      toast.error('Verification failed');
    } finally {
      setVerifying(null);
    }
  }

  async function deleteDomain(domainId: string) {
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains/${domainId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete domain');
      
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success('Domain removed');
    } catch (error) {
      console.error('Failed to delete domain:', error);
      toast.error('Failed to remove domain');
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  function getStatusBadge(status: string) {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CircleCheck; spin?: boolean }> = {
      pending: { variant: 'secondary', icon: AlertTriangle },
      verifying: { variant: 'secondary', icon: Loader2, spin: true },
      verified: { variant: 'outline', icon: CircleCheck },
      provisioning: { variant: 'secondary', icon: Loader2, spin: true },
      active: { variant: 'default', icon: CircleCheck },
      failed: { variant: 'destructive', icon: AlertTriangle },
      expired: { variant: 'destructive', icon: Clock },
      disabled: { variant: 'secondary', icon: AlertTriangle }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.spin ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Custom Domains
          </h2>
          <p className="text-muted-foreground">
            Connect your own domain to run this module as a standalone app
          </p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  placeholder="app.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your domain or subdomain (e.g., app.yourcompany.com)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addDomain} disabled={adding || !newDomain.trim()}>
                {adding ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Domain
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domains List */}
      {domains.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Custom Domains</h3>
            <p className="text-muted-foreground mb-4">
              Add a custom domain to use this module on your own URL
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              verifying={verifying === domain.id}
              onVerify={() => verifyDomain(domain.id)}
              onDelete={() => deleteDomain(domain.id)}
              onSettings={() => setSelectedDomain(domain)}
              onCopy={copyToClipboard}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      {selectedDomain && (
        <DomainSettingsDialog
          domain={selectedDomain}
          onClose={() => setSelectedDomain(null)}
          onSave={loadDomains}
          siteModuleId={siteModuleId}
        />
      )}
    </div>
  );
}

// ================================================================
// Domain Card Component
// ================================================================

interface DomainCardProps {
  domain: Domain;
  verifying: boolean;
  onVerify: () => void;
  onDelete: () => void;
  onSettings: () => void;
  onCopy: (text: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function DomainCard({
  domain,
  verifying,
  onVerify,
  onDelete,
  onSettings,
  onCopy,
  getStatusBadge
}: DomainCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-lg font-mono">{domain.domain}</CardTitle>
            {getStatusBadge(domain.status)}
            {domain.ssl_status === 'active' && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                SSL
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {domain.status === 'active' && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
            {showDeleteConfirm ? (
              <>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Pending Verification */}
      {domain.status === 'pending' && (
        <CardContent className="pt-0">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">DNS Configuration Required</p>
              <p className="text-sm mb-3">
                Add the following DNS record to verify ownership:
              </p>
              
              <DNSInstructions 
                domain={domain} 
                onCopy={onCopy} 
              />

              <Button 
                className="mt-4 w-full" 
                onClick={onVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Verify DNS
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {/* SSL Provisioning */}
      {(domain.status === 'verified' || domain.status === 'provisioning') && (
        <CardContent className="pt-0">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <p className="font-medium">Provisioning SSL Certificate</p>
              <p className="text-sm text-muted-foreground">
                This usually takes a few minutes...
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}

      {/* Active Domain Stats */}
      {domain.status === 'active' && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Verified:</span>{' '}
              {domain.verified_at ? new Date(domain.verified_at).toLocaleDateString() : 'N/A'}
            </div>
            {domain.ssl_expires_at && (
              <div>
                <span className="text-muted-foreground">SSL Expires:</span>{' '}
                {new Date(domain.ssl_expires_at).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Requests:</span>{' '}
              {formatNumber(domain.total_requests)}
            </div>
            <div>
              <span className="text-muted-foreground">Bandwidth:</span>{' '}
              {formatBytes(domain.bandwidth_bytes)}
            </div>
          </div>
        </CardContent>
      )}

      {/* Failed Status */}
      {domain.status === 'failed' && (
        <CardContent className="pt-0">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Setup Failed</p>
              <p className="text-sm">
                SSL certificate provisioning failed. Please try again or contact support.
              </p>
              <Button variant="outline" className="mt-2" onClick={onVerify}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}

// ================================================================
// DNS Instructions Component
// ================================================================

interface DNSInstructionsProps {
  domain: Domain;
  onCopy: (text: string) => void;
}

function DNSInstructions({ domain, onCopy }: DNSInstructionsProps) {
  const isTXT = domain.verification_method === 'txt';

  return (
    <div className="bg-muted p-3 rounded-md space-y-2 text-sm font-mono">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Type:</span>
        <span>{isTXT ? 'TXT' : 'CNAME'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Host:</span>
        <span>{isTXT ? '_dramac-verify' : '@'}</span>
      </div>
      <div className="flex justify-between items-center gap-2">
        <span className="text-muted-foreground">Value:</span>
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[200px]">
            {isTXT ? domain.verification_value : 'modules.dramac.app'}
          </span>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => onCopy(isTXT ? domain.verification_value : 'modules.dramac.app')}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Settings Dialog Component
// ================================================================

interface DomainSettingsDialogProps {
  domain: Domain;
  onClose: () => void;
  onSave: () => void;
  siteModuleId: string;
}

function DomainSettingsDialog({
  domain,
  onClose,
  onSave,
  siteModuleId
}: DomainSettingsDialogProps) {
  const [saving, setSaving] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>(domain.white_label || {});
  const [config, setConfig] = useState<DomainConfig>(domain.config || {});

  async function save() {
    setSaving(true);
    
    try {
      const response = await fetch(`/api/modules/${siteModuleId}/domains/${domain.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ white_label: whiteLabel, config })
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      toast.success('Settings saved');
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">{domain.domain}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="branding">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Brand Name</Label>
              <Input
                id="brand_name"
                value={whiteLabel.brand_name || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, brand_name: e.target.value })}
                placeholder="Your Company Name"
              />
              <p className="text-xs text-muted-foreground">
                Displayed in the browser tab and as a title suffix
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={whiteLabel.logo_url || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input
                id="favicon_url"
                value={whiteLabel.favicon_url || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, favicon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={whiteLabel.brand_colors?.primary || '#3b82f6'}
                    onChange={(e) => setWhiteLabel({
                      ...whiteLabel,
                      brand_colors: { ...whiteLabel.brand_colors, primary: e.target.value }
                    })}
                  />
                  <Input
                    value={whiteLabel.brand_colors?.primary || '#3b82f6'}
                    onChange={(e) => setWhiteLabel({
                      ...whiteLabel,
                      brand_colors: { ...whiteLabel.brand_colors, primary: e.target.value }
                    })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={whiteLabel.brand_colors?.secondary || '#6366f1'}
                    onChange={(e) => setWhiteLabel({
                      ...whiteLabel,
                      brand_colors: { ...whiteLabel.brand_colors, secondary: e.target.value }
                    })}
                  />
                  <Input
                    value={whiteLabel.brand_colors?.secondary || '#6366f1'}
                    onChange={(e) => setWhiteLabel({
                      ...whiteLabel,
                      brand_colors: { ...whiteLabel.brand_colors, secondary: e.target.value }
                    })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Hide DRAMAC Branding</Label>
                <p className="text-sm text-muted-foreground">
                  Remove "Powered by DRAMAC" from the module
                </p>
              </div>
              <Switch
                checked={whiteLabel.hide_powered_by || false}
                onCheckedChange={(checked) => setWhiteLabel({ ...whiteLabel, hide_powered_by: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="custom_css">Custom CSS</Label>
              <textarea
                id="custom_css"
                className="w-full h-32 p-3 border rounded-md font-mono text-sm bg-muted"
                value={whiteLabel.custom_css || ''}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, custom_css: e.target.value })}
                placeholder=".my-class { color: red; }"
              />
              <p className="text-xs text-muted-foreground">
                Add custom CSS styles (advanced)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Redirect HTTP to HTTPS</Label>
                <p className="text-sm text-muted-foreground">
                  Always use secure connections (recommended)
                </p>
              </div>
              <Switch
                checked={config.redirect_to_https !== false}
                onCheckedChange={(checked) => setConfig({ ...config, redirect_to_https: checked })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable CDN Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Cache static assets on CDN edge servers
                </p>
              </div>
              <Switch
                checked={config.enable_cdn !== false}
                onCheckedChange={(checked) => setConfig({ ...config, enable_cdn: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="cache_ttl">Cache TTL (seconds)</Label>
              <Input
                id="cache_ttl"
                type="number"
                min="0"
                max="86400"
                value={config.cache_ttl || 3600}
                onChange={(e) => setConfig({ ...config, cache_ttl: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                How long to cache responses (0 = no cache, 3600 = 1 hour)
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Force WWW Prefix</Label>
                <p className="text-sm text-muted-foreground">
                  Redirect non-www to www version
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={config.force_www === true ? 'default' : 'outline'}
                  onClick={() => setConfig({ ...config, force_www: true })}
                >
                  www
                </Button>
                <Button
                  size="sm"
                  variant={config.force_www === false ? 'default' : 'outline'}
                  onClick={() => setConfig({ ...config, force_www: false })}
                >
                  non-www
                </Button>
                <Button
                  size="sm"
                  variant={config.force_www === undefined ? 'default' : 'outline'}
                  onClick={() => setConfig({ ...config, force_www: undefined })}
                >
                  Either
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DomainSettings;
