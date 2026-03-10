import { request } from './http';
import type { Page, Pagination } from './index';

export interface PagesApi {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }, serverRequest?: Request) => Promise<Pagination<Page>>;
  get: (id: string, serverRequest?: Request) => Promise<Page>;
  getBySlug: (slug: string, serverRequest?: Request) => Promise<Page>;
  create: (data: { slug: string; title: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }, serverRequest?: Request) => Promise<Page>;
  update: (id: string, data: { slug?: string; title?: string; content?: string; metaTitle?: string; metaDescription?: string; status?: string }, serverRequest?: Request) => Promise<Page>;
  delete: (id: string, serverRequest?: Request) => Promise<{ success: boolean }>;
}

export const pagesApi: PagesApi = {
  list: (params, serverRequest) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request<Pagination<Page>>(`/pages${query ? `?${query}` : ''}`, { serverRequest });
  },
  get: (id: string, serverRequest?: Request) => request<Page>(`/pages/${id}`, { serverRequest }),
  getBySlug: (slug: string, serverRequest?: Request) => request<Page>(`/pages/slug/${slug}`, { serverRequest }),
  create: (data, serverRequest?: Request) => request<Page>('/pages', { method: 'POST', body: data, serverRequest }),
  update: (id, data, serverRequest?: Request) => request<Page>(`/pages/${id}`, { method: 'PUT', body: data, serverRequest }),
  delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/pages/${id}`, { method: 'DELETE', serverRequest }),
};
