import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Workaround for Supabase Navigator Locks API deadlock issue
 * 
 * The GoTrueClient uses navigator.locks which can cause deadlocks
 * in production, especially on mobile browsers and after app resume.
 * 
 * @see https://github.com/supabase/supabase-js/issues/1594
 * @see https://github.com/supabase/supabase-js/pull/1962
 * 
 * This noOpLock skips the lock mechanism entirely. Potential trade-offs:
 * - Multiple tabs may refresh tokens simultaneously (minor redundancy)
 * - Rare race conditions in session state (recoverable by re-login)
 * 
 * These trade-offs are preferable to complete auth system deadlock.
 */
const noOpLock = async <T>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return await fn();
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use noOpLock to prevent Navigator Locks API deadlocks
        // This is a known Supabase issue (#1594) that causes
        // "AbortError: signal is aborted without reason" errors
        lock: noOpLock,
      },
    }
  );
}
