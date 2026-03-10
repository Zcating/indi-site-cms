const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_BASE || "http://localhost:3001/api"
    : "/api";

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  serverRequest?: Request;
}

export async function requestInternal<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; response: Response }> {
  const { method = 'GET', body, headers = {}, serverRequest } = options;

  const mergedHeaders: Record<string, string> = {
    ...headers,
  };

  if (typeof window === 'undefined') {
    const cookie = serverRequest?.headers.get('cookie');
    if (cookie) {
      mergedHeaders.Cookie = cookie;
    }
  }

  if (body !== undefined && !(body instanceof FormData)) {
    mergedHeaders['Content-Type'] = mergedHeaders['Content-Type'] || 'application/json';
  }

  const config: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const rawBody = await response.text();
  const data = rawBody ? JSON.parse(rawBody) : {};

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return { data: data as T, response };
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestInternal<T>(endpoint, options);
  return data;
}
