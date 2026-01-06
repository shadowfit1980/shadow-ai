/**
 * Feature Store - ML features
 */
import { EventEmitter } from 'events';

export interface Feature { id: string; name: string; type: 'numeric' | 'categorical' | 'embedding' | 'timestamp'; source: string; version: string; }
export interface FeatureSet { id: string; name: string; features: string[]; created: number; }

export class FeatureStoreEngine extends EventEmitter {
    private static instance: FeatureStoreEngine;
    private features: Map<string, Feature> = new Map();
    private sets: Map<string, FeatureSet> = new Map();
    private constructor() { super(); }
    static getInstance(): FeatureStoreEngine { if (!FeatureStoreEngine.instance) FeatureStoreEngine.instance = new FeatureStoreEngine(); return FeatureStoreEngine.instance; }

    register(name: string, type: Feature['type'], source: string, version = '1.0'): Feature { const feature: Feature = { id: `feat_${Date.now()}`, name, type, source, version }; this.features.set(feature.id, feature); return feature; }
    createSet(name: string, featureIds: string[]): FeatureSet { const set: FeatureSet = { id: `fset_${Date.now()}`, name, features: featureIds, created: Date.now() }; this.sets.set(set.id, set); return set; }
    getFeature(featureId: string): Feature | null { return this.features.get(featureId) || null; }
    getSet(setId: string): FeatureSet | null { return this.sets.get(setId) || null; }
    searchFeatures(query: string): Feature[] { const q = query.toLowerCase(); return Array.from(this.features.values()).filter(f => f.name.toLowerCase().includes(q)); }
    getAllFeatures(): Feature[] { return Array.from(this.features.values()); }
}
export function getFeatureStoreEngine(): FeatureStoreEngine { return FeatureStoreEngine.getInstance(); }
