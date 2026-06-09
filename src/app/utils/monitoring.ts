/**
 * Monitoring and Analytics Utilities
 * Performance tracking, error monitoring, and user analytics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'navigation' | 'resource' | 'measure' | 'custom';
}

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  componentStack?: string;
}

interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: number;
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  /**
   * Record Web Vitals (Core Web Vitals)
   */
  recordWebVitals(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // Time to First Byte (TTFB)
    this.recordTTFB();

    // First Contentful Paint (FCP)
    this.recordFCP();
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        this.addMetric({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          timestamp: Date.now(),
          category: 'measure',
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      console.warn('LCP observation not supported');
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          this.addMetric({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now(),
            category: 'measure',
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch {
      console.warn('FID observation not supported');
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.addMetric({
              name: 'CLS',
              value: clsValue,
              timestamp: Date.now(),
              category: 'measure',
            });
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch {
      console.warn('CLS observation not supported');
    }
  }

  private recordTTFB(): void {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      this.addMetric({
        name: 'TTFB',
        value: navTiming.responseStart - navTiming.requestStart,
        timestamp: Date.now(),
        category: 'navigation',
      });
    }
  }

  private recordFCP(): void {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
    
    if (fcp) {
      this.addMetric({
        name: 'FCP',
        value: fcp.startTime,
        timestamp: Date.now(),
        category: 'measure',
      });
    }
  }

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, category: PerformanceMetric['category'] = 'custom'): void {
    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      category,
    });
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter((m) => m.category === category);
  }

  /**
   * Get average value for a metric
   */
  getAverageMetric(name: string): number {
    const metrics = this.metrics.filter((m) => m.name === name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Send metrics to analytics service
   */
  async sendToAnalytics(endpoint = '/api/analytics/metrics'): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });

      this.clear();
    } catch {
      console.error('Failed to send metrics:', error);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)}ms`);
    }
  }
}

/**
 * Error Monitor
 */
export class ErrorMonitor {
  private errors: ErrorLog[] = [];
  private readonly maxErrors = 50;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });
  }

  /**
   * Log an error manually
   */
  logError(error: Partial<ErrorLog>): void {
    const errorLog: ErrorLog = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: error.timestamp || Date.now(),
      url: error.url || window.location.href,
      userAgent: error.userAgent || navigator.userAgent,
      componentStack: error.componentStack,
    };

    this.errors.push(errorLog);

    // Keep only the last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error logged:', errorLog);
    }
  }

  /**
   * Get all logged errors
   */
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Send errors to monitoring service
   */
  async sendToMonitoring(endpoint = '/api/analytics/errors'): Promise<void> {
    if (this.errors.length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: this.errors,
          timestamp: Date.now(),
        }),
      });

      this.clear();
    } catch {
      console.error('Failed to send errors:', error);
    }
  }
}

/**
 * User Analytics Tracker
 */
export class AnalyticsTracker {
  private actions: UserAction[] = [];
  private readonly maxActions = 100;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, additionalData?: Record<string, any>): void {
    this.trackAction({
      action: 'page_view',
      category: 'navigation',
      label: pageName,
      timestamp: Date.now(),
    });

    // Send to Google Analytics or other service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'page_view', {
        page_title: pageName,
        page_path: window.location.pathname,
        ...additionalData,
      });
    }
  }

  /**
   * Track custom event
   */
  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number
  ): void {
    this.trackAction({
      action,
      category,
      label,
      value,
      timestamp: Date.now(),
    });

    // Send to Google Analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
      });
    }
  }

  /**
   * Track button click
   */
  trackClick(elementName: string, location?: string): void {
    this.trackEvent('engagement', 'click', `${elementName}${location ? ` - ${location}` : ''}`);
  }

  /**
   * Track form submission
   */
  trackFormSubmission(formName: string, success: boolean): void {
    this.trackEvent('form', success ? 'submit_success' : 'submit_error', formName);
  }

  /**
   * Track API call
   */
  trackAPICall(endpoint: string, method: string, duration: number, status: number): void {
    this.trackEvent('api', `${method}_${status}`, endpoint, duration);
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get all tracked actions
   */
  getActions(): UserAction[] {
    return [...this.actions];
  }

  /**
   * Clear all actions
   */
  clear(): void {
    this.actions = [];
  }

  private trackAction(action: UserAction): void {
    this.actions.push(action);

    if (this.actions.length > this.maxActions) {
      this.actions.shift();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const errorMonitor = new ErrorMonitor();
export const analyticsTracker = new AnalyticsTracker();

/**
 * Initialize all monitoring
 */
export function initializeMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Record web vitals
  performanceMonitor.recordWebVitals();

  // Send metrics periodically (every 30 seconds)
  setInterval(() => {
    performanceMonitor.sendToAnalytics().catch(console.error);
    errorMonitor.sendToMonitoring().catch(console.error);
  }, 30000);

  // Send metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.sendToAnalytics().catch(console.error);
    errorMonitor.sendToMonitoring().catch(console.error);
  });

  // Log page view
  analyticsTracker.trackPageView(document.title);

  if (process.env.NODE_ENV === 'development') {
    console.log('📈 Monitoring initialized');
  }
}

/**
 * Track route change (for SPAs)
 */
export function trackRouteChange(newPath: string, newTitle: string): void {
  analyticsTracker.trackPageView(newTitle);
  performanceMonitor.recordMetric('route_change', performance.now());
}
