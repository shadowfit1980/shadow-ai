/**
 * ArtifactSigner - Code Provenance and Signing
 * 
 * Signs generated artifacts with provenance metadata:
 * - SHA-256 hash of content
 * - Model and prompt information
 * - Timestamp and version info
 * - Memory/context hits
 * - Verifiable attestation records
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export interface ProvenanceMetadata {
    model: string;
    modelVersion?: string;
    promptHash: string;
    contextHits?: string[];
    memoryKeys?: string[];
    timestamp: string;
    generationId: string;
}

export interface SignedArtifact {
    id: string;
    contentHash: string;
    content: string;
    contentType: 'code' | 'test' | 'documentation' | 'config';
    language?: string;
    fileName?: string;
    provenance: ProvenanceMetadata;
    signature: string;
    signedAt: string;
    version: string;
}

export interface AttestationRecord {
    artifactId: string;
    contentHash: string;
    provenance: ProvenanceMetadata;
    signature: string;
    attestedAt: string;
    attestationType: 'generation' | 'verification' | 'test-passed';
    verificationResult?: {
        valid: boolean;
        issues?: string[];
    };
}

export class ArtifactSigner {
    private static instance: ArtifactSigner;
    private signingSecret: string;
    private attestationPath: string;
    private artifacts: Map<string, SignedArtifact> = new Map();

    private constructor() {
        // Generate or load signing secret
        this.signingSecret = this.getOrCreateSecret();

        try {
            this.attestationPath = path.join(app.getPath('userData'), 'attestations');
        } catch {
            this.attestationPath = path.join(process.cwd(), '.attestations');
        }

        this.ensureAttestationDir();
        console.log('[ArtifactSigner] Initialized');
    }

    static getInstance(): ArtifactSigner {
        if (!ArtifactSigner.instance) {
            ArtifactSigner.instance = new ArtifactSigner();
        }
        return ArtifactSigner.instance;
    }

    private async ensureAttestationDir(): Promise<void> {
        try {
            await fs.mkdir(this.attestationPath, { recursive: true });
        } catch (error) {
            console.warn('[ArtifactSigner] Failed to create attestation dir:', error);
        }
    }

    private getOrCreateSecret(): string {
        // In production, this should be loaded from secure storage
        // For now, use a deterministic secret based on app identity
        const baseSecret = 'shadow-ai-signing-v1';
        return crypto
            .createHash('sha256')
            .update(baseSecret)
            .digest('hex');
    }

    /**
     * Compute SHA-256 hash of content
     */
    hashContent(content: string): string {
        return crypto
            .createHash('sha256')
            .update(content, 'utf-8')
            .digest('hex');
    }

    /**
     * Create HMAC signature
     */
    createSignature(data: string): string {
        return crypto
            .createHmac('sha256', this.signingSecret)
            .update(data)
            .digest('hex');
    }

    /**
     * Sign an artifact with provenance
     */
    signArtifact(
        content: string,
        contentType: SignedArtifact['contentType'],
        provenance: ProvenanceMetadata,
        options?: {
            language?: string;
            fileName?: string;
        }
    ): SignedArtifact {
        const contentHash = this.hashContent(content);
        const id = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        // Data to sign
        const signatureData = JSON.stringify({
            id,
            contentHash,
            provenance,
            signedAt: new Date().toISOString()
        });

        const signature = this.createSignature(signatureData);

        const artifact: SignedArtifact = {
            id,
            contentHash,
            content,
            contentType,
            language: options?.language,
            fileName: options?.fileName,
            provenance,
            signature,
            signedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        this.artifacts.set(id, artifact);
        console.log(`[ArtifactSigner] Signed artifact: ${id}`);

        return artifact;
    }

    /**
     * Verify an artifact signature
     */
    verifyArtifact(artifact: SignedArtifact): { valid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Verify content hash
        const actualHash = this.hashContent(artifact.content);
        if (actualHash !== artifact.contentHash) {
            issues.push('Content hash mismatch - content may have been modified');
        }

        // Verify signature
        const signatureData = JSON.stringify({
            id: artifact.id,
            contentHash: artifact.contentHash,
            provenance: artifact.provenance,
            signedAt: artifact.signedAt
        });

        const expectedSignature = this.createSignature(signatureData);
        if (expectedSignature !== artifact.signature) {
            issues.push('Signature verification failed - artifact may have been tampered with');
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Create an attestation record
     */
    async createAttestation(
        artifact: SignedArtifact,
        type: AttestationRecord['attestationType'],
        verificationResult?: AttestationRecord['verificationResult']
    ): Promise<AttestationRecord> {
        const attestation: AttestationRecord = {
            artifactId: artifact.id,
            contentHash: artifact.contentHash,
            provenance: artifact.provenance,
            signature: artifact.signature,
            attestedAt: new Date().toISOString(),
            attestationType: type,
            verificationResult
        };

        // Save to disk
        const filename = `${artifact.id}_${type}.json`;
        const filepath = path.join(this.attestationPath, filename);

        try {
            await fs.writeFile(filepath, JSON.stringify(attestation, null, 2));
            console.log(`[ArtifactSigner] Created attestation: ${filename}`);
        } catch (error) {
            console.warn('[ArtifactSigner] Failed to save attestation:', error);
        }

        return attestation;
    }

    /**
     * Sign generated code with full provenance
     */
    signGeneratedCode(
        code: string,
        model: string,
        prompt: string,
        options?: {
            language?: string;
            fileName?: string;
            contextHits?: string[];
        }
    ): SignedArtifact {
        const provenance: ProvenanceMetadata = {
            model,
            promptHash: this.hashContent(prompt),
            contextHits: options?.contextHits,
            timestamp: new Date().toISOString(),
            generationId: `gen_${Date.now()}`
        };

        return this.signArtifact(code, 'code', provenance, {
            language: options?.language,
            fileName: options?.fileName
        });
    }

    /**
     * Get artifact by ID
     */
    getArtifact(id: string): SignedArtifact | undefined {
        return this.artifacts.get(id);
    }

    /**
     * Export artifact for external verification
     */
    exportArtifact(id: string): string {
        const artifact = this.artifacts.get(id);
        if (!artifact) {
            throw new Error(`Artifact ${id} not found`);
        }
        return JSON.stringify(artifact, null, 2);
    }

    /**
     * Import and verify external artifact
     */
    importArtifact(json: string): {
        artifact: SignedArtifact;
        verification: { valid: boolean; issues: string[] };
    } {
        const artifact: SignedArtifact = JSON.parse(json);
        const verification = this.verifyArtifact(artifact);

        if (verification.valid) {
            this.artifacts.set(artifact.id, artifact);
        }

        return { artifact, verification };
    }

    /**
     * Generate provenance summary for a set of artifacts
     */
    generateProvenanceSummary(artifactIds: string[]): {
        totalArtifacts: number;
        models: string[];
        generationTimeRange: { earliest: string; latest: string };
        allVerified: boolean;
    } {
        const artifacts = artifactIds
            .map(id => this.artifacts.get(id))
            .filter(Boolean) as SignedArtifact[];

        const models = [...new Set(artifacts.map(a => a.provenance.model))];
        const timestamps = artifacts.map(a => new Date(a.provenance.timestamp).getTime());

        const verifications = artifacts.map(a => this.verifyArtifact(a));

        return {
            totalArtifacts: artifacts.length,
            models,
            generationTimeRange: {
                earliest: new Date(Math.min(...timestamps)).toISOString(),
                latest: new Date(Math.max(...timestamps)).toISOString()
            },
            allVerified: verifications.every(v => v.valid)
        };
    }
}

export const artifactSigner = ArtifactSigner.getInstance();
