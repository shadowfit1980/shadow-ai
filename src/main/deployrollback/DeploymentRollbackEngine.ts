/**
 * Deployment Rollback - Rollback deployments
 */
import { EventEmitter } from 'events';

export interface DeploymentSnapshot { id: string; deploymentId: string; version: string; config: Record<string, unknown>; createdAt: number; }
export interface RollbackOperation { id: string; deploymentId: string; fromVersion: string; toVersion: string; status: 'pending' | 'rolling_back' | 'complete' | 'failed'; startedAt: number; completedAt?: number; }

export class DeploymentRollbackEngine extends EventEmitter {
    private static instance: DeploymentRollbackEngine;
    private snapshots: Map<string, DeploymentSnapshot[]> = new Map();
    private rollbacks: RollbackOperation[] = [];
    private maxSnapshots = 10;
    private constructor() { super(); }
    static getInstance(): DeploymentRollbackEngine { if (!DeploymentRollbackEngine.instance) DeploymentRollbackEngine.instance = new DeploymentRollbackEngine(); return DeploymentRollbackEngine.instance; }

    createSnapshot(deploymentId: string, version: string, config: Record<string, unknown>): DeploymentSnapshot { const snap: DeploymentSnapshot = { id: `snap_${Date.now()}`, deploymentId, version, config: { ...config }, createdAt: Date.now() }; const snaps = this.snapshots.get(deploymentId) || []; snaps.push(snap); if (snaps.length > this.maxSnapshots) snaps.shift(); this.snapshots.set(deploymentId, snaps); return snap; }

    async rollback(deploymentId: string, targetVersion?: string): Promise<RollbackOperation> {
        const snaps = this.snapshots.get(deploymentId) || []; if (snaps.length < 2) throw new Error('No previous version to rollback to');
        const target = targetVersion ? snaps.find(s => s.version === targetVersion) : snaps[snaps.length - 2]; if (!target) throw new Error('Target version not found');
        const current = snaps[snaps.length - 1];
        const op: RollbackOperation = { id: `rb_${Date.now()}`, deploymentId, fromVersion: current.version, toVersion: target.version, status: 'pending', startedAt: Date.now() };
        this.rollbacks.push(op); op.status = 'rolling_back'; await new Promise(r => setTimeout(r, 100));
        op.status = 'complete'; op.completedAt = Date.now(); this.emit('rolledBack', op); return op;
    }

    getSnapshots(deploymentId: string): DeploymentSnapshot[] { return this.snapshots.get(deploymentId) || []; }
    getRollbacks(deploymentId?: string): RollbackOperation[] { return deploymentId ? this.rollbacks.filter(r => r.deploymentId === deploymentId) : this.rollbacks; }
}
export function getDeploymentRollbackEngine(): DeploymentRollbackEngine { return DeploymentRollbackEngine.getInstance(); }
