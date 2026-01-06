/**
 * Brand Configuration
 * Centralized brand assets and style settings
 * Similar to Canva's Brand Kit
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface BrandConfig {
    id: string;
    name: string;
    description?: string;
    colors: BrandColors;
    typography: BrandTypography;
    logos: BrandLogo[];
    voice: BrandVoice;
    assets: BrandAsset[];
    createdAt: number;
    updatedAt: number;
}

export interface BrandColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success?: string;
    warning?: string;
    error?: string;
    palette?: string[]; // Additional colors
}

export interface BrandTypography {
    headingFont: string;
    bodyFont: string;
    monoFont: string;
    baseFontSize: number;
    headingWeight: number;
    bodyWeight: number;
    lineHeight: number;
}

export interface BrandLogo {
    id: string;
    name: string;
    type: 'primary' | 'secondary' | 'icon' | 'wordmark';
    path?: string;
    url?: string;
}

export interface BrandVoice {
    tone: string[];
    personality: string[];
    doWords: string[];
    dontWords: string[];
    tagline?: string;
    missionStatement?: string;
}

export interface BrandAsset {
    id: string;
    name: string;
    type: 'image' | 'icon' | 'pattern' | 'illustration';
    path?: string;
    url?: string;
    tags: string[];
}

/**
 * BrandManager
 * Manages brand configurations
 */
export class BrandManager extends EventEmitter {
    private static instance: BrandManager;
    private store: Store;
    private brands: Map<string, BrandConfig> = new Map();
    private activeBrandId: string | null = null;

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-brands' });
        this.loadBrands();
        this.initializeDefaultBrand();
    }

    static getInstance(): BrandManager {
        if (!BrandManager.instance) {
            BrandManager.instance = new BrandManager();
        }
        return BrandManager.instance;
    }

    /**
     * Create new brand
     */
    async createBrand(options: Partial<BrandConfig> & { name: string }): Promise<BrandConfig> {
        const id = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const brand: BrandConfig = {
            id,
            name: options.name,
            description: options.description,
            colors: options.colors || this.getDefaultColors(),
            typography: options.typography || this.getDefaultTypography(),
            logos: options.logos || [],
            voice: options.voice || this.getDefaultVoice(),
            assets: options.assets || [],
            createdAt: now,
            updatedAt: now,
        };

        this.brands.set(id, brand);
        await this.persist();

        this.emit('brandCreated', brand);
        return brand;
    }

    /**
     * Get brand by ID
     */
    getBrand(id: string): BrandConfig | null {
        return this.brands.get(id) || null;
    }

    /**
     * Get active brand
     */
    getActiveBrand(): BrandConfig | null {
        if (!this.activeBrandId) return null;
        return this.brands.get(this.activeBrandId) || null;
    }

    /**
     * Set active brand
     */
    async setActiveBrand(id: string): Promise<BrandConfig | null> {
        const brand = this.brands.get(id);
        if (!brand) return null;

        this.activeBrandId = id;
        await this.persist();

        this.emit('brandActivated', brand);
        return brand;
    }

    /**
     * Update brand
     */
    async updateBrand(id: string, updates: Partial<BrandConfig>): Promise<BrandConfig | null> {
        const brand = this.brands.get(id);
        if (!brand) return null;

        Object.assign(brand, updates, { id, updatedAt: Date.now() });
        await this.persist();

        this.emit('brandUpdated', brand);
        return brand;
    }

    /**
     * Delete brand
     */
    async deleteBrand(id: string): Promise<boolean> {
        if (this.activeBrandId === id) {
            this.activeBrandId = null;
        }

        const deleted = this.brands.delete(id);
        if (deleted) {
            await this.persist();
            this.emit('brandDeleted', { id });
        }
        return deleted;
    }

    /**
     * Get all brands
     */
    getAllBrands(): BrandConfig[] {
        return Array.from(this.brands.values());
    }

    /**
     * Generate CSS variables from brand
     */
    generateCSSVariables(brandId?: string): string {
        const brand = brandId ? this.brands.get(brandId) : this.getActiveBrand();
        if (!brand) return '';

        return `
:root {
  /* Colors */
  --brand-primary: ${brand.colors.primary};
  --brand-secondary: ${brand.colors.secondary};
  --brand-accent: ${brand.colors.accent};
  --brand-background: ${brand.colors.background};
  --brand-text: ${brand.colors.text};
  --brand-success: ${brand.colors.success || '#10b981'};
  --brand-warning: ${brand.colors.warning || '#f59e0b'};
  --brand-error: ${brand.colors.error || '#ef4444'};

  /* Typography */
  --font-heading: ${brand.typography.headingFont};
  --font-body: ${brand.typography.bodyFont};
  --font-mono: ${brand.typography.monoFont};
  --font-size-base: ${brand.typography.baseFontSize}px;
  --font-weight-heading: ${brand.typography.headingWeight};
  --font-weight-body: ${brand.typography.bodyWeight};
  --line-height: ${brand.typography.lineHeight};
}
`;
    }

    /**
     * Generate Tailwind config from brand
     */
    generateTailwindConfig(brandId?: string): string {
        const brand = brandId ? this.brands.get(brandId) : this.getActiveBrand();
        if (!brand) return '';

        return `
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '${brand.colors.primary}',
        secondary: '${brand.colors.secondary}',
        accent: '${brand.colors.accent}',
      },
      fontFamily: {
        heading: ['${brand.typography.headingFont}', 'sans-serif'],
        body: ['${brand.typography.bodyFont}', 'sans-serif'],
        mono: ['${brand.typography.monoFont}', 'monospace'],
      },
    },
  },
}
`;
    }

    /**
     * Apply brand to markdown
     */
    applyBrandToMarkdown(markdown: string, brandId?: string): string {
        const brand = brandId ? this.brands.get(brandId) : this.getActiveBrand();
        if (!brand) return markdown;

        // Add brand header
        const header = brand.voice.tagline ? `> ${brand.voice.tagline}\n\n` : '';
        return header + markdown;
    }

    /**
     * Get brand color palette
     */
    getColorPalette(brandId?: string): string[] {
        const brand = brandId ? this.brands.get(brandId) : this.getActiveBrand();
        if (!brand) return [];

        return [
            brand.colors.primary,
            brand.colors.secondary,
            brand.colors.accent,
            ...(brand.colors.palette || []),
        ];
    }

    /**
     * Validate brand content against voice guidelines
     */
    validateContent(content: string, brandId?: string): {
        valid: boolean;
        violations: string[];
        suggestions: string[];
    } {
        const brand = brandId ? this.brands.get(brandId) : this.getActiveBrand();
        if (!brand) return { valid: true, violations: [], suggestions: [] };

        const violations: string[] = [];
        const suggestions: string[] = [];
        const contentLower = content.toLowerCase();

        // Check for words to avoid
        for (const word of brand.voice.dontWords) {
            if (contentLower.includes(word.toLowerCase())) {
                violations.push(`Contains discouraged word: "${word}"`);
            }
        }

        // Suggest tone improvements
        const hasToneWords = brand.voice.doWords.some(word =>
            contentLower.includes(word.toLowerCase())
        );
        if (!hasToneWords && brand.voice.doWords.length > 0) {
            suggestions.push(`Consider using brand voice words: ${brand.voice.doWords.slice(0, 3).join(', ')}`);
        }

        return {
            valid: violations.length === 0,
            violations,
            suggestions,
        };
    }

    /**
     * Export brand config
     */
    exportBrand(id: string): string | null {
        const brand = this.brands.get(id);
        if (!brand) return null;
        return JSON.stringify(brand, null, 2);
    }

    /**
     * Import brand config
     */
    async importBrand(json: string): Promise<BrandConfig | null> {
        try {
            const data = JSON.parse(json) as BrandConfig;
            return this.createBrand(data);
        } catch (error) {
            console.error('Failed to import brand:', error);
            return null;
        }
    }

    // Private methods

    private getDefaultColors(): BrandColors {
        return {
            primary: '#6366f1',
            secondary: '#8b5cf6',
            accent: '#ec4899',
            background: '#ffffff',
            text: '#1f2937',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            palette: ['#3b82f6', '#14b8a6', '#f97316'],
        };
    }

    private getDefaultTypography(): BrandTypography {
        return {
            headingFont: 'Inter',
            bodyFont: 'Inter',
            monoFont: 'JetBrains Mono',
            baseFontSize: 16,
            headingWeight: 700,
            bodyWeight: 400,
            lineHeight: 1.6,
        };
    }

    private getDefaultVoice(): BrandVoice {
        return {
            tone: ['professional', 'friendly', 'helpful'],
            personality: ['innovative', 'reliable', 'approachable'],
            doWords: ['empower', 'simplify', 'enhance', 'streamline'],
            dontWords: ['basically', 'obviously', 'just'],
            tagline: 'Empowering your workflow',
        };
    }

    private initializeDefaultBrand(): void {
        if (this.brands.size > 0) return;

        this.createBrand({
            name: 'Shadow AI',
            description: 'Default Shadow AI brand',
            colors: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                accent: '#10b981',
                background: '#0f172a',
                text: '#e2e8f0',
            },
            voice: {
                tone: ['professional', 'intelligent', 'helpful'],
                personality: ['precise', 'efficient', 'innovative'],
                doWords: ['assist', 'generate', 'analyze', 'optimize'],
                dontWords: ['cannot', 'impossible', 'refuse'],
                tagline: 'Your AI-powered coding assistant',
            },
        });
    }

    private async persist(): Promise<void> {
        try {
            this.store.set('brands', Array.from(this.brands.entries()));
            this.store.set('activeBrandId', this.activeBrandId);
        } catch (error) {
            console.error('Failed to persist brands:', error);
        }
    }

    private loadBrands(): void {
        try {
            const data = this.store.get('brands') as Array<[string, BrandConfig]>;
            if (data) {
                this.brands = new Map(data);
            }
            this.activeBrandId = this.store.get('activeBrandId') as string | null;
        } catch (error) {
            console.error('Failed to load brands:', error);
        }
    }
}

// Singleton getter
export function getBrandManager(): BrandManager {
    return BrandManager.getInstance();
}
