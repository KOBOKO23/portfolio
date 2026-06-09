import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Contact } from './Contact';

vi.mock('../components/SEO', () => ({ SEO: () => null }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}
function fail(code = 500) {
  return Promise.resolve({ ok: false, status: code, json: () => Promise.resolve({}) } as Response);
}

function renderContact() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Contact />
      </MemoryRouter>
    </HelmetProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue(ok({ success: false }));
});

describe('Contact page', () => {
  it('renders without crashing', () => {
    expect(() => renderContact()).not.toThrow();
  });

  it('renders name and email inputs', () => {
    renderContact();
    expect(screen.getByPlaceholderText(/full name/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/your\.email/i)).toBeTruthy();
  });

  it('renders the send button', () => {
    renderContact();
    expect(screen.getByRole('button', { name: /send message/i })).toBeTruthy();
  });

  it('shows profile email when API returns one', async () => {
    mockFetch.mockResolvedValueOnce(ok({
      success: true,
      data: {
        full_name: 'Koboko Philip',
        email: 'kobokophilip@gmail.com',
        phone: '+254700000000',
        location: 'Nairobi',
        linkedin_url: '', github_url: '', twitter_url: '', instagram_url: '',
      },
    }));
    renderContact();
    await waitFor(() => {
      expect(screen.getByText('kobokophilip@gmail.com')).toBeTruthy();
    });
  });

  it('shows success state after valid form submission', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ success: false }))
      .mockResolvedValueOnce(ok({ success: true, data: { message: 'Received.' } }));

    const user = userEvent.setup();
    renderContact();

    await user.type(screen.getByPlaceholderText(/full name/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/your\.email/i), 'john@example.com');
    await user.selectOptions(screen.getByRole('combobox'), 'general');
    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Hello!');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/message sent/i)).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ success: false }))
      .mockResolvedValueOnce(fail(500));

    const user = userEvent.setup();
    renderContact();

    await user.type(screen.getByPlaceholderText(/full name/i), 'Jane');
    await user.type(screen.getByPlaceholderText(/your\.email/i), 'jane@example.com');
    await user.selectOptions(screen.getByRole('combobox'), 'general');
    await user.type(screen.getByRole('textbox', { name: /message/i }), 'Test');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong|try again|error/i)).toBeTruthy();
    });
  });
});
