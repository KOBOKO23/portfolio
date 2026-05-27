/**
 * app/components/SEO.tsx
 * ──────────────────────
 * Drop-in SEO head manager. Renders <title>, canonical, Open Graph, Twitter Card,
 * and JSON-LD structured data via react-helmet-async's <Helmet>.
 *
 * Requires <HelmetProvider> wrapping the app (see src/main.tsx).
 *
 * Usage:
 *   // Static page
 *   <SEO title="Projects" description="..." url="/projects" />
 *
 *   // Blog article
 *   <SEO type="article" title={article.title} article={{ publishedTime, tags, author }} />
 *
 * Environment variable:
 *   VITE_SITE_URL — canonical base URL (default: https://koboko.dev)
 */
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
    section?: string;
  };
  noindex?: boolean;
}

const SITE_NAME = 'Koboko';
const BASE_URL = (import.meta.env.VITE_SITE_URL as string) ?? 'https://koboko.dev';
const DEFAULT_DESCRIPTION =
  'Kenyan meteorologist, backend developer, data scientist, gospel artist, and author. Building things that matter from Nairobi.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

const PERSON_LD = {
  '@type': 'Person',
  name: 'Koboko',
  url: BASE_URL,
  jobTitle: 'Meteorologist · Backend Developer · Data Scientist',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  sameAs: [
    'https://github.com/koboko',
  ],
};

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  article,
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const img = image ?? DEFAULT_IMAGE;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  const jsonLd =
    type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: desc,
          image: img,
          url: canonicalUrl,
          datePublished: article?.publishedTime,
          dateModified: article?.modifiedTime ?? article?.publishedTime,
          author: PERSON_LD,
          publisher: PERSON_LD,
          keywords: article?.tags?.join(', '),
          articleSection: article?.section,
        }
      : type === 'profile'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: canonicalUrl,
          mainEntity: PERSON_LD,
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          url: BASE_URL,
          description: DEFAULT_DESCRIPTION,
          author: PERSON_LD,
        };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type === 'profile' ? 'profile' : type} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* Article extras */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && <meta property="article:author" content={article.author} />}
      {article?.section && <meta property="article:section" content={article.section} />}
      {article?.tags?.map((tag) => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* JSON-LD structured data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
