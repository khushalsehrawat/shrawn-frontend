import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string; error?: string; errors?: Record<string, string> } | undefined;
    if (payload?.message) return payload.message;
    if (payload?.error) return payload.error;
    if (payload?.errors) return Object.values(payload.errors).filter(Boolean).join(', ');
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
