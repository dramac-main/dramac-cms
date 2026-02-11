/**
 * Live Chat Module — Database Record Mapping
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
 * Does not recurse into JSON columns — they are already the correct shape.
 */
export function mapRecord<T>(record: Record<string, unknown>): T {
  if (!record || typeof record !== 'object') return record as T

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(record)) {
    const camelKey = snakeToCamel(key)
    result[camelKey] = value
  }

  return result as T
}

/**
 * Convert an array of snake_case DB records to camelCase
 */
export function mapRecords<T>(records: Record<string, unknown>[]): T[] {
  if (!records || !Array.isArray(records)) return []
  return records.map((r) => mapRecord<T>(r))
}

/**
 * Convert a camelCase object to snake_case for DB writes.
 * Use when inserting or updating records.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function toDbRecord(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    result[snakeKey] = value
  }

  return result
}
