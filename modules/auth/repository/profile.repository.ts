// Repository for the public.profiles table that mirrors auth.users metadata.
// The DB trigger `on_auth_user_change` keeps this table in sync automatically,
// but the client can also read/write it directly for richer profile fields.

import { supabase } from '@/lib/supabase/client';
import type { StoredUser } from '../storage/userStorage';

export interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export const profileRepository = {
  async getCurrent(): Promise<ProfileRow | null> {
    const { data: userData } = await supabase().auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return null;

    const { data, error } = await supabase()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[profileRepository.getCurrent]', error);
      return null;
    }
    return data as ProfileRow | null;
  },

  /**
   * Upsert the current user's profile. RLS guarantees they can only write
   * their own row (`auth.uid() = id`). Safe to call after a successful
   * verifyOtp() — by that point a session is active.
   */
  async upsertCurrent(patch: Partial<Omit<StoredUser, never>>): Promise<ProfileRow | null> {
    const { data: userData } = await supabase().auth.getUser();
    const user = userData.user;
    if (!user) {
      console.warn('[profileRepository.upsertCurrent] no active session — skipping upsert');
      return null;
    }

    const row = {
      id: user.id,
      first_name: patch.first_name ?? '',
      last_name:  patch.last_name  ?? '',
      email:      patch.email      ?? user.email ?? '',
      phone:      patch.phone      ?? user.phone ?? '',
      country:    patch.country    ?? '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase()
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[profileRepository.upsertCurrent]', error);
      return null;
    }
    return data as ProfileRow;
  },
};
