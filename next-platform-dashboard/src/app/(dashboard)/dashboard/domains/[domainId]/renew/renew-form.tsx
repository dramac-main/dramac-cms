"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addYears, format } from "date-fns";
import { CreditCard, Calendar, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { renewDomain } from "@/lib/actions/domains";
import type { DomainWithDetails } from "@/types/domain";

interface DomainRenewFormProps {
  domain: DomainWithDetails;
  expiryDate: Date | null;
}

const RENEWAL_OPTIONS = [
  { years: 1, label: "1 Year", popular: false },
  { years: 2, label: "2 Years", popular: true },
  { years: 3, label: "3 Years", popular: false },
  { years: 5, label: "5 Years", popular: false },
];

// Estimated price per year - would come from actual pricing in production
const ESTIMATED_PRICE_PER_YEAR = 12.99;

export function DomainRenewForm({ domain, expiryDate }: DomainRenewFormProps) {
  const router = useRouter();
  const [selectedYears, setSelectedYears] = useState<string>("1");
  const [isRenewing, setIsRenewing] = useState(false);
  
  const years = parseInt(selectedYears);
  const newExpiryDate = expiryDate ? addYears(expiryDate, years) : null;
  const totalPrice = years * ESTIMATED_PRICE_PER_YEAR;
  
  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      const result = await renewDomain(domain.id, years);
      
      if (result.success) {
        toast.success(`Domain renewed for ${years} year${years > 1 ? 's' : ''}!`);
        router.push(`/dashboard/domains/${domain.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to renew domain');
      }
    } catch (error) {
      toast.error('An error occurred while renewing the domain');
    } finally {
      setIsRenewing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Renewal Period
        </CardTitle>
        <CardDescription>
          Choose how many years you want to extend your registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedYears} 
          onValueChange={setSelectedYears}
          className="grid grid-cols-2 gap-4"
        >
          {RENEWAL_OPTIONS.map((option) => (
            <div key={option.years} className="relative">
              <RadioGroupItem
                value={option.years.toString()}
                id={`years-${option.years}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`years-${option.years}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                {option.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                    Popular
                  </span>
                )}
                <span className="font-semibold text-lg">{option.label}</span>
                <span className="text-muted-foreground text-sm">
                  ${(option.years * ESTIMATED_PRICE_PER_YEAR).toFixed(2)}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {/* Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Domain</span>
            <span className="font-medium">{domain.domain_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Period</span>
            <span className="font-medium">{years} year{years > 1 ? 's' : ''}</span>
          </div>
          {newExpiryDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">New Expiry</span>
              <span className="font-medium text-green-600">
                {format(newExpiryDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
          <div className="pt-2 border-t flex justify-between">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()} disabled={isRenewing}>
          Cancel
        </Button>
        <Button onClick={handleRenew} disabled={isRenewing}>
          {isRenewing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Renew Domain
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
