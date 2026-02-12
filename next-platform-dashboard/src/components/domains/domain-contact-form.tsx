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
  // Africa
  { code: 'ZM', name: 'Zambia', phoneCode: '+260' },
  { code: 'ZA', name: 'South Africa', phoneCode: '+27' },
  { code: 'KE', name: 'Kenya', phoneCode: '+254' },
  { code: 'NG', name: 'Nigeria', phoneCode: '+234' },
  { code: 'GH', name: 'Ghana', phoneCode: '+233' },
  { code: 'TZ', name: 'Tanzania', phoneCode: '+255' },
  { code: 'UG', name: 'Uganda', phoneCode: '+256' },
  { code: 'ZW', name: 'Zimbabwe', phoneCode: '+263' },
  { code: 'BW', name: 'Botswana', phoneCode: '+267' },
  { code: 'MW', name: 'Malawi', phoneCode: '+265' },
  { code: 'MZ', name: 'Mozambique', phoneCode: '+258' },
  { code: 'NA', name: 'Namibia', phoneCode: '+264' },
  { code: 'RW', name: 'Rwanda', phoneCode: '+250' },
  { code: 'CD', name: 'Democratic Republic of the Congo', phoneCode: '+243' },
  { code: 'CI', name: 'Côte d\'Ivoire', phoneCode: '+225' },
  { code: 'SN', name: 'Senegal', phoneCode: '+221' },
  { code: 'CM', name: 'Cameroon', phoneCode: '+237' },
  { code: 'ET', name: 'Ethiopia', phoneCode: '+251' },
  { code: 'EG', name: 'Egypt', phoneCode: '+20' },
  { code: 'MA', name: 'Morocco', phoneCode: '+212' },
  { code: 'AO', name: 'Angola', phoneCode: '+244' },
  { code: 'DZ', name: 'Algeria', phoneCode: '+213' },
  { code: 'TN', name: 'Tunisia', phoneCode: '+216' },
  { code: 'SD', name: 'Sudan', phoneCode: '+249' },
  { code: 'LY', name: 'Libya', phoneCode: '+218' },
  { code: 'MU', name: 'Mauritius', phoneCode: '+230' },
  { code: 'MG', name: 'Madagascar', phoneCode: '+261' },
  // Americas
  { code: 'US', name: 'United States', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', phoneCode: '+1' },
  { code: 'MX', name: 'Mexico', phoneCode: '+52' },
  { code: 'BR', name: 'Brazil', phoneCode: '+55' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54' },
  { code: 'CL', name: 'Chile', phoneCode: '+56' },
  { code: 'CO', name: 'Colombia', phoneCode: '+57' },
  { code: 'PE', name: 'Peru', phoneCode: '+51' },
  { code: 'VE', name: 'Venezuela', phoneCode: '+58' },
  { code: 'EC', name: 'Ecuador', phoneCode: '+593' },
  { code: 'UY', name: 'Uruguay', phoneCode: '+598' },
  { code: 'PY', name: 'Paraguay', phoneCode: '+595' },
  { code: 'JM', name: 'Jamaica', phoneCode: '+1876' },
  { code: 'TT', name: 'Trinidad and Tobago', phoneCode: '+1868' },
  // Europe
  { code: 'GB', name: 'United Kingdom', phoneCode: '+44' },
  { code: 'DE', name: 'Germany', phoneCode: '+49' },
  { code: 'FR', name: 'France', phoneCode: '+33' },
  { code: 'IT', name: 'Italy', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', phoneCode: '+34' },
  { code: 'PT', name: 'Portugal', phoneCode: '+351' },
  { code: 'NL', name: 'Netherlands', phoneCode: '+31' },
  { code: 'BE', name: 'Belgium', phoneCode: '+32' },
  { code: 'CH', name: 'Switzerland', phoneCode: '+41' },
  { code: 'AT', name: 'Austria', phoneCode: '+43' },
  { code: 'SE', name: 'Sweden', phoneCode: '+46' },
  { code: 'NO', name: 'Norway', phoneCode: '+47' },
  { code: 'DK', name: 'Denmark', phoneCode: '+45' },
  { code: 'FI', name: 'Finland', phoneCode: '+358' },
  { code: 'PL', name: 'Poland', phoneCode: '+48' },
  { code: 'IE', name: 'Ireland', phoneCode: '+353' },
  { code: 'CZ', name: 'Czech Republic', phoneCode: '+420' },
  { code: 'RO', name: 'Romania', phoneCode: '+40' },
  { code: 'GR', name: 'Greece', phoneCode: '+30' },
  { code: 'HU', name: 'Hungary', phoneCode: '+36' },
  { code: 'HR', name: 'Croatia', phoneCode: '+385' },
  { code: 'UA', name: 'Ukraine', phoneCode: '+380' },
  { code: 'RS', name: 'Serbia', phoneCode: '+381' },
  { code: 'BG', name: 'Bulgaria', phoneCode: '+359' },
  { code: 'SK', name: 'Slovakia', phoneCode: '+421' },
  { code: 'LT', name: 'Lithuania', phoneCode: '+370' },
  { code: 'LV', name: 'Latvia', phoneCode: '+371' },
  { code: 'EE', name: 'Estonia', phoneCode: '+372' },
  { code: 'IS', name: 'Iceland', phoneCode: '+354' },
  // Asia & Pacific
  { code: 'IN', name: 'India', phoneCode: '+91' },
  { code: 'CN', name: 'China', phoneCode: '+86' },
  { code: 'JP', name: 'Japan', phoneCode: '+81' },
  { code: 'KR', name: 'South Korea', phoneCode: '+82' },
  { code: 'SG', name: 'Singapore', phoneCode: '+65' },
  { code: 'AU', name: 'Australia', phoneCode: '+61' },
  { code: 'NZ', name: 'New Zealand', phoneCode: '+64' },
  { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', phoneCode: '+966' },
  { code: 'IL', name: 'Israel', phoneCode: '+972' },
  { code: 'TR', name: 'Turkey', phoneCode: '+90' },
  { code: 'TH', name: 'Thailand', phoneCode: '+66' },
  { code: 'MY', name: 'Malaysia', phoneCode: '+60' },
  { code: 'PH', name: 'Philippines', phoneCode: '+63' },
  { code: 'ID', name: 'Indonesia', phoneCode: '+62' },
  { code: 'VN', name: 'Vietnam', phoneCode: '+84' },
  { code: 'PK', name: 'Pakistan', phoneCode: '+92' },
  { code: 'BD', name: 'Bangladesh', phoneCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', phoneCode: '+94' },
  { code: 'NP', name: 'Nepal', phoneCode: '+977' },
  { code: 'HK', name: 'Hong Kong', phoneCode: '+852' },
  { code: 'TW', name: 'Taiwan', phoneCode: '+886' },
  { code: 'QA', name: 'Qatar', phoneCode: '+974' },
  { code: 'KW', name: 'Kuwait', phoneCode: '+965' },
  { code: 'BH', name: 'Bahrain', phoneCode: '+973' },
  { code: 'OM', name: 'Oman', phoneCode: '+968' },
  { code: 'JO', name: 'Jordan', phoneCode: '+962' },
  { code: 'FJ', name: 'Fiji', phoneCode: '+679' },
  { code: 'PG', name: 'Papua New Guinea', phoneCode: '+675' },
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
      country: "ZM",
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
                    Include country code (e.g., +260 for ZM, +1 for US, +44 for UK)
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
