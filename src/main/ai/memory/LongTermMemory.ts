import * as fs from 'fs';
import * as path from 'path';

export interface Memory {
    id: string;
    type: 'conversation' | 'task' | 'preference' | 'fact';
    content: string;
    context: Record<string, any>;
    timestamp: Date;
    importance: number; // 0-1
    tags: string[];
}

export interface ConversationMemory {
    sessionId: string;
    messages: any[];
    summary: string;
    outcomes: string[];
    timestamp: Date;
}

export interface TaskMemory {
    taskId: string;
    description: string;
    approach: string;
    result: string;
    successful: boolean;
    patterns: string[];
    timestamp: Date;
}

export interface PreferenceMemory {
    category: string;
    preference: string;
    confidence: number;
    examples: string[];
}

export class LongTermMemory {
    private memoryPath: string;
    private memories: Memory[] = [];
    private conversations: ConversationMemory[] = [];
    private tasks: TaskMemory[] = [];
    private preferences: PreferenceMemory[] = [];

    constructor(storagePath?: string) {
        this.memoryPath = storagePath || path.join(process.cwd(), '.shadow-memory');
        this.ensureDirectory();
        this.load();
    }

    /**
     * Store a memory
     */
    remember(memory: Omit<Memory, 'id' | 'timestamp'>): void {
        const fullMemory: Memory = {
            ...memory,
            id: this.generateId(),
            timestamp: new Date()
        };

        this.memories.push(fullMemory);
        this.save();
    }

    /**
     * Recall memories by query
     */
    recall(query: string, limit: number = 10): Memory[] {
        const queryLower = query.toLowerCase();

        return this.memories
            .filter(m => {
                const contentMatch = m.content.toLowerCase().includes(queryLower);
                const tagMatch = m.tags.some(t => t.toLowerCase().includes(queryLower));
                return contentMatch || tagMatch;
            })
            .sort((a, b) => {
                // Sort by importance and recency
                const scoreA = a.importance * 0.7 + (Date.now() - a.timestamp.getTime()) / 1000000 * 0.3;
                const scoreB = b.importance * 0.7 + (Date.now() - b.timestamp.getTime()) / 1000000 * 0.3;
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }

    /**
     * Store conversation
     */
    storeConversation(conversation: Omit<ConversationMemory, 'timestamp'>): void {
        this.conversations.push({
            ...conversation,
            timestamp: new Date()
        });
        this.save();
    }

    /**
     * Store task outcome
     */
    storeTask(task: Omit<TaskMemory, 'timestamp'>): void {
        this.tasks.push({
            ...task,
            timestamp: new Date()
        });

        // Extract patterns and learn
        if (task.successful && task.patterns.length > 0) {
            task.patterns.forEach(pattern => {
                this.remember({
                    type: 'fact',
                    content: `Successful pattern: ${pattern}`,
                    context: { taskId: task.taskId },
                    importance: 0.8,
                    tags: ['pattern', 'success']
                });
            });
        }

        this.save();
    }

    /**
     * Store user preference
     */
    storePreference(preference: PreferenceMemory): void {
        // Update existing or add new
        const existing = this.preferences.findIndex(p =>
            p.category === preference.category
        );

        if (existing >= 0) {
            this.preferences[existing] = preference;
        } else {
            this.preferences.push(preference);
        }

        this.save();
    }

    /**
     * Get preference
     */
    getPreference(category: string): PreferenceMemory | null {
        return this.preferences.find(p => p.category === category) || null;
    }

    /**
     * Get similar tasks
     */
    getSimilarTasks(description: string, limit: number = 5): TaskMemory[] {
        const descLower = description.toLowerCase();

        return this.tasks
            .filter(t => {
                const similarity = this.calculateSimilarity(descLower, t.description.toLowerCase());
                return similarity > 0.3;
            })
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get recent conversations
     */
    getRecentConversations(limit: number = 10): ConversationMemory[] {
        return this.conversations
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Clear old memories
     */
    cleanup(olderThanDays: number = 90): void {
        const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

        this.memories = this.memories.filter(m =>
            m.timestamp.getTime() > cutoff || m.importance > 0.8
        );

        this.conversations = this.conversations.filter(c =>
            c.timestamp.getTime() > cutoff
        );

        this.save();
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalMemories: this.memories.length,
            conversations: this.conversations.length,
            tasks: this.tasks.length,
            preferences: this.preferences.length,
            successRate: this.tasks.length > 0
                ? this.tasks.filter(t => t.successful).length / this.tasks.length
                : 0
        };
    }

    private ensureDirectory(): void {
        if (!fs.existsSync(this.memoryPath)) {
            fs.mkdirSync(this.memoryPath, { recursive: true });
        }
    }

    private load(): void {
        try {
            const memoriesFile = path.join(this.memoryPath, 'memories.json');
            const conversationsFile = path.join(this.memoryPath, 'conversations.json');
            const tasksFile = path.join(this.memoryPath, 'tasks.json');
            const preferencesFile = path.join(this.memoryPath, 'preferences.json');

            if (fs.existsSync(memoriesFile)) {
                this.memories = JSON.parse(fs.readFileSync(memoriesFile, 'utf-8'));
            }
            if (fs.existsSync(conversationsFile)) {
                this.conversations = JSON.parse(fs.readFileSync(conversationsFile, 'utf-8'));
            }
            if (fs.existsSync(tasksFile)) {
                this.tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
            }
            if (fs.existsSync(preferencesFile)) {
                this.preferences = JSON.parse(fs.readFileSync(preferencesFile, 'utf-8'));
            }
        } catch (error) {
            console.error('Failed to load memories:', error);
        }
    }

    private save(): void {
        try {
            fs.writeFileSync(
                path.join(this.memoryPath, 'memories.json'),
                JSON.stringify(this.memories, null, 2)
            );
            fs.writeFileSync(
                path.join(this.memoryPath, 'conversations.json'),
                JSON.stringify(this.conversations, null, 2)
            );
            fs.writeFileSync(
                path.join(this.memoryPath, 'tasks.json'),
                JSON.stringify(this.tasks, null, 2)
            );
            fs.writeFileSync(
                path.join(this.memoryPath, 'preferences.json'),
                JSON.stringify(this.preferences, null, 2)
            );
        } catch (error) {
            console.error('Failed to save memories:', error);
        }
    }

    private generateId(): string {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateSimilarity(a: string, b: string): number {
        const wordsA = new Set(a.split(/\s+/));
        const wordsB = new Set(b.split(/\s+/));

        const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
        const union = new Set([...wordsA, ...wordsB]);

        return intersection.size / union.size;
    }
}

// Singleton
let instance: LongTermMemory | null = null;

export function getMemory(): LongTermMemory {
    if (!instance) {
        instance = new LongTermMemory();
    }
    return instance;
}
