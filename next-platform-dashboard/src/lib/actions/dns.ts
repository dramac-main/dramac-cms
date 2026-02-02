// src/lib/actions/dns.ts
// DNS Management Server Actions
// 
// NOTE: These actions use explicit type definitions since the domain tables 
// were created in DM-02 but TypeScript types haven't been regenerated yet.
// The database tables exist and these actions will work at runtime.

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { zoneService } from "@/lib/cloudflare/zones";
import { dnsService } from "@/lib/cloudflare/dns";
import { propagationService } from "@/lib/cloudflare/propagation";
import type { DnsRecordType, ExpectedDnsRecord } from "@/lib/cloudflare/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Database Row Types (matching DM-02 schema)
// These types match the database schema until types are regenerated
// ============================================================================

interface DomainRow {
  id: string;
  agency_id: string;
  client_id: string | null;
  site_id: string | null;
  domain_name: string;
  tld: string;
  sld: string;
  cloudflare_zone_id: string | null;
  nameservers: string[] | null;
  dns_configured: boolean;
  dns_verified_at: string | null;
  status: string;
}

interface DnsRecordRow {
  id: string;
  domain_id: string;
  record_type: string;
  name: string;
  content: string;
  ttl: number;
  priority: number | null;
  proxied: boolean;
  cloudflare_record_id: string | null;
  status: string;
  created_by: string | null;
}

// Helper to get untyped table access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTable(client: SupabaseClient<any>, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).from(table);
}

// ============================================================================
// Type Definitions
// ============================================================================

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ZoneCreationData {
  zoneId: string;
  nameservers: string[];
}

interface DnsSetupData {
  recordsCreated: number;
}

// ============================================================================
// Zone Actions
// ============================================================================

/**
 * Create Cloudflare zone for a domain
 */
export async function createCloudflareZone(
  domainId: string
): Promise<ActionResult<ZoneCreationData>> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  try {
    const { data: domain, error } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single() as { data: DomainRow | null; error: Error | null };
    
    if (error || !domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    if (domain.cloudflare_zone_id) {
      const activation = await zoneService.checkActivation(domain.cloudflare_zone_id);
      return { 
        success: true, 
        data: {
          zoneId: domain.cloudflare_zone_id,
          nameservers: activation.nameservers,
        }
      };
    }
    
    const zone = await zoneService.createZone({ name: domain.domain_name });
    
    await getTable(admin, 'cloudflare_zones')
      .insert({
        domain_id: domainId,
        zone_id: zone.id,
        name: zone.name,
        status: zone.status,
        assigned_nameservers: zone.nameServers,
        original_nameservers: zone.originalNameServers,
      });
    
    await getTable(admin, 'domains')
      .update({
        cloudflare_zone_id: zone.id,
        nameservers: zone.nameServers,
      })
      .eq('id', domainId);
    
    try {
      await zoneService.applySecurityDefaults(zone.id);
    } catch (securityError) {
      console.error('[DNS] Failed to apply security defaults:', securityError);
    }
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { 
      success: true, 
      data: {
        zoneId: zone.id,
        nameservers: zone.nameServers,
      }
    };
  } catch (error) {
    console.error('[DNS] Zone creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create DNS zone' 
    };
  }
}

/**
 * Delete Cloudflare zone for a domain
 */
export async function deleteCloudflareZone(
  domainId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'cloudflare_zone_id'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: true };
    }
    
    await zoneService.deleteZone(domain.cloudflare_zone_id);
    
    await getTable(admin, 'cloudflare_zones')
      .delete()
      .eq('domain_id', domainId);
    
    await getTable(admin, 'domain_dns_records')
      .delete()
      .eq('domain_id', domainId);
    
    await getTable(admin, 'domains')
      .update({
        cloudflare_zone_id: null,
        nameservers: [],
        dns_configured: false,
        dns_verified_at: null,
      })
      .eq('id', domainId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    
    return { success: true };
  } catch (error) {
    console.error('[DNS] Zone deletion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete DNS zone' 
    };
  }
}

/**
 * Check zone activation status
 * Returns expected nameservers from Cloudflare and actual current nameservers from DNS
 */
export async function checkZoneActivation(
  domainId: string
): Promise<ActionResult<{ 
  activated: boolean; 
  nameservers: string[];  // Expected (Cloudflare assigned)
  currentNameservers: string[]; // Actual (from DNS lookup)
}>> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('cloudflare_zone_id, domain_name')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'cloudflare_zone_id' | 'domain_name'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured' };
    }
    
    // Get expected nameservers from Cloudflare
    const status = await zoneService.checkActivation(domain.cloudflare_zone_id);
    
    // Get actual current nameservers from DNS lookup
    let currentNameservers: string[] = [];
    try {
      const nsStatus = await propagationService.checkNameserverPropagation(
        domain.domain_name,
        status.nameservers
      );
      currentNameservers = nsStatus.current;
    } catch {
      // If DNS lookup fails, return empty array
      currentNameservers = [];
    }
    
    return { 
      success: true, 
      data: {
        activated: status.activated,
        nameservers: status.nameservers,
        currentNameservers,
      }
    };
  } catch (error) {
    console.error('[DNS] Zone activation check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check zone activation' 
    };
  }
}

// ============================================================================
// DNS Record Actions
// ============================================================================

/**
 * Create a DNS record
 */
export async function createDnsRecord(
  domainId: string,
  record: {
    type: DnsRecordType;
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }
): Promise<ActionResult<{ recordId: string }>> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  try {
    const { data: domain, error } = await getTable(supabase, 'domains')
      .select('domain_name, cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'domain_name' | 'cloudflare_zone_id'> | null; error: Error | null };
    
    if (error || !domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    if (!domain.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured. Please set up DNS first.' };
    }
    
    const cfRecord = await dnsService.createRecord({
      zoneId: domain.cloudflare_zone_id,
      ...record,
    });
    
    const storageName = record.name === '@' 
      ? '@' 
      : record.name.replace(`.${domain.domain_name}`, '');
    
    const { data: dbRecord } = await getTable(admin, 'domain_dns_records')
      .insert({
        domain_id: domainId,
        record_type: record.type,
        name: storageName,
        content: record.content,
        ttl: record.ttl || 3600,
        priority: record.priority,
        proxied: record.proxied ?? true,
        cloudflare_record_id: cfRecord.id,
        status: 'active',
        created_by: 'user',
      })
      .select('id')
      .single() as { data: { id: string } | null };
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: { recordId: dbRecord?.id || cfRecord.id } };
  } catch (error) {
    console.error('[DNS] Record creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create DNS record' 
    };
  }
}

/**
 * Update a DNS record
 * Note: recordId is the Cloudflare record ID (from listDnsRecords)
 */
export async function updateDnsRecord(
  domainId: string,
  recordId: string,
  updates: {
    type: DnsRecordType;
    name: string;
    content: string;
    ttl?: number;
    priority?: number;
    proxied?: boolean;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'cloudflare_zone_id'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not found or DNS zone not configured' };
    }
    
    // recordId IS the Cloudflare record ID (from listDnsRecords which fetches from CF)
    await dnsService.updateRecord({
      zoneId: domain.cloudflare_zone_id,
      recordId: recordId,
      ...updates,
    });
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true };
  } catch (error) {
    console.error('[DNS] Record update error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update DNS record' 
    };
  }
}

/**
 * Delete a DNS record
 * Note: recordId is the Cloudflare record ID (from listDnsRecords)
 */
export async function deleteDnsRecord(
  domainId: string, 
  recordId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'cloudflare_zone_id'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'Domain not found or DNS zone not configured' };
    }
    
    // recordId IS the Cloudflare record ID (from listDnsRecords which fetches from CF)
    await dnsService.deleteRecord(domain.cloudflare_zone_id, recordId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true };
  } catch (error) {
    console.error('[DNS] Record deletion error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete DNS record' 
    };
  }
}

/**
 * List DNS records for a domain
 * Fetches directly from Cloudflare for accurate real-time data
 */
export async function listDnsRecords(
  domainId: string
): Promise<ActionResult<Array<{
  id: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number;
  proxied: boolean;
  proxiable: boolean;
  status: string;
}>>> {
  const supabase = await createClient();
  
  try {
    // Get domain with zone ID
    const { data: domain, error } = await getTable(supabase, 'domains')
      .select('domain_name, cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'domain_name' | 'cloudflare_zone_id'> | null; error: Error | null };
    
    if (error || !domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    if (!domain.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured. Click "Sync" to set up DNS.' };
    }
    
    // Fetch directly from Cloudflare for real-time accuracy
    const { records } = await dnsService.listRecords(domain.cloudflare_zone_id);
    
    return { 
      success: true, 
      data: records.map(r => ({
        id: r.id,
        type: r.type as DnsRecordType,
        name: r.name,
        content: r.content,
        ttl: r.ttl,
        priority: r.priority,
        proxied: r.proxied,
        proxiable: r.proxiable,
        status: 'active',
      }))
    };
  } catch (error) {
    console.error('[DNS] List records error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to list DNS records' 
    };
  }
}

// ============================================================================
// Template Actions
// ============================================================================

/**
 * Setup site DNS (A record + www CNAME)
 */
export async function setupSiteDns(
  domainId: string, 
  siteId?: string
): Promise<ActionResult<DnsSetupData>> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single() as { data: DomainRow | null };
    
    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    let zoneId = domain.cloudflare_zone_id;
    
    // Create zone if needed
    if (!zoneId) {
      const zoneResult = await createCloudflareZone(domainId);
      if (!zoneResult.success || !zoneResult.data) {
        return { success: false, error: zoneResult.error || 'Failed to create DNS zone' };
      }
      zoneId = zoneResult.data.zoneId;
    }
    
    // Apply site template - this creates records directly in Cloudflare
    const records = await dnsService.applySiteTemplate(zoneId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: { recordsCreated: records.length } };
  } catch (error) {
    console.error('[DNS] Site setup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to setup site DNS' 
    };
  }
}

/**
 * Setup email DNS (MX, SPF, DKIM, DMARC)
 */
export async function setupEmailDns(
  domainId: string, 
  provider: 'titan' | 'google' = 'titan',
  options?: { dkimValue?: string }
): Promise<ActionResult<DnsSetupData>> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('*')
      .eq('id', domainId)
      .single() as { data: DomainRow | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured' };
    }
    
    let records;
    if (provider === 'titan') {
      records = await dnsService.applyTitanEmailTemplate(
        domain.cloudflare_zone_id,
        options?.dkimValue
      );
    } else if (provider === 'google') {
      records = await dnsService.applyGoogleWorkspaceTemplate(domain.cloudflare_zone_id);
    } else {
      return { success: false, error: 'Unsupported email provider' };
    }
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { success: true, data: { recordsCreated: records.length } };
  } catch (error) {
    console.error('[DNS] Email setup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to setup email DNS' 
    };
  }
}

/**
 * Add domain verification record
 */
export async function addVerificationRecord(
  domainId: string,
  token: string
): Promise<ActionResult<{ recordId: string }>> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'cloudflare_zone_id'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured' };
    }
    
    const record = await dnsService.addVerificationRecord(
      domain.cloudflare_zone_id,
      token
    );
    
    return { success: true, data: { recordId: record.id } };
  } catch (error) {
    console.error('[DNS] Verification record error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add verification record' 
    };
  }
}

// ============================================================================
// Propagation Actions
// ============================================================================

/**
 * Check DNS propagation for domain records
 */
export async function checkDnsPropagation(
  domainId: string
): Promise<ActionResult<{
  allPropagated: boolean;
  records: Array<{
    type: string;
    name: string;
    expected: string;
    propagated: boolean;
  }>;
}>> {
  const supabase = await createClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('domain_name')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'domain_name'> | null };
    
    if (!domain) {
      return { success: false, error: 'Domain not found' };
    }
    
    const { data: dbRecords } = await getTable(supabase, 'domain_dns_records')
      .select('record_type, name, content, status')
      .eq('domain_id', domainId)
      .eq('status', 'active') as { data: Pick<DnsRecordRow, 'record_type' | 'name' | 'content' | 'status'>[] | null };
    
    if (!dbRecords?.length) {
      return { 
        success: true, 
        data: { allPropagated: true, records: [] } 
      };
    }
    
    const expectedRecords: ExpectedDnsRecord[] = dbRecords.map(r => ({
      type: r.record_type as DnsRecordType,
      name: r.name,
      content: r.content,
    }));
    
    const status = await propagationService.checkPropagation(
      domain.domain_name,
      expectedRecords
    );
    
    return { 
      success: true, 
      data: {
        allPropagated: status.allPropagated,
        records: status.records.map(r => ({
          type: r.type,
          name: r.name,
          expected: r.expected,
          propagated: r.propagated,
        })),
      }
    };
  } catch (error) {
    console.error('[DNS] Propagation check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check propagation' 
    };
  }
}

/**
 * Check nameserver propagation
 */
export async function checkNameserverPropagation(
  domainId: string
): Promise<ActionResult<{
  propagated: boolean;
  current: string[];
  expected: string[];
}>> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('domain_name, nameservers')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'domain_name' | 'nameservers'> | null };
    
    if (!domain || !domain.nameservers?.length) {
      return { success: false, error: 'Domain or nameservers not found' };
    }
    
    const status = await propagationService.checkNameserverPropagation(
      domain.domain_name,
      domain.nameservers
    );
    
    if (status.propagated) {
      await getTable(admin, 'domains')
        .update({ dns_verified_at: new Date().toISOString() })
        .eq('id', domainId);
    }
    
    return { success: true, data: status };
  } catch (error) {
    console.error('[DNS] NS propagation check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check nameserver propagation' 
    };
  }
}

// ============================================================================
// Sync Actions
// ============================================================================

/**
 * Sync DNS records from Cloudflare to database
 */
export async function syncDnsRecords(
  domainId: string
): Promise<ActionResult<{ synced: number; added: number; removed: number }>> {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  try {
    const { data: domain } = await getTable(supabase, 'domains')
      .select('domain_name, cloudflare_zone_id')
      .eq('id', domainId)
      .single() as { data: Pick<DomainRow, 'domain_name' | 'cloudflare_zone_id'> | null };
    
    if (!domain?.cloudflare_zone_id) {
      return { success: false, error: 'DNS zone not configured' };
    }
    
    // Get records from Cloudflare
    const { records: cfRecords } = await dnsService.listRecords(domain.cloudflare_zone_id);
    
    // Get existing database records
    const { data: dbRecords } = await getTable(supabase, 'domain_dns_records')
      .select('id, cloudflare_record_id')
      .eq('domain_id', domainId) as { data: { id: string; cloudflare_record_id: string | null }[] | null };
    
    const dbRecordIds = new Set((dbRecords || []).map(r => r.cloudflare_record_id).filter(Boolean));
    const cfRecordIds = new Set(cfRecords.map(r => r.id));
    
    let added = 0;
    let removed = 0;
    
    // Add new records from Cloudflare
    for (const cfRecord of cfRecords) {
      if (!dbRecordIds.has(cfRecord.id)) {
        const storageName = cfRecord.name
          .replace(`.${domain.domain_name}`, '')
          .replace(domain.domain_name, '@');
        
        await getTable(admin, 'domain_dns_records')
          .insert({
            domain_id: domainId,
            record_type: cfRecord.type,
            name: storageName,
            content: cfRecord.content,
            ttl: cfRecord.ttl,
            priority: cfRecord.priority,
            proxied: cfRecord.proxied,
            cloudflare_record_id: cfRecord.id,
            status: 'active',
            created_by: 'sync',
            last_synced_at: new Date().toISOString(),
          });
        added++;
      }
    }
    
    // Remove records that no longer exist in Cloudflare
    for (const dbRecord of dbRecords || []) {
      if (dbRecord.cloudflare_record_id && !cfRecordIds.has(dbRecord.cloudflare_record_id)) {
        await getTable(admin, 'domain_dns_records')
          .delete()
          .eq('id', dbRecord.id);
        removed++;
      }
    }
    
    // Update sync timestamp
    await getTable(admin, 'cloudflare_zones')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('domain_id', domainId);
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath(`/dashboard/domains/${domainId}/dns`);
    
    return { 
      success: true, 
      data: { 
        synced: cfRecords.length,
        added,
        removed,
      }
    };
  } catch (error) {
    console.error('[DNS] Sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to sync DNS records' 
    };
  }
}
