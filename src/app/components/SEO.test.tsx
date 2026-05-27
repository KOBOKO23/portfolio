import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from './SEO';

function renderSEO(props: Parameters<typeof SEO>[0] = {}) {
  return render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  );
}

describe('SEO component', () => {
  it('renders without crashing with no props', () => {
    expect(() => renderSEO()).not.toThrow();
  });

  it('renders with all article props without crashing', () => {
    expect(() =>
      renderSEO({
        title: 'Understanding ECMWF Forecasts',
        description: 'A deep dive into ECMWF IFS model output over East Africa.',
        url: '/blog/understanding-ecmwf',
        type: 'article',
        article: {
          publishedTime: '2026-01-15T10:00:00Z',
          modifiedTime: '2026-01-16T09:00:00Z',
          author: 'Koboko',
          tags: ['meteorology', 'ECMWF', 'forecast'],
          section: 'Meteorology',
        },
      })
    ).not.toThrow();
  });

  it('renders profile type without crashing', () => {
    expect(() =>
      renderSEO({ type: 'profile', url: '/about' })
    ).not.toThrow();
  });

  it('renders with noindex flag without crashing', () => {
    expect(() =>
      renderSEO({ title: 'Draft', noindex: true })
    ).not.toThrow();
  });
});
