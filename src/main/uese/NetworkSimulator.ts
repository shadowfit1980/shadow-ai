/**
 * UESE Network Simulator
 * 
 * Simulates network conditions including latency, bandwidth,
 * packet loss, and various network profiles.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type NetworkType = 'ethernet' | 'wifi' | '4g' | '5g' | '3g' | 'satellite' | 'offline';

export interface NetworkProfile {
    id: string;
    name: string;
    type: NetworkType;
    latencyMs: { min: number; max: number; avg: number };
    bandwidthMbps: { download: number; upload: number };
    packetLoss: number;      // 0-1
    jitter: number;          // ms
    mtu: number;
    congestion: number;      // 0-1
}

export interface NetworkRequest {
    id: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers: Record<string, string>;
    body?: any;
    timestamp: number;
    size: number;
}

export interface NetworkResponse {
    requestId: string;
    status: number;
    headers: Record<string, string>;
    body?: any;
    size: number;
    latency: number;
    timestamp: number;
}

export interface NetworkEvent {
    type: 'request' | 'response' | 'error' | 'timeout' | 'dns' | 'tls';
    timestamp: number;
    data: any;
}

export interface DNSRecord {
    domain: string;
    ip: string;
    ttl: number;
    type: 'A' | 'AAAA' | 'CNAME' | 'MX';
}

export interface TLSInfo {
    version: 'TLS1.2' | 'TLS1.3';
    cipher: string;
    certificateValid: boolean;
    certificateExpiry: Date;
}

// ============================================================================
// NETWORK PROFILES
// ============================================================================

const NETWORK_PROFILES: Record<string, NetworkProfile> = {
    'fiber': {
        id: 'fiber',
        name: 'Fiber (1Gbps)',
        type: 'ethernet',
        latencyMs: { min: 1, max: 5, avg: 3 },
        bandwidthMbps: { download: 1000, upload: 500 },
        packetLoss: 0.0001,
        jitter: 1,
        mtu: 1500,
        congestion: 0
    },
    'wifi-fast': {
        id: 'wifi-fast',
        name: 'Fast WiFi',
        type: 'wifi',
        latencyMs: { min: 5, max: 20, avg: 10 },
        bandwidthMbps: { download: 300, upload: 100 },
        packetLoss: 0.001,
        jitter: 5,
        mtu: 1500,
        congestion: 0.1
    },
    'wifi-slow': {
        id: 'wifi-slow',
        name: 'Slow WiFi',
        type: 'wifi',
        latencyMs: { min: 30, max: 100, avg: 50 },
        bandwidthMbps: { download: 10, upload: 2 },
        packetLoss: 0.03,
        jitter: 20,
        mtu: 1500,
        congestion: 0.4
    },
    '5g': {
        id: '5g',
        name: '5G Mobile',
        type: '5g',
        latencyMs: { min: 10, max: 30, avg: 15 },
        bandwidthMbps: { download: 500, upload: 100 },
        packetLoss: 0.005,
        jitter: 8,
        mtu: 1400,
        congestion: 0.15
    },
    '4g-lte': {
        id: '4g-lte',
        name: '4G LTE',
        type: '4g',
        latencyMs: { min: 30, max: 80, avg: 50 },
        bandwidthMbps: { download: 50, upload: 20 },
        packetLoss: 0.01,
        jitter: 15,
        mtu: 1400,
        congestion: 0.25
    },
    '3g': {
        id: '3g',
        name: '3G Mobile',
        type: '3g',
        latencyMs: { min: 100, max: 500, avg: 200 },
        bandwidthMbps: { download: 2, upload: 0.5 },
        packetLoss: 0.05,
        jitter: 50,
        mtu: 1400,
        congestion: 0.5
    },
    'satellite': {
        id: 'satellite',
        name: 'Satellite',
        type: 'satellite',
        latencyMs: { min: 500, max: 800, avg: 600 },
        bandwidthMbps: { download: 50, upload: 10 },
        packetLoss: 0.02,
        jitter: 100,
        mtu: 1400,
        congestion: 0.3
    },
    'offline': {
        id: 'offline',
        name: 'Offline',
        type: 'offline',
        latencyMs: { min: 0, max: 0, avg: 0 },
        bandwidthMbps: { download: 0, upload: 0 },
        packetLoss: 1,
        jitter: 0,
        mtu: 0,
        congestion: 1
    }
};

// ============================================================================
// NETWORK SIMULATOR
// ============================================================================

export class NetworkSimulator extends EventEmitter {
    private static instance: NetworkSimulator;
    private currentProfile: NetworkProfile;
    private dnsCache: Map<string, DNSRecord> = new Map();
    private requests: Map<string, NetworkRequest> = new Map();
    private responses: Map<string, NetworkResponse> = new Map();
    private eventLog: NetworkEvent[] = [];
    private isOnline: boolean = true;
    private failureProbability: number = 0;

    private constructor() {
        super();
        this.currentProfile = NETWORK_PROFILES['wifi-fast'];
        this.initializeDNS();
        console.log('🌐 Network Simulator initialized');
    }

    static getInstance(): NetworkSimulator {
        if (!NetworkSimulator.instance) {
            NetworkSimulator.instance = new NetworkSimulator();
        }
        return NetworkSimulator.instance;
    }

    private initializeDNS(): void {
        // Common DNS records
        const records: DNSRecord[] = [
            { domain: 'localhost', ip: '127.0.0.1', ttl: 3600, type: 'A' },
            { domain: 'api.example.com', ip: '93.184.216.34', ttl: 300, type: 'A' },
            { domain: 'cdn.example.com', ip: '104.18.12.34', ttl: 60, type: 'A' },
        ];
        records.forEach(r => this.dnsCache.set(r.domain, r));
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    setProfile(profileId: string): boolean {
        if (NETWORK_PROFILES[profileId]) {
            this.currentProfile = NETWORK_PROFILES[profileId];
            this.isOnline = this.currentProfile.type !== 'offline';
            this.emit('profile-changed', this.currentProfile);
            return true;
        }
        return false;
    }

    getProfile(): NetworkProfile {
        return { ...this.currentProfile };
    }

    getAvailableProfiles(): string[] {
        return Object.keys(NETWORK_PROFILES);
    }

    setOnline(online: boolean): void {
        this.isOnline = online;
        if (!online) {
            this.setProfile('offline');
        }
        this.emit('connectivity-changed', online);
    }

    // ========================================================================
    // LATENCY SIMULATION
    // ========================================================================

    private calculateLatency(): number {
        const { min, max, avg } = this.currentProfile.latencyMs;
        // Normal distribution around average
        const variance = (max - min) / 4;
        const latency = avg + (Math.random() - 0.5) * variance * 2;

        // Add jitter
        const jitter = (Math.random() - 0.5) * this.currentProfile.jitter * 2;

        return Math.max(min, Math.min(max, latency + jitter));
    }

    private shouldDropPacket(): boolean {
        return Math.random() < this.currentProfile.packetLoss;
    }

    private shouldFail(): boolean {
        return Math.random() < this.failureProbability;
    }

    // ========================================================================
    // REQUEST SIMULATION
    // ========================================================================

    async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const request: NetworkRequest = {
            id: requestId,
            url,
            method: (options.method as any) || 'GET',
            headers: options.headers as Record<string, string> || {},
            body: options.body,
            timestamp: Date.now(),
            size: options.body ? JSON.stringify(options.body).length : 0
        };

        this.requests.set(requestId, request);
        this.logEvent('request', request);

        // Check offline status
        if (!this.isOnline) {
            this.logEvent('error', { requestId, error: 'Network offline' });
            throw new Error('Network Error: offline');
        }

        // Simulate DNS lookup
        const domain = new URL(url).hostname;
        await this.simulateDNSLookup(domain);

        // Simulate TLS handshake
        if (url.startsWith('https://')) {
            await this.simulateTLSHandshake(domain);
        }

        // Simulate latency
        const latency = this.calculateLatency();
        await new Promise(resolve => setTimeout(resolve, latency));

        // Simulate packet loss / failure
        if (this.shouldDropPacket() || this.shouldFail()) {
            this.logEvent('error', { requestId, error: 'Connection reset' });
            throw new Error('Network Error: Connection reset');
        }

        // Generate response
        const response: NetworkResponse = {
            requestId,
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: { success: true, data: {} },
            size: 100,
            latency,
            timestamp: Date.now()
        };

        this.responses.set(requestId, response);
        this.logEvent('response', response);

        return new Response(JSON.stringify(response.body), {
            status: response.status,
            headers: response.headers
        });
    }

    private async simulateDNSLookup(domain: string): Promise<DNSRecord> {
        const cached = this.dnsCache.get(domain);
        if (cached) {
            return cached;
        }

        // Simulate DNS resolution time
        await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));

        const record: DNSRecord = {
            domain,
            ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            ttl: 300,
            type: 'A'
        };

        this.dnsCache.set(domain, record);
        this.logEvent('dns', record);

        return record;
    }

    private async simulateTLSHandshake(domain: string): Promise<TLSInfo> {
        // Simulate TLS handshake time
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

        const tls: TLSInfo = {
            version: 'TLS1.3',
            cipher: 'TLS_AES_256_GCM_SHA384',
            certificateValid: true,
            certificateExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };

        this.logEvent('tls', { domain, ...tls });
        return tls;
    }

    // ========================================================================
    // CHAOS / FAILURE INJECTION
    // ========================================================================

    setFailureProbability(probability: number): void {
        this.failureProbability = Math.max(0, Math.min(1, probability));
    }

    simulateOutage(durationMs: number): void {
        const wasOnline = this.isOnline;
        this.setOnline(false);
        this.emit('outage-started');

        setTimeout(() => {
            this.setOnline(wasOnline);
            this.emit('outage-ended');
        }, durationMs);
    }

    simulateLatencySpike(multiplier: number, durationMs: number): void {
        const original = { ...this.currentProfile.latencyMs };

        this.currentProfile.latencyMs = {
            min: original.min * multiplier,
            max: original.max * multiplier,
            avg: original.avg * multiplier
        };

        this.emit('latency-spike-started', { multiplier });

        setTimeout(() => {
            this.currentProfile.latencyMs = original;
            this.emit('latency-spike-ended');
        }, durationMs);
    }

    simulatePacketLossSpike(lossRate: number, durationMs: number): void {
        const original = this.currentProfile.packetLoss;
        this.currentProfile.packetLoss = lossRate;

        this.emit('packet-loss-spike-started', { rate: lossRate });

        setTimeout(() => {
            this.currentProfile.packetLoss = original;
            this.emit('packet-loss-spike-ended');
        }, durationMs);
    }

    // ========================================================================
    // LOGGING & METRICS
    // ========================================================================

    private logEvent(type: NetworkEvent['type'], data: any): void {
        const event: NetworkEvent = {
            type,
            timestamp: Date.now(),
            data
        };
        this.eventLog.push(event);
        this.emit('network-event', event);

        // Keep last 1000 events
        if (this.eventLog.length > 1000) {
            this.eventLog = this.eventLog.slice(-1000);
        }
    }

    getEventLog(): NetworkEvent[] {
        return [...this.eventLog];
    }

    getMetrics(): {
        totalRequests: number;
        totalResponses: number;
        avgLatency: number;
        failureRate: number;
    } {
        const responses = Array.from(this.responses.values());
        const avgLatency = responses.length > 0
            ? responses.reduce((sum, r) => sum + r.latency, 0) / responses.length
            : 0;

        const failures = this.eventLog.filter(e => e.type === 'error').length;
        const total = this.requests.size;

        return {
            totalRequests: total,
            totalResponses: responses.length,
            avgLatency,
            failureRate: total > 0 ? failures / total : 0
        };
    }

    clearHistory(): void {
        this.requests.clear();
        this.responses.clear();
        this.eventLog = [];
    }
}

export const networkSimulator = NetworkSimulator.getInstance();
