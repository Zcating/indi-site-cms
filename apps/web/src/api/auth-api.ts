import { request, requestInternal } from './http';
import type { User } from './index';

export interface AuthApi {
  login: (email: string, password: string, serverRequest?: Request) => Promise<{ user: User } & { setCookie?: string }>;
  register: (email: string, password: string, name?: string, serverRequest?: Request) => Promise<{ user: User } & { setCookie?: string }>;
  logout: (serverRequest?: Request) => Promise<{ success: boolean } & { setCookie?: string }>;
  me: (serverRequest?: Request) => Promise<User>;
}

export const authApi: AuthApi = {
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
};
