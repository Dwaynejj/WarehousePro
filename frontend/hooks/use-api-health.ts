import { useCallback, useEffect, useState } from 'react';

import { getApiBaseUrl } from '@/lib/client';

export type ApiHealth =
  | { status: 'checking' }
  | { status: 'online'; baseUrl: string }
  | { status: 'offline'; baseUrl: string; detail: string };

/**
 * Lightweight ping so screens can show "API connected" vs "start the backend".
 */
export function useApiHealth(pollMs = 15000): ApiHealth & { refresh: () => void } {
  const [health, setHealth] = useState<ApiHealth>({ status: 'checking' });

  const refresh = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    setHealth({ status: 'checking' });
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        setHealth({
          status: 'offline',
          baseUrl,
          detail: `API answered ${response.status}.`,
        });
        return;
      }
      setHealth({ status: 'online', baseUrl });
    } catch {
      setHealth({
        status: 'offline',
        baseUrl,
        detail: 'No response from the API (it may be waking up — wait ~30s and Retry).',
      });
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { ...health, refresh };
}
