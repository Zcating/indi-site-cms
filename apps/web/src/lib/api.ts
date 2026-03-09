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

async function requestInternal<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; response: Response }> {
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

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestInternal<T>(endpoint, options);
  return data;
}

export const api = {
  auth: {
    login: async (email: string, password: string, serverRequest?: Request) => {
      const { data, response } = await requestInternal<{ user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        serverRequest,
      });
      return { ...data, setCookie: response.headers.get('set-cookie') || undefined };
    },
    register: async (email: string, password: string, name?: string, serverRequest?: Request) => {
      const { data, response } = await requestInternal<{ user: User }>('/auth/register', {
        method: 'POST',
        body: { email, password, name },
        serverRequest,
      });
      return { ...data, setCookie: response.headers.get('set-cookie') || undefined };
    },
    logout: async (serverRequest?: Request) => {
      const { data, response } = await requestInternal<{ success: boolean }>('/auth/logout', {
        method: 'POST',
        serverRequest,
      });
      return { ...data, setCookie: response.headers.get('set-cookie') || undefined };
    },
    me: (serverRequest?: Request) => request<User>('/auth/me', { serverRequest }),
  },
  users: {
    list: (serverRequest?: Request) => request<User[]>('/users', { serverRequest }),
    get: (id: string, serverRequest?: Request) => request<User>(`/users/${id}`, { serverRequest }),
    create: (data: { email: string; password: string; name?: string; role?: string }, serverRequest?: Request) =>
      request<User>('/users', { method: 'POST', body: data, serverRequest }),
    update: (id: string, data: { email?: string; name?: string; role?: string; password?: string }, serverRequest?: Request) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: data, serverRequest }),
    delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE', serverRequest }),
  },
  customers: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Customer[]; pagination: Pagination }>(`/customers${query ? `?${query}` : ''}`, { serverRequest });
    },
    get: (id: string, serverRequest?: Request) => request<Customer>(`/customers/${id}`, { serverRequest }),
    create: (data: { name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }, serverRequest?: Request) =>
      request<Customer>('/customers', { method: 'POST', body: data, serverRequest }),
    update: (id: string, data: { name?: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }, serverRequest?: Request) =>
      request<Customer>(`/customers/${id}`, { method: 'PUT', body: data, serverRequest }),
    delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE', serverRequest }),
  },
  products: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Product[]; pagination: Pagination }>(`/products${query ? `?${query}` : ''}`, { serverRequest });
    },
    get: (id: string, serverRequest?: Request) => request<Product>(`/products/${id}`, { serverRequest }),
    create: (data: { name: string; slug?: string; description?: string; imageIds?: string[]; status?: string }, serverRequest?: Request) =>
      request<Product>('/products', { method: 'POST', body: data, serverRequest }),
    update: (id: string, data: { name?: string; slug?: string; description?: string; imageIds?: string[]; status?: string }, serverRequest?: Request) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: data, serverRequest }),
    delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE', serverRequest }),
  },
  images: {
    list: (params?: { page?: number; limit?: number; category?: string; search?: string }, serverRequest?: Request) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Image[]; pagination: Pagination }>(`/images${query ? `?${query}` : ''}`, { serverRequest });
    },
    get: (id: string, serverRequest?: Request) => request<Image>(`/images/${id}`, { serverRequest }),
    upload: async (file: File, metadata: { title?: string; alt?: string; category?: string; tags?: string[] }, serverRequest?: Request) => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.alt) formData.append('alt', metadata.alt);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

      const response = await fetch(`${API_BASE}/images`, {
        method: 'POST',
        body: formData,
        headers:
          typeof window === 'undefined' && serverRequest?.headers.get('cookie')
            ? { Cookie: serverRequest.headers.get('cookie')! }
            : undefined,
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      return data as Image;
    },
    delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/images/${id}`, { method: 'DELETE', serverRequest }),
  },
  pages: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Page[]; pagination: Pagination }>(`/pages${query ? `?${query}` : ''}`, { serverRequest });
    },
    get: (id: string, serverRequest?: Request) => request<Page>(`/pages/${id}`, { serverRequest }),
    getBySlug: (slug: string, serverRequest?: Request) => request<Page>(`/pages/slug/${slug}`, { serverRequest }),
    create: (data: { slug: string; title: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }, serverRequest?: Request) =>
      request<Page>('/pages', { method: 'POST', body: data, serverRequest }),
    update: (id: string, data: { slug?: string; title?: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }, serverRequest?: Request) =>
      request<Page>(`/pages/${id}`, { method: 'PUT', body: data, serverRequest }),
    delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE', serverRequest }),
  },
};

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  title: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images?: Image[];
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
