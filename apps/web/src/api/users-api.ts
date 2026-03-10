import { request } from './http';
import type { User } from './index';

export interface UsersApi {
  list: (serverRequest?: Request) => Promise<User[]>;
  get: (id: string, serverRequest?: Request) => Promise<User>;
  create: (data: { email: string; password: string; name?: string; role?: string }, serverRequest?: Request) => Promise<User>;
  update: (id: string, data: { email?: string; name?: string; role?: string; password?: string }, serverRequest?: Request) => Promise<User>;
  delete: (id: string, serverRequest?: Request) => Promise<{ success: boolean }>;
}

export const usersApi: UsersApi = {
  list: (serverRequest?: Request) => request<User[]>('/users', { serverRequest }),
  get: (id: string, serverRequest?: Request) => request<User>(`/users/${id}`, { serverRequest }),
  create: (data, serverRequest?: Request) => request<User>('/users', { method: 'POST', body: data, serverRequest }),
  update: (id, data, serverRequest?: Request) => request<User>(`/users/${id}`, { method: 'PUT', body: data, serverRequest }),
  delete: (id: string, serverRequest?: Request) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE', serverRequest }),
};
