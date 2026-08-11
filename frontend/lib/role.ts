import type { Href } from 'expo-router';

/**
 * Account roles stored in Supabase user_metadata.role at account creation.
 *
 * Pickers self-register. Admins are created only via /admin/invite (invite code)
 * or the Supabase dashboard — never through the public signup flow.
 */
export type Role = 'picker' | 'admin';

export function readRoleFromMetadata(metadata: unknown): Role | null {
  if (typeof metadata !== 'object' || metadata === null) return null;
  const value = (metadata as Record<string, unknown>).role;
  return value === 'admin' || value === 'picker' ? value : null;
}

/** Where a successful sign-in should land. */
export function landingRouteForRole(role: Role | null): Href {
  return role === 'admin' ? '/(admin)/dashboard' : '/(picker)/home';
}
