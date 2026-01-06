/**
 * Dimensional Word Ladder
 */
import { EventEmitter } from 'events';
export class DimensionalWordLadder extends EventEmitter {
    private static instance: DimensionalWordLadder;
    private constructor() { super(); }
    static getInstance(): DimensionalWordLadder { if (!DimensionalWordLadder.instance) { DimensionalWordLadder.instance = new DimensionalWordLadder(); } return DimensionalWordLadder.instance; }
    ladderLength(beginWord: string, endWord: string, wordList: string[]): number { const wordSet = new Set(wordList); if (!wordSet.has(endWord)) return 0; const queue: [string, number][] = [[beginWord, 1]]; while (queue.length) { const [word, level] = queue.shift()!; if (word === endWord) return level; for (let i = 0; i < word.length; i++) for (let c = 97; c <= 122; c++) { const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1); if (wordSet.has(newWord)) { queue.push([newWord, level + 1]); wordSet.delete(newWord); } } } return 0; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalWordLadder = DimensionalWordLadder.getInstance();
