import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { readRoleFromMetadata, type Role } from '@/lib/role';
import { supabase } from '@/lib/supabase';

export type SessionRole =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; role: Role | null };

/**
 * Current session role, synced with Supabase auth.
 * Role always comes from account metadata — never from the signup role store.
 */
export function useSessionRole(): SessionRole {
  const [state, setState] = useState<SessionRole>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    function apply(session: Session | null) {
      if (!active) return;
      setState(
        session
          ? { status: 'signed-in', role: readRoleFromMetadata(session.user?.user_metadata) }
          : { status: 'signed-out' },
      );
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
