import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
};

function metaString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Map a Supabase user to editable profile fields. */
export function profileFromUser(user: User): UserProfile {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    metaString(metadata, 'full_name') ||
    metaString(metadata, 'name') ||
    metaString(metadata, 'display_name');
  const avatarUrl =
    metaString(metadata, 'avatar_url') ||
    metaString(metadata, 'picture') ||
    null;

  return {
    id: user.id,
    email: user.email ?? null,
    fullName,
    phone: metaString(metadata, 'phone'),
    avatarUrl: avatarUrl || null,
  };
}

export type ProfileUpdates = {
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
};

/** Persist profile fields on the auth user (user_metadata). */
export async function updateUserProfile(updates: ProfileUpdates): Promise<UserProfile> {
  const payload: Record<string, string> = {
    full_name: updates.fullName.trim(),
    name: updates.fullName.trim(),
    phone: updates.phone.trim(),
  };
  if (updates.avatarUrl !== undefined) {
    if (updates.avatarUrl) {
      payload.avatar_url = updates.avatarUrl;
    } else {
      payload.avatar_url = '';
    }
  }

  const { data, error } = await supabase.auth.updateUser({ data: payload });
  if (error) throw error;
  if (!data.user) throw new Error('Profile update did not return a user.');
  return profileFromUser(data.user);
}

/**
 * Upload a local/picked image to the public `avatars` bucket and return a
 * cache-busted public URL. Requires the bucket + policies in supabase/avatars.sql.
 */
export async function uploadAvatarImage(
  userId: string,
  localUri: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  const ext = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read the selected image.');
  }
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
    upsert: true,
    contentType: mimeType,
    cacheControl: '3600',
  });

  if (uploadError) {
    if (/bucket|not found|row-level security/i.test(uploadError.message)) {
      throw new Error(
        'Avatar storage is not set up yet. Run supabase/avatars.sql in the Supabase SQL editor, then try again.',
      );
    }
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

/** Initials for the avatar placeholder. */
export function initialsFromName(name: string, email: string | null): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}
