/**
 * Secure credential storage for external services
 */

export interface ServiceCredentials {
    canva: {
        clientId: string;
        clientSecret: string;
    };
    supabase: {
        url: string;
        apiKey: string;
    };
    figma: {
        accessToken: string;
    };
}

export class ServiceCredentialsManager {
    private static credentials: ServiceCredentials = {
        canva: {
            clientId: process.env.CANVA_CLIENT_ID || '',
            clientSecret: process.env.CANVA_CLIENT_SECRET || '',
        },
        supabase: {
            url: process.env.SUPABASE_URL || '',
            apiKey: process.env.SUPABASE_API_KEY || '',
        },
        figma: {
            accessToken: process.env.FIGMA_ACCESS_TOKEN || '',
        },
    };

    static setCredentials(service: keyof ServiceCredentials, credentials: any): void {
        this.credentials[service] = credentials;
    }

    static getCredentials(service: keyof ServiceCredentials): any {
        return this.credentials[service];
    }

    static getAllCredentials(): ServiceCredentials {
        return this.credentials;
    }

    static hasCredentials(service: keyof ServiceCredentials): boolean {
        const creds = this.credentials[service];
        return Object.values(creds).every(val => val && val.length > 0);
    }

    static validateCredentials(): { valid: boolean; missing: string[] } {
        const missing: string[] = [];

        if (!this.hasCredentials('canva')) missing.push('Canva');
        if (!this.hasCredentials('supabase')) missing.push('Supabase');
        if (!this.hasCredentials('figma')) missing.push('Figma');

        return {
            valid: missing.length === 0,
            missing,
        };
    }
}
