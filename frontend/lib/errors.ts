import { ApiError, getApiBaseUrl } from '@/lib/client';

/** Plain-language API errors for the UI. */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return `Cannot reach the warehouse API at ${getApiBaseUrl()}. Start the Spring Boot backend, then tap Retry.`;
    }
    if (error.status === 400) {
      return `Invalid request: ${error.body || 'check the pick list / start bin.'}`;
    }
    if (error.status === 404) {
      return 'That order or item was not found. Refresh the list and try again.';
    }
    return `Server error (${error.status}). ${error.body || 'Try again in a moment.'}`;
  }

  if (error instanceof Error) {
    if (/Could not reach the backend/i.test(error.message) || /Network request failed/i.test(error.message)) {
      return (
        `Backend offline or blocked. Expected API at ${getApiBaseUrl()}. ` +
        'Run the Spring Boot server on port 8080, then Retry. ' +
        'On a phone use your computer LAN IP instead of localhost.'
      );
    }
    return error.message;
  }

  return 'Something went wrong. Try again.';
}
