export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          plan: "starter" | "professional" | "enterprise";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          billing_email: string | null;
          white_label_enabled: boolean;
          custom_branding: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string;
          owner_id: string;
          plan?: "starter" | "professional" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          billing_email?: string | null;
          white_label_enabled?: boolean;
          custom_branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          owner_id?: string;
          plan?: "starter" | "professional" | "enterprise";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          billing_email?: string | null;
          white_label_enabled?: boolean;
          custom_branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          role: "super_admin" | "admin" | "member";
          agency_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "admin" | "member";
          agency_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: "super_admin" | "admin" | "member";
          agency_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      agency_members: {
        Row: {
          id: string;
          agency_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          permissions: Json;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          agency_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          permissions?: Json;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          agency_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          permissions?: Json;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          email: string | null;
          company: string | null;
          phone: string | null;
          status: "active" | "inactive" | "archived";
          seat_activated_at: string;
          seat_paused_at: string | null;
          stripe_subscription_item_id: string | null;
          has_portal_access: boolean;
          portal_user_id: string | null;
          notes: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          status?: "active" | "inactive" | "archived";
          seat_activated_at?: string;
          seat_paused_at?: string | null;
          stripe_subscription_item_id?: string | null;
          has_portal_access?: boolean;
          portal_user_id?: string | null;
          notes?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          name?: string;
          email?: string | null;
          company?: string | null;
          phone?: string | null;
          status?: "active" | "inactive" | "archived";
          seat_activated_at?: string;
          seat_paused_at?: string | null;
          stripe_subscription_item_id?: string | null;
          has_portal_access?: boolean;
          portal_user_id?: string | null;
          notes?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      sites: {
        Row: {
          id: string;
          client_id: string;
          agency_id: string;
          name: string;
          subdomain: string;
          custom_domain: string | null;
          published: boolean;
          published_at: string | null;
          settings: Json;
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          agency_id: string;
          name: string;
          subdomain: string;
          custom_domain?: string | null;
          published?: boolean;
          published_at?: string | null;
          settings?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          agency_id?: string;
          name?: string;
          subdomain?: string;
          custom_domain?: string | null;
          published?: boolean;
          published_at?: string | null;
          settings?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sites_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      pages: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          slug: string;
          is_homepage: boolean;
          seo_title: string | null;
          seo_description: string | null;
          seo_image: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          slug: string;
          is_homepage?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          slug?: string;
          is_homepage?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          }
        ];
      };
      page_content: {
        Row: {
          id: string;
          page_id: string;
          content: Json;
          version: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          content: Json;
          version?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          content?: Json;
          version?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_content_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          }
        ];
      };
      assets: {
        Row: {
          id: string;
          site_id: string;
          agency_id: string;
          name: string;
          file_name: string;
          url: string;
          storage_path: string;
          mime_type: string;
          size: number;
          width: number | null;
          height: number | null;
          folder: string;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          agency_id: string;
          name: string;
          file_name: string;
          url: string;
          storage_path: string;
          mime_type: string;
          size: number;
          width?: number | null;
          height?: number | null;
          folder?: string;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          agency_id?: string;
          name?: string;
          file_name?: string;
          url?: string;
          storage_path?: string;
          mime_type?: string;
          size?: number;
          width?: number | null;
          height?: number | null;
          folder?: string;
          alt_text?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assets_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          }
        ];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          content: Json;
          category: string;
          is_public: boolean;
          agency_id: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          content: Json;
          category: string;
          is_public?: boolean;
          agency_id: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          content?: Json;
          category?: string;
          is_public?: boolean;
          agency_id?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      modules: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          long_description: string | null;
          icon: string;
          category: string;
          price_monthly: number;
          price_yearly: number | null;
          is_active: boolean;
          is_featured: boolean;
          features: Json;
          screenshots: Json;
          requirements: Json;
          version: string;
          stripe_product_id: string | null;
          stripe_price_monthly: string | null;
          stripe_price_yearly: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          long_description?: string | null;
          icon?: string;
          category: string;
          price_monthly?: number;
          price_yearly?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          features?: Json;
          screenshots?: Json;
          requirements?: Json;
          version?: string;
          stripe_product_id?: string | null;
          stripe_price_monthly?: string | null;
          stripe_price_yearly?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          long_description?: string | null;
          icon?: string;
          category?: string;
          price_monthly?: number;
          price_yearly?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          features?: Json;
          screenshots?: Json;
          requirements?: Json;
          version?: string;
          stripe_product_id?: string | null;
          stripe_price_monthly?: string | null;
          stripe_price_yearly?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      module_subscriptions: {
        Row: {
          id: string;
          agency_id: string;
          module_id: string;
          status: "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";
          billing_cycle: "monthly" | "yearly";
          current_period_start: string | null;
          current_period_end: string | null;
          stripe_subscription_id: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          module_id: string;
          status?: "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";
          billing_cycle?: "monthly" | "yearly";
          current_period_start?: string | null;
          current_period_end?: string | null;
          stripe_subscription_id?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          module_id?: string;
          status?: "active" | "canceled" | "past_due" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";
          billing_cycle?: "monthly" | "yearly";
          current_period_start?: string | null;
          current_period_end?: string | null;
          stripe_subscription_id?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_subscriptions_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
      site_modules: {
        Row: {
          id: string;
          site_id: string;
          module_id: string;
          settings: Json;
          is_enabled: boolean;
          enabled_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          module_id: string;
          settings?: Json;
          is_enabled?: boolean;
          enabled_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          module_id?: string;
          settings?: Json;
          is_enabled?: boolean;
          enabled_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_modules_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_modules_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
      agency_modules: {
        Row: {
          id: string;
          agency_id: string;
          module_id: string;
          enabled: boolean;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          module_id: string;
          enabled?: boolean;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          module_id?: string;
          enabled?: boolean;
          settings?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_modules_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_modules_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
      module_usage: {
        Row: {
          id: string;
          module_subscription_id: string;
          site_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_subscription_id: string;
          site_id?: string | null;
          event_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          module_subscription_id?: string;
          site_id?: string | null;
          event_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_usage_module_subscription_id_fkey";
            columns: ["module_subscription_id"];
            isOneToOne: false;
            referencedRelation: "module_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_usage_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_customers: {
        Row: {
          id: string;
          agency_id: string;
          stripe_customer_id: string;
          email: string;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          stripe_customer_id: string;
          email: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          stripe_customer_id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_customers_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: true;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_subscriptions: {
        Row: {
          id: string;
          agency_id: string;
          stripe_subscription_id: string;
          status: string;
          billing_cycle: string;
          quantity: number;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          trial_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          stripe_subscription_id: string;
          status?: string;
          billing_cycle?: string;
          quantity?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          stripe_subscription_id?: string;
          status?: string;
          billing_cycle?: string;
          quantity?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_invoices: {
        Row: {
          id: string;
          agency_id: string;
          stripe_invoice_id: string;
          amount_due: number;
          amount_paid: number;
          currency: string;
          status: string;
          invoice_pdf: string | null;
          hosted_invoice_url: string | null;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          stripe_invoice_id: string;
          amount_due: number;
          amount_paid: number;
          currency?: string;
          status: string;
          invoice_pdf?: string | null;
          hosted_invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          agency_id?: string;
          stripe_invoice_id?: string;
          amount_due?: number;
          amount_paid?: number;
          currency?: string;
          status?: string;
          invoice_pdf?: string | null;
          hosted_invoice_url?: string | null;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "billing_invoices_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      billing_usage: {
        Row: {
          id: string;
          agency_id: string;
          module_id: string | null;
          stripe_subscription_item_id: string | null;
          quantity: number;
          timestamp: string;
          idempotency_key: string | null;
        };
        Insert: {
          id?: string;
          agency_id: string;
          module_id?: string | null;
          stripe_subscription_item_id?: string | null;
          quantity?: number;
          timestamp?: string;
          idempotency_key?: string | null;
        };
        Update: {
          id?: string;
          agency_id?: string;
          module_id?: string | null;
          stripe_subscription_item_id?: string | null;
          quantity?: number;
          timestamp?: string;
          idempotency_key?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "billing_usage_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "billing_usage_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
export type Agency = Database["public"]["Tables"]["agencies"]["Row"];
export type AgencyInsert = Database["public"]["Tables"]["agencies"]["Insert"];
export type AgencyUpdate = Database["public"]["Tables"]["agencies"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type AgencyMember = Database["public"]["Tables"]["agency_members"]["Row"];
export type AgencyMemberInsert = Database["public"]["Tables"]["agency_members"]["Insert"];
export type AgencyMemberUpdate = Database["public"]["Tables"]["agency_members"]["Update"];

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
export type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export type Page = Database["public"]["Tables"]["pages"]["Row"];
export type PageInsert = Database["public"]["Tables"]["pages"]["Insert"];
export type PageUpdate = Database["public"]["Tables"]["pages"]["Update"];

export type PageContent = Database["public"]["Tables"]["page_content"]["Row"];
export type PageContentInsert = Database["public"]["Tables"]["page_content"]["Insert"];
export type PageContentUpdate = Database["public"]["Tables"]["page_content"]["Update"];

export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
export type AssetUpdate = Database["public"]["Tables"]["assets"]["Update"];

export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type TemplateInsert = Database["public"]["Tables"]["templates"]["Insert"];
export type TemplateUpdate = Database["public"]["Tables"]["templates"]["Update"];

export type DbModule = Database["public"]["Tables"]["modules"]["Row"];
export type DbModuleInsert = Database["public"]["Tables"]["modules"]["Insert"];
export type DbModuleUpdate = Database["public"]["Tables"]["modules"]["Update"];

export type DbModuleSubscription = Database["public"]["Tables"]["module_subscriptions"]["Row"];
export type DbModuleSubscriptionInsert = Database["public"]["Tables"]["module_subscriptions"]["Insert"];
export type DbModuleSubscriptionUpdate = Database["public"]["Tables"]["module_subscriptions"]["Update"];

export type DbSiteModule = Database["public"]["Tables"]["site_modules"]["Row"];
export type DbSiteModuleInsert = Database["public"]["Tables"]["site_modules"]["Insert"];
export type DbSiteModuleUpdate = Database["public"]["Tables"]["site_modules"]["Update"];

export type DbModuleUsage = Database["public"]["Tables"]["module_usage"]["Row"];
export type DbModuleUsageInsert = Database["public"]["Tables"]["module_usage"]["Insert"];
export type DbModuleUsageUpdate = Database["public"]["Tables"]["module_usage"]["Update"];

export type DbBillingCustomer = Database["public"]["Tables"]["billing_customers"]["Row"];
export type DbBillingCustomerInsert = Database["public"]["Tables"]["billing_customers"]["Insert"];
export type DbBillingCustomerUpdate = Database["public"]["Tables"]["billing_customers"]["Update"];

export type DbBillingSubscription = Database["public"]["Tables"]["billing_subscriptions"]["Row"];
export type DbBillingSubscriptionInsert = Database["public"]["Tables"]["billing_subscriptions"]["Insert"];
export type DbBillingSubscriptionUpdate = Database["public"]["Tables"]["billing_subscriptions"]["Update"];

export type DbBillingInvoice = Database["public"]["Tables"]["billing_invoices"]["Row"];
export type DbBillingInvoiceInsert = Database["public"]["Tables"]["billing_invoices"]["Insert"];
export type DbBillingInvoiceUpdate = Database["public"]["Tables"]["billing_invoices"]["Update"];

export type DbBillingUsage = Database["public"]["Tables"]["billing_usage"]["Row"];
export type DbBillingUsageInsert = Database["public"]["Tables"]["billing_usage"]["Insert"];
export type DbBillingUsageUpdate = Database["public"]["Tables"]["billing_usage"]["Update"];
