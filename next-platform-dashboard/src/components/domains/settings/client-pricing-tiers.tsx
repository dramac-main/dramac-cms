"use client";

// src/components/domains/settings/client-pricing-tiers.tsx
// Client Pricing Tiers Management

import { useState } from "react";
import { Plus, Edit2, Trash2, Users, Percent, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  addClientPricingTier, 
  updateClientPricingTier, 
  deleteClientPricingTier 
} from "@/lib/actions/domain-billing";
import type { ClientPricingTier } from "@/types/domain-pricing";

interface ClientPricingTiersProps {
  tiers: ClientPricingTier[];
  onUpdate: () => void;
}

export function ClientPricingTiers({ tiers, onUpdate }: ClientPricingTiersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<ClientPricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: 0,
    min_domains: 0,
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: 0,
      min_domains: 0,
    });
  };
  
  const handleAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('Tier name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await addClientPricingTier({
        name: formData.name,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        min_domains: formData.min_domains || undefined,
        client_ids: [],
      });
      
      if (result.success) {
        toast.success('Pricing tier created');
        setIsAddDialogOpen(false);
        resetForm();
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to create tier');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!editingTier) return;
    
    setIsLoading(true);
    try {
      const result = await updateClientPricingTier(editingTier.id, {
        name: formData.name,
        description: formData.description,
        discount_percentage: formData.discount_percentage,
        min_domains: formData.min_domains || undefined,
      });
      
      if (result.success) {
        toast.success('Pricing tier updated');
        setEditingTier(null);
        resetForm();
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to update tier');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (tierId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteClientPricingTier(tierId);
      
      if (result.success) {
        toast.success('Pricing tier deleted');
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to delete tier');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startEdit = (tier: ClientPricingTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description,
      discount_percentage: tier.discount_percentage,
      min_domains: tier.min_domains || 0,
    });
  };
  
  const cancelEdit = () => {
    setEditingTier(null);
    resetForm();
  };
  
  const TierForm = ({ onSave, isEdit = false }: { onSave: () => void; isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tier Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., VIP Clients, Partner Agencies"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe who qualifies for this tier..."
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount">Discount Percentage</Label>
          <div className="flex items-center gap-2">
            <Input
              id="discount"
              type="number"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ 
                ...formData, 
                discount_percentage: parseFloat(e.target.value) || 0 
              })}
              min="0"
              max="100"
              className="w-24"
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Discount off your retail price
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minDomains">Minimum Domains (Optional)</Label>
          <Input
            id="minDomains"
            type="number"
            value={formData.min_domains}
            onChange={(e) => setFormData({ 
              ...formData, 
              min_domains: parseInt(e.target.value) || 0 
            })}
            min="0"
            className="w-24"
          />
          <p className="text-xs text-muted-foreground">
            Auto-qualify clients with X+ domains
          </p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        {isEdit && (
          <Button variant="outline" onClick={cancelEdit}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button onClick={onSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isEdit ? 'Update Tier' : 'Create Tier'}
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Client Pricing Tiers</h3>
          <p className="text-sm text-muted-foreground">
            Create tiered pricing to offer discounts to specific client groups
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pricing Tier</DialogTitle>
              <DialogDescription>
                Define a new pricing tier for your clients
              </DialogDescription>
            </DialogHeader>
            <TierForm onSave={handleAdd} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tier List */}
      {tiers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No Pricing Tiers</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create tiers to offer discounted pricing to VIP clients or high-volume partners
            </p>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Tier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <Card key={tier.id} className={editingTier?.id === tier.id ? 'ring-2 ring-primary' : ''}>
              {editingTier?.id === tier.id ? (
                <CardContent className="pt-6">
                  <TierForm onSave={handleUpdate} isEdit />
                </CardContent>
              ) : (
                <>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {tier.name}
                          <Badge variant="secondary" className="font-mono">
                            <Percent className="h-3 w-3 mr-1" />
                            {tier.discount_percentage}% off
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {tier.description || 'No description'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(tier)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tier?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the &quot;{tier.name}&quot; tier and its discounts will no longer apply to assigned clients.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(tier.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{tier.client_ids?.length || 0} clients</span>
                      </div>
                      {tier.min_domains && tier.min_domains > 0 && (
                        <div className="text-muted-foreground">
                          Auto-qualify: {tier.min_domains}+ domains
                        </div>
                      )}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
