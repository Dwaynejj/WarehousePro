import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { profileFromUser, type UserProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

type ProfileState =
  | { status: 'loading'; profile: null; user: null }
  | { status: 'signed-out'; profile: null; user: null }
  | { status: 'ready'; profile: UserProfile; user: User };

/**
 * Current auth user + editable profile fields, synced with Supabase.
 */
export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    status: 'loading',
    profile: null,
    user: null,
  });

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      setState({ status: 'signed-out', profile: null, user: null });
      return;
    }
    setState({
      status: 'ready',
      profile: profileFromUser(data.user),
      user: data.user,
    });
  }, []);

  useEffect(() => {
    let active = true;

    void refresh().then(() => {
      if (!active) return;
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setState({ status: 'signed-out', profile: null, user: null });
        return;
      }
      setState({
        status: 'ready',
        profile: profileFromUser(session.user),
        user: session.user,
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { ...state, refresh };
}
