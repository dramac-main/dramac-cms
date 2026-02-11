/**
 * Social Media Module - Database Record Mapping
 * 
 * Converts snake_case Supabase rows to camelCase TypeScript interfaces.
 * Supabase returns snake_case column names, but our types use camelCase.
 */

/**
 * Generic snake_case to camelCase key converter
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert a snake_case DB record to camelCase.
 * Handles nested objects and arrays.
 */
export function mapRecord<T>(record: Record<string, unknown>): T {
  if (!record || typeof record !== 'object') return record as T
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(record)) {
    const camelKey = snakeToCamel(key)
    // Don't recurse into arrays/objects that are JSON columns — they're already the right shape
    result[camelKey] = value
  }
  
  return result as T
}

/**
 * Convert an array of snake_case DB records to camelCase
 */
export function mapRecords<T>(records: Record<string, unknown>[]): T[] {
  if (!records || !Array.isArray(records)) return []
  return records.map(r => mapRecord<T>(r))
}
