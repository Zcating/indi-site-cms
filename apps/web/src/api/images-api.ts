import { request } from './http';
import type { Image, Pagination } from './index';

const API_BASE =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_BASE || "http://localhost:3001/api"
    : "/api";

export interface ImagesApi {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string }, serverRequest?: Request) => Promise<{ data: Image[]; pagination: Pagination }>;
  get: (id: string, serverRequest?: Request) => Promise<Image>;
  upload: (file: File, metadata: { title?: string; alt?: string; category?: string; tags?: string[] }, serverRequest?: Request) => Promise<Image>;
  delete: (id: string, serverRequest?: Request) => Promise<{ success: boolean }>;
}

export const imagesApi: ImagesApi = {
  list: (params, serverRequest) => {
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
};
