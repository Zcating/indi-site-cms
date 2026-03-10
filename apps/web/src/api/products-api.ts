import { request } from './http';
import type { Product, Pagination } from './index';

export interface ProductsApi {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => Promise<{ data: Product[]; pagination: Pagination }>;
  get: (id: string, serverRequest?: Request) => Promise<Product>;
  create: (data: { name: string; slug?: string; description?: string; imageUrl?: string; status?: string }, serverRequest?: Request) => Promise<Product>;
  update: (id: string, data: { name?: string; slug?: string; description?: string; imageUrl?: string; status?: string }, serverRequest?: Request) => Promise<Product>;
  delete: (id: string, serverRequest?: Request) => Promise<{ success: boolean }>;
}

export const productsApi: ProductsApi = {
  list: (params, serverRequest) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request<{ data: Product[]; pagination: Pagination }>(`/products${query ? `?${query}` : ''}`, { serverRequest });
  },
  get: (id: string, serverRequest?: Request) => request<Product>(`/products/${id}`, { serverRequest }),
  create: (data, serverRequest?: Request) => request<Product>('/products', { method: 'POST', body: data, serverRequest }),
  update: (id, data, serverRequest?: Request) => request<Product>(`/products/${id}`, { method: 'PUT', body: data, serverRequest }),
  delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE', serverRequest }),
};
