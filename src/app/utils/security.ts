/**
 * Security Utilities
 * Advanced security measures for client-side protection
 */

/**
 * Content Security Policy (CSP) Headers
 * To be used with Helmet or similar library
 */
export const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Note: Remove unsafe-inline in production with nonce
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  connectSrc: ["'self'", import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: [],
};

/**
 * Rate limiting for client-side actions
 */
class RateLimiter {
  private attempts = new Map<string, number[]>();

  /**
   * Check if action is rate limited
   * @param key - Unique identifier for the action
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   */
  isRateLimited(key: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) ?? [];
    
    // Remove old attempts outside the time window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return false;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Prevent clickjacking attacks
 */
export function preventClickjacking(): void {
  if (typeof window !== 'undefined') {
    // Ensure we're not in an iframe
    if (window.self !== window.top && window.top) {
      window.top.location.href = window.self.location.href;
    }
  }
}

/**
 * Generate a random nonce for inline scripts (CSP)
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure cookie settings
 */
export const SECURE_COOKIE_OPTIONS = {
  secure: true, // Only send over HTTPS
  sameSite: 'strict' as const, // Prevent CSRF
  httpOnly: false, // Can't be accessed by JavaScript (set on server)
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Sanitize filename for uploads
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Check if string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(input: string): boolean {
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /<iframe[\s\S]*?>/gi, // Iframes
    /eval\s*\(/gi, // Eval function
    /expression\s*\(/gi, // CSS expressions
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Create Content Security Policy meta tag
 */
export function createCSPMetaTag(): HTMLMetaElement | null {
  if (typeof document === 'undefined') return null;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  
  const cspString = Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
  
  meta.content = cspString;
  
  return meta;
}

/**
 * Secure random string generator
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(36)).join('').slice(0, length);
}

/**
 * Check if URL is safe to navigate to
 */
export function isSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    
    // Only allow http, https, and mailto protocols
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    if (!safeProtocols.includes(parsed.protocol)) {
      return false;
    }
    
    // Check for common phishing patterns
    const suspiciousPatterns = [
      /[а-яА-Я]/, // Cyrillic characters (homograph attack)
      /\.\./,     // Path traversal
      /\s/,       // Whitespace (unusual in URLs)
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Prevent timing attacks by comparing strings in constant time
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Encrypt sensitive data before storing in localStorage
 * Note: This is basic obfuscation. For real encryption, use Web Crypto API
 */
export function obfuscate(data: string): string {
  const key = generateSecureToken(16);
  let result = '';
  
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  
  return btoa(result + '::' + key);
}

/**
 * Decrypt obfuscated data
 */
export function deobfuscate(encoded: string): string {
  try {
    const decoded = atob(encoded);
    const [data, key] = decoded.split('::');
    let result = '';
    
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return result;
  } catch {
    return '';
  }
}

/**
 * Secure data storage in localStorage with encryption
 */
export const secureStorage = {
  setItem(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify(value);
      const obfuscated = obfuscate(serialized);
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  },

  getItem<T>(key: string): T | null {
    try {
      const obfuscated = localStorage.getItem(key);
      if (!obfuscated) return null;
      
      const deobfuscated = deobfuscate(obfuscated);
      return JSON.parse(deobfuscated) as T;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

/**
 * Initialize security measures on app load
 */
export function initializeSecurity(): void {
  if (typeof window === 'undefined') return;

  // Prevent clickjacking
  preventClickjacking();

  // Disable right-click in production (optional)
  if (import.meta.env.MODE === 'production') {
    // Uncomment if you want to disable right-click
    // document.addEventListener('contextmenu', e => e.preventDefault());
  }

  // Clear sensitive data on unload
  window.addEventListener('beforeunload', () => {
    // Clear any sensitive in-memory data
    rateLimiter.clearAll();
  });

  // Detect and warn about console usage in production
  if (import.meta.env.MODE === 'production') {
    const consoleWarning = () => {
      console.log(
        '%cStop!',
        'color: red; font-size: 60px; font-weight: bold;'
      );
      console.log(
        '%cThis is a browser feature intended for developers. Do not paste any code here.',
        'font-size: 18px;'
      );
    };
    consoleWarning();
  }
}
