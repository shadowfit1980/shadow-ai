import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ServiceCredentialsManager } from '../config/ServiceCredentials';

export class SupabaseService {
    private client: SupabaseClient | null = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        const creds = ServiceCredentialsManager.getCredentials('supabase');

        if (creds.url && creds.apiKey) {
            this.client = createClient(creds.url, creds.apiKey);
            console.log('✅ Supabase client initialized');
        } else {
            console.warn('⚠️ Supabase credentials not found');
        }
    }

    async query(table: string, filters?: any): Promise<any> {
        if (!this.client) throw new Error('Supabase not initialized');

        let query = this.client.from(table).select('*');

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    async insert(table: string, data: any): Promise<any> {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data: result, error } = await this.client
            .from(table)
            .insert(data)
            .select();

        if (error) throw error;
        return result;
    }

    async update(table: string, id: string, data: any): Promise<any> {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data: result, error } = await this.client
            .from(table)
            .update(data)
            .eq('id', id)
            .select();

        if (error) throw error;
        return result;
    }

    async delete(table: string, id: string): Promise<void> {
        if (!this.client) throw new Error('Supabase not initialized');

        const { error } = await this.client
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async uploadFile(bucket: string, path: string, file: Buffer, contentType?: string): Promise<string> {
        if (!this.client) throw new Error('Supabase not initialized');

        const { data, error } = await this.client.storage
            .from(bucket)
            .upload(path, file, {
                contentType: contentType || 'application/octet-stream',
            });

        if (error) throw error;

        const { data: urlData } = this.client.storage
            .from(bucket)
            .getPublicUrl(path);

        return urlData.publicUrl;
    }

    isInitialized(): boolean {
        return this.client !== null;
    }
}
