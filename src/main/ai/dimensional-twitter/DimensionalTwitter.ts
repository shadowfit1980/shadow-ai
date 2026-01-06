/**
 * Dimensional Design Patterns
 */
import { EventEmitter } from 'events';
export class DimensionalTwitter extends EventEmitter {
    private tweets: Map<number, [number, number][]> = new Map(); // userId -> [tweetId, timestamp][]
    private follows: Map<number, Set<number>> = new Map();
    private timestamp: number = 0;
    constructor() { super(); }
    postTweet(userId: number, tweetId: number): void { if (!this.tweets.has(userId)) this.tweets.set(userId, []); this.tweets.get(userId)!.push([tweetId, this.timestamp++]); }
    getNewsFeed(userId: number): number[] { const all: [number, number][] = []; const users = new Set([userId, ...(this.follows.get(userId) || [])]); for (const u of users) { const tweets = this.tweets.get(u) || []; all.push(...tweets); } all.sort((a, b) => b[1] - a[1]); return all.slice(0, 10).map(t => t[0]); }
    follow(followerId: number, followeeId: number): void { if (!this.follows.has(followerId)) this.follows.set(followerId, new Set()); this.follows.get(followerId)!.add(followeeId); }
    unfollow(followerId: number, followeeId: number): void { this.follows.get(followerId)?.delete(followeeId); }
}
export class AutocompleteSystem extends EventEmitter {
    private sentences: Map<string, number> = new Map();
    private current: string = '';
    constructor(sentences: string[], times: number[]) { super(); for (let i = 0; i < sentences.length; i++) this.sentences.set(sentences[i], times[i]); }
    input(c: string): string[] { if (c === '#') { this.sentences.set(this.current, (this.sentences.get(this.current) || 0) + 1); this.current = ''; return []; } this.current += c; const matches: [string, number][] = []; for (const [s, count] of this.sentences) if (s.startsWith(this.current)) matches.push([s, count]); matches.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); return matches.slice(0, 3).map(m => m[0]); }
}
export const createTwitter = () => new DimensionalTwitter();
export const createAutocomplete = (sentences: string[], times: number[]) => new AutocompleteSystem(sentences, times);
