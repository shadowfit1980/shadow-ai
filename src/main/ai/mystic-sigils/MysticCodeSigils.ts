/**
 * Mystic Code Sigils
 * 
 * Creates protective and enhancing sigils for code - symbolic
 * markers that provide documentation, protection, and enhancement.
 */

import { EventEmitter } from 'events';

export interface Sigil {
    id: string;
    symbol: string;
    name: string;
    purpose: SigilPurpose;
    power: number;
    incantation: string;
}

export type SigilPurpose =
    | 'protection'
    | 'enhancement'
    | 'documentation'
    | 'warning'
    | 'blessing';

export interface SigilApplication {
    id: string;
    sigil: Sigil;
    location: string;
    strength: number;
    active: boolean;
}

export interface SigilNetwork {
    sigils: SigilApplication[];
    totalPower: number;
    harmony: number;
}

export class MysticCodeSigils extends EventEmitter {
    private static instance: MysticCodeSigils;
    private sigils: Map<string, Sigil> = new Map();
    private applications: Map<string, SigilApplication[]> = new Map();

    private constructor() {
        super();
        this.initializeSigils();
    }

    static getInstance(): MysticCodeSigils {
        if (!MysticCodeSigils.instance) {
            MysticCodeSigils.instance = new MysticCodeSigils();
        }
        return MysticCodeSigils.instance;
    }

    private initializeSigils(): void {
        const baseSigils: Omit<Sigil, 'id'>[] = [
            { symbol: '🛡️', name: 'Aegis', purpose: 'protection', power: 0.9, incantation: 'Protego!' },
            { symbol: '⚡', name: 'Power', purpose: 'enhancement', power: 0.85, incantation: 'Amplify!' },
            { symbol: '📜', name: 'Scroll', purpose: 'documentation', power: 0.7, incantation: 'Document!' },
            { symbol: '⚠️', name: 'Warning', purpose: 'warning', power: 0.75, incantation: 'Alert!' },
            { symbol: '✨', name: 'Blessing', purpose: 'blessing', power: 0.8, incantation: 'Bless!' },
        ];

        for (let i = 0; i < baseSigils.length; i++) {
            const sigil: Sigil = { ...baseSigils[i], id: `sigil_${i}` };
            this.sigils.set(sigil.id, sigil);
        }
    }

    applySigil(sigilId: string, targetCode: string, location: string = 'top'): SigilApplication | undefined {
        const sigil = this.sigils.get(sigilId);
        if (!sigil) return undefined;

        const application: SigilApplication = {
            id: `app_${Date.now()}`,
            sigil,
            location,
            strength: sigil.power,
            active: true,
        };

        const codeApps = this.applications.get(targetCode) || [];
        codeApps.push(application);
        this.applications.set(targetCode, codeApps);

        this.emit('sigil:applied', application);
        return application;
    }

    getSigilNetwork(code: string): SigilNetwork {
        const apps = this.applications.get(code) || [];
        const totalPower = apps.reduce((s, a) => s + a.strength, 0);
        const harmony = apps.length > 0 ? 1 - (apps.length - 1) * 0.1 : 1;

        return { sigils: apps, totalPower, harmony: Math.max(0, harmony) };
    }

    getAllSigils(): Sigil[] {
        return Array.from(this.sigils.values());
    }

    getStats(): { totalSigils: number; totalApplications: number; avgPower: number } {
        const sigils = Array.from(this.sigils.values());
        let totalApps = 0;
        for (const apps of this.applications.values()) {
            totalApps += apps.length;
        }

        return {
            totalSigils: sigils.length,
            totalApplications: totalApps,
            avgPower: sigils.length > 0
                ? sigils.reduce((s, sig) => s + sig.power, 0) / sigils.length
                : 0,
        };
    }
}

export const mysticCodeSigils = MysticCodeSigils.getInstance();
