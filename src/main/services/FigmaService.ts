import axios, { AxiosInstance } from 'axios';
import { ServiceCredentialsManager } from '../config/ServiceCredentials';

export class FigmaService {
    private client: AxiosInstance;
    private accessToken: string;

    constructor() {
        const creds = ServiceCredentialsManager.getCredentials('figma');
        this.accessToken = creds.accessToken;

        this.client = axios.create({
            baseURL: 'https://api.figma.com/v1',
            headers: {
                'X-Figma-Token': this.accessToken,
            },
        });

        console.log('✅ Figma client initialized');
    }

    async getFile(fileKey: string): Promise<any> {
        const response = await this.client.get(`/files/${fileKey}`);
        return response.data;
    }

    async getFileNodes(fileKey: string, nodeIds: string[]): Promise<any> {
        const idsParam = nodeIds.join(',');
        const response = await this.client.get(`/files/${fileKey}/nodes`, {
            params: { ids: idsParam },
        });
        return response.data;
    }

    async exportImage(fileKey: string, nodeId: string, format: 'png' | 'svg' | 'jpg' = 'png', scale: number = 2): Promise<string> {
        const response = await this.client.get(`/images/${fileKey}`, {
            params: {
                ids: nodeId,
                format,
                scale,
            },
        });

        const imageUrl = response.data.images[nodeId];
        if (!imageUrl) {
            throw new Error('Failed to export image');
        }

        return imageUrl;
    }

    async getComments(fileKey: string): Promise<any> {
        const response = await this.client.get(`/files/${fileKey}/comments`);
        return response.data;
    }

    extractFileKey(url: string): string | null {
        // Extract file key from Figma URL
        // e.g., https://www.figma.com/file/ABC123/Design-Name
        const match = url.match(/\/file\/([a-zA-Z0-9]+)\//);
        return match ? match[1] : null;
    }

    isInitialized(): boolean {
        return !!this.accessToken;
    }
}
