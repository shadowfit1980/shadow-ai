/**
 * Error Tracking Generator
 * 
 * Generate error tracking with Sentry, Bugsnag,
 * and custom error handling.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ErrorTrackingProvider = 'sentry' | 'bugsnag' | 'rollbar';

// ============================================================================
// ERROR TRACKING GENERATOR
// ============================================================================

export class ErrorTrackingGenerator extends EventEmitter {
    private static instance: ErrorTrackingGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ErrorTrackingGenerator {
        if (!ErrorTrackingGenerator.instance) {
            ErrorTrackingGenerator.instance = new ErrorTrackingGenerator();
        }
        return ErrorTrackingGenerator.instance;
    }

    // ========================================================================
    // SENTRY
    // ========================================================================

    generateSentryNode(): string {
        return `import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_version,
  
  integrations: [
    nodeProfilingIntegration(),
  ],
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  
  // Filter sensitive data
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],
});

export { Sentry };

// Capture exception with context
export function captureError(error: Error, context?: {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info';
}) {
  Sentry.withScope(scope => {
    if (context?.user) {
      scope.setUser(context.user);
    }
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    Sentry.captureException(error);
  });
}

// Express error handler
import { Request, Response, NextFunction } from 'express';

export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      // Only report 500 errors
      return error.status >= 500;
    },
  });
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

// Add breadcrumb
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Set user context
export function setUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function clearUser() {
  Sentry.setUser(null);
}
`;
    }

    generateSentryReact(): string {
        return `import * as Sentry from '@sentry/react';

// Initialize Sentry for React
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export { Sentry };

// Error Boundary component
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error reporting
export function useErrorTracking() {
  const captureException = (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, { extra: context });
  };

  const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
  };

  const setUser = (user: { id: string; email?: string }) => {
    Sentry.setUser(user);
  };

  return { captureException, captureMessage, setUser };
}

// Wrap component with profiler
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name: string
) {
  return Sentry.withProfiler(Component, { name });
}

// Error dialog for user feedback
export function showReportDialog(eventId: string) {
  Sentry.showReportDialog({ eventId });
}
`;
    }

    generateSentryNextJS(): string {
        return `// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // your config
};

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'your-project',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});

// Error handling in API routes
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Your logic
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Global error page (app/error.tsx)
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
`;
    }

    // ========================================================================
    // FLUTTER ERROR TRACKING
    // ========================================================================

    generateFlutterSentry(): string {
        return `import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> initSentry(Future<void> Function() appRunner) async {
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.tracesSampleRate = kDebugMode ? 1.0 : 0.1;
      options.attachScreenshot = true;
      options.attachViewHierarchy = true;
      options.environment = kDebugMode ? 'development' : 'production';
    },
    appRunner: appRunner,
  );
}

// Capture exception
Future<void> captureException(
  dynamic exception, {
  dynamic stackTrace,
  Map<String, dynamic>? extra,
}) async {
  await Sentry.captureException(
    exception,
    stackTrace: stackTrace,
    withScope: (scope) {
      if (extra != null) {
        extra.forEach((key, value) {
          scope.setExtra(key, value);
        });
      }
    },
  );
}

// Set user
void setUser(String id, {String? email, String? username}) {
  Sentry.configureScope((scope) {
    scope.setUser(SentryUser(
      id: id,
      email: email,
      username: username,
    ));
  });
}

void clearUser() {
  Sentry.configureScope((scope) => scope.setUser(null));
}

// Add breadcrumb
void addBreadcrumb(String message, {String? category, Map<String, dynamic>? data}) {
  Sentry.addBreadcrumb(Breadcrumb(
    message: message,
    category: category,
    data: data,
  ));
}

// Performance monitoring
Future<T> measureTransaction<T>(
  String name,
  String operation,
  Future<T> Function() fn,
) async {
  final transaction = Sentry.startTransaction(name, operation);
  try {
    final result = await fn();
    transaction.status = const SpanStatus.ok();
    return result;
  } catch (e) {
    transaction.status = const SpanStatus.internalError();
    rethrow;
  } finally {
    await transaction.finish();
  }
}

// Usage in main.dart
// void main() async {
//   await initSentry(() async {
//     runApp(const MyApp());
//   });
// }
`;
    }

    generateEnvTemplate(provider: ErrorTrackingProvider): string {
        switch (provider) {
            case 'sentry':
                return `SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx`;
            case 'bugsnag':
                return `BUGSNAG_API_KEY=`;
            default:
                return '';
        }
    }
}

export const errorTrackingGenerator = ErrorTrackingGenerator.getInstance();
