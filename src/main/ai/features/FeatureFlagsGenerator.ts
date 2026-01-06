/**
 * Feature Flags Generator
 * 
 * Generate feature flag systems using LaunchDarkly,
 * Split.io, or custom implementations.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureFlagProvider = 'launchdarkly' | 'split' | 'custom';

export interface FeatureFlag {
    key: string;
    name: string;
    description: string;
    defaultValue: boolean;
    variations?: Array<{ value: any; name: string }>;
}

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
        return `import * as LDClient from 'launchdarkly-node-server-sdk';

const ldClient = LDClient.init(process.env.LAUNCHDARKLY_SDK_KEY!);

export async function waitForLDClient() {
    await ldClient.waitForInitialization();
}

export async function getFeatureFlag(flagKey: string, user: any, defaultValue: boolean = false): Promise<boolean> {
    try {
        return await ldClient.variation(flagKey, user, defaultValue);
    } catch (error) {
        console.error('Feature flag error:', error);
        return defaultValue;
    }
}

export async function getAllFlags(user: any): Promise<Record<string, any>> {
    try {
        return await ldClient.allFlagsState(user);
    } catch (error) {
        console.error('Error getting all flags:', error);
        return {};
    }
}

export function trackEvent(eventName: string, user: any, data?: any) {
    ldClient.track(eventName, user, data);
}

export async function closeLDClient() {
    await ldClient.close();
}

// React Hook
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string, defaultValue: boolean = false) {
    const [enabled, setEnabled] = useState(defaultValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = { key: 'user-id' }; // Get from auth context
        
        getFeatureFlag(flagKey, user, defaultValue).then(value => {
            setEnabled(value);
            setLoading(false);
        });
    }, [flagKey, defaultValue]);

    return { enabled, loading };
}
`;
    }

    // ========================================================================
    // SPLIT.IO
    // ========================================================================

    generateSplit(): string {
        return `import { SplitFactory } from '@splitsoftware/splitio';

const factory = SplitFactory({
    core: {
        authorizationKey: process.env.SPLIT_API_KEY!,
        key: 'customer-id',
    },
});

const client = factory.client();

export async function waitForSplitReady(): Promise<void> {
    return new Promise((resolve) => {
        client.on(client.Event.SDK_READY, () => resolve());
    });
}

export function getTreatment(featureName: string, attributes?: any): string {
    return client.getTreatment(featureName, attributes);
}

export function isFeatureEnabled(featureName: string, attributes?: any): boolean {
    return getTreatment(featureName, attributes) === 'on';
}

export function getTreatments(featureNames: string[], attributes?: any): Record<string, string> {
    return client.getTreatments(featureNames, attributes);
}

export function track(eventType: string, value?: number, properties?: any) {
    client.track(eventType, value, properties);
}

export function destroySplit() {
    client.destroy();
}
`;
    }

    // ========================================================================
    // CUSTOM FEATURE FLAGS
    // ========================================================================

    generateCustomFeatureFlags(flags: FeatureFlag[]): string {
        return `/**
 * Custom Feature Flags System
 */

export interface User {
    id: string;
    email?: string;
    roles?: string[];
    attributes?: Record<string, any>;
}

export interface FeatureFlag {
    key: string;
    enabled: boolean;
    rolloutPercentage?: number;
    targetRules?: Array<{
        attribute: string;
        operator: 'equals' | 'contains' | 'in';
        values: any[];
    }>;
    variants?: Array<{
        key: string;
        value: any;
        weight: number;
    }>;
}

// Feature flags database
const featureFlags: Map<string, FeatureFlag> = new Map([
${flags.map(flag => `    ['${flag.key}', {
        key: '${flag.key}',
        enabled: ${flag.defaultValue},
        rolloutPercentage: 100,
    }],`).join('\n')}
]);

// Check if feature is enabled for user
export function isFeatureEnabled(flagKey: string, user: User): boolean {
    const flag = featureFlags.get(flagKey);
    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        const hash = hashUser(user.id + flagKey);
        if (hash % 100 >= flag.rolloutPercentage) {
            return false;
        }
    }

    // Check target rules
    if (flag.targetRules && flag.targetRules.length > 0) {
        return evaluateRules(flag.targetRules, user);
    }

    return true;
}

// Get feature variant
export function getFeatureVariant(flagKey: string, user: User): any {
    const flag = featureFlags.get(flagKey);
    if (!flag?.variants || !flag.enabled) return null;

    const hash = hashUser(user.id + flagKey);
    let cumulative = 0;

    for (const variant of flag.variants) {
        cumulative += variant.weight;
        if (hash % 100 < cumulative) {
            return variant.value;
        }
    }

    return flag.variants[0]?.value;
}

// Evaluate targeting rules
function evaluateRules(rules: FeatureFlag['targetRules'], user: User): boolean {
    if (!rules) return true;

    return rules.every(rule => {
        const userValue = (user.attributes as any)?.[rule.attribute] || (user as any)[rule.attribute];

        switch (rule.operator) {
            case 'equals':
                return rule.values.includes(userValue);
            case 'contains':
                return rule.values.some(v => String(userValue).includes(v));
            case 'in':
                return rule.values.includes(userValue);
            default:
                return false;
        }
    });
}

// Simple hash function
function hashUser(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// React Hook
import { useState, useEffect, useContext, createContext } from 'react';

const UserContext = createContext<User | null>(null);

export function useFeatureFlag(flagKey: string): boolean {
    const user = useContext(UserContext);
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (user) {
            setEnabled(isFeatureEnabled(flagKey, user));
        }
    }, [flagKey, user]);

    return enabled;
}

export function useFeatureVariant(flagKey: string): any {
    const user = useContext(UserContext);
    const [variant, setVariant] = useState(null);

    useEffect(() => {
        if (user) {
            setVariant(getFeatureVariant(flagKey, user));
        }
    }, [flagKey, user]);

    return variant;
}

// Feature Flag Component
export function FeatureFlag({ flag, children }: { flag: string; children: React.ReactNode }) {
    const enabled = useFeatureFlag(flag);
    return enabled ? <>{children}</> : null;
}

// Admin API
export async function updateFeatureFlag(flagKey: string, updates: Partial<FeatureFlag>) {
    const flag = featureFlags.get(flagKey);
    if (flag) {
        featureFlags.set(flagKey, { ...flag, ...updates });
    }
}

export function getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(featureFlags.values());
}
`;
    }

    // ========================================================================
    // FEATURE FLAG ADMIN UI
    // ========================================================================

    generateFeatureFlagAdmin(): string {
        return `import { useState, useEffect } from 'react';

interface FeatureFlag {
    key: string;
    name: string;
    enabled: boolean;
    rolloutPercentage: number;
    description?: string;
}

export function FeatureFlagAdmin() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFlags();
    }, []);

    const fetchFlags = async () => {
        try {
            const response = await fetch('/api/feature-flags');
            const data = await response.json();
            setFlags(data);
        } catch (error) {
            console.error('Failed to fetch feature flags:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = async (key: string, enabled: boolean) => {
        try {
            await fetch(\`/api/feature-flags/\${key}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled }),
            });
            await fetchFlags();
        } catch (error) {
            console.error('Failed to update flag:', error);
        }
    };

    const updateRollout = async (key: string, percentage: number) => {
        try {
            await fetch(\`/api/feature-flags/\${key}\`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rolloutPercentage: percentage }),
            });
            await fetchFlags();
        } catch (error) {
            console.error('Failed to update rollout:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Feature Flags</h1>

            <div className="space-y-4">
                {flags.map((flag) => (
                    <div key={flag.key} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">{flag.name}</h3>
                                <p className="text-sm text-gray-500">{flag.key}</p>
                                {flag.description && (
                                    <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                                )}
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={flag.enabled}
                                    onChange={(e) => toggleFlag(flag.key, e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-2">
                                Rollout Percentage: {flag.rolloutPercentage}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={flag.rolloutPercentage}
                                onChange={(e) => updateRollout(flag.key, parseInt(e.target.value))}
                                className="w-full"
                                disabled={!flag.enabled}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
`;
    }
}

export const featureFlagsGenerator = FeatureFlagsGenerator.getInstance();
