import ElectronStore from 'electron-store';

/**
 * Knowledge Base using electron-store
 * Simpler alternative to SQLite that doesn't require native compilation
 */

interface Project {
    id: number;
    name: string;
    type: string;
    path: string;
    created_at: string;
    metadata?: any;
}

interface Conversation {
    id: number;
    project_id: number | null;
    role: string;
    content: string;
    agent_type?: string;
    created_at: string;
}

interface Learning {
    id: number;
    category: string;
    key: string;
    value: string;
    confidence: number;
    created_at: string;
    updated_at: string;
}

interface StoreSchema {
    projects: Project[];
    conversations: Conversation[];
    learnings: Learning[];
    preferences: Record<string, string>;
    nextId: {
        project: number;
        conversation: number;
        learning: number;
    };
}

export class KnowledgeBase {
    private static instance: KnowledgeBase;
    private store: ElectronStore<StoreSchema>;

    private constructor() {
        this.store = new ElectronStore<StoreSchema>({
            name: 'knowledge-base',
            defaults: {
                projects: [],
                conversations: [],
                learnings: [],
                preferences: {},
                nextId: {
                    project: 1,
                    conversation: 1,
                    learning: 1,
                },
            },
        });
    }

    static getInstance(): KnowledgeBase {
        if (!KnowledgeBase.instance) {
            KnowledgeBase.instance = new KnowledgeBase();
        }
        return KnowledgeBase.instance;
    }

    /**
     * Store project information
     */
    storeProject(name: string, type: string, projectPath: string, metadata?: any): number {
        const projects = this.store.get('projects');
        const nextId = this.store.get('nextId');

        const project: Project = {
            id: nextId.project,
            name,
            type,
            path: projectPath,
            created_at: new Date().toISOString(),
            metadata,
        };

        projects.push(project);
        this.store.set('projects', projects);
        this.store.set('nextId.project', nextId.project + 1);

        return project.id;
    }

    /**
     * Store conversation
     */
    storeConversation(
        projectId: number | null,
        role: string,
        content: string,
        agentType?: string
    ): void {
        const conversations = this.store.get('conversations');
        const nextId = this.store.get('nextId');

        const conversation: Conversation = {
            id: nextId.conversation,
            project_id: projectId,
            role,
            content,
            agent_type: agentType,
            created_at: new Date().toISOString(),
        };

        conversations.push(conversation);
        this.store.set('conversations', conversations);
        this.store.set('nextId.conversation', nextId.conversation + 1);
    }

    /**
     * Store learning
     */
    storeLearning(category: string, key: string, value: string, confidence: number = 0.5): void {
        const learnings = this.store.get('learnings');
        const nextId = this.store.get('nextId');

        // Check if learning already exists
        const existingIndex = learnings.findIndex(
            (l) => l.category === category && l.key === key
        );

        if (existingIndex >= 0) {
            learnings[existingIndex] = {
                ...learnings[existingIndex],
                value,
                confidence,
                updated_at: new Date().toISOString(),
            };
        } else {
            const learning: Learning = {
                id: nextId.learning,
                category,
                key,
                value,
                confidence,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            learnings.push(learning);
            this.store.set('nextId.learning', nextId.learning + 1);
        }

        this.store.set('learnings', learnings);
    }

    /**
     * Query learnings
     */
    queryLearnings(category?: string): Learning[] {
        const learnings = this.store.get('learnings');

        if (category) {
            return learnings
                .filter((l) => l.category === category)
                .sort((a, b) => b.confidence - a.confidence);
        }

        return learnings.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Get project history
     */
    getProjectHistory(limit: number = 10): Project[] {
        const projects = this.store.get('projects');
        return projects
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
    }

    /**
     * Get conversations for a project
     */
    getProjectConversations(projectId: number): Conversation[] {
        const conversations = this.store.get('conversations');
        return conversations
            .filter((c) => c.project_id === projectId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    /**
     * Store preference
     */
    setPreference(key: string, value: string): void {
        const preferences = this.store.get('preferences');
        preferences[key] = value;
        this.store.set('preferences', preferences);
    }

    /**
     * Get preference
     */
    getPreference(key: string): string | null {
        const preferences = this.store.get('preferences');
        return preferences[key] || null;
    }

    /**
     * Query general knowledge
     */
    async query(queryText: string): Promise<any> {
        const keywords = queryText.toLowerCase().split(' ');
        const learnings = this.store.get('learnings');

        const results = learnings.filter((l) => {
            const searchText = `${l.key} ${l.value}`.toLowerCase();
            return keywords.some((keyword) => searchText.includes(keyword));
        });

        return {
            learnings: results.sort((a, b) => b.confidence - a.confidence).slice(0, 10),
            query: queryText,
        };
    }

    /**
     * Store general data
     */
    async storeData(data: any): Promise<void> {
        if (data.type === 'learning') {
            this.storeLearning(data.category, data.key, data.value, data.confidence);
        } else if (data.type === 'preference') {
            this.setPreference(data.key, data.value);
        } else if (data.type === 'project') {
            this.storeProject(data.name, data.projectType, data.path, data.metadata);
        }
    }

    /**
     * Clear all data (for testing)
     */
    clear(): void {
        this.store.clear();
    }
}
