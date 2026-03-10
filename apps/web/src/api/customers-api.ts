import { request } from './http';
import type { Customer, Pagination } from './index';

export interface CustomersApi {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => Promise<Pagination<Customer>>;
  get: (id: string, serverRequest?: Request) => Promise<Customer>;
  create: (data: { name: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }, serverRequest?: Request) => Promise<Customer>;
  update: (id: string, data: { name?: string; email?: string; phone?: string; company?: string; address?: string; notes?: string; status?: string }, serverRequest?: Request) => Promise<Customer>;
  delete: (id: string, serverRequest?: Request) => Promise<{ success: boolean }>;
}

export const customersApi: CustomersApi = {
  list: (params, serverRequest) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request<Pagination<Customer>>(`/customers${query ? `?${query}` : ''}`, { serverRequest });
  },
  get: (id: string, serverRequest?: Request) => request<Customer>(`/customers/${id}`, { serverRequest }),
  create: (data, serverRequest?: Request) => request<Customer>('/customers', { method: 'POST', body: data, serverRequest }),
  update: (id, data, serverRequest?: Request) => request<Customer>(`/customers/${id}`, { method: 'PUT', body: data, serverRequest }),
  delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/customers/${id}`, { method: 'DELETE', serverRequest }),
};
