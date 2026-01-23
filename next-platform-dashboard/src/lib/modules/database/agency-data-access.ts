/**
 * Agency-Level Data Access Layer
 * 
 * Provides data access for agency administrators who need to see data
 * across all sites within their agency.
 * 
 * @module modules/database/agency-data-access
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAdminClient } from '@/lib/supabase/admin';
import type { TenantContext } from '@/lib/multi-tenant/tenant-context';

// Helper type to bypass strict Supabase typing for dynamic tables
type AnySupabaseClient = any;

/**
 * Site information
 */
export interface SiteInfo {
  id: string;
  name: string;
  domain?: string;
  createdAt: string;
}

/**
 * Stats per site
 */
export interface SiteStats {
  siteId: string;
  siteName?: string;
  count: number;
}

/**
 * Grouped data by site
 */
export interface GroupedBySite<T> {
  [siteId: string]: {
    site: SiteInfo;
    records: T[];
  };
}

/**
 * Agency-level data access (for admins to see all sites)
 * 
 * @throws Error if user doesn't have admin role
 */
export function createAgencyDataAccess(
  tablePrefix: string,
  context: TenantContext
) {
  if (context.role !== 'owner' && context.role !== 'admin') {
    throw new Error('Agency-level access requires admin role');
  }
  
  // Use admin client for dynamic table access
  const supabase = createAdminClient() as AnySupabaseClient;
  
  /**
   * Get full table name from short name
   */
  function getFullTableName(tableName: string): string {
    if (tableName.startsWith(tablePrefix)) {
      return tableName;
    }
    return `${tablePrefix}_${tableName}`;
  }
  
  return {
    /**
     * Query across all sites in agency
     */
    from(tableName: string) {
      const fullTableName = getFullTableName(tableName);
      
      return {
        /**
         * Get data from all sites in the agency
         */
        async selectAll<T = any>(columns = '*'): Promise<T[]> {
          const { data, error } = await supabase
            .from(fullTableName)
            .select(columns)
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          return (data || []) as T[];
        },
        
        /**
         * Get data with site information joined
         */
        async selectWithSite<T = any>(columns = '*'): Promise<(T & { site: SiteInfo })[]> {
          const { data, error } = await (supabase as any)
            .from(fullTableName)
            .select(`${columns}, site:sites(id, name)`)
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          return (data || []) as (T & { site: SiteInfo })[];
        },
        
        /**
         * Get data grouped by site
         */
        async selectBySite<T = any>(columns = '*'): Promise<GroupedBySite<T>> {
          const { data, error } = await (supabase as any)
            .from(fullTableName)
            .select(`${columns}, site:sites(id, name)`)
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          
          // Group by site
          const grouped: GroupedBySite<T> = {};
          
          (data || []).forEach((record: any) => {
            const siteId = record.site_id;
            if (!grouped[siteId]) {
              grouped[siteId] = {
                site: record.site as SiteInfo,
                records: []
              };
            }
            // Remove the nested site object from the record
            const { site: _site, ...recordWithoutSite } = record;
            grouped[siteId].records.push(recordWithoutSite as T);
          });
          
          return grouped;
        },
        
        /**
         * Get aggregate stats per site
         */
        async statsPerSite(): Promise<SiteStats[]> {
          // First get all unique site_ids with counts
          const { data: records, error } = await (supabase as any)
            .from(fullTableName)
            .select('site_id')
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          
          // Count per site
          const countMap = new Map<string, number>();
          (records || []).forEach((r: any) => {
            const count = countMap.get(r.site_id) || 0;
            countMap.set(r.site_id, count + 1);
          });
          
          // Get site names
          const siteIds = Array.from(countMap.keys());
          const { data: sites } = await supabase
            .from('sites')
            .select('id, name')
            .in('id', siteIds);
          
          const siteNameMap = new Map(
            (sites || []).map((s: any) => [s.id, s.name])
          );
          
          return Array.from(countMap.entries()).map(([siteId, count]) => ({
            siteId,
            siteName: siteNameMap.get(siteId) as string | undefined,
            count
          }));
        },
        
        /**
         * Get record count for the entire agency
         */
        async countAll(): Promise<number> {
          const { count, error } = await (supabase as any)
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          return count || 0;
        },
        
        /**
         * Get recent records across all sites
         */
        async recentRecords<T = any>(
          limit = 10,
          orderBy = 'created_at'
        ): Promise<(T & { site: SiteInfo })[]> {
          const { data, error } = await (supabase as any)
            .from(fullTableName)
            .select(`*, site:sites(id, name)`)
            .eq('agency_id', context.agencyId)
            .order(orderBy, { ascending: false })
            .limit(limit);
          
          if (error) throw error;
          return (data || []) as (T & { site: SiteInfo })[];
        },
        
        /**
         * Search across all sites
         */
        async search<T = any>(
          searchColumn: string,
          searchTerm: string,
          columns = '*'
        ): Promise<T[]> {
          const { data, error } = await (supabase as any)
            .from(fullTableName)
            .select(columns)
            .eq('agency_id', context.agencyId)
            .ilike(searchColumn, `%${searchTerm}%`);
          
          if (error) throw error;
          return (data || []) as T[];
        }
      };
    },
    
    /**
     * Get all sites in agency
     */
    async getSites(): Promise<SiteInfo[]> {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('agency_id', context.agencyId)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        domain: undefined,
        createdAt: ''
      }));
    },
    
    /**
     * Get site by ID (with verification it belongs to agency)
     */
    async getSite(siteId: string): Promise<SiteInfo | null> {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('id', siteId)
        .eq('agency_id', context.agencyId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.name,
        domain: undefined,
        createdAt: ''
      };
    },
    
    /**
     * Get agency-wide module statistics
     */
    async getModuleStats(tableName: string): Promise<{
      totalRecords: number;
      recordsPerSite: SiteStats[];
      recentActivity: { date: string; count: number }[];
    }> {
      const fullTableName = getFullTableName(tableName);
      
      // Total count
      const { count: totalRecords } = await (supabase as any)
        .from(fullTableName)
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', context.agencyId);
      
      // Per-site stats (using the from().statsPerSite() method)
      const recordsPerSite = await this.from(tableName).statsPerSite();
      
      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentRecords } = await (supabase as any)
        .from(fullTableName)
        .select('created_at')
        .eq('agency_id', context.agencyId)
        .gte('created_at', sevenDaysAgo.toISOString());
      
      // Group by date
      const activityMap = new Map<string, number>();
      (recentRecords || []).forEach((r: any) => {
        const date = new Date(r.created_at).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });
      
      const recentActivity = Array.from(activityMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        totalRecords: totalRecords || 0,
        recordsPerSite,
        recentActivity
      };
    },
    
    /**
     * Get agency summary dashboard data
     */
    async getAgencySummary(): Promise<{
      totalSites: number;
      activeSites: number;
      totalUsers: number;
      recentActivity: number;
    }> {
      // Total sites
      const { count: totalSites } = await supabase
        .from('sites')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', context.agencyId);
      
      // Active sites (have content in last 30 days)
      // This would need to be implemented based on your activity tracking
      const activeSites = totalSites || 0;
      
      // Total users
      const { count: totalUsers } = await (supabase as any)
        .from('agency_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('agency_id', context.agencyId);
      
      return {
        totalSites: totalSites || 0,
        activeSites,
        totalUsers: totalUsers || 0,
        recentActivity: 0 // Would aggregate from activity logs
      };
    },
    
    /**
     * Compare data across sites
     */
    async compareSites(
      tableName: string,
      siteIds: string[]
    ): Promise<{ [siteId: string]: { count: number; latestRecord?: Date } }> {
      const fullTableName = getFullTableName(tableName);
      const comparison: { [siteId: string]: { count: number; latestRecord?: Date } } = {};
      
      for (const siteId of siteIds) {
        // Verify site belongs to agency
        const { data: site } = await supabase
          .from('sites')
          .select('id')
          .eq('id', siteId)
          .eq('agency_id', context.agencyId)
          .single();
        
        if (!site) continue;
        
        // Get count and latest
        const { count } = await (supabase as any)
          .from(fullTableName)
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId);
        
        const { data: latest } = await (supabase as any)
          .from(fullTableName)
          .select('created_at')
          .eq('site_id', siteId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        comparison[siteId] = {
          count: count || 0,
          latestRecord: latest ? new Date(latest.created_at) : undefined
        };
      }
      
      return comparison;
    },
    
    /**
     * Get context information
     */
    getContext() {
      return {
        agencyId: context.agencyId,
        role: context.role,
        userId: context.userId,
        tablePrefix
      };
    }
  };
}

/**
 * Type for agency data access client
 */
export type AgencyDataAccess = ReturnType<typeof createAgencyDataAccess>;
