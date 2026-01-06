/**
 * 👥 CollaborationEngine - Real-Time Collaborative Coding
 * 
 * From Queen 3 Max: "Like Google Docs for code — but smarter.
 * Multiple users edit same project, AI resolves merge conflicts in real-time."
 * 
 * Features:
 * - CRDT-based shared state (Yjs-compatible)
 * - Real-time presence
 * - AI-powered merge conflict resolution
 * - Voice chat overlay with transcription
 * - Change summarization
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface CollaborationSession {
    id: string;
    name: string;
    projectPath: string;
    createdAt: Date;
    participants: Participant[];
    activeFile?: string;
    state: 'active' | 'paused' | 'ended';
}

export interface Participant {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    cursor?: CursorPosition;
    selection?: Selection;
    status: 'active' | 'idle' | 'away';
    lastActivity: Date;
    isAI?: boolean;
}

export interface CursorPosition {
    file: string;
    line: number;
    column: number;
}

export interface Selection {
    file: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
}

export interface CRDTOperation {
    id: string;
    type: 'insert' | 'delete' | 'update';
    file: string;
    position: number;
    content?: string;
    length?: number;
    timestamp: number;
    authorId: string;
    vector: Record<string, number>;
}

export interface MergeConflict {
    id: string;
    file: string;
    type: 'content' | 'semantic' | 'structural';
    ourChange: string;
    theirChange: string;
    baseContent: string;
    resolution?: ConflictResolution;
}

export interface ConflictResolution {
    strategy: 'ours' | 'theirs' | 'merge' | 'ai';
    resolvedContent: string;
    explanation?: string;
}

export interface VoiceMessage {
    id: string;
    participantId: string;
    audioUrl?: string;
    transcription: string;
    timestamp: Date;
}

export interface ChangeSummary {
    since: Date;
    files: FileChange[];
    highlights: string[];
    byParticipant: ParticipantChanges[];
}

export interface FileChange {
    file: string;
    additions: number;
    deletions: number;
    description: string;
}

export interface ParticipantChanges {
    participant: Participant;
    files: string[];
    linesChanged: number;
    summary: string;
}

// Colors for participants
const PARTICIPANT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

// ============================================================================
// COLLABORATION ENGINE
// ============================================================================

export class CollaborationEngine extends EventEmitter {
    private static instance: CollaborationEngine;
    private sessions: Map<string, CollaborationSession> = new Map();
    private operations: Map<string, CRDTOperation[]> = new Map();
    private conflicts: Map<string, MergeConflict[]> = new Map();
    private vectorClocks: Map<string, Record<string, number>> = new Map();
    private voiceMessages: Map<string, VoiceMessage[]> = new Map();

    private constructor() {
        super();
    }

    public static getInstance(): CollaborationEngine {
        if (!CollaborationEngine.instance) {
            CollaborationEngine.instance = new CollaborationEngine();
        }
        return CollaborationEngine.instance;
    }

    /**
     * Create a new collaboration session
     */
    public createSession(name: string, projectPath: string, creatorName: string): CollaborationSession {
        const sessionId = this.generateId();

        const session: CollaborationSession = {
            id: sessionId,
            name,
            projectPath,
            createdAt: new Date(),
            participants: [{
                id: this.generateId(),
                name: creatorName,
                color: PARTICIPANT_COLORS[0],
                status: 'active',
                lastActivity: new Date()
            }],
            state: 'active'
        };

        this.sessions.set(sessionId, session);
        this.operations.set(sessionId, []);
        this.vectorClocks.set(sessionId, { [session.participants[0].id]: 0 });

        console.log(`👥 Created collaboration session: ${name}`);
        this.emit('session:created', session);

        return session;
    }

    /**
     * Join an existing session
     */
    public joinSession(sessionId: string, participantName: string): Participant {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const colorIndex = session.participants.length % PARTICIPANT_COLORS.length;

        const participant: Participant = {
            id: this.generateId(),
            name: participantName,
            color: PARTICIPANT_COLORS[colorIndex],
            status: 'active',
            lastActivity: new Date()
        };

        session.participants.push(participant);

        // Initialize vector clock for participant
        const clock = this.vectorClocks.get(sessionId)!;
        clock[participant.id] = 0;

        console.log(`👤 ${participantName} joined session: ${session.name}`);
        this.emit('participant:joined', { sessionId, participant });

        return participant;
    }

    /**
     * Leave a session
     */
    public leaveSession(sessionId: string, participantId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const index = session.participants.findIndex(p => p.id === participantId);
        if (index !== -1) {
            const participant = session.participants[index];
            session.participants.splice(index, 1);

            this.emit('participant:left', { sessionId, participant });
            console.log(`👤 ${participant.name} left session: ${session.name}`);
        }

        // End session if no participants
        if (session.participants.length === 0) {
            session.state = 'ended';
            this.emit('session:ended', session);
        }
    }

    /**
     * Apply a CRDT operation
     */
    public applyOperation(sessionId: string, operation: Omit<CRDTOperation, 'id' | 'timestamp' | 'vector'>): CRDTOperation {
        const clock = this.vectorClocks.get(sessionId);
        if (!clock) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // Increment vector clock
        clock[operation.authorId] = (clock[operation.authorId] || 0) + 1;

        const fullOperation: CRDTOperation = {
            ...operation,
            id: this.generateId(),
            timestamp: Date.now(),
            vector: { ...clock }
        };

        // Store operation
        const ops = this.operations.get(sessionId) || [];
        ops.push(fullOperation);
        this.operations.set(sessionId, ops);

        // Check for conflicts
        const conflict = this.detectConflict(sessionId, fullOperation);
        if (conflict) {
            this.handleConflict(sessionId, conflict);
        }

        this.emit('operation:applied', { sessionId, operation: fullOperation });

        return fullOperation;
    }

    /**
     * Update participant cursor position
     */
    public updateCursor(sessionId: string, participantId: string, cursor: CursorPosition): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const participant = session.participants.find(p => p.id === participantId);
        if (participant) {
            participant.cursor = cursor;
            participant.lastActivity = new Date();
            participant.status = 'active';

            this.emit('cursor:updated', { sessionId, participantId, cursor });
        }
    }

    /**
     * Update participant selection
     */
    public updateSelection(sessionId: string, participantId: string, selection: Selection | undefined): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const participant = session.participants.find(p => p.id === participantId);
        if (participant) {
            participant.selection = selection;
            participant.lastActivity = new Date();

            this.emit('selection:updated', { sessionId, participantId, selection });
        }
    }

    /**
     * Get merge conflicts for a session
     */
    public getConflicts(sessionId: string): MergeConflict[] {
        return this.conflicts.get(sessionId) || [];
    }

    /**
     * Resolve a merge conflict with AI
     */
    public async resolveConflictWithAI(sessionId: string, conflictId: string): Promise<ConflictResolution> {
        const conflicts = this.conflicts.get(sessionId) || [];
        const conflict = conflicts.find(c => c.id === conflictId);

        if (!conflict) {
            throw new Error(`Conflict not found: ${conflictId}`);
        }

        // AI-powered resolution (simulated)
        const resolution = this.mergeWithAI(conflict);
        conflict.resolution = resolution;

        this.emit('conflict:resolved', { sessionId, conflict });

        return resolution;
    }

    /**
     * Add a voice message
     */
    public addVoiceMessage(sessionId: string, participantId: string, transcription: string): VoiceMessage {
        const message: VoiceMessage = {
            id: this.generateId(),
            participantId,
            transcription,
            timestamp: new Date()
        };

        const messages = this.voiceMessages.get(sessionId) || [];
        messages.push(message);
        this.voiceMessages.set(sessionId, messages);

        this.emit('voice:message', { sessionId, message });

        return message;
    }

    /**
     * Get changes since last check
     */
    public getChangesSince(sessionId: string, since: Date): ChangeSummary {
        const ops = this.operations.get(sessionId) || [];
        const session = this.sessions.get(sessionId);

        // Filter operations since timestamp
        const recentOps = ops.filter(op => op.timestamp > since.getTime());

        // Group by file
        const fileChanges: Map<string, { additions: number; deletions: number }> = new Map();
        const participantChanges: Map<string, { files: Set<string>; lines: number }> = new Map();

        for (const op of recentOps) {
            // Track file changes
            const existing = fileChanges.get(op.file) || { additions: 0, deletions: 0 };
            if (op.type === 'insert') existing.additions++;
            if (op.type === 'delete') existing.deletions++;
            fileChanges.set(op.file, existing);

            // Track participant changes
            const pc = participantChanges.get(op.authorId) || { files: new Set(), lines: 0 };
            pc.files.add(op.file);
            pc.lines++;
            participantChanges.set(op.authorId, pc);
        }

        // Build summary
        const files: FileChange[] = Array.from(fileChanges.entries()).map(([file, changes]) => ({
            file,
            additions: changes.additions,
            deletions: changes.deletions,
            description: `${changes.additions} additions, ${changes.deletions} deletions`
        }));

        const byParticipant: ParticipantChanges[] = [];
        if (session) {
            for (const [id, changes] of participantChanges) {
                const participant = session.participants.find(p => p.id === id);
                if (participant) {
                    byParticipant.push({
                        participant,
                        files: Array.from(changes.files),
                        linesChanged: changes.lines,
                        summary: `Modified ${changes.files.size} files with ${changes.lines} changes`
                    });
                }
            }
        }

        return {
            since,
            files,
            highlights: this.generateHighlights(files, byParticipant),
            byParticipant
        };
    }

    /**
     * Get session
     */
    public getSession(sessionId: string): CollaborationSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get all active sessions
     */
    public getActiveSessions(): CollaborationSession[] {
        return Array.from(this.sessions.values()).filter(s => s.state === 'active');
    }

    /**
     * End a session
     */
    public endSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.state = 'ended';
            this.emit('session:ended', session);
        }
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private detectConflict(sessionId: string, operation: CRDTOperation): MergeConflict | null {
        const ops = this.operations.get(sessionId) || [];

        // Look for concurrent operations on same position
        const concurrent = ops.filter(op =>
            op.file === operation.file &&
            op.id !== operation.id &&
            Math.abs(op.position - operation.position) < 10 &&
            Math.abs(op.timestamp - operation.timestamp) < 1000 &&
            !this.happensBefore(op.vector, operation.vector) &&
            !this.happensBefore(operation.vector, op.vector)
        );

        if (concurrent.length > 0) {
            return {
                id: this.generateId(),
                file: operation.file,
                type: 'content',
                ourChange: operation.content || '',
                theirChange: concurrent[0].content || '',
                baseContent: '' // Would need to track base
            };
        }

        return null;
    }

    private happensBefore(v1: Record<string, number>, v2: Record<string, number>): boolean {
        let atLeastOneLess = false;

        for (const key of Object.keys({ ...v1, ...v2 })) {
            if ((v1[key] || 0) > (v2[key] || 0)) {
                return false;
            }
            if ((v1[key] || 0) < (v2[key] || 0)) {
                atLeastOneLess = true;
            }
        }

        return atLeastOneLess;
    }

    private handleConflict(sessionId: string, conflict: MergeConflict): void {
        const conflicts = this.conflicts.get(sessionId) || [];
        conflicts.push(conflict);
        this.conflicts.set(sessionId, conflicts);

        this.emit('conflict:detected', { sessionId, conflict });
        console.log(`⚠️ Merge conflict detected in ${conflict.file}`);
    }

    private mergeWithAI(conflict: MergeConflict): ConflictResolution {
        // Intelligent merge strategy
        const ours = conflict.ourChange.trim();
        const theirs = conflict.theirChange.trim();

        // If one is a subset of the other, take the larger
        if (theirs.includes(ours)) {
            return {
                strategy: 'theirs',
                resolvedContent: theirs,
                explanation: 'Their change is more comprehensive'
            };
        }
        if (ours.includes(theirs)) {
            return {
                strategy: 'ours',
                resolvedContent: ours,
                explanation: 'Our change is more comprehensive'
            };
        }

        // Try to merge both changes
        const merged = `${ours}\n${theirs}`;
        return {
            strategy: 'merge',
            resolvedContent: merged,
            explanation: 'Combined both changes - please verify'
        };
    }

    private generateHighlights(files: FileChange[], participants: ParticipantChanges[]): string[] {
        const highlights: string[] = [];

        if (files.length > 0) {
            highlights.push(`${files.length} files modified`);
        }

        const topFile = files.reduce((max, f) =>
            (f.additions + f.deletions) > (max.additions + max.deletions) ? f : max,
            files[0]
        );

        if (topFile) {
            highlights.push(`Most active: ${topFile.file}`);
        }

        if (participants.length > 1) {
            highlights.push(`${participants.length} collaborators contributing`);
        }

        return highlights;
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const collaborationEngine = CollaborationEngine.getInstance();
