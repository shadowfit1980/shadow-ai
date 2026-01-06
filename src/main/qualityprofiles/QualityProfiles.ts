/**
 * Quality Profiles - Code quality rulesets
 */
import { EventEmitter } from 'events';

export interface QualityProfile { id: string; name: string; language: string; rules: { ruleId: string; severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker'; enabled: boolean }[]; isDefault: boolean; }

export class QualityProfiles extends EventEmitter {
    private static instance: QualityProfiles;
    private profiles: Map<string, QualityProfile> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): QualityProfiles { if (!QualityProfiles.instance) QualityProfiles.instance = new QualityProfiles(); return QualityProfiles.instance; }

    private initDefaults(): void {
        const defaults: QualityProfile[] = [
            { id: 'sonar-way-ts', name: 'Sonar Way', language: 'typescript', rules: [{ ruleId: 'no-any', severity: 'major', enabled: true }, { ruleId: 'no-console', severity: 'minor', enabled: true }], isDefault: true },
            { id: 'sonar-way-js', name: 'Sonar Way', language: 'javascript', rules: [{ ruleId: 'no-eval', severity: 'critical', enabled: true }], isDefault: true }
        ];
        defaults.forEach(p => this.profiles.set(p.id, p));
    }

    create(name: string, language: string, baseProfile?: string): QualityProfile { const base = baseProfile ? this.profiles.get(baseProfile) : null; const profile: QualityProfile = { id: `qp_${Date.now()}`, name, language, rules: base?.rules ? [...base.rules] : [], isDefault: false }; this.profiles.set(profile.id, profile); return profile; }
    setDefault(id: string, language: string): boolean { this.profiles.forEach(p => { if (p.language === language) p.isDefault = p.id === id; }); return true; }
    getDefault(language: string): QualityProfile | null { return Array.from(this.profiles.values()).find(p => p.language === language && p.isDefault) || null; }
    getAll(): QualityProfile[] { return Array.from(this.profiles.values()); }
}
export function getQualityProfiles(): QualityProfiles { return QualityProfiles.getInstance(); }
