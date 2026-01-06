/**
 * Feature Flags Generator
 * 
 * Generate feature flag integration for LaunchDarkly,
 * Unleash, PostHog, and custom implementations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureFlagProvider = 'launchdarkly' | 'unleash' | 'posthog' | 'custom';

// ============================================================================
// FEATURE FLAGS GENERATOR
// ============================================================================

export class FeatureFlagsGenerator extends EventEmitter {
    private static instance: FeatureFlagsGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FeatureFlagsGenerator {
        if (!FeatureFlagsGenerator.instance) {
            FeatureFlagsGenerator.instance = new FeatureFlagsGenerator();
        }
        return FeatureFlagsGenerator.instance;
    }

    // ========================================================================
    // LAUNCHDARKLY
    // ========================================================================

    generateLaunchDarkly(): string {
        return `// Server-side
import LaunchDarkly from '@launchdarkly/node-server-sdk';

const client = LaunchDarkly.init(process.env.LAUNCHDARKLY_SDK_KEY!);

await client.waitForInitialization();

export const featureFlags = {
  // Check flag for user
  async isEnabled(flagKey: string, user: {
    key: string;
    email?: string;
    name?: string;
    custom?: Record<string, any>;
  }, defaultValue = false): Promise<boolean> {
    const context = {
      kind: 'user',
      key: user.key,
      email: user.email,
      name: user.name,
      ...user.custom,
    };
    
    return client.variation(flagKey, context, defaultValue);
  },

  // Get all flags for user
  async getAllFlags(user: { key: string; email?: string }) {
    const context = { kind: 'user', key: user.key, email: user.email };
    return client.allFlagsState(context);
  },

  // Track custom event
  track(eventKey: string, user: { key: string }, data?: any) {
    client.track(eventKey, { kind: 'user', key: user.key }, data);
  },
};

// Express middleware
import { Request, Response, NextFunction } from 'express';

export function featureFlagMiddleware(flagKey: string, defaultValue = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return next();

    const isEnabled = await featureFlags.isEnabled(flagKey, { key: user.id });
    (req as any).featureFlags = { [flagKey]: isEnabled };
    
    next();
  };
}

// React SDK
import { LDProvider, useFlags, useLDClient } from 'launchdarkly-react-client-sdk';

export function FeatureFlagProvider({ children, user }: {
  children: React.ReactNode;
  user?: { key: string; email?: string };
}) {
  return (
    <LDProvider
      clientSideID={process.env.NEXT_PUBLIC_LD_CLIENT_ID!}
      context={user ? { kind: 'user', ...user } : { kind: 'user', anonymous: true }}
    >
      {children}
    </LDProvider>
  );
}

// Hook usage
export function useFeatureFlag(flagKey: string, defaultValue = false): boolean {
  const flags = useFlags();
  return flags[flagKey] ?? defaultValue;
}

// Conditional component
export function Feature({ flag, children, fallback = null }: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  return <>{isEnabled ? children : fallback}</>;
}
`;
    }

    // ========================================================================
    // CUSTOM IMPLEMENTATION
    // ========================================================================

    generateCustomFlags(): string {
        return `// lib/feature-flags.ts
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

interface FlagConfig {
  enabled: boolean;
  percentage?: number; // For gradual rollout
  allowList?: string[]; // User IDs
  rules?: Array<{
    attribute: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in';
    value: any;
  }>;
}

class FeatureFlagService {
  private cache = new Map<string, FlagConfig>();
  private cacheTimeout = 60000; // 1 minute

  // Check if flag is enabled
  async isEnabled(
    flagKey: string,
    context?: { userId?: string; attributes?: Record<string, any> }
  ): Promise<boolean> {
    const config = await this.getFlag(flagKey);
    if (!config) return false;

    // Check if globally enabled
    if (!config.enabled) return false;

    // Check allowlist
    if (config.allowList && context?.userId) {
      if (config.allowList.includes(context.userId)) return true;
    }

    // Check percentage rollout
    if (config.percentage !== undefined && context?.userId) {
      const hash = this.hashUserId(context.userId);
      if (hash > config.percentage) return false;
    }

    // Check rules
    if (config.rules && context?.attributes) {
      for (const rule of config.rules) {
        const value = context.attributes[rule.attribute];
        if (!this.evaluateRule(rule, value)) return false;
      }
    }

    return true;
  }

  // Get flag config
  async getFlag(key: string): Promise<FlagConfig | null> {
    // Check cache
    const cached = this.cache.get(key);
    if (cached) return cached;

    // Fetch from Redis
    const data = await redis.get(\`flags:\${key}\`);
    if (!data) return null;

    const config = JSON.parse(data) as FlagConfig;
    this.cache.set(key, config);
    
    // Clear cache after timeout
    setTimeout(() => this.cache.delete(key), this.cacheTimeout);

    return config;
  }

  // Set flag config
  async setFlag(key: string, config: FlagConfig): Promise<void> {
    await redis.set(\`flags:\${key}\`, JSON.stringify(config));
    this.cache.delete(key);
  }

  // Delete flag
  async deleteFlag(key: string): Promise<void> {
    await redis.del(\`flags:\${key}\`);
    this.cache.delete(key);
  }

  // List all flags
  async listFlags(): Promise<string[]> {
    const keys = await redis.keys('flags:*');
    return keys.map(k => k.replace('flags:', ''));
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  private evaluateRule(rule: { operator: string; value: any }, actualValue: any): boolean {
    switch (rule.operator) {
      case 'eq': return actualValue === rule.value;
      case 'ne': return actualValue !== rule.value;
      case 'gt': return actualValue > rule.value;
      case 'lt': return actualValue < rule.value;
      case 'in': return rule.value.includes(actualValue);
      default: return false;
    }
  }
}

export const featureFlags = new FeatureFlagService();

// React hook
import { useState, useEffect } from 'react';

export function useFeatureFlag(
  flagKey: string,
  userId?: string,
  attributes?: Record<string, any>
): { enabled: boolean; loading: boolean } {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/flags/\${flagKey}?userId=\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled);
        setLoading(false);
      });
  }, [flagKey, userId]);

  return { enabled, loading };
}

// API routes
import express from 'express';
const router = express.Router();

router.get('/:key', async (req, res) => {
  const { key } = req.params;
  const { userId } = req.query;
  
  const enabled = await featureFlags.isEnabled(key, { userId: userId as string });
  res.json({ enabled });
});

router.post('/:key', async (req, res) => {
  const { key } = req.params;
  await featureFlags.setFlag(key, req.body);
  res.json({ success: true });
});

export { router as flagsRouter };
`;
    }

    // ========================================================================
    // FLUTTER
    // ========================================================================

    generateFlutterFlags(): string {
        return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FeatureFlagService {
  static const String _baseUrl = 'YOUR_API_URL';
  final Map<String, bool> _cache = {};
  String? _userId;

  void setUser(String userId) {
    _userId = userId;
    _cache.clear();
  }

  Future<bool> isEnabled(String flagKey) async {
    // Check cache
    if (_cache.containsKey(flagKey)) {
      return _cache[flagKey]!;
    }

    try {
      final response = await http.get(
        Uri.parse('\$_baseUrl/api/flags/\$flagKey?userId=\$_userId'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final enabled = data['enabled'] as bool;
        _cache[flagKey] = enabled;
        return enabled;
      }
    } catch (e) {
      print('Feature flag error: \$e');
    }

    return false;
  }

  void clearCache() {
    _cache.clear();
  }
}

// Riverpod provider
final featureFlagServiceProvider = Provider<FeatureFlagService>((ref) {
  return FeatureFlagService();
});

final featureFlagProvider = FutureProvider.family<bool, String>((ref, flagKey) {
  return ref.watch(featureFlagServiceProvider).isEnabled(flagKey);
});

// Usage widget
class FeatureFlag extends ConsumerWidget {
  final String flag;
  final Widget child;
  final Widget? fallback;

  const FeatureFlag({
    super.key,
    required this.flag,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flagAsync = ref.watch(featureFlagProvider(flag));

    return flagAsync.when(
      data: (enabled) => enabled ? child : (fallback ?? const SizedBox.shrink()),
      loading: () => fallback ?? const SizedBox.shrink(),
      error: (_, __) => fallback ?? const SizedBox.shrink(),
    );
  }
}

// Usage:
// FeatureFlag(
//   flag: 'new_dashboard',
//   child: NewDashboard(),
//   fallback: OldDashboard(),
// )
`;
    }

    generateEnvTemplate(provider: FeatureFlagProvider): string {
        switch (provider) {
            case 'launchdarkly':
                return `LAUNCHDARKLY_SDK_KEY=
NEXT_PUBLIC_LD_CLIENT_ID=`;
            case 'unleash':
                return `UNLEASH_URL=
UNLEASH_API_TOKEN=`;
            default:
                return '';
        }
    }
}

export const featureFlagsGenerator = FeatureFlagsGenerator.getInstance();
