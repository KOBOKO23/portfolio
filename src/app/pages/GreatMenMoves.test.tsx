import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { GreatMenMoves } from './GreatMenMoves';

vi.mock('../components/SEO', () => ({ SEO: () => null }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

function renderGMM() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <GreatMenMoves />
      </MemoryRouter>
    </HelmetProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(ok({ success: true, data: [] }));
});

describe('GreatMenMoves page', () => {
  it('renders without crashing', () => {
    expect(() => renderGMM()).not.toThrow();
  });

  it('renders the main heading', async () => {
    renderGMM();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    });
  });

  it('renders the volunteer form fields', async () => {
    renderGMM();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/full name/i)).toBeTruthy();
    });
  });

  it('renders impact goals returned by the API', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ success: true, data: [] }))
      .mockResolvedValueOnce(ok({
        success: true,
        data: [
          { id: 1, number: '500+', label: 'Men Mentored', progress: 85, icon: 'users' },
        ],
      }));

    renderGMM();
    await waitFor(() => {
      expect(screen.getByText('500+')).toBeTruthy();
      expect(screen.getByText('Men Mentored')).toBeTruthy();
    });
  });

  it('shows success message after volunteer form submission', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ success: true, data: [] }))
      .mockResolvedValueOnce(ok({ success: true, data: [] }))
      .mockResolvedValueOnce(ok({
        success: true,
        data: { message: 'Your volunteer application has been received.' },
      }));

    const user = userEvent.setup();
    renderGMM();

    await user.type(screen.getByPlaceholderText(/full name/i), 'John Kamau');
    await user.type(screen.getByPlaceholderText(/email/i), 'jkamau@example.com');
    await user.type(screen.getByPlaceholderText(/motivation|why/i), 'I want to serve young men.');

    await user.click(screen.getByRole('button', { name: /submit|apply|volunteer/i }));

    await waitFor(() => {
      expect(screen.getByText(/received|thank you|application/i)).toBeTruthy();
    });
  });
});
