"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

const COUNTRIES = [
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'IN', name: 'India', phoneCode: '+91' },
  { code: 'ZM', name: 'Zambia', phoneCode: '+260' },
  { code: 'ZA', name: 'South Africa', phoneCode: '+27' },
  { code: 'KE', name: 'Kenya', phoneCode: '+254' },
  { code: 'NG', name: 'Nigeria', phoneCode: '+234' },
  { code: 'GH', name: 'Ghana', phoneCode: '+233' },
  { code: 'TZ', name: 'Tanzania', phoneCode: '+255' },
  { code: 'UG', name: 'Uganda', phoneCode: '+256' },
  { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'SG', name: 'Singapore', phoneCode: '+65' },
  { code: 'JP', name: 'Japan', phoneCode: '+81' },
  { code: 'CN', name: 'China', phoneCode: '+86' },
  { code: 'BR', name: 'Brazil', phoneCode: '+55' },
  { code: 'MX', name: 'Mexico', phoneCode: '+52' },
].sort((a, b) => a.name.localeCompare(b.name));

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State/Province must be at least 2 characters"),
  country: z.string().length(2, "Please select a country"),
  zipcode: z.string().min(3, "Please enter a valid postal code"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface DomainContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  defaultValues?: Partial<ContactFormData>;
  isSubmitting?: boolean;
}

export function DomainContactForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: DomainContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      address: "",
      city: "",
      state: "",
      country: "US",
      zipcode: "",
      phone: "",
      ...defaultValues,
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Contact Information
        </CardTitle>
        <CardDescription>
          This information will be used for domain registration (WHOIS records).
          Privacy protection will hide this from public WHOIS lookups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company / Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="Company Name (Optional)" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave blank for personal registrations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal / ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="+1 234 567 8900" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include country code (e.g., +1 for US, +44 for UK)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Complete Registration'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
