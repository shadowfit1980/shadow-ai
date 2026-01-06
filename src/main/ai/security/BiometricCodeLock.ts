/**
 * Biometric Code Lock
 * Secure sensitive code sections with biometric verification
 * Grok Recommendation: Biometric Code Locks
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface BiometricProfile {
    id: string;
    userId: string;
    methods: BiometricMethod[];
    createdAt: Date;
    lastUsed: Date;
    failedAttempts: number;
    locked: boolean;
}

interface BiometricMethod {
    type: 'fingerprint' | 'face' | 'voice' | 'pattern' | 'pin' | 'hardware_key';
    enabled: boolean;
    hash: string;
    lastVerified?: Date;
    enrollment: Date;
}

interface ProtectedSection {
    id: string;
    filePath: string;
    startLine: number;
    endLine: number;
    description: string;
    requiredMethods: BiometricMethod['type'][];
    accessLevel: 'view' | 'edit' | 'full';
    ownerId: string;
    allowedUsers: string[];
    accessLog: AccessLogEntry[];
}

interface AccessLogEntry {
    timestamp: Date;
    userId: string;
    action: 'view' | 'edit' | 'unlock' | 'lock' | 'failed';
    method: BiometricMethod['type'];
    success: boolean;
    ipAddress?: string;
}

interface VerificationResult {
    success: boolean;
    method: BiometricMethod['type'];
    confidence: number;
    message: string;
    sessionToken?: string;
    expiresAt?: Date;
}

interface SecurityPolicy {
    maxFailedAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireMultiFactor: boolean;
    allowedMethods: BiometricMethod['type'][];
    autoLockOnIdle: boolean;
    idleTimeout: number;
}

export class BiometricCodeLock extends EventEmitter {
    private static instance: BiometricCodeLock;
    private profiles: Map<string, BiometricProfile> = new Map();
    private protectedSections: Map<string, ProtectedSection> = new Map();
    private activeSessions: Map<string, { token: string; userId: string; expiresAt: Date }> = new Map();
    private policy: SecurityPolicy;

    private constructor() {
        super();
        this.policy = this.getDefaultPolicy();
    }

    static getInstance(): BiometricCodeLock {
        if (!BiometricCodeLock.instance) {
            BiometricCodeLock.instance = new BiometricCodeLock();
        }
        return BiometricCodeLock.instance;
    }

    private getDefaultPolicy(): SecurityPolicy {
        return {
            maxFailedAttempts: 5,
            lockoutDuration: 300000, // 5 minutes
            sessionTimeout: 3600000, // 1 hour
            requireMultiFactor: false,
            allowedMethods: ['fingerprint', 'face', 'voice', 'pattern', 'pin', 'hardware_key'],
            autoLockOnIdle: true,
            idleTimeout: 600000 // 10 minutes
        };
    }

    createProfile(userId: string): BiometricProfile {
        const profile: BiometricProfile = {
            id: crypto.randomUUID(),
            userId,
            methods: [],
            createdAt: new Date(),
            lastUsed: new Date(),
            failedAttempts: 0,
            locked: false
        };

        this.profiles.set(userId, profile);
        this.emit('profileCreated', profile);
        return profile;
    }

    enrollMethod(userId: string, type: BiometricMethod['type'], data: string): { success: boolean; message: string } {
        let profile = this.profiles.get(userId);
        if (!profile) {
            profile = this.createProfile(userId);
        }

        if (!this.policy.allowedMethods.includes(type)) {
            return { success: false, message: `Method ${type} is not allowed by policy` };
        }

        const existingMethod = profile.methods.find(m => m.type === type);
        if (existingMethod) {
            return { success: false, message: `Method ${type} is already enrolled` };
        }

        const hash = crypto.createHash('sha256').update(data + userId).digest('hex');

        const method: BiometricMethod = {
            type,
            enabled: true,
            hash,
            enrollment: new Date()
        };

        profile.methods.push(method);
        this.emit('methodEnrolled', { userId, type });

        return { success: true, message: `${type} enrolled successfully` };
    }

    verify(userId: string, type: BiometricMethod['type'], data: string): VerificationResult {
        const profile = this.profiles.get(userId);

        if (!profile) {
            return { success: false, method: type, confidence: 0, message: 'Profile not found' };
        }

        if (profile.locked) {
            return { success: false, method: type, confidence: 0, message: 'Account is locked' };
        }

        const method = profile.methods.find(m => m.type === type && m.enabled);
        if (!method) {
            return { success: false, method: type, confidence: 0, message: `Method ${type} not enrolled` };
        }

        const hash = crypto.createHash('sha256').update(data + userId).digest('hex');
        const match = hash === method.hash;

        if (!match) {
            profile.failedAttempts++;

            if (profile.failedAttempts >= this.policy.maxFailedAttempts) {
                profile.locked = true;
                this.emit('accountLocked', { userId, reason: 'Too many failed attempts' });

                setTimeout(() => {
                    profile.locked = false;
                    profile.failedAttempts = 0;
                    this.emit('accountUnlocked', { userId });
                }, this.policy.lockoutDuration);
            }

            return {
                success: false,
                method: type,
                confidence: 0,
                message: `Verification failed. ${this.policy.maxFailedAttempts - profile.failedAttempts} attempts remaining`
            };
        }

        profile.failedAttempts = 0;
        profile.lastUsed = new Date();
        method.lastVerified = new Date();

        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + this.policy.sessionTimeout);

        this.activeSessions.set(sessionToken, { token: sessionToken, userId, expiresAt });

        this.emit('verificationSuccess', { userId, method: type });

        return {
            success: true,
            method: type,
            confidence: 0.95 + Math.random() * 0.05,
            message: 'Verification successful',
            sessionToken,
            expiresAt
        };
    }

    protectSection(options: {
        filePath: string;
        startLine: number;
        endLine: number;
        description: string;
        ownerId: string;
        requiredMethods?: BiometricMethod['type'][];
        accessLevel?: ProtectedSection['accessLevel'];
        allowedUsers?: string[];
    }): ProtectedSection {
        const section: ProtectedSection = {
            id: crypto.randomUUID(),
            filePath: options.filePath,
            startLine: options.startLine,
            endLine: options.endLine,
            description: options.description,
            requiredMethods: options.requiredMethods || ['pin'],
            accessLevel: options.accessLevel || 'edit',
            ownerId: options.ownerId,
            allowedUsers: options.allowedUsers || [],
            accessLog: []
        };

        this.protectedSections.set(section.id, section);
        this.emit('sectionProtected', section);
        return section;
    }

    accessSection(sectionId: string, sessionToken: string): { allowed: boolean; section?: ProtectedSection; message: string } {
        const section = this.protectedSections.get(sectionId);
        if (!section) {
            return { allowed: false, message: 'Protected section not found' };
        }

        const session = this.activeSessions.get(sessionToken);
        if (!session) {
            return { allowed: false, message: 'Invalid or expired session' };
        }

        if (session.expiresAt < new Date()) {
            this.activeSessions.delete(sessionToken);
            return { allowed: false, message: 'Session expired' };
        }

        const isOwner = section.ownerId === session.userId;
        const isAllowed = section.allowedUsers.includes(session.userId);

        if (!isOwner && !isAllowed) {
            this.logAccess(sectionId, session.userId, 'view', 'pin', false);
            return { allowed: false, message: 'Access denied' };
        }

        this.logAccess(sectionId, session.userId, 'view', 'pin', true);
        return { allowed: true, section, message: 'Access granted' };
    }

    private logAccess(sectionId: string, userId: string, action: AccessLogEntry['action'], method: BiometricMethod['type'], success: boolean): void {
        const section = this.protectedSections.get(sectionId);
        if (!section) return;

        const entry: AccessLogEntry = {
            timestamp: new Date(),
            userId,
            action,
            method,
            success
        };

        section.accessLog.push(entry);

        if (section.accessLog.length > 1000) {
            section.accessLog = section.accessLog.slice(-1000);
        }

        this.emit('accessLogged', entry);
    }

    removeSection(sectionId: string, sessionToken: string): boolean {
        const section = this.protectedSections.get(sectionId);
        if (!section) return false;

        const session = this.activeSessions.get(sessionToken);
        if (!session || section.ownerId !== session.userId) return false;

        this.protectedSections.delete(sectionId);
        this.emit('sectionUnprotected', sectionId);
        return true;
    }

    checkAccess(filePath: string, line: number): ProtectedSection | null {
        for (const section of this.protectedSections.values()) {
            if (section.filePath === filePath && line >= section.startLine && line <= section.endLine) {
                return section;
            }
        }
        return null;
    }

    getProtectedSections(filePath?: string): ProtectedSection[] {
        const sections = Array.from(this.protectedSections.values());
        if (filePath) {
            return sections.filter(s => s.filePath === filePath);
        }
        return sections;
    }

    getProfile(userId: string): BiometricProfile | undefined {
        return this.profiles.get(userId);
    }

    getAccessLog(sectionId: string): AccessLogEntry[] {
        return this.protectedSections.get(sectionId)?.accessLog || [];
    }

    updatePolicy(newPolicy: Partial<SecurityPolicy>): void {
        this.policy = { ...this.policy, ...newPolicy };
        this.emit('policyUpdated', this.policy);
    }

    getPolicy(): SecurityPolicy {
        return { ...this.policy };
    }

    invalidateSession(sessionToken: string): boolean {
        return this.activeSessions.delete(sessionToken);
    }

    getActiveSessions(userId: string): { token: string; expiresAt: Date }[] {
        return Array.from(this.activeSessions.values())
            .filter(s => s.userId === userId)
            .map(s => ({ token: s.token, expiresAt: s.expiresAt }));
    }

    lockAllSections(): void {
        this.activeSessions.clear();
        this.emit('allSectionsLocked');
    }

    emergencyUnlock(adminKey: string, userId: string): boolean {
        const expectedKey = crypto.createHash('sha256').update('admin_emergency_key').digest('hex');
        if (adminKey !== expectedKey) return false;

        const profile = this.profiles.get(userId);
        if (profile) {
            profile.locked = false;
            profile.failedAttempts = 0;
            this.emit('emergencyUnlock', { userId });
            return true;
        }
        return false;
    }
}

export const biometricCodeLock = BiometricCodeLock.getInstance();
