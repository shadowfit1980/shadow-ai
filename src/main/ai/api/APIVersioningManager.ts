/**
 * API Versioning Manager
 * 
 * Manage API versions, generate version headers,
 * and handle API deprecation strategies.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type VersioningStrategy = 'url' | 'header' | 'query' | 'content-type';

export interface APIVersion {
    version: string;
    status: 'current' | 'deprecated' | 'sunset' | 'beta' | 'alpha';
    releaseDate: Date;
    deprecationDate?: Date;
    sunsetDate?: Date;
    changelog: string[];
    breakingChanges: string[];
}

export interface VersionConfig {
    strategy: VersioningStrategy;
    currentVersion: string;
    defaultVersion?: string;
    headerName?: string;
    queryParam?: string;
    supportedVersions: string[];
    deprecatedVersions: string[];
}

export interface EndpointVersion {
    endpoint: string;
    method: string;
    introducedIn: string;
    deprecatedIn?: string;
    removedIn?: string;
    changes: Array<{ version: string; change: string }>;
}

// ============================================================================
// API VERSIONING MANAGER
// ============================================================================

export class APIVersioningManager extends EventEmitter {
    private static instance: APIVersioningManager;
    private versions: Map<string, APIVersion> = new Map();
    private endpoints: Map<string, EndpointVersion> = new Map();
    private config: VersionConfig = {
        strategy: 'url',
        currentVersion: 'v1',
        supportedVersions: ['v1'],
        deprecatedVersions: [],
    };

    private constructor() {
        super();
    }

    static getInstance(): APIVersioningManager {
        if (!APIVersioningManager.instance) {
            APIVersioningManager.instance = new APIVersioningManager();
        }
        return APIVersioningManager.instance;
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    configure(config: Partial<VersionConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configured', this.config);
    }

    getConfig(): VersionConfig {
        return { ...this.config };
    }

    // ========================================================================
    // VERSION MANAGEMENT
    // ========================================================================

    registerVersion(version: APIVersion): void {
        this.versions.set(version.version, version);
        this.emit('versionRegistered', version);
    }

    getVersion(version: string): APIVersion | undefined {
        return this.versions.get(version);
    }

    listVersions(): APIVersion[] {
        return Array.from(this.versions.values())
            .sort((a, b) => this.compareVersions(b.version, a.version));
    }

    deprecateVersion(version: string, sunsetDate?: Date): void {
        const ver = this.versions.get(version);
        if (ver) {
            ver.status = 'deprecated';
            ver.deprecationDate = new Date();
            ver.sunsetDate = sunsetDate;
            this.config.deprecatedVersions.push(version);
            this.emit('versionDeprecated', ver);
        }
    }

    // ========================================================================
    // MIDDLEWARE GENERATION
    // ========================================================================

    generateExpressMiddleware(): string {
        return `import { Request, Response, NextFunction } from 'express';

const SUPPORTED_VERSIONS = ${JSON.stringify(this.config.supportedVersions)};
const DEPRECATED_VERSIONS = ${JSON.stringify(this.config.deprecatedVersions)};
const DEFAULT_VERSION = '${this.config.defaultVersion || this.config.currentVersion}';
const CURRENT_VERSION = '${this.config.currentVersion}';

interface VersionedRequest extends Request {
  apiVersion?: string;
}

export function apiVersioning(req: VersionedRequest, res: Response, next: NextFunction) {
  let version: string | undefined;

  ${this.getVersionExtractionCode()}

  if (!version) {
    version = DEFAULT_VERSION;
  }

  // Validate version
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return res.status(400).json({
      error: 'Unsupported API version',
      message: \`Version \${version} is not supported. Supported versions: \${SUPPORTED_VERSIONS.join(', ')}\`,
      currentVersion: CURRENT_VERSION,
    });
  }

  // Add deprecation warning headers
  if (DEPRECATED_VERSIONS.includes(version)) {
    res.set('Deprecation', 'true');
    res.set('Sunset', '${this.config.deprecatedVersions.length > 0 ? this.versions.get(this.config.deprecatedVersions[0])?.sunsetDate?.toISOString() || '' : ''}');
    res.set('Link', \`</api/\${CURRENT_VERSION}>; rel="successor-version"\`);
  }

  // Add version to request
  req.apiVersion = version;
  res.set('X-API-Version', version);

  next();
}

// Version-specific route handler
export function versioned(handlers: Record<string, (req: Request, res: Response) => void>) {
  return (req: VersionedRequest, res: Response) => {
    const version = req.apiVersion || DEFAULT_VERSION;
    
    // Find best matching version
    const handler = handlers[version] || handlers[DEFAULT_VERSION];
    
    if (!handler) {
      return res.status(500).json({ error: 'No handler for version' });
    }
    
    return handler(req, res);
  };
}
`;
    }

    private getVersionExtractionCode(): string {
        switch (this.config.strategy) {
            case 'url':
                return `
  // URL path versioning: /api/v1/resource
  const match = req.path.match(/\\/v(\\d+)/);
  if (match) {
    version = 'v' + match[1];
  }`;
            case 'header':
                return `
  // Header versioning: X-API-Version: v1
  version = req.get('${this.config.headerName || 'X-API-Version'}');`;
            case 'query':
                return `
  // Query param versioning: ?version=v1
  version = req.query.${this.config.queryParam || 'version'} as string;`;
            case 'content-type':
                return `
  // Content-Type versioning: application/vnd.api.v1+json
  const contentType = req.get('Accept');
  const match = contentType?.match(/vnd\\.api\\.(v\\d+)/);
  if (match) {
    version = match[1];
  }`;
        }
    }

    // ========================================================================
    // CHANGELOG GENERATION
    // ========================================================================

    generateChangelog(): string {
        const versions = this.listVersions();

        return `# API Changelog

${versions.map(v => `## ${v.version} ${this.getStatusBadge(v.status)}
**Released**: ${v.releaseDate.toISOString().split('T')[0]}
${v.deprecationDate ? `**Deprecated**: ${v.deprecationDate.toISOString().split('T')[0]}` : ''}
${v.sunsetDate ? `**Sunset**: ${v.sunsetDate.toISOString().split('T')[0]}` : ''}

### Changes
${v.changelog.map(c => `- ${c}`).join('\n')}

${v.breakingChanges.length > 0 ? `### ⚠️ Breaking Changes
${v.breakingChanges.map(c => `- ${c}`).join('\n')}` : ''}
`).join('\n---\n\n')}`;
    }

    private getStatusBadge(status: APIVersion['status']): string {
        switch (status) {
            case 'current': return '🟢 Current';
            case 'deprecated': return '🟡 Deprecated';
            case 'sunset': return '🔴 Sunset';
            case 'beta': return '🔵 Beta';
            case 'alpha': return '⚪ Alpha';
        }
    }

    // ========================================================================
    // OPENAPI EXTENSION
    // ========================================================================

    generateOpenAPIVersionInfo(): Record<string, any> {
        return {
            'x-api-versioning': {
                strategy: this.config.strategy,
                currentVersion: this.config.currentVersion,
                supportedVersions: this.config.supportedVersions,
                deprecatedVersions: this.config.deprecatedVersions,
                ...(this.config.strategy === 'header' && { headerName: this.config.headerName }),
                ...(this.config.strategy === 'query' && { queryParam: this.config.queryParam }),
            },
            'x-api-versions': Object.fromEntries(
                Array.from(this.versions.entries()).map(([v, info]) => [v, {
                    status: info.status,
                    releaseDate: info.releaseDate.toISOString(),
                    deprecationDate: info.deprecationDate?.toISOString(),
                    sunsetDate: info.sunsetDate?.toISOString(),
                }])
            ),
        };
    }

    // ========================================================================
    // MIGRATION GUIDE GENERATION
    // ========================================================================

    generateMigrationGuide(fromVersion: string, toVersion: string): string {
        const from = this.versions.get(fromVersion);
        const to = this.versions.get(toVersion);

        if (!from || !to) {
            return 'Version not found';
        }

        const versionsInRange = this.listVersions()
            .filter(v => this.compareVersions(v.version, fromVersion) > 0 &&
                this.compareVersions(v.version, toVersion) <= 0);

        return `# Migration Guide: ${fromVersion} → ${toVersion}

## Overview
This guide covers all breaking changes and required updates when migrating from ${fromVersion} to ${toVersion}.

${versionsInRange.map(v => `## ${v.version}

### Breaking Changes
${v.breakingChanges.length > 0 ? v.breakingChanges.map(c => `- ${c}`).join('\n') : 'None'}

### All Changes
${v.changelog.map(c => `- ${c}`).join('\n')}
`).join('\n')}

## Checklist
- [ ] Review all breaking changes
- [ ] Update API calls to new endpoints
- [ ] Update request/response models
- [ ] Update error handling
- [ ] Run integration tests
- [ ] Update API documentation
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private compareVersions(a: string, b: string): number {
        const parseVersion = (v: string) => {
            const num = v.replace(/[^\d]/g, '');
            return parseInt(num) || 0;
        };
        return parseVersion(a) - parseVersion(b);
    }

    // ========================================================================
    // ENDPOINT MANAGEMENT
    // ========================================================================

    registerEndpoint(endpoint: EndpointVersion): void {
        const key = `${endpoint.method}:${endpoint.endpoint}`;
        this.endpoints.set(key, endpoint);
    }

    getEndpointHistory(method: string, endpoint: string): EndpointVersion | undefined {
        return this.endpoints.get(`${method}:${endpoint}`);
    }

    listEndpointsForVersion(version: string): string[] {
        return Array.from(this.endpoints.values())
            .filter(e =>
                this.compareVersions(e.introducedIn, version) <= 0 &&
                (!e.removedIn || this.compareVersions(e.removedIn, version) > 0)
            )
            .map(e => `${e.method} ${e.endpoint}`);
    }
}

export const apiVersioningManager = APIVersioningManager.getInstance();
