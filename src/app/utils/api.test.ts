import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get, post, getCached, clearCache, API_ENDPOINTS } from './api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockError(status: number, body: unknown = { message: 'Error' }) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  clearCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('get()', () => {
  it('returns success response on 200', async () => {
    mockFetch.mockReturnValueOnce(mockOk({ success: true, data: { id: 1 } }));

    const result = await get('/test/');
    expect(result.success).toBe(true);
    expect((result.data as any).success).toBe(true);
  });

  it('returns error response on 4xx', async () => {
    mockFetch.mockReturnValueOnce(mockError(404, { message: 'Not found' }));

    const result = await get('/missing/');
    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(404);
    expect(result.error?.message).toBe('Not found');
  });

  it('returns error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await get('/broken/');
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Network error');
  });
});

describe('post()', () => {
  it('sends JSON body and returns success', async () => {
    const payload = { name: 'Philip', email: 'p@koboko.dev' };
    mockFetch.mockReturnValueOnce(mockOk({ success: true, data: {} }));

    const result = await post('/contact/', payload);
    expect(result.success).toBe(true);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('returns validation errors on 400', async () => {
    mockFetch.mockReturnValueOnce(mockError(400, { message: 'Invalid data', details: { email: ['Required'] } }));

    const result = await post('/contact/', {});
    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(400);
  });
});

describe('getCached()', () => {
  it('caches the result and returns it on second call', async () => {
    mockFetch.mockReturnValue(mockOk({ success: true, data: [1, 2, 3] }));

    await getCached('/blog/articles/');
    await getCached('/blog/articles/');

    // fetch should only be called once — second call is served from cache
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after cache expires', async () => {
    vi.useFakeTimers();
    mockFetch.mockReturnValue(mockOk({ success: true, data: [] }));

    await getCached('/projects/', {}, 1000); // 1 second cache
    vi.advanceTimersByTime(1500);            // expire the cache
    await getCached('/projects/', {}, 1000);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('clearCache() removes specific entry', async () => {
    mockFetch.mockReturnValue(mockOk({ success: true, data: [] }));

    await getCached('/skills/');
    clearCache('/skills/');
    await getCached('/skills/');

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('clearCache() with no argument clears everything', async () => {
    mockFetch.mockReturnValue(mockOk({ success: true, data: [] }));

    await getCached('/a/');
    await getCached('/b/');
    clearCache();
    await getCached('/a/');
    await getCached('/b/');

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});

describe('API_ENDPOINTS constants', () => {
  it('provides static path strings', () => {
    expect(API_ENDPOINTS.BLOG_ARTICLES).toBe('/blog/articles/');
    expect(API_ENDPOINTS.CONTACT_SUBMIT).toBe('/contact/');
    expect(API_ENDPOINTS.NEWSLETTER_SUBSCRIBE).toBe('/newsletter/subscribe/');
  });

  it('provides dynamic path builder functions', () => {
    expect(API_ENDPOINTS.BLOG_ARTICLE_DETAIL('my-post')).toBe('/blog/articles/my-post/');
    expect(API_ENDPOINTS.PROJECT_DETAIL('nwp-system')).toBe('/projects/nwp-system/');
  });
});
