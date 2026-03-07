const API_BASE = '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
    register: (email: string, password: string, name?: string) =>
      request<{ user: User }>('/auth/register', { method: 'POST', body: { email, password, name } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request<User>('/auth/me'),
  },
  users: {
    list: () => request<User[]>('/users'),
    get: (id: string) => request<User>(`/users/${id}`),
    create: (data: { email: string; password: string; name?: string; role?: string }) =>
      request<User>('/users', { method: 'POST', body: data }),
    update: (id: string, data: { email?: string; name?: string; role?: string; password?: string }) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },
  customers: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Customer[]; pagination: Pagination }>(`/customers${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Customer>(`/customers/${id}`),
    create: (data: { name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }) =>
      request<Customer>('/customers', { method: 'POST', body: data }),
    update: (id: string, data: { name?: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }) =>
      request<Customer>(`/customers/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE' }),
  },
  images: {
    list: (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.category) searchParams.set('category', params.category);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Image[]; pagination: Pagination }>(`/images${query ? `?${query}` : ''}`);
    },
    upload: async (file: File, metadata: { title?: string; alt?: string; category?: string; tags?: string[] }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.alt) formData.append('alt', metadata.alt);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));

      const response = await fetch(`${API_BASE}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      return data as Image;
    },
    delete: (id: string) => request<{ success: boolean }>(`/images/${id}`, { method: 'DELETE' }),
  },
  pages: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.status) searchParams.set('status', params.status);
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return request<{ data: Page[]; pagination: Pagination }>(`/pages${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Page>(`/pages/${id}`),
    getBySlug: (slug: string) => request<Page>(`/pages/slug/${slug}`),
    create: (data: { slug: string; title: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }) =>
      request<Page>('/pages', { method: 'POST', body: data }),
    update: (id: string, data: { slug?: string; title?: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }) =>
      request<Page>(`/pages/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE' }),
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
