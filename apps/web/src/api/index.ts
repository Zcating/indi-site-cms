import { authApi, type AuthApi } from './auth-api';
import { usersApi, type UsersApi } from './users-api';
import { customersApi, type CustomersApi } from './customers-api';
import { productsApi, type ProductsApi } from './products-api';
import { imagesApi, type ImagesApi } from './images-api';
import { pagesApi, type PagesApi } from './pages-api';

export const api = {
  auth: authApi,
  users: usersApi,
  customers: customersApi,
  products: productsApi,
  images: imagesApi,
  pages: pagesApi,
};

export type Api = {
  auth: AuthApi;
  users: UsersApi;
  customers: CustomersApi;
  products: ProductsApi;
  images: ImagesApi;
  pages: PagesApi;
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
  absoluteUrl?: string;
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
  imageUrl?: string;
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
