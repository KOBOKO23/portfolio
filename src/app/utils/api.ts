/**
 * app/utils/api.ts
 * ────────────────
 * Typed HTTP client for the Django REST backend.
 *
 * All responses follow the backend's standard envelope:
 *   { success: boolean, data: T | null, error: APIError | null }
 *
 * Usage:
 *   import { get, post, API_ENDPOINTS } from '@/app/utils/api';
 *
 *   const result = await get<Article[]>(API_ENDPOINTS.BLOG_ARTICLES);
 *   if (result.success) { ... result.data ... }
 *
 * Features:
 *   - 30-second AbortController timeout on every request
 *   - apiRequestWithRetry() with exponential backoff (skips retries on 4xx)
 *   - getCached() — 5-minute in-memory cache keyed by endpoint URL
 *   - clearCache() — invalidate one endpoint or the entire cache
 *   - uploadFile() — XHR-based file upload with progress callback
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 30000; // 30 seconds

export interface APIError {
  message: string;
  status?: number;
  details?: any;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}

/**
 * Custom fetch wrapper with timeout and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));

      return {
        success: false,
        error: {
          message: errorData.message || 'An error occurred',
          status: response.status,
          details: errorData.details,
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('API Request Error:', error);

    return {
      success: false,
      error: {
        message: error.message || 'Network error occurred',
        details: error,
      },
    };
  }
}

/**
 * Retry logic for failed requests
 */
export async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<APIResponse<T>> {
  let lastError: APIError | undefined;

  for (let i = 0; i < maxRetries; i++) {
    const response = await apiRequest<T>(endpoint, options);

    if (response.success) {
      return response;
    }

    lastError = response.error;

    // Don't retry on client errors (4xx)
    if (lastError?.status && lastError.status >= 400 && lastError.status < 500) {
      break;
    }

    // Wait before retrying (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

/**
 * GET request
 */
export async function get<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETE request
 */
export async function del<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    ...options,
  });
}

/**
 * Upload file with progress
 */
export async function uploadFile(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<APIResponse<any>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: true, data });
        } catch {
          resolve({ success: true, data: xhr.responseText });
        }
      } else {
        resolve({
          success: false,
          error: {
            message: 'Upload failed',
            status: xhr.status,
          },
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: {
          message: 'Upload error occurred',
        },
      });
    });

    xhr.open('POST', `${API_BASE_URL}${endpoint}`);
    xhr.send(formData);
  });
}

/**
 * Cache for API responses
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET request with caching
 */
export async function getCached<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheDuration: number = CACHE_DURATION
): Promise<APIResponse<T>> {
  const cached = cache.get(endpoint);

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return { success: true, data: cached.data };
  }

  const response = await get<T>(endpoint, options);

  if (response.success && response.data) {
    cache.set(endpoint, {
      data: response.data,
      timestamp: Date.now(),
    });
  }

  return response;
}

/**
 * Clear cache
 */
export function clearCache(endpoint?: string): void {
  if (endpoint) {
    cache.delete(endpoint);
  } else {
    cache.clear();
  }
}

/**
 * API endpoints constants
 */
export const API_ENDPOINTS = {
  // Blog
  BLOG_CATEGORIES: '/blog/categories/',
  BLOG_ARTICLES: '/blog/articles/',
  BLOG_ARTICLE_DETAIL: (slug: string) => `/blog/articles/${slug}/`,

  // Projects
  PROJECT_CATEGORIES: '/projects/categories/',
  PROJECTS: '/projects/',
  PROJECT_DETAIL: (slug: string) => `/projects/${slug}/`,

  // Fashion
  FASHION_CATEGORIES: '/fashion/categories/',
  FASHION_IMAGES: '/fashion/images/',

  // Music
  MUSIC_TRACKS: '/music/tracks/',

  // Book
  BOOKS: '/books/',
  BOOK_TESTIMONIALS: (bookId: number) => `/books/${bookId}/testimonials/`,

  // Great Men Moves
  GMM_PROGRAMS: '/great-men-moves/programs/',
  GMM_IMPACT_GOALS: '/great-men-moves/impact-goals/',
  GMM_VOLUNTEER: '/great-men-moves/volunteer/',

  // Newsletter
  NEWSLETTER_SUBSCRIBE: '/newsletter/subscribe/',
  NEWSLETTER_ISSUES: '/newsletter/issues/',

  // Feedback
  FEEDBACK_SUBMIT: '/feedback/',

  // Contact
  CONTACT_SUBMIT: '/contact/',

  // Profile
  PROFILE: '/profile/',
  SKILLS: '/skills/',
};
