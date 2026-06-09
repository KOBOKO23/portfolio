import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Book } from './Book';

vi.mock('../components/SEO', () => ({ SEO: () => null }));

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve(null)) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements:          ({ children }: any) => <>{children}</>,
  CardNumberElement: () => <input aria-label="Card number" />,
  CardExpiryElement: () => <input aria-label="Expiry" />,
  CardCvcElement:    () => <input aria-label="CVC" />,
  useStripe:         () => null,
  useElements:       () => null,
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const BOOK = {
  id: 1,
  title: 'Broken Souls',
  subtitle: 'Finding Wholeness in a Fractured World',
  description: 'A journey through pain, faith, and redemption.',
  cover_image: null, author: 'Koboko Philip', page_count: 240,
  release_date: '2026-12-01', publisher: 'Self-published',
  amazon_url: '', preview_pdf: null,
  authors_note: 'This book is my testimony.',
  price_kes: 1200, price_usd: '9.99', is_published: false,
  chapters: [
    { id: 1, number: 1, title: 'The Fracture', theme: 'Pain', excerpt: 'Every soul has a breaking point.' },
  ],
  testimonials: [],
  stripe_publishable_key: 'pk_test_placeholder',
};

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

function renderBook() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Book />
      </MemoryRouter>
    </HelmetProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(ok({ success: true, data: [BOOK] }));
});

describe('Book page', () => {
  it('renders without crashing', () => {
    expect(() => renderBook()).not.toThrow();
  });

  it('shows book title after data loads', async () => {
    renderBook();
    await waitFor(() => {
      expect(screen.getByText('Broken Souls')).toBeTruthy();
    });
  });

  it('shows subtitle', async () => {
    renderBook();
    await waitFor(() => {
      expect(screen.getByText(/finding wholeness/i)).toBeTruthy();
    });
  });

  it('shows chapter title', async () => {
    renderBook();
    await waitFor(() => {
      expect(screen.getByText('The Fracture')).toBeTruthy();
    });
  });

  it('shows payment method options', async () => {
    renderBook();
    await waitFor(() => {
      expect(screen.getByText(/visa|card/i)).toBeTruthy();
      expect(screen.getByText(/m-pesa|mpesa/i)).toBeTruthy();
    });
  });

  it('opens payment modal with mpesa option on pre-order click', async () => {
    const user = userEvent.setup();
    renderBook();
    await waitFor(() => screen.getAllByText(/pre-order now/i));
    await user.click(screen.getAllByText(/pre-order now/i)[0]);
    await waitFor(() => {
      expect(screen.getAllByText(/m-pesa/i).length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when API fails', async () => {
    mockFetch.mockResolvedValue(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) } as Response)
    );
    renderBook();
    await waitFor(() => {
      expect(screen.queryByText(/no book information|available/i)).toBeTruthy();
    });
  });
});
