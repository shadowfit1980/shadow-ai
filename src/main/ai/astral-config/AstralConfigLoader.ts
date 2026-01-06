/**
 * Astral Config Loader
 * 
 * Loads configurations from the astral plane, where
 * settings exist in their purest, most aligned form.
 */

import { EventEmitter } from 'events';

export interface AstralConfig {
    id: string;
    name: string;
    settings: Record<string, unknown>;
    alignment: number;
    source: 'local' | 'astral' | 'cosmic';
}

export class AstralConfigLoader extends EventEmitter {
    private static instance: AstralConfigLoader;
    private configs: Map<string, AstralConfig> = new Map();

    private constructor() { super(); }

    static getInstance(): AstralConfigLoader {
        if (!AstralConfigLoader.instance) {
            AstralConfigLoader.instance = new AstralConfigLoader();
        }
        return AstralConfigLoader.instance;
    }

    load(name: string, settings: Record<string, unknown>): AstralConfig {
        const config: AstralConfig = {
            id: `config_${Date.now()}`,
            name,
            settings,
            alignment: 0.8 + Math.random() * 0.2,
            source: 'astral',
        };

        this.configs.set(config.id, config);
        this.emit('config:loaded', config);
        return config;
    }

    get(configId: string): AstralConfig | undefined {
        return this.configs.get(configId);
    }

    getStats(): { total: number; avgAlignment: number } {
        const configs = Array.from(this.configs.values());
        return {
            total: configs.length,
            avgAlignment: configs.length > 0 ? configs.reduce((s, c) => s + c.alignment, 0) / configs.length : 0,
        };
    }
}

export const astralConfigLoader = AstralConfigLoader.getInstance();
