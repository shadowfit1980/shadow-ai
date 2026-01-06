import { ServiceCredentialsManager } from '../config/ServiceCredentials';
import { SupabaseService } from './SupabaseService';
import { FigmaService } from './FigmaService';
import { CanvaService } from './CanvaService';

export class ServiceManager {
    private static instance: ServiceManager;

    public supabase: SupabaseService;
    public figma: FigmaService;
    public canva: CanvaService;

    private constructor() {
        // Initialize all services
        this.supabase = new SupabaseService();
        this.figma = new FigmaService();
        this.canva = new CanvaService();
    }

    static getInstance(): ServiceManager {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }

    /**
     * Initialize services with credentials
     */
    static initialize(credentials: {
        canva?: { clientId: string; clientSecret: string };
        supabase?: { url: string; apiKey: string };
        figma?: { accessToken: string };
    }): void {
        if (credentials.canva) {
            ServiceCredentialsManager.setCredentials('canva', credentials.canva);
        }
        if (credentials.supabase) {
            ServiceCredentialsManager.setCredentials('supabase', credentials.supabase);
        }
        if (credentials.figma) {
            ServiceCredentialsManager.setCredentials('figma', credentials.figma);
        }

        // Reinitialize services
        ServiceManager.instance = new ServiceManager();
    }

    /**
     * Get status of all services
     */
    getServicesStatus(): {
        [key: string]: { initialized: boolean; available: boolean };
    } {
        return {
            supabase: {
                initialized: this.supabase.isInitialized(),
                available: ServiceCredentialsManager.hasCredentials('supabase'),
            },
            figma: {
                initialized: this.figma.isInitialized(),
                available: ServiceCredentialsManager.hasCredentials('figma'),
            },
            canva: {
                initialized: this.canva.isInitialized(),
                available: ServiceCredentialsManager.hasCredentials('canva'),
            },
        };
    }

    /**
     * Handle AI service requests automatically
     */
    async handleServiceRequest(prompt: string): Promise<any> {
        const lowerPrompt = prompt.toLowerCase();

        // Detect Figma URLs
        if (lowerPrompt.includes('figma.com')) {
            const url = prompt.match(/https?:\/\/[^\s]+figma\.com[^\s]+/)?.[0];
            if (url) {
                const fileKey = this.figma.extractFileKey(url);
                if (fileKey) {
                    return await this.figma.getFile(fileKey);
                }
            }
        }

        // Detect database operations
        if (lowerPrompt.includes('database') || lowerPrompt.includes('save') || lowerPrompt.includes('query')) {
            return {
                service: 'supabase',
                message: 'Supabase detected. Specify table name and operation (insert/query/update/delete)',
            };
        }

        // Detect design creation
        if (lowerPrompt.includes('design') || lowerPrompt.includes('presentation') || lowerPrompt.includes('social')) {
            return {
                service: 'canva',
                message: 'Canva design detected',
                url: this.canva.getCreateUrl('presentation'),
            };
        }

        return null;
    }
}
