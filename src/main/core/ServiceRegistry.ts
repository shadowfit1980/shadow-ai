/**
 * ServiceRegistry - Dynamic Service Discovery and Management
 * 
 * Provides centralized registration, discovery, and health monitoring
 * for all Shadow AI services. Addresses the "599 services" consolidation need.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ServiceStatus = 'registered' | 'running' | 'paused' | 'error' | 'stopped';
export type ServiceCategory =
    | 'ai-core'           // Core AI capabilities
    | 'code-generation'   // Code generation services
    | 'analysis'          // Code analysis services
    | 'memory'            // Memory and context services
    | 'tooling'           // Development tools
    | 'integration'       // External integrations
    | 'security'          // Security services
    | 'ui'                // UI-related services
    | 'infrastructure'    // Infrastructure services
    | 'domain-specific';  // Domain-specific agents

export interface ServiceCapability {
    name: string;
    description: string;
    version: string;
}

export interface ServiceDependency {
    serviceId: string;
    required: boolean;
}

export interface ServiceRegistration {
    id: string;
    name: string;
    description: string;
    category: ServiceCategory;
    capabilities: ServiceCapability[];
    dependencies: ServiceDependency[];
    version: string;
    status: ServiceStatus;
    registeredAt: Date;
    lastHealthCheck?: Date;
    healthScore: number; // 0-100
    usageCount: number;
    errorCount: number;
    averageLatencyMs: number;
    instance?: any;
    getInstanceFn?: () => any;
}

export interface ServiceQuery {
    category?: ServiceCategory;
    capability?: string;
    status?: ServiceStatus;
    minHealthScore?: number;
}

export interface ServiceHealth {
    serviceId: string;
    status: ServiceStatus;
    healthScore: number;
    lastCheck: Date;
    details?: Record<string, any>;
}

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

export class ServiceRegistry extends EventEmitter {
    private static instance: ServiceRegistry;

    private services: Map<string, ServiceRegistration> = new Map();
    private capabilityIndex: Map<string, Set<string>> = new Map();
    private categoryIndex: Map<ServiceCategory, Set<string>> = new Map();
    private healthCheckInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.startHealthChecks();
    }

    static getInstance(): ServiceRegistry {
        if (!ServiceRegistry.instance) {
            ServiceRegistry.instance = new ServiceRegistry();
        }
        return ServiceRegistry.instance;
    }

    // ========================================================================
    // REGISTRATION
    // ========================================================================

    /**
     * Register a service
     */
    register(
        id: string,
        name: string,
        options: {
            description?: string;
            category: ServiceCategory;
            capabilities?: ServiceCapability[];
            dependencies?: ServiceDependency[];
            version?: string;
            instance?: any;
            getInstanceFn?: () => any;
        }
    ): ServiceRegistration {
        const registration: ServiceRegistration = {
            id,
            name,
            description: options.description || '',
            category: options.category,
            capabilities: options.capabilities || [],
            dependencies: options.dependencies || [],
            version: options.version || '1.0.0',
            status: 'registered',
            registeredAt: new Date(),
            healthScore: 100,
            usageCount: 0,
            errorCount: 0,
            averageLatencyMs: 0,
            instance: options.instance,
            getInstanceFn: options.getInstanceFn
        };

        this.services.set(id, registration);

        // Index by category
        if (!this.categoryIndex.has(options.category)) {
            this.categoryIndex.set(options.category, new Set());
        }
        this.categoryIndex.get(options.category)!.add(id);

        // Index by capabilities
        for (const cap of registration.capabilities) {
            if (!this.capabilityIndex.has(cap.name)) {
                this.capabilityIndex.set(cap.name, new Set());
            }
            this.capabilityIndex.get(cap.name)!.add(id);
        }

        console.log(`📦 [ServiceRegistry] Registered: ${name} (${id})`);
        this.emit('service:registered', registration);

        return registration;
    }

    /**
     * Unregister a service
     */
    unregister(id: string): boolean {
        const service = this.services.get(id);
        if (!service) return false;

        // Remove from indices
        this.categoryIndex.get(service.category)?.delete(id);
        for (const cap of service.capabilities) {
            this.capabilityIndex.get(cap.name)?.delete(id);
        }

        this.services.delete(id);
        this.emit('service:unregistered', { id });
        return true;
    }

    // ========================================================================
    // DISCOVERY
    // ========================================================================

    /**
     * Get a service by ID
     */
    get(id: string): ServiceRegistration | undefined {
        return this.services.get(id);
    }

    /**
     * Get a service instance
     */
    getInstance<T>(id: string): T | undefined {
        const service = this.services.get(id);
        if (!service) return undefined;

        // Track usage
        service.usageCount++;

        if (service.instance) {
            return service.instance as T;
        }


        if (service.getInstanceFn) {
            return service.getInstanceFn() as T;
        }

        return undefined;
    }

    /**
     * Find services by capability
     */
    findByCapability(capability: string): ServiceRegistration[] {
        const ids = this.capabilityIndex.get(capability) || new Set();
        return Array.from(ids).map(id => this.services.get(id)!).filter(Boolean);
    }

    /**
     * Find services by category
     */
    findByCategory(category: ServiceCategory): ServiceRegistration[] {
        const ids = this.categoryIndex.get(category) || new Set();
        return Array.from(ids).map(id => this.services.get(id)!).filter(Boolean);
    }

    /**
     * Query services with multiple criteria
     */
    query(options: ServiceQuery): ServiceRegistration[] {
        let results = Array.from(this.services.values());

        if (options.category) {
            const categoryIds = this.categoryIndex.get(options.category) || new Set();
            results = results.filter(s => categoryIds.has(s.id));
        }

        if (options.capability) {
            const capIds = this.capabilityIndex.get(options.capability) || new Set();
            results = results.filter(s => capIds.has(s.id));
        }

        if (options.status) {
            results = results.filter(s => s.status === options.status);
        }

        if (options.minHealthScore !== undefined) {
            results = results.filter(s => s.healthScore >= options.minHealthScore!);
        }

        return results;
    }

    /**
     * Get all services
     */
    getAll(): ServiceRegistration[] {
        return Array.from(this.services.values());
    }

    // ========================================================================
    // HEALTH MONITORING
    // ========================================================================

    /**
     * Update service status
     */
    updateStatus(id: string, status: ServiceStatus): void {
        const service = this.services.get(id);
        if (service) {
            service.status = status;
            this.emit('service:statusChange', { id, status });
        }
    }

    /**
     * Record service error
     */
    recordError(id: string, error?: string): void {
        const service = this.services.get(id);
        if (service) {
            service.errorCount++;
            service.healthScore = Math.max(0, service.healthScore - 5);
            this.emit('service:error', { id, error, errorCount: service.errorCount });
        }
    }

    /**
     * Record service success with latency
     */
    recordSuccess(id: string, latencyMs: number): void {
        const service = this.services.get(id);
        if (service) {
            // Update average latency (exponential moving average)
            service.averageLatencyMs = service.averageLatencyMs * 0.9 + latencyMs * 0.1;

            // Recover health score
            service.healthScore = Math.min(100, service.healthScore + 1);
        }
    }

    /**
     * Get health status for all services
     */
    getHealthStatus(): ServiceHealth[] {
        return Array.from(this.services.values()).map(s => ({
            serviceId: s.id,
            status: s.status,
            healthScore: s.healthScore,
            lastCheck: s.lastHealthCheck || s.registeredAt,
            details: {
                usageCount: s.usageCount,
                errorCount: s.errorCount,
                averageLatencyMs: s.averageLatencyMs
            }
        }));
    }

    private startHealthChecks(): void {
        this.healthCheckInterval = setInterval(() => {
            for (const service of this.services.values()) {
                service.lastHealthCheck = new Date();

                // Check for stale services (no usage in 1 hour)
                if (service.usageCount === 0 && service.status === 'running') {
                    // Mark as paused if unused
                }
            }
            this.emit('healthCheck:complete');
        }, 60000); // Every minute
    }

    // ========================================================================
    // DEPENDENCY RESOLUTION
    // ========================================================================

    /**
     * Check if all dependencies are available
     */
    checkDependencies(id: string): {
        satisfied: boolean;
        missing: string[];
        optional: string[];
    } {
        const service = this.services.get(id);
        if (!service) {
            return { satisfied: false, missing: [id], optional: [] };
        }

        const missing: string[] = [];
        const optional: string[] = [];

        for (const dep of service.dependencies) {
            const depService = this.services.get(dep.serviceId);
            if (!depService || depService.status === 'stopped') {
                if (dep.required) {
                    missing.push(dep.serviceId);
                } else {
                    optional.push(dep.serviceId);
                }
            }
        }

        return {
            satisfied: missing.length === 0,
            missing,
            optional
        };
    }

    /**
     * Get dependency graph
     */
    getDependencyGraph(): Map<string, string[]> {
        const graph = new Map<string, string[]>();

        for (const service of this.services.values()) {
            graph.set(service.id, service.dependencies.map(d => d.serviceId));
        }

        return graph;
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get registry statistics
     */
    getStats(): {
        totalServices: number;
        byCategory: Record<ServiceCategory, number>;
        byStatus: Record<ServiceStatus, number>;
        totalCapabilities: number;
        averageHealthScore: number;
        mostUsed: Array<{ id: string; name: string; usageCount: number }>;
    } {
        const byCategory = {} as Record<ServiceCategory, number>;
        const byStatus = {} as Record<ServiceStatus, number>;
        let totalHealth = 0;

        for (const service of this.services.values()) {
            byCategory[service.category] = (byCategory[service.category] || 0) + 1;
            byStatus[service.status] = (byStatus[service.status] || 0) + 1;
            totalHealth += service.healthScore;
        }

        const sortedByUsage = Array.from(this.services.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)
            .map(s => ({ id: s.id, name: s.name, usageCount: s.usageCount }));

        return {
            totalServices: this.services.size,
            byCategory,
            byStatus,
            totalCapabilities: this.capabilityIndex.size,
            averageHealthScore: this.services.size > 0 ? totalHealth / this.services.size : 0,
            mostUsed: sortedByUsage
        };
    }

    /**
     * Clear all services (for testing)
     */
    clear(): void {
        this.services.clear();
        this.capabilityIndex.clear();
        this.categoryIndex.clear();
    }
}

// Export singleton
export const serviceRegistry = ServiceRegistry.getInstance();

// ============================================================================
// AUTO-REGISTRATION DECORATOR
// ============================================================================

/**
 * Decorator to auto-register services
 */
export function RegisterService(options: {
    id: string;
    name: string;
    category: ServiceCategory;
    capabilities?: ServiceCapability[];
}) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);

                serviceRegistry.register(options.id, options.name, {
                    category: options.category,
                    capabilities: options.capabilities,
                    instance: this
                });
            }
        };
    };
}
