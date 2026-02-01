"use client";

import { useState } from "react";
import { Server, Plus, Trash2, Edit, Check, X, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DomainNameserversProps {
  domainId: string;
  currentNameservers: string[];
  onUpdate?: (nameservers: string[]) => Promise<void>;
}

const DEFAULT_NAMESERVERS = [
  'ns1.cloudflare.com',
  'ns2.cloudflare.com',
];

const PLATFORM_NAMESERVERS = [
  'ns1.dramac.app',
  'ns2.dramac.app',
];

export function DomainNameservers({ 
  domainId, 
  currentNameservers,
  onUpdate 
}: DomainNameserversProps) {
  const [nameservers, setNameservers] = useState<string[]>(
    currentNameservers.length > 0 ? currentNameservers : DEFAULT_NAMESERVERS
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNs, setNewNs] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  
  const isCloudflare = nameservers.some(ns => ns.includes('cloudflare'));
  const isPlatform = nameservers.some(ns => ns.includes('dramac'));
  
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(nameservers[index]);
  };
  
  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue("");
  };
  
  const saveEdit = async () => {
    if (!editValue.trim()) {
      toast.error('Nameserver cannot be empty');
      return;
    }
    
    if (editingIndex === null) return;
    
    const newNameservers = [...nameservers];
    newNameservers[editingIndex] = editValue.trim().toLowerCase();
    
    setIsUpdating(true);
    try {
      if (onUpdate) {
        await onUpdate(newNameservers);
      }
      setNameservers(newNameservers);
      toast.success('Nameserver updated');
    } catch (error) {
      toast.error('Failed to update nameserver');
    } finally {
      setIsUpdating(false);
      cancelEditing();
    }
  };
  
  const addNameserver = async () => {
    if (!newNs.trim()) {
      toast.error('Nameserver cannot be empty');
      return;
    }
    
    if (nameservers.length >= 4) {
      toast.error('Maximum 4 nameservers allowed');
      return;
    }
    
    const newNameservers = [...nameservers, newNs.trim().toLowerCase()];
    
    setIsUpdating(true);
    try {
      if (onUpdate) {
        await onUpdate(newNameservers);
      }
      setNameservers(newNameservers);
      toast.success('Nameserver added');
      setNewNs("");
      setShowAddInput(false);
    } catch (error) {
      toast.error('Failed to add nameserver');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const removeNameserver = async (index: number) => {
    if (nameservers.length <= 2) {
      toast.error('Minimum 2 nameservers required');
      return;
    }
    
    const newNameservers = nameservers.filter((_, i) => i !== index);
    
    setIsUpdating(true);
    try {
      if (onUpdate) {
        await onUpdate(newNameservers);
      }
      setNameservers(newNameservers);
      toast.success('Nameserver removed');
    } catch (error) {
      toast.error('Failed to remove nameserver');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const resetToDefaults = async (type: 'cloudflare' | 'platform') => {
    const defaultNs = type === 'cloudflare' ? DEFAULT_NAMESERVERS : PLATFORM_NAMESERVERS;
    
    setIsUpdating(true);
    try {
      if (onUpdate) {
        await onUpdate(defaultNs);
      }
      setNameservers(defaultNs);
      toast.success(`Reset to ${type === 'cloudflare' ? 'Cloudflare' : 'Platform'} nameservers`);
    } catch (error) {
      toast.error('Failed to reset nameservers');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCloudflare && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
              Cloudflare DNS
            </Badge>
          )}
          {isPlatform && (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Platform DNS
            </Badge>
          )}
          {!isCloudflare && !isPlatform && (
            <Badge variant="outline">Custom DNS</Badge>
          )}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                Nameservers control where DNS queries for your domain are handled. 
                Changes may take up to 48 hours to propagate globally.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Nameserver List */}
      <div className="space-y-2">
        {nameservers.map((ns, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md border",
              editingIndex === index ? "border-primary bg-muted/50" : "bg-muted/30"
            )}
          >
            <Server className="h-4 w-4 text-muted-foreground shrink-0" />
            
            {editingIndex === index ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-8 text-sm font-mono"
                  placeholder="ns1.example.com"
                  disabled={isUpdating}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0"
                  onClick={saveEdit}
                  disabled={isUpdating}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0"
                  onClick={cancelEditing}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-mono">{ns}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => startEditing(index)}
                  disabled={isUpdating}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeNameserver(index)}
                  disabled={isUpdating || nameservers.length <= 2}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Add Nameserver */}
      {showAddInput ? (
        <div className="flex items-center gap-2">
          <Input
            value={newNs}
            onChange={(e) => setNewNs(e.target.value)}
            className="h-9 text-sm font-mono"
            placeholder="ns3.example.com"
            disabled={isUpdating}
          />
          <Button 
            size="sm" 
            onClick={addNameserver}
            disabled={isUpdating || !newNs.trim()}
          >
            Add
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => {
              setShowAddInput(false);
              setNewNs("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowAddInput(true)}
          disabled={nameservers.length >= 4}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Nameserver
        </Button>
      )}
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => resetToDefaults('cloudflare')}
          disabled={isUpdating || isCloudflare}
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Use Cloudflare
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => resetToDefaults('platform')}
          disabled={isUpdating || isPlatform}
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Use Platform
        </Button>
      </div>
    </div>
  );
}
