/**
 * Configuration Management Generator
 * 
 * Generate configuration management systems with
 * environment variables, config files, and remote config.
 */

import { EventEmitter } from 'events';

// ============================================================================
// CONFIGURATION MANAGEMENT GENERATOR
// ============================================================================

export class ConfigurationGenerator extends EventEmitter {
    private static instance: ConfigurationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ConfigurationGenerator {
        if (!ConfigurationGenerator.instance) {
            ConfigurationGenerator.instance = new ConfigurationGenerator();
        }
        return ConfigurationGenerator.instance;
    }

    // ========================================================================
    // ENVIRONMENT CONFIG
    // ========================================================================

    generateEnvConfig(): string {
        return `import { z } from 'zod';

// ============================================================================
// ENVIRONMENT SCHEMA
// ============================================================================

const envSchema = z.object({
    // App
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3000'),
    APP_NAME: z.string().default('My App'),
    APP_URL: z.string().url(),

    // Database
    DATABASE_URL: z.string().url(),
    DB_POOL_MIN: z.string().transform(Number).default('2'),
    DB_POOL_MAX: z.string().transform(Number).default('10'),

    // Redis
    REDIS_URL: z.string().url().optional(),
    REDIS_PASSWORD: z.string().optional(),

    // Authentication
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('7d'),
    SESSION_SECRET: z.string().min(32),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).default('587'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    // AWS
    AWS_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),

    // Monitoring
    SENTRY_DSN: z.string().url().optional(),
    DATADOG_API_KEY: z.string().optional(),

    // Feature Flags
    LAUNCHDARKLY_SDK_KEY: z.string().optional(),

    // Payment
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

// ============================================================================
// PARSE AND VALIDATE
// ============================================================================

function loadConfig() {
    try {
        const parsed = envSchema.parse(process.env);
        return parsed;
    } catch (error) {
        console.error('❌ Invalid environment variables:');
        if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
                console.error(\`  - \${err.path.join('.')}: \${err.message}\`);
            });
        }
        process.exit(1);
    }
}

export const config = loadConfig();

// ============================================================================
// TYPED CONFIG ACCESS
// ============================================================================

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

export type Config = z.infer<typeof envSchema>;
`;
    }

    // ========================================================================
    // CONFIG FILE LOADER
    // ========================================================================

    generateConfigLoader(): string {
        return `import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

// ============================================================================
// CONFIG LOADER
// ============================================================================

export interface AppConfig {
    app: {
        name: string;
        version: string;
        port: number;
    };
    database: {
        host: string;
        port: number;
        name: string;
        pool: {
            min: number;
            max: number;
        };
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
    cors: {
        origins: string[];
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
}

class ConfigLoader {
    private config: AppConfig | null = null;
    private readonly configDir = path.join(process.cwd(), 'config');

    load(): AppConfig {
        if (this.config) return this.config;

        const env = process.env.NODE_ENV || 'development';
        const configFile = path.join(this.configDir, \`\${env}.yml\`);
        const defaultConfig = path.join(this.configDir, 'default.yml');

        let config: Partial<AppConfig> = {};

        // Load default config
        if (fs.existsSync(defaultConfig)) {
            const defaultYaml = fs.readFileSync(defaultConfig, 'utf8');
            config = YAML.parse(defaultYaml);
        }

        // Merge environment-specific config
        if (fs.existsSync(configFile)) {
            const envYaml = fs.readFileSync(configFile, 'utf8');
            const envConfig = YAML.parse(envYaml);
            config = this.deepMerge(config, envConfig);
        }

        // Override with environment variables
        config = this.applyEnvOverrides(config);

        this.config = config as AppConfig;
        return this.config;
    }

    private deepMerge(target: any, source: any): any {
        const output = { ...target };
        
        for (const key in source) {
            if (source[key] instanceof Object && key in target) {
                output[key] = this.deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        }
        
        return output;
    }

    private applyEnvOverrides(config: any): any {
        // Example: DATABASE_HOST -> config.database.host
        const envMappings: Record<string, string> = {
            'APP_PORT': 'app.port',
            'DATABASE_HOST': 'database.host',
            'DATABASE_PORT': 'database.port',
            'CACHE_ENABLED': 'cache.enabled',
        };

        for (const [envKey, configPath] of Object.entries(envMappings)) {
            const envValue = process.env[envKey];
            if (envValue !== undefined) {
                this.setNestedValue(config, configPath, this.parseValue(envValue));
            }
        }

        return config;
    }

    private setNestedValue(obj: any, path: string, value: any) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    private parseValue(value: string): any {
        // Try to parse as JSON
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(Number(value))) return Number(value);
        return value;
    }

    reload(): AppConfig {
        this.config = null;
        return this.load();
    }
}

export const configLoader = new ConfigLoader();
export const config = configLoader.load();
`;
    }

    // ========================================================================
    // REMOTE CONFIG (Firebase)
    // ========================================================================

    generateRemoteConfig(): string {
        return `import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    }),
});

const remoteConfig = admin.remoteConfig();

// ============================================================================
// REMOTE CONFIG MANAGER
// ============================================================================

export class RemoteConfigManager {
    private cache: Map<string, any> = new Map();
    private template: any = null;

    async init() {
        await this.fetchTemplate();
    }

    async fetchTemplate() {
        try {
            this.template = await remoteConfig.getTemplate();
            console.log('Remote config template fetched');
        } catch (error) {
            console.error('Failed to fetch remote config:', error);
        }
    }

    getValue<T = any>(key: string, defaultValue: T): T {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const param = this.template?.parameters?.[key];
        if (!param) return defaultValue;

        const value = param.defaultValue?.value || defaultValue;
        this.cache.set(key, value);
        return value;
    }

    async setValue(key: string, value: any, description?: string) {
        try {
            const template = await remoteConfig.getTemplate();
            
            template.parameters[key] = {
                defaultValue: { value: String(value) },
                description: description || '',
            };

            await remoteConfig.publishTemplate(template);
            this.cache.set(key, value);
        } catch (error) {
            console.error('Failed to set remote config:', error);
            throw error;
        }
    }

    async getAllValues(): Promise<Record<string, any>> {
        if (!this.template) {
            await this.fetchTemplate();
        }

        const values: Record<string, any> = {};
        
        for (const [key, param] of Object.entries(this.template.parameters || {})) {
            values[key] = (param as any).defaultValue?.value;
        }

        return values;
    }

    clearCache() {
        this.cache.clear();
    }
}

export const remoteConfigManager = new RemoteConfigManager();

// Initialize on app start
remoteConfigManager.init();
`;
    }

    // ========================================================================
    // CONFIG TYPES GENERATOR
    // ========================================================================

    generateConfigTypes(): string {
        return `// Auto-generated configuration types

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    pool: {
        min: number;
        max: number;
    };
    ssl: boolean;
}

export interface CacheConfig {
    enabled: boolean;
    provider: 'redis' | 'memory';
    ttl: number;
    maxSize: number;
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
}

export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
}

export interface EmailConfig {
    provider: 'smtp' | 'sendgrid' | 'ses';
    from: string;
    replyTo?: string;
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
}

export interface LoggingConfig {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple';
    console: boolean;
    file?: {
        enabled: boolean;
        path: string;
        maxSize: string;
        maxFiles: number;
    };
}

export interface RateLimitConfig {
    enabled: boolean;
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
}

export interface AppConfig {
    env: 'development' | 'production' | 'test';
    port: number;
    host: string;
    database: DatabaseConfig;
    cache: CacheConfig;
    auth: AuthConfig;
    email: EmailConfig;
    logging: LoggingConfig;
    rateLimit: RateLimitConfig;
}
`;
    }
}

export const configurationGenerator = ConfigurationGenerator.getInstance();
