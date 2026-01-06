/**
 * Contact Profiles Database
 * Persistent user/contact storage across sessions
 * Similar to Cognigy Contact Profiles
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface ContactProfile {
    id: string;
    externalId?: string; // CRM ID, phone number, etc.
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    preferences: Record<string, any>;
    metadata: Record<string, any>;
    tags: string[];
    conversationHistory: ConversationSummary[];
    lastContact: number;
    createdAt: number;
    updatedAt: number;
}

export interface ConversationSummary {
    id: string;
    timestamp: number;
    duration?: number;
    summary?: string;
    resolved: boolean;
    sentiment?: 'positive' | 'neutral' | 'negative';
    topics?: string[];
}

export interface ContactSearchOptions {
    query?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'lastContact' | 'createdAt' | 'name';
    sortOrder?: 'asc' | 'desc';
}

/**
 * ContactProfileManager
 * Manages persistent contact/user profiles
 */
export class ContactProfileManager extends EventEmitter {
    private static instance: ContactProfileManager;
    private store: Store;
    private profiles: Map<string, ContactProfile> = new Map();
    private indexByExternalId: Map<string, string> = new Map();
    private indexByEmail: Map<string, string> = new Map();

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-contacts' });
        this.loadProfiles();
    }

    static getInstance(): ContactProfileManager {
        if (!ContactProfileManager.instance) {
            ContactProfileManager.instance = new ContactProfileManager();
        }
        return ContactProfileManager.instance;
    }

    /**
     * Create a new contact profile
     */
    async createProfile(data: Partial<ContactProfile>): Promise<ContactProfile> {
        const id = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const profile: ContactProfile = {
            id,
            externalId: data.externalId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            preferences: data.preferences || {},
            metadata: data.metadata || {},
            tags: data.tags || [],
            conversationHistory: [],
            lastContact: now,
            createdAt: now,
            updatedAt: now,
        };

        this.profiles.set(id, profile);
        this.updateIndexes(profile);
        await this.persist();

        this.emit('profileCreated', profile);
        return profile;
    }

    /**
     * Get profile by ID
     */
    getProfile(id: string): ContactProfile | null {
        return this.profiles.get(id) || null;
    }

    /**
     * Get profile by external ID
     */
    getByExternalId(externalId: string): ContactProfile | null {
        const id = this.indexByExternalId.get(externalId);
        return id ? this.profiles.get(id) || null : null;
    }

    /**
     * Get profile by email
     */
    getByEmail(email: string): ContactProfile | null {
        const normalizedEmail = email.toLowerCase();
        const id = this.indexByEmail.get(normalizedEmail);
        return id ? this.profiles.get(id) || null : null;
    }

    /**
     * Get or create profile
     */
    async getOrCreate(identifier: {
        externalId?: string;
        email?: string;
        phone?: string;
    }, defaults?: Partial<ContactProfile>): Promise<ContactProfile> {
        // Try to find existing
        if (identifier.externalId) {
            const existing = this.getByExternalId(identifier.externalId);
            if (existing) return existing;
        }
        if (identifier.email) {
            const existing = this.getByEmail(identifier.email);
            if (existing) return existing;
        }

        // Create new
        return this.createProfile({
            ...defaults,
            ...identifier,
        });
    }

    /**
     * Update profile
     */
    async updateProfile(id: string, updates: Partial<ContactProfile>): Promise<ContactProfile | null> {
        const profile = this.profiles.get(id);
        if (!profile) return null;

        // Apply updates
        Object.assign(profile, {
            ...updates,
            id, // Preserve ID
            updatedAt: Date.now(),
        });

        this.updateIndexes(profile);
        await this.persist();

        this.emit('profileUpdated', profile);
        return profile;
    }

    /**
     * Set preference
     */
    async setPreference(id: string, key: string, value: any): Promise<boolean> {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        profile.preferences[key] = value;
        profile.updatedAt = Date.now();
        await this.persist();

        this.emit('preferenceSet', { id, key, value });
        return true;
    }

    /**
     * Get preference
     */
    getPreference(id: string, key: string, defaultValue?: any): any {
        const profile = this.profiles.get(id);
        if (!profile) return defaultValue;
        return profile.preferences[key] ?? defaultValue;
    }

    /**
     * Add conversation to history
     */
    async addConversation(id: string, summary: ConversationSummary): Promise<boolean> {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        profile.conversationHistory.push(summary);
        profile.lastContact = summary.timestamp;
        profile.updatedAt = Date.now();

        // Keep only last 100 conversations
        if (profile.conversationHistory.length > 100) {
            profile.conversationHistory = profile.conversationHistory.slice(-100);
        }

        await this.persist();
        this.emit('conversationAdded', { id, summary });
        return true;
    }

    /**
     * Add tag
     */
    async addTag(id: string, tag: string): Promise<boolean> {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        if (!profile.tags.includes(tag)) {
            profile.tags.push(tag);
            profile.updatedAt = Date.now();
            await this.persist();
        }

        return true;
    }

    /**
     * Remove tag
     */
    async removeTag(id: string, tag: string): Promise<boolean> {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        const index = profile.tags.indexOf(tag);
        if (index !== -1) {
            profile.tags.splice(index, 1);
            profile.updatedAt = Date.now();
            await this.persist();
        }

        return true;
    }

    /**
     * Search profiles
     */
    search(options: ContactSearchOptions = {}): ContactProfile[] {
        let results = Array.from(this.profiles.values());

        // Filter by query
        if (options.query) {
            const query = options.query.toLowerCase();
            results = results.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.email?.toLowerCase().includes(query) ||
                p.company?.toLowerCase().includes(query) ||
                p.phone?.includes(query)
            );
        }

        // Filter by tags
        if (options.tags && options.tags.length > 0) {
            results = results.filter(p =>
                options.tags!.some(tag => p.tags.includes(tag))
            );
        }

        // Sort
        const sortBy = options.sortBy || 'lastContact';
        const sortOrder = options.sortOrder || 'desc';

        results.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortBy) {
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'createdAt':
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                    break;
                default:
                    aVal = a.lastContact;
                    bVal = b.lastContact;
            }

            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortOrder === 'asc' ? cmp : -cmp;
        });

        // Paginate
        const offset = options.offset || 0;
        const limit = options.limit || 50;

        return results.slice(offset, offset + limit);
    }

    /**
     * Delete profile
     */
    async deleteProfile(id: string): Promise<boolean> {
        const profile = this.profiles.get(id);
        if (!profile) return false;

        this.profiles.delete(id);

        // Clean indexes
        if (profile.externalId) {
            this.indexByExternalId.delete(profile.externalId);
        }
        if (profile.email) {
            this.indexByEmail.delete(profile.email.toLowerCase());
        }

        await this.persist();
        this.emit('profileDeleted', { id });
        return true;
    }

    /**
     * Get all tags
     */
    getAllTags(): string[] {
        const tags = new Set<string>();
        for (const profile of this.profiles.values()) {
            for (const tag of profile.tags) {
                tags.add(tag);
            }
        }
        return Array.from(tags).sort();
    }

    /**
     * Get total count
     */
    getCount(): number {
        return this.profiles.size;
    }

    /**
     * Export all profiles
     */
    exportProfiles(): string {
        return JSON.stringify(Array.from(this.profiles.values()), null, 2);
    }

    /**
     * Import profiles
     */
    async importProfiles(json: string): Promise<number> {
        const profiles = JSON.parse(json) as ContactProfile[];
        let imported = 0;

        for (const profile of profiles) {
            if (!this.profiles.has(profile.id)) {
                this.profiles.set(profile.id, profile);
                this.updateIndexes(profile);
                imported++;
            }
        }

        await this.persist();
        return imported;
    }

    // Private methods

    private updateIndexes(profile: ContactProfile): void {
        if (profile.externalId) {
            this.indexByExternalId.set(profile.externalId, profile.id);
        }
        if (profile.email) {
            this.indexByEmail.set(profile.email.toLowerCase(), profile.id);
        }
    }

    private async persist(): Promise<void> {
        try {
            this.store.set('profiles', Array.from(this.profiles.entries()));
        } catch (error) {
            console.error('Failed to persist contacts:', error);
        }
    }

    private loadProfiles(): void {
        try {
            const data = this.store.get('profiles') as Array<[string, ContactProfile]>;
            if (data) {
                this.profiles = new Map(data);
                // Rebuild indexes
                for (const profile of this.profiles.values()) {
                    this.updateIndexes(profile);
                }
            }
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    }
}

// Singleton getter
export function getContactProfileManager(): ContactProfileManager {
    return ContactProfileManager.getInstance();
}
