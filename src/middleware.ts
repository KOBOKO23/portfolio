// Vercel Edge Middleware — dynamic rendering for crawlers/link-unfurlers.
//
// This is a plain Vite SPA (react-helmet-async only updates <head> after React
// mounts), so any client that doesn't execute JavaScript — social link-unfurlers
// (Facebook, Twitter/X, Slack, WhatsApp, LinkedIn, Telegram, Discord...) and some
// crawlers — only ever sees the generic static tags in index.html, never the
// real per-page title/description/image.
//
// For the three content routes that matter most for sharing (article, project,
// and the book page), known bot User-Agents are transparently proxied to a
// small Django-rendered HTML endpoint with correct OG/Twitter/JSON-LD tags
// (see backend/apps/core/views_meta.py). Everyone else — i.e. every real
// visitor — gets the exact same SPA as before; this file changes nothing for
// them. On any failure (Django unreachable, unknown slug → 404) this fails
// open to the normal SPA rather than showing a broken page.
//
// Framework-agnostic Vercel Edge Middleware (this project has no `next`
// dependency, so plain Web Request/Response — not next/server — is used).

export const config = {
  // Broad path match; exact shape is validated inside the function so this
  // doesn't depend on how the Vercel matcher handles dynamic segments.
  matcher: ['/blog/:path*', '/projects/:path*', '/book'],
};

const BOT_UA_PATTERN =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Googlebot|bingbot|Discordbot|redditbot|Pinterest|SkypeUriPreview|vkShare|Applebot|W3C_Validator/i;

const BACKEND_ORIGIN = 'https://api.koboko.co.ke';

const BLOG_SLUG_PATTERN = /^\/blog\/([^/]+)\/?$/;
const PROJECT_SLUG_PATTERN = /^\/projects\/([^/]+)\/?$/;

function resolveMetaPath(pathname: string): string | null {
  const blogMatch = BLOG_SLUG_PATTERN.exec(pathname);
  if (blogMatch) return `/meta/blog/${blogMatch[1]}/`;

  const projectMatch = PROJECT_SLUG_PATTERN.exec(pathname);
  if (projectMatch) return `/meta/projects/${projectMatch[1]}/`;

  if (pathname === '/book' || pathname === '/book/') return '/meta/book/';

  return null;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!BOT_UA_PATTERN.test(userAgent)) return undefined;

  const { pathname } = new URL(request.url);
  const metaPath = resolveMetaPath(pathname);
  if (!metaPath) return undefined;

  try {
    const upstream = await fetch(`${BACKEND_ORIGIN}${metaPath}`, {
      headers: { 'user-agent': userAgent },
    });
    if (!upstream.ok) return undefined; // e.g. unpublished/unknown slug — fail open to the SPA

    const html = await upstream.text();
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return undefined; // backend unreachable — fail open to the SPA
  }
}
