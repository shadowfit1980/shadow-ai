/**
 * Analytics Integration Generator
 * 
 * Generate analytics integration for Google Analytics,
 * Mixpanel, PostHog, and custom event tracking.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type AnalyticsProvider = 'google' | 'mixpanel' | 'posthog' | 'amplitude' | 'segment' | 'plausible';

export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
}

export interface AnalyticsConfig {
    provider: AnalyticsProvider;
    features: {
        pageViews?: boolean;
        userTracking?: boolean;
        customEvents?: boolean;
        errorTracking?: boolean;
        performance?: boolean;
    };
}

// ============================================================================
// ANALYTICS GENERATOR
// ============================================================================

export class AnalyticsIntegrationGenerator extends EventEmitter {
    private static instance: AnalyticsIntegrationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): AnalyticsIntegrationGenerator {
        if (!AnalyticsIntegrationGenerator.instance) {
            AnalyticsIntegrationGenerator.instance = new AnalyticsIntegrationGenerator();
        }
        return AnalyticsIntegrationGenerator.instance;
    }

    // ========================================================================
    // GOOGLE ANALYTICS
    // ========================================================================

    /**
     * Generate Google Analytics 4 integration
     */
    generateGoogleAnalytics(): string {
        return `// lib/analytics/google.ts
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!;

// Initialize GA4
export const initGA = () => {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

// Track page view
export const pageview = (url: string) => {
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// Track event
export const event = (action: string, params?: {
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  window.gtag('event', action, params);
};

// Track user
export const setUser = (userId: string, properties?: Record<string, any>) => {
  window.gtag('set', 'user_properties', {
    user_id: userId,
    ...properties,
  });
};

// Ecommerce events
export const ecommerce = {
  viewItem: (item: { id: string; name: string; price: number }) => {
    event('view_item', {
      currency: 'USD',
      value: item.price,
      items: [{ item_id: item.id, item_name: item.name, price: item.price }],
    });
  },

  addToCart: (item: { id: string; name: string; price: number; quantity: number }) => {
    event('add_to_cart', {
      currency: 'USD',
      value: item.price * item.quantity,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
    });
  },

  purchase: (transaction: { id: string; value: number; items: any[] }) => {
    event('purchase', {
      transaction_id: transaction.id,
      currency: 'USD',
      value: transaction.value,
      items: transaction.items,
    });
  },
};

// Script component for Next.js
export const GoogleAnalyticsScript = () => \`
  <script async src="https://www.googletagmanager.com/gtag/js?id=\${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '\${GA_MEASUREMENT_ID}');
  </script>
\`;
`;
    }

    // ========================================================================
    // MIXPANEL
    // ========================================================================

    /**
     * Generate Mixpanel integration
     */
    generateMixpanel(): string {
        return `// lib/analytics/mixpanel.ts
import mixpanel, { Dict, Callback } from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

// Initialize
export const initMixpanel = () => {
  mixpanel.init(MIXPANEL_TOKEN, {
    track_pageview: true,
    persistence: 'localStorage',
    debug: process.env.NODE_ENV === 'development',
  });
};

// Identify user
export const identify = (userId: string) => {
  mixpanel.identify(userId);
};

// Set user properties
export const setUserProperties = (properties: Dict) => {
  mixpanel.people.set(properties);
};

// Track event
export const track = (eventName: string, properties?: Dict, callback?: Callback) => {
  mixpanel.track(eventName, properties, callback);
};

// Track page view
export const trackPageView = (pageName: string, properties?: Dict) => {
  track('Page View', { page: pageName, ...properties });
};

// Reset on logout
export const reset = () => {
  mixpanel.reset();
};

// Time event
export const timeEvent = (eventName: string) => {
  mixpanel.time_event(eventName);
};

// Common events
export const events = {
  signUp: (method: string) => track('Sign Up', { method }),
  login: (method: string) => track('Login', { method }),
  logout: () => track('Logout'),
  
  buttonClick: (buttonName: string, page: string) => 
    track('Button Click', { button: buttonName, page }),
  
  featureUsed: (featureName: string, details?: Dict) =>
    track('Feature Used', { feature: featureName, ...details }),
  
  error: (errorType: string, errorMessage: string) =>
    track('Error', { type: errorType, message: errorMessage }),
    
  subscription: (plan: string, action: 'started' | 'upgraded' | 'cancelled') =>
    track('Subscription', { plan, action }),
};

// React hook
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useMixpanel() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return { track, identify, setUserProperties, events };
}
`;
    }

    // ========================================================================
    // POSTHOG
    // ========================================================================

    /**
     * Generate PostHog integration
     */
    generatePostHog(): string {
        return `// lib/analytics/posthog.ts
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize
export const initPostHog = () => {
  if (typeof window === 'undefined') return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      recordCrossOriginIframes: true,
    },
  });
};

// Identify user
export const identify = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

// Track event
export const capture = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Set user properties
export const setPersonProperties = (properties: Record<string, any>) => {
  posthog.people.set(properties);
};

// Feature flags
export const isFeatureEnabled = (flagKey: string): boolean => {
  return posthog.isFeatureEnabled(flagKey);
};

export const getFeatureFlag = (flagKey: string): string | boolean | undefined => {
  return posthog.getFeatureFlag(flagKey);
};

// Groups (for B2B)
export const group = (groupType: string, groupKey: string, properties?: Record<string, any>) => {
  posthog.group(groupType, groupKey, properties);
};

// Reset on logout
export const reset = () => {
  posthog.reset();
};

// Opt in/out
export const optIn = () => posthog.opt_in_capturing();
export const optOut = () => posthog.opt_out_capturing();
export const hasOptedIn = () => posthog.has_opted_in_capturing();
export const hasOptedOut = () => posthog.has_opted_out_capturing();

// Common events
export const events = {
  signUp: (method: string, properties?: Record<string, any>) =>
    capture('user_signed_up', { method, ...properties }),
    
  login: (method: string) =>
    capture('user_logged_in', { method }),
    
  featureUsed: (feature: string, properties?: Record<string, any>) =>
    capture('feature_used', { feature, ...properties }),
    
  pageView: (pageName: string, properties?: Record<string, any>) =>
    capture('$pageview', { page: pageName, ...properties }),
    
  error: (errorType: string, errorMessage: string, stack?: string) =>
    capture('error_occurred', { type: errorType, message: errorMessage, stack }),
};

// React Provider
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (pathname) {
      const url = window.origin + pathname;
      if (searchParams?.toString()) {
        posthog.capture('$pageview', { $current_url: url + '?' + searchParams.toString() });
      } else {
        posthog.capture('$pageview', { $current_url: url });
      }
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

// Feature flag hook
export function useFeatureFlag(flagKey: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(flagKey));
      setLoading(false);
    });
  }, [flagKey]);

  return { enabled, loading };
}

import { useState } from 'react';
`;
    }

    // ========================================================================
    // UNIFIED ANALYTICS
    // ========================================================================

    /**
     * Generate unified analytics wrapper
     */
    generateUnifiedAnalytics(): string {
        return `// lib/analytics/index.ts

type AnalyticsProvider = 'google' | 'mixpanel' | 'posthog' | 'segment';

interface AnalyticsConfig {
  providers: AnalyticsProvider[];
  debug?: boolean;
}

class Analytics {
  private providers: AnalyticsProvider[] = [];
  private debug = false;

  init(config: AnalyticsConfig) {
    this.providers = config.providers;
    this.debug = config.debug || false;

    if (typeof window === 'undefined') return;

    this.providers.forEach((provider) => {
      switch (provider) {
        case 'google':
          // Init GA
          break;
        case 'mixpanel':
          // Init Mixpanel
          break;
        case 'posthog':
          // Init PostHog
          break;
      }
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (this.debug) console.log('[Analytics] identify:', userId, traits);

    this.providers.forEach((provider) => {
      switch (provider) {
        case 'google':
          window.gtag?.('set', 'user_properties', { user_id: userId, ...traits });
          break;
        case 'mixpanel':
          // mixpanel.identify(userId);
          break;
        case 'posthog':
          // posthog.identify(userId, traits);
          break;
      }
    });
  }

  track(event: string, properties?: Record<string, any>) {
    if (this.debug) console.log('[Analytics] track:', event, properties);

    this.providers.forEach((provider) => {
      switch (provider) {
        case 'google':
          window.gtag?.('event', event, properties);
          break;
        case 'mixpanel':
          // mixpanel.track(event, properties);
          break;
        case 'posthog':
          // posthog.capture(event, properties);
          break;
      }
    });
  }

  page(name: string, properties?: Record<string, any>) {
    if (this.debug) console.log('[Analytics] page:', name, properties);

    this.providers.forEach((provider) => {
      switch (provider) {
        case 'google':
          window.gtag?.('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
            page_path: window.location.pathname,
            page_title: name,
            ...properties,
          });
          break;
        case 'mixpanel':
          // mixpanel.track('Page View', { page: name, ...properties });
          break;
        case 'posthog':
          // posthog.capture('$pageview', { page: name, ...properties });
          break;
      }
    });
  }

  reset() {
    this.providers.forEach((provider) => {
      switch (provider) {
        case 'mixpanel':
          // mixpanel.reset();
          break;
        case 'posthog':
          // posthog.reset();
          break;
      }
    });
  }
}

export const analytics = new Analytics();

// React hook
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    analytics.page(pathname);
  }, [pathname]);

  return analytics;
}

// Pre-defined events
export const trackEvents = {
  signUp: (method: string) => analytics.track('Sign Up', { method }),
  login: (method: string) => analytics.track('Login', { method }),
  logout: () => analytics.track('Logout'),
  click: (element: string, page: string) => analytics.track('Click', { element, page }),
  search: (query: string, results: number) => analytics.track('Search', { query, results }),
  purchase: (amount: number, currency: string) => analytics.track('Purchase', { amount, currency }),
  error: (error: Error) => analytics.track('Error', { message: error.message, stack: error.stack }),
};
`;
    }

    // ========================================================================
    // FLUTTER ANALYTICS
    // ========================================================================

    /**
     * Generate Flutter analytics
     */
    generateFlutterAnalytics(): string {
        return `import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  static final FirebaseAnalyticsObserver observer = 
    FirebaseAnalyticsObserver(analytics: _analytics);

  // Set user
  static Future<void> setUser(String userId) async {
    await _analytics.setUserId(id: userId);
  }

  // Set user properties
  static Future<void> setUserProperty(String name, String value) async {
    await _analytics.setUserProperty(name: name, value: value);
  }

  // Log screen view
  static Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }

  // Log custom event
  static Future<void> logEvent(String name, [Map<String, dynamic>? parameters]) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  // Pre-defined events
  static Future<void> logSignUp(String method) async {
    await _analytics.logSignUp(signUpMethod: method);
  }

  static Future<void> logLogin(String method) async {
    await _analytics.logLogin(loginMethod: method);
  }

  static Future<void> logPurchase({
    required double value,
    required String currency,
    String? transactionId,
  }) async {
    await _analytics.logPurchase(
      value: value,
      currency: currency,
      transactionId: transactionId,
    );
  }

  static Future<void> logSearch(String query) async {
    await _analytics.logSearch(searchTerm: query);
  }

  static Future<void> logShare(String contentType, String itemId) async {
    await _analytics.logShare(
      contentType: contentType,
      itemId: itemId,
      method: 'in_app',
    );
  }
}

// Usage with GoRouter
import 'package:go_router/go_router.dart';

final goRouter = GoRouter(
  observers: [AnalyticsService.observer],
  routes: [...],
);
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Generate env template
     */
    generateEnvTemplate(provider: AnalyticsProvider): string {
        switch (provider) {
            case 'google':
                return `# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
`;
            case 'mixpanel':
                return `# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=
`;
            case 'posthog':
                return `# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
`;
            default:
                return '';
        }
    }
}

// Export singleton
export const analyticsIntegrationGenerator = AnalyticsIntegrationGenerator.getInstance();
