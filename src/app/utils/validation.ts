/**
 * app/utils/validation.ts
 * ────────────────────────
 * Pure validation and sanitisation helpers used by form components.
 *
 * All functions are side-effect-free — safe to call in any context (browser or test).
 *
 * Exported validators: isValidEmail, isValidURL, isValidPhone, isValidLength,
 *   validateRequired, isInRange, hasValidationErrors, safeJSONParse, escapeRegex
 *
 * Exported sanitisers: sanitizeHTML, sanitizeInput
 *
 * Exported form validators:
 *   validateContactForm   — name, email, subject, message
 *   validateNewsletterForm — name, email
 *   validateFeedbackForm  — rating (1-5), message, optional email
 *
 * Form validators return a ValidationErrors object (empty = no errors).
 * Use hasValidationErrors(errors) to gate form submission.
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it's between 10-15 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Sanitize HTML to prevent XSS
 * Note: For production, consider using DOMPurify library
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitize user input by removing potentially dangerous characters
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate string length
 */
export function isValidLength(
  str: string,
  min: number,
  max: number
): boolean {
  const length = str.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate required fields
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate number range
 */
export function isInRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/**
 * Form validation errors type
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Contact form validation
 */
export function validateContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!validateRequired(data.name)) {
    errors.name = 'Name is required';
  } else if (!isValidLength(data.name, 2, 200)) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (!validateRequired(data.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validateRequired(data.subject)) {
    errors.subject = 'Subject is required';
  } else if (!isValidLength(data.subject, 5, 300)) {
    errors.subject = 'Subject must be between 5 and 300 characters';
  }

  if (!validateRequired(data.message)) {
    errors.message = 'Message is required';
  } else if (!isValidLength(data.message, 10, 2000)) {
    errors.message = 'Message must be between 10 and 2000 characters';
  }

  return errors;
}

/**
 * Newsletter subscription validation
 */
export function validateNewsletterForm(data: {
  name: string;
  email: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!validateRequired(data.name)) {
    errors.name = 'Name is required';
  } else if (!isValidLength(data.name, 2, 200)) {
    errors.name = 'Name must be between 2 and 200 characters';
  }

  if (!validateRequired(data.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
}

/**
 * Feedback form validation
 */
export function validateFeedbackForm(data: {
  rating: number;
  message: string;
  email?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!validateRequired(data.rating)) {
    errors.rating = 'Rating is required';
  } else if (!isInRange(data.rating, 1, 5)) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  if (!validateRequired(data.message)) {
    errors.message = 'Message is required';
  } else if (!isValidLength(data.message, 10, 1000)) {
    errors.message = 'Message must be between 10 and 1000 characters';
  }

  if (data.email && data.email.trim() && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
}

/**
 * Check if validation errors exist
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Safe JSON parse
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Escape special characters for use in regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
