import axios, { AxiosInstance } from 'axios';
import { ServiceCredentialsManager } from '../config/ServiceCredentials';

export class CanvaService {
    private clientId: string;
    private clientSecret: string;
    private client: AxiosInstance;

    constructor() {
        const creds = ServiceCredentialsManager.getCredentials('canva');
        this.clientId = creds.clientId;
        this.clientSecret = creds.clientSecret;

        this.client = axios.create({
            baseURL: 'https://api.canva.com/v1',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ Canva client initialized');
    }

    /**
     * Create a design from a template
     */
    async createDesign(options: {
        title?: string;
        designType?: 'presentation' | 'social' | 'document';
        prompt?: string;
    }): Promise<any> {
        // Note: Canva API has limited public access
        // For now, return a mock response with guidance
        return {
            success: false,
            message: 'Canva API requires OAuth authentication. Please visit canva.com to create designs manually.',
            guidance: {
                designType: options.designType || 'document',
                prompt: options.prompt || 'Design request',
                url: `https://www.canva.com/create/${options.designType || 'design'}`,
            },
        };
    }

    /**
     * Export a design (requires design ID from authenticated session)
     */
    async exportDesign(designId: string, format: 'png' | 'pdf' = 'png'): Promise<any> {
        return {
            success: false,
            message: 'Canva export requires authenticated session',
            designId,
            format,
        };
    }

    /**
     * Get Canva creation URL
     */
    getCreateUrl(type: 'presentation' | 'social' | 'document' = 'document'): string {
        const typeMap = {
            presentation: 'presentation',
            social: 'instagram-post',
            document: 'document',
        };

        return `https://www.canva.com/create/${typeMap[type]}`;
    }

    isInitialized(): boolean {
        return !!this.clientId && !!this.clientSecret;
    }
}
