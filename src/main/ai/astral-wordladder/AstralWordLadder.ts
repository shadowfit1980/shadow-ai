/**
 * Astral Word Ladder
 */
import { EventEmitter } from 'events';
export class AstralWordLadder extends EventEmitter {
    private static instance: AstralWordLadder;
    private constructor() { super(); }
    static getInstance(): AstralWordLadder { if (!AstralWordLadder.instance) { AstralWordLadder.instance = new AstralWordLadder(); } return AstralWordLadder.instance; }
    ladderLength(beginWord: string, endWord: string, wordList: string[]): number { const wordSet = new Set(wordList); if (!wordSet.has(endWord)) return 0; const queue: [string, number][] = [[beginWord, 1]]; const visited = new Set([beginWord]); while (queue.length) { const [word, level] = queue.shift()!; if (word === endWord) return level; for (let i = 0; i < word.length; i++) { for (let c = 97; c <= 122; c++) { const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1); if (wordSet.has(newWord) && !visited.has(newWord)) { visited.add(newWord); queue.push([newWord, level + 1]); } } } } return 0; }
    findLadders(beginWord: string, endWord: string, wordList: string[]): string[][] { const wordSet = new Set(wordList); if (!wordSet.has(endWord)) return []; const graph: Map<string, string[]> = new Map(); const levels: Map<string, number> = new Map([[beginWord, 0]]); const queue = [beginWord]; while (queue.length) { const word = queue.shift()!; const level = levels.get(word)!; for (let i = 0; i < word.length; i++) { for (let c = 97; c <= 122; c++) { const newWord = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1); if (wordSet.has(newWord)) { if (!levels.has(newWord)) { levels.set(newWord, level + 1); queue.push(newWord); } if (levels.get(newWord) === level + 1) { if (!graph.has(word)) graph.set(word, []); graph.get(word)!.push(newWord); } } } } } const result: string[][] = []; const dfs = (path: string[]): void => { const last = path[path.length - 1]; if (last === endWord) { result.push([...path]); return; } for (const next of graph.get(last) || []) { path.push(next); dfs(path); path.pop(); } }; dfs([beginWord]); return result; }
}
export const astralWordLadder = AstralWordLadder.getInstance();
