// one small fetch wrapper for the whole app. Customer and staff keep separate tokens.
export type Who = 'customer' | 'staff';
const KEYS: Record<Who, string> = { customer: 'rb_token', staff: 'rb_staff_token' };

export const tokens = {
  get: (who: Who) => localStorage.getItem(KEYS[who]),
  set: (who: Who, token: string) => localStorage.setItem(KEYS[who], token),
  clear: (who: Who) => localStorage.removeItem(KEYS[who]),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; who?: Who };

export async function api<T = unknown>(path: string, { method = 'GET', body, who = 'customer' }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokens.get(who);
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch('/api' + path, { method, headers, body: isForm ? body : body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the backend is running.');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && token) {
    tokens.clear(who);
    window.dispatchEvent(new CustomEvent('rb:logout', { detail: who }));
  }
  if (!res.ok) throw new ApiError(res.status, data?.message || 'Something went wrong. Please try again.');
  return data as T;
}

export const staffApi = <T = unknown>(path: string, opts: Omit<Options, 'who'> = {}) => api<T>(path, { ...opts, who: 'staff' });

export const query = (params: Record<string, string | number | boolean | undefined | null>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && v !== false && q.set(k, String(v)));
  const s = q.toString();
  return s ? '?' + s : '';
};
