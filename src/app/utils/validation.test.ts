import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidURL,
  isValidPhone,
  sanitizeInput,
  isValidLength,
  validateRequired,
  isInRange,
  validateContactForm,
  validateNewsletterForm,
  validateFeedbackForm,
  hasValidationErrors,
  safeJSONParse,
  escapeRegex,
} from './validation';

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('first.last@domain.co.ke')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });
});

describe('isValidURL', () => {
  it('accepts valid URLs', () => {
    expect(isValidURL('https://koboko.dev')).toBe(true);
    expect(isValidURL('http://localhost:8000')).toBe(true);
    expect(isValidURL('https://example.com/path?q=1')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(isValidURL('')).toBe(false);
    expect(isValidURL('not a url')).toBe(false);
    expect(isValidURL('ftp')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidPhone('0712345678')).toBe(true);
    expect(isValidPhone('+254712345678')).toBe(true);
    expect(isValidPhone('254712345678')).toBe(true);
  });

  it('rejects short or overly long numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('1234567890123456')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('strips angle brackets and quotes', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });

  it('truncates to 1000 characters', () => {
    const long = 'a'.repeat(2000);
    expect(sanitizeInput(long).length).toBe(1000);
  });
});

describe('isValidLength', () => {
  it('passes within bounds', () => {
    expect(isValidLength('hello', 3, 10)).toBe(true);
  });

  it('fails below minimum', () => {
    expect(isValidLength('hi', 3, 10)).toBe(false);
  });

  it('fails above maximum', () => {
    expect(isValidLength('toolongstring', 1, 5)).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isValidLength('  ab  ', 3, 10)).toBe(false); // 'ab' is 2 chars
  });
});

describe('validateRequired', () => {
  it('passes for non-empty values', () => {
    expect(validateRequired('hello')).toBe(true);
    expect(validateRequired(42)).toBe(true);
    expect(validateRequired([1])).toBe(true);
  });

  it('fails for empty/null/undefined', () => {
    expect(validateRequired('')).toBe(false);
    expect(validateRequired('   ')).toBe(false);
    expect(validateRequired(null)).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
    expect(validateRequired([])).toBe(false);
  });
});

describe('isInRange', () => {
  it('passes within inclusive range', () => {
    expect(isInRange(3, 1, 5)).toBe(true);
    expect(isInRange(1, 1, 5)).toBe(true);
    expect(isInRange(5, 1, 5)).toBe(true);
  });

  it('fails outside range', () => {
    expect(isInRange(0, 1, 5)).toBe(false);
    expect(isInRange(6, 1, 5)).toBe(false);
  });
});

describe('validateContactForm', () => {
  const valid = {
    name: 'Philip Koboko',
    email: 'philip@koboko.dev',
    subject: 'Collaboration inquiry',
    message: 'I would love to collaborate on a weather data project.',
  };

  it('returns no errors for valid data', () => {
    expect(validateContactForm(valid)).toEqual({});
  });

  it('requires name', () => {
    const errors = validateContactForm({ ...valid, name: '' });
    expect(errors.name).toBeTruthy();
  });

  it('requires valid email', () => {
    const errors = validateContactForm({ ...valid, email: 'bad-email' });
    expect(errors.email).toBeTruthy();
  });

  it('requires subject of minimum length', () => {
    const errors = validateContactForm({ ...valid, subject: 'Hi' });
    expect(errors.subject).toBeTruthy();
  });

  it('requires message of minimum length', () => {
    const errors = validateContactForm({ ...valid, message: 'Short' });
    expect(errors.message).toBeTruthy();
  });
});

describe('validateNewsletterForm', () => {
  it('returns no errors for valid data', () => {
    expect(validateNewsletterForm({ name: 'Philip', email: 'p@koboko.dev' })).toEqual({});
  });

  it('requires name and valid email', () => {
    const e1 = validateNewsletterForm({ name: '', email: 'p@koboko.dev' });
    expect(e1.name).toBeTruthy();

    const e2 = validateNewsletterForm({ name: 'Philip', email: 'invalid' });
    expect(e2.email).toBeTruthy();
  });
});

describe('validateFeedbackForm', () => {
  const valid = { rating: 5, message: 'Outstanding work, really enjoyed it!' };

  it('returns no errors for valid data', () => {
    expect(validateFeedbackForm(valid)).toEqual({});
  });

  it('rejects out-of-range rating', () => {
    expect(validateFeedbackForm({ ...valid, rating: 6 }).rating).toBeTruthy();
    expect(validateFeedbackForm({ ...valid, rating: 0 }).rating).toBeTruthy();
  });

  it('validates optional email when provided', () => {
    const errors = validateFeedbackForm({ ...valid, email: 'bad' });
    expect(errors.email).toBeTruthy();

    const noErrors = validateFeedbackForm({ ...valid, email: 'ok@koboko.dev' });
    expect(noErrors.email).toBeUndefined();
  });
});

describe('hasValidationErrors', () => {
  it('returns true when errors exist', () => {
    expect(hasValidationErrors({ name: 'required' })).toBe(true);
  });

  it('returns false for empty errors object', () => {
    expect(hasValidationErrors({})).toBe(false);
  });
});

describe('safeJSONParse', () => {
  it('parses valid JSON', () => {
    expect(safeJSONParse('{"key":"value"}', {})).toEqual({ key: 'value' });
    expect(safeJSONParse('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it('returns fallback on invalid JSON', () => {
    expect(safeJSONParse('not json', 'fallback')).toBe('fallback');
    expect(safeJSONParse('', null)).toBe(null);
  });
});

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    const escaped = escapeRegex('hello.world+test?');
    expect(escaped).toBe('hello\\.world\\+test\\?');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeRegex('hello')).toBe('hello');
  });
});
