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
const BASE_URL = (import.meta.env.VITE_SITE_URL as string) || 'https://koboko.dev';
const GITHUB_URL = (import.meta.env.VITE_GITHUB_URL as string) || 'https://github.com/KOBOKO23';
const TWITTER_HANDLE = (import.meta.env.VITE_TWITTER_HANDLE as string) || '';

const DEFAULT_DESCRIPTION =
  'Kenyan meteorologist, backend developer, data scientist, gospel artist, and author. Building things that matter from Nairobi.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

const PERSON_LD = {
  '@type': 'Person',
  name: 'Koboko Philip',
  url: BASE_URL,
  jobTitle: 'Meteorologist · Backend Developer · Data Scientist',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  sameAs: [
    GITHUB_URL,
    ...(TWITTER_HANDLE ? [`https://twitter.com/${TWITTER_HANDLE.replace('@', '')}`] : []),
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
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Meteorologist · Developer · Author`;
  const desc = description ?? DEFAULT_DESCRIPTION;
  const img = image ?? DEFAULT_IMAGE;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  const breadcrumbLd = url && url !== '/'
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: title ?? SITE_NAME, item: canonicalUrl },
        ],
      }
    : null;

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
          publisher: {
            ...PERSON_LD,
            '@type': 'Organization',
            logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
          },
          keywords: article?.tags?.join(', '),
          articleSection: article?.section,
          inLanguage: 'en-KE',
          isAccessibleForFree: true,
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
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/blog?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
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
      <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type === 'profile' ? 'profile' : type} />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {TWITTER_HANDLE && <meta name="twitter:creator" content={TWITTER_HANDLE} />}
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

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
      {breadcrumbLd && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      )}
    </Helmet>
  );
}
