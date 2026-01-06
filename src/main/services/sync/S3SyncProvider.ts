/**
 * S3 Sync Provider
 * 
 * Real implementation of AWS S3 sync
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface SyncItem {
    id: string;
    type: 'memory' | 'setting' | 'workflow' | 'agent';
    data: any;
    updatedAt: Date;
    version: number;
}

/**
 * S3SyncProvider - Sync data with AWS S3
 */
export class S3SyncProvider extends EventEmitter {
    private bucket: string = '';
    private region: string = 'us-east-1';
    private accessKeyId: string = '';
    private secretAccessKey: string = '';
    private prefix: string = 'shadow-ai-sync';
    private isInitialized = false;

    /**
     * Initialize S3 connection
     */
    async initialize(config: {
        bucket: string;
        region?: string;
        accessKeyId: string;
        secretAccessKey: string;
        prefix?: string;
    }): Promise<boolean> {
        this.bucket = config.bucket;
        this.region = config.region || 'us-east-1';
        this.accessKeyId = config.accessKeyId;
        this.secretAccessKey = config.secretAccessKey;
        this.prefix = config.prefix || 'shadow-ai-sync';

        try {
            // Test connection by listing objects
            await this.listObjects();
            this.isInitialized = true;
            this.emit('initialized');
            return true;
        } catch (error: any) {
            this.emit('error', { message: error.message });
            return false;
        }
    }

    /**
     * Sign AWS request
     */
    private sign(method: string, path: string, dateStr: string, payloadHash: string): string {
        const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
        const canonicalRequest = [
            method,
            path,
            '',
            `host:${host}`,
            `x-amz-content-sha256:${payloadHash}`,
            `x-amz-date:${dateStr}`,
            '',
            'host;x-amz-content-sha256;x-amz-date',
            payloadHash,
        ].join('\n');

        const scope = `${dateStr.slice(0, 8)}/${this.region}/s3/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            dateStr,
            scope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
        ].join('\n');

        const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStr.slice(0, 8)).digest();
        const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
        const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
        const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        return `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${scope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;
    }

    /**
     * Make S3 request
     */
    private async s3Request(method: string, key: string, body?: string): Promise<Response> {
        const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
        const path = `/${key}`;
        const dateStr = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
        const payloadHash = crypto.createHash('sha256').update(body || '').digest('hex');
        const authorization = this.sign(method, path, dateStr, payloadHash);

        return fetch(`https://${host}${path}`, {
            method,
            headers: {
                'Host': host,
                'x-amz-date': dateStr,
                'x-amz-content-sha256': payloadHash,
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body,
        });
    }

    /**
     * List objects in bucket
     */
    private async listObjects(): Promise<string[]> {
        const response = await this.s3Request('GET', `?prefix=${this.prefix}/`);
        if (!response.ok) throw new Error('Failed to list S3 objects');
        const text = await response.text();
        // Parse XML response
        const keys = text.match(/<Key>([^<]+)<\/Key>/g)?.map(k => k.replace(/<\/?Key>/g, '')) || [];
        return keys;
    }

    /**
     * Push data to S3
     */
    async push(items: SyncItem[]): Promise<{ success: boolean; failed: string[] }> {
        if (!this.isInitialized) throw new Error('S3 not initialized');

        const failed: string[] = [];

        for (const item of items) {
            try {
                const key = `${this.prefix}/${item.type}/${item.id}.json`;
                const body = JSON.stringify({
                    ...item,
                    updatedAt: item.updatedAt.toISOString(),
                });

                const response = await this.s3Request('PUT', key, body);
                if (!response.ok) {
                    failed.push(item.id);
                } else {
                    this.emit('item:pushed', item);
                }
            } catch {
                failed.push(item.id);
            }
        }

        return { success: failed.length === 0, failed };
    }

    /**
     * Pull data from S3
     */
    async pull(type?: string): Promise<SyncItem[]> {
        if (!this.isInitialized) throw new Error('S3 not initialized');

        const items: SyncItem[] = [];
        const keys = await this.listObjects();

        for (const key of keys) {
            if (type && !key.includes(`/${type}/`)) continue;

            try {
                const response = await this.s3Request('GET', key);
                if (response.ok) {
                    const data = await response.json();
                    items.push({
                        ...data,
                        updatedAt: new Date(data.updatedAt),
                    });
                }
            } catch {
                // Skip failed items
            }
        }

        this.emit('pulled', { count: items.length });
        return items;
    }

    /**
     * Get a single item
     */
    async get(type: string, id: string): Promise<SyncItem | null> {
        if (!this.isInitialized) return null;

        try {
            const key = `${this.prefix}/${type}/${id}.json`;
            const response = await this.s3Request('GET', key);
            if (!response.ok) return null;

            const data = await response.json();
            return {
                ...data,
                updatedAt: new Date(data.updatedAt),
            };
        } catch {
            return null;
        }
    }

    /**
     * Delete an item
     */
    async delete(type: string, id: string): Promise<boolean> {
        if (!this.isInitialized) return false;

        try {
            const key = `${this.prefix}/${type}/${id}.json`;
            const response = await this.s3Request('DELETE', key);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.isInitialized;
    }
}

export default S3SyncProvider;
