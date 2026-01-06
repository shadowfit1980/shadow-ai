/**
 * Arcane Spell Compiler
 * 
 * Compiles code "spells" - powerful code incantations that combine
 * multiple patterns into single, reusable magical invocations.
 */

import { EventEmitter } from 'events';

export interface Spell {
    id: string;
    name: string;
    incantation: string;
    components: SpellComponent[];
    power: number;
    castingTime: number;
    effects: SpellEffect[];
    school: MagicSchool;
}

export type MagicSchool =
    | 'evocation'      // Creation
    | 'abjuration'     // Protection
    | 'transmutation'  // Transformation
    | 'divination'     // Analysis
    | 'conjuration'    // Generation
    | 'enchantment'    // Enhancement
    | 'illusion'       // Mocking
    | 'necromancy';    // Legacy revival

export interface SpellComponent {
    type: 'verbal' | 'somatic' | 'material';
    description: string;
    code?: string;
}

export interface SpellEffect {
    name: string;
    description: string;
    duration: 'instant' | 'sustained' | 'permanent';
}

export interface Spellbook {
    id: string;
    name: string;
    spells: Spell[];
    owner: string;
}

export class ArcaneSpellCompiler extends EventEmitter {
    private static instance: ArcaneSpellCompiler;
    private spellbooks: Map<string, Spellbook> = new Map();
    private compiledSpells: Map<string, Spell> = new Map();

    private constructor() {
        super();
        this.initializeBaseSpells();
    }

    static getInstance(): ArcaneSpellCompiler {
        if (!ArcaneSpellCompiler.instance) {
            ArcaneSpellCompiler.instance = new ArcaneSpellCompiler();
        }
        return ArcaneSpellCompiler.instance;
    }

    private initializeBaseSpells(): void {
        const baseSpells: Omit<Spell, 'id'>[] = [
            {
                name: 'Create API Endpoint',
                incantation: 'Constructo Endpoint!',
                components: [
                    { type: 'verbal', description: 'Specify route path' },
                    { type: 'somatic', description: 'Define handler function' },
                    { type: 'material', description: 'Request/Response types', code: 'interface Request { ... }' },
                ],
                power: 0.7,
                castingTime: 5,
                effects: [
                    { name: 'REST Endpoint', description: 'Creates a new API endpoint', duration: 'permanent' },
                ],
                school: 'evocation',
            },
            {
                name: 'Protect with Types',
                incantation: 'Typus Protego!',
                components: [
                    { type: 'verbal', description: 'Declare interface names' },
                    { type: 'material', description: 'Type definitions', code: 'interface Props { ... }' },
                ],
                power: 0.8,
                castingTime: 3,
                effects: [
                    { name: 'Type Safety', description: 'Adds compile-time protection', duration: 'permanent' },
                ],
                school: 'abjuration',
            },
            {
                name: 'Transform to Async',
                incantation: 'Asynchro Mutatio!',
                components: [
                    { type: 'somatic', description: 'Add async keyword' },
                    { type: 'material', description: 'await expressions', code: 'await promise' },
                ],
                power: 0.6,
                castingTime: 2,
                effects: [
                    { name: 'Async Transformation', description: 'Converts to async/await', duration: 'permanent' },
                ],
                school: 'transmutation',
            },
            {
                name: 'Analyze Code Quality',
                incantation: 'Revelatio Qualitas!',
                components: [
                    { type: 'verbal', description: 'Specify analysis scope' },
                ],
                power: 0.5,
                castingTime: 1,
                effects: [
                    { name: 'Quality Report', description: 'Reveals code quality metrics', duration: 'instant' },
                ],
                school: 'divination',
            },
            {
                name: 'Generate Test Suite',
                incantation: 'Testum Generato!',
                components: [
                    { type: 'verbal', description: 'Specify test framework' },
                    { type: 'material', description: 'Test template', code: 'describe("...", () => { ... })' },
                ],
                power: 0.85,
                castingTime: 8,
                effects: [
                    { name: 'Test Coverage', description: 'Creates comprehensive tests', duration: 'permanent' },
                ],
                school: 'conjuration',
            },
        ];

        for (const spell of baseSpells) {
            const id = `spell_${spell.name.toLowerCase().replace(/\s+/g, '_')}`;
            this.compiledSpells.set(id, { id, ...spell });
        }
    }

    compileSpell(name: string, school: MagicSchool, components: SpellComponent[], effects: SpellEffect[]): Spell {
        const spell: Spell = {
            id: `spell_${Date.now()}`,
            name,
            incantation: this.generateIncantation(name),
            components,
            power: this.calculatePower(components, effects),
            castingTime: components.length * 2,
            effects,
            school,
        };

        this.compiledSpells.set(spell.id, spell);
        this.emit('spell:compiled', spell);
        return spell;
    }

    private generateIncantation(name: string): string {
        const words = name.split(' ');
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() + 'o').join(' ') + '!';
    }

    private calculatePower(components: SpellComponent[], effects: SpellEffect[]): number {
        const componentPower = components.length * 0.15;
        const effectPower = effects.reduce((s, e) =>
            s + (e.duration === 'permanent' ? 0.3 : e.duration === 'sustained' ? 0.2 : 0.1), 0);
        return Math.min(1, componentPower + effectPower);
    }

    castSpell(spellId: string, target: string): { success: boolean; result: string } {
        const spell = this.compiledSpells.get(spellId);
        if (!spell) {
            return { success: false, result: 'Spell not found' };
        }

        // Simulate spell casting
        const success = Math.random() < spell.power;
        const result = success
            ? `${spell.incantation} Successfully cast ${spell.name} on ${target}!`
            : `The spell fizzles... ${spell.name} failed.`;

        this.emit('spell:cast', { spell, target, success });
        return { success, result };
    }

    createSpellbook(name: string, owner: string): Spellbook {
        const spellbook: Spellbook = {
            id: `book_${Date.now()}`,
            name,
            spells: [],
            owner,
        };

        this.spellbooks.set(spellbook.id, spellbook);
        this.emit('spellbook:created', spellbook);
        return spellbook;
    }

    addToSpellbook(bookId: string, spellId: string): boolean {
        const book = this.spellbooks.get(bookId);
        const spell = this.compiledSpells.get(spellId);
        if (!book || !spell) return false;

        book.spells.push(spell);
        return true;
    }

    getSpell(id: string): Spell | undefined {
        return this.compiledSpells.get(id);
    }

    getAllSpells(): Spell[] {
        return Array.from(this.compiledSpells.values());
    }

    getSpellsBySchool(school: MagicSchool): Spell[] {
        return Array.from(this.compiledSpells.values()).filter(s => s.school === school);
    }

    getStats(): { totalSpells: number; totalSpellbooks: number; avgPower: number } {
        const spells = Array.from(this.compiledSpells.values());
        return {
            totalSpells: spells.length,
            totalSpellbooks: this.spellbooks.size,
            avgPower: spells.length > 0
                ? spells.reduce((s, sp) => s + sp.power, 0) / spells.length
                : 0,
        };
    }
}

export const arcaneSpellCompiler = ArcaneSpellCompiler.getInstance();
