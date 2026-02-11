"use client";

import { useState, useEffect } from "react";
import { Building, Globe, Link as LinkIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  company: string | null;
}

interface Site {
  id: string;
  name: string;
  subdomain: string;
}

interface DomainAssignmentProps {
  domainId: string;
  currentClientId: string | null;
  currentSiteId: string | null;
  onAssign?: (clientId: string | null, siteId: string | null) => Promise<void>;
}

// Mock data - in production, these would come from server actions
const MOCK_CLIENTS: Client[] = [
  { id: 'c1', name: 'Customer A', company: 'Company One' },
  { id: 'c2', name: 'Customer B', company: 'Tech Solutions' },
  { id: 'c3', name: 'Customer C', company: null },
];

const MOCK_SITES: Site[] = [
  { id: 's1', name: 'Main Website', subdomain: 'company' },
  { id: 's2', name: 'Blog', subdomain: 'blog' },
  { id: 's3', name: 'Store', subdomain: 'shop' },
];

export function DomainAssignment({ 
  domainId, 
  currentClientId, 
  currentSiteId,
  onAssign 
}: DomainAssignmentProps) {
  const [clientId, setClientId] = useState<string | null>(currentClientId);
  const [siteId, setSiteId] = useState<string | null>(currentSiteId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clients] = useState<Client[]>(MOCK_CLIENTS);
  const [sites] = useState<Site[]>(MOCK_SITES);
  
  const selectedClient = clients.find(c => c.id === clientId);
  const selectedSite = sites.find(s => s.id === siteId);
  
  const handleClientChange = async (value: string) => {
    const newClientId = value === 'none' ? null : value;
    setIsUpdating(true);
    
    try {
      if (onAssign) {
        await onAssign(newClientId, siteId);
      }
      setClientId(newClientId);
      toast.success(newClientId ? 'Client assigned' : 'Client removed');
    } catch (error) {
      toast.error('Failed to update assignment');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSiteChange = async (value: string) => {
    const newSiteId = value === 'none' ? null : value;
    setIsUpdating(true);
    
    try {
      if (onAssign) {
        await onAssign(clientId, newSiteId);
      }
      setSiteId(newSiteId);
      toast.success(newSiteId ? 'Site connected' : 'Site disconnected');
    } catch (error) {
      toast.error('Failed to update assignment');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const removeClient = async () => {
    await handleClientChange('none');
  };
  
  const removeSite = async () => {
    await handleSiteChange('none');
  };
  
  return (
    <div className="space-y-4">
      {/* Client Assignment */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          Client
        </label>
        
        {selectedClient ? (
          <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
            <div>
              <p className="text-sm font-medium">
                {selectedClient.company || selectedClient.name}
              </p>
              {selectedClient.company && (
                <p className="text-xs text-muted-foreground">{selectedClient.name}</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={removeClient}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Select onValueChange={handleClientChange} disabled={isUpdating}>
            <SelectTrigger>
              <SelectValue placeholder="Assign to client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company || client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Site Assignment */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          Connected Site
        </label>
        
        {selectedSite ? (
          <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
            <div>
              <p className="text-sm font-medium">{selectedSite.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedSite.subdomain}.dramac.app
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={removeSite}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Select onValueChange={handleSiteChange} disabled={isUpdating}>
            <SelectTrigger>
              <SelectValue placeholder="Connect to site..." />
            </SelectTrigger>
            <SelectContent>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  <div className="flex flex-col">
                    <span>{site.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {site.subdomain}.dramac.app
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Status */}
      {!selectedClient && !selectedSite && (
        <p className="text-xs text-muted-foreground">
          This domain is not assigned to any client or site.
        </p>
      )}
    </div>
  );
}
