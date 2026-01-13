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

