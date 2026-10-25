const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
    return null;
  }

  const data = (await res.json()) as { tokens: { accessToken: string; refreshToken: string } };
  localStorage.setItem('accessToken', data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.tokens.refreshToken);
  return data.tokens.accessToken;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = getAccessToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await attemptRefresh();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
    // No refresh token or refresh failed — clear stale session and redirect
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    window.location.href = '/login';
  }

  return res;
}
