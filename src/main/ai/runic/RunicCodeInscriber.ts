/**
 * Runic Code Inscriber
 * 
 * Inscribes runic symbols into code, providing magical protection,
 * enhancement, and documentation through ancient symbolic systems.
 */

import { EventEmitter } from 'events';

export interface RunicInscription {
    id: string;
    code: string;
    runes: Rune[];
    enchantments: Enchantment[];
    protectionLevel: number;
    inscribedCode: string;
    createdAt: Date;
}

export interface Rune {
    symbol: string;
    name: string;
    meaning: string;
    power: RunicPower;
    position: number;
}

export type RunicPower =
    | 'strength'    // Performance
    | 'wisdom'      // Documentation
    | 'protection'  // Error handling
    | 'speed'       // Optimization
    | 'truth'       // Validation
    | 'harmony';    // Clean code

export interface Enchantment {
    rune: string;
    effect: string;
    applied: boolean;
}

export class RunicCodeInscriber extends EventEmitter {
    private static instance: RunicCodeInscriber;
    private inscriptions: Map<string, RunicInscription> = new Map();

    private readonly runicAlphabet: Rune[] = [
        { symbol: 'ᚠ', name: 'Fehu', meaning: 'Wealth/Resources', power: 'strength', position: 1 },
        { symbol: 'ᚢ', name: 'Uruz', meaning: 'Strength/Vitality', power: 'speed', position: 2 },
        { symbol: 'ᚦ', name: 'Thurisaz', meaning: 'Protection', power: 'protection', position: 3 },
        { symbol: 'ᚨ', name: 'Ansuz', meaning: 'Wisdom', power: 'wisdom', position: 4 },
        { symbol: 'ᚱ', name: 'Raido', meaning: 'Journey', power: 'harmony', position: 5 },
        { symbol: 'ᚲ', name: 'Kenaz', meaning: 'Knowledge', power: 'truth', position: 6 },
        { symbol: 'ᚷ', name: 'Gebo', meaning: 'Gift', power: 'harmony', position: 7 },
        { symbol: 'ᚹ', name: 'Wunjo', meaning: 'Joy', power: 'harmony', position: 8 },
    ];

    private constructor() {
        super();
    }

    static getInstance(): RunicCodeInscriber {
        if (!RunicCodeInscriber.instance) {
            RunicCodeInscriber.instance = new RunicCodeInscriber();
        }
        return RunicCodeInscriber.instance;
    }

    inscribe(code: string): RunicInscription {
        const selectedRunes = this.selectRunes(code);
        const enchantments = this.createEnchantments(selectedRunes, code);
        const inscribedCode = this.applyInscription(code, selectedRunes, enchantments);
        const protectionLevel = this.calculateProtection(selectedRunes, enchantments);

        const inscription: RunicInscription = {
            id: `rune_${Date.now()}`,
            code,
            runes: selectedRunes,
            enchantments,
            protectionLevel,
            inscribedCode,
            createdAt: new Date(),
        };

        this.inscriptions.set(inscription.id, inscription);
        this.emit('inscription:created', inscription);
        return inscription;
    }

    private selectRunes(code: string): Rune[] {
        const runes: Rune[] = [];

        // Protection rune if error handling needed
        if (!code.includes('try')) {
            runes.push(this.runicAlphabet.find(r => r.power === 'protection')!);
        }

        // Wisdom rune if lacking comments
        if (!code.includes('//') && !code.includes('/*')) {
            runes.push(this.runicAlphabet.find(r => r.power === 'wisdom')!);
        }

        // Speed rune if async operations
        if (code.includes('async')) {
            runes.push(this.runicAlphabet.find(r => r.power === 'speed')!);
        }

        // Truth rune if types needed
        if (!code.includes('interface') && !code.includes('type ')) {
            runes.push(this.runicAlphabet.find(r => r.power === 'truth')!);
        }

        // Harmony rune always
        runes.push(this.runicAlphabet.find(r => r.name === 'Wunjo')!);

        return runes;
    }

    private createEnchantments(runes: Rune[], code: string): Enchantment[] {
        return runes.map(rune => ({
            rune: rune.symbol,
            effect: this.getEnchantmentEffect(rune.power),
            applied: true,
        }));
    }

    private getEnchantmentEffect(power: RunicPower): string {
        switch (power) {
            case 'protection':
                return 'Adds error boundary protection';
            case 'wisdom':
                return 'Adds documentation comments';
            case 'speed':
                return 'Optimizes async operations';
            case 'truth':
                return 'Adds type annotations';
            case 'strength':
                return 'Enhances performance';
            case 'harmony':
                return 'Improves code readability';
            default:
                return 'Unknown enchantment';
        }
    }

    private applyInscription(code: string, runes: Rune[], enchantments: Enchantment[]): string {
        const runeSymbols = runes.map(r => r.symbol).join(' ');
        const header = `/**
 * ${runeSymbols}
 * Runic Protection Active
 * Enchantments: ${enchantments.map(e => e.effect).join(', ')}
 */
`;

        let inscribedCode = header + code;

        // Apply protection enchantment
        if (enchantments.some(e => e.effect.includes('error'))) {
            if (!code.includes('try {')) {
                inscribedCode += '\n// ᚦ Protected by Thurisaz - add error handling';
            }
        }

        return inscribedCode;
    }

    private calculateProtection(runes: Rune[], enchantments: Enchantment[]): number {
        const baseProtection = runes.filter(r => r.power === 'protection').length * 0.3;
        const enchantmentBonus = enchantments.filter(e => e.applied).length * 0.1;
        return Math.min(1, baseProtection + enchantmentBonus + 0.2);
    }

    getRune(name: string): Rune | undefined {
        return this.runicAlphabet.find(r =>
            r.name.toLowerCase() === name.toLowerCase() || r.symbol === name
        );
    }

    getAllRunes(): Rune[] {
        return [...this.runicAlphabet];
    }

    getInscription(id: string): RunicInscription | undefined {
        return this.inscriptions.get(id);
    }

    getStats(): { total: number; avgProtection: number; mostUsedRune: string } {
        const inscriptions = Array.from(this.inscriptions.values());
        const runeCounts: Record<string, number> = {};

        for (const insc of inscriptions) {
            for (const rune of insc.runes) {
                runeCounts[rune.name] = (runeCounts[rune.name] || 0) + 1;
            }
        }

        const mostUsedRune = Object.entries(runeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

        return {
            total: inscriptions.length,
            avgProtection: inscriptions.length > 0
                ? inscriptions.reduce((s, i) => s + i.protectionLevel, 0) / inscriptions.length
                : 0,
            mostUsedRune,
        };
    }
}

export const runicCodeInscriber = RunicCodeInscriber.getInstance();
