/**
 * Modelfile Parser - Parse Modelfile syntax
 */
import { EventEmitter } from 'events';

export interface ModelfileConfig { from: string; template?: string; system?: string; parameters: Record<string, number | string>; adapters: string[]; license?: string; }

export class ModelfileParserEngine extends EventEmitter {
    private static instance: ModelfileParserEngine;
    private constructor() { super(); }
    static getInstance(): ModelfileParserEngine { if (!ModelfileParserEngine.instance) ModelfileParserEngine.instance = new ModelfileParserEngine(); return ModelfileParserEngine.instance; }

    parse(content: string): ModelfileConfig {
        const config: ModelfileConfig = { from: '', parameters: {}, adapters: [] };
        const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        for (const line of lines) {
            const [cmd, ...rest] = line.split(/\s+/);
            const value = rest.join(' ');
            switch (cmd.toUpperCase()) {
                case 'FROM': config.from = value; break;
                case 'TEMPLATE': config.template = value.replace(/^"|"$/g, ''); break;
                case 'SYSTEM': config.system = value.replace(/^"|"$/g, ''); break;
                case 'PARAMETER': const [pName, pVal] = value.split(/\s+/); config.parameters[pName] = isNaN(Number(pVal)) ? pVal : Number(pVal); break;
                case 'ADAPTER': config.adapters.push(value); break;
                case 'LICENSE': config.license = value; break;
            }
        }
        return config;
    }

    generate(config: ModelfileConfig): string {
        const lines: string[] = [`FROM ${config.from}`];
        if (config.template) lines.push(`TEMPLATE "${config.template}"`);
        if (config.system) lines.push(`SYSTEM "${config.system}"`);
        Object.entries(config.parameters).forEach(([k, v]) => lines.push(`PARAMETER ${k} ${v}`));
        config.adapters.forEach(a => lines.push(`ADAPTER ${a}`));
        if (config.license) lines.push(`LICENSE ${config.license}`);
        return lines.join('\n');
    }

    validate(config: ModelfileConfig): { valid: boolean; errors: string[] } { const errors: string[] = []; if (!config.from) errors.push('FROM is required'); return { valid: errors.length === 0, errors }; }
}
export function getModelfileParserEngine(): ModelfileParserEngine { return ModelfileParserEngine.getInstance(); }
