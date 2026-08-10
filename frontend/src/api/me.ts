import { env } from '../env';

export interface MeResponse {
  sub: string;
}

/**
 * Calls GET /me with a Bearer token.
 * Returns the authenticated user profile from the backend.
 */
export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${env.VITE_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`/me returned ${response.status}`);
  }

  return response.json() as Promise<MeResponse>;
}
