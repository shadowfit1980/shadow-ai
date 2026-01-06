/**
 * Codebase Statistics
 * 
 * Comprehensive statistics about the codebase.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface FileStats {
    file: string;
    lines: number;
    code: number;
    comments: number;
    blank: number;
    language: string;
}

interface ProjectStats {
    totalFiles: number;
    totalLines: number;
    totalCode: number;
    totalComments: number;
    languages: Record<string, number>;
    largestFiles: FileStats[];
    avgFileSize: number;
}

export class CodebaseStatistics extends EventEmitter {
    private static instance: CodebaseStatistics;

    private constructor() { super(); }

    static getInstance(): CodebaseStatistics {
        if (!CodebaseStatistics.instance) {
            CodebaseStatistics.instance = new CodebaseStatistics();
        }
        return CodebaseStatistics.instance;
    }

    analyzeFile(file: string, content: string): FileStats {
        const lines = content.split('\n');
        const ext = path.extname(file).slice(1);
        const language = this.getLanguage(ext);

        let code = 0, comments = 0, blank = 0;
        let inBlockComment = false;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) { blank++; continue; }
            if (inBlockComment) {
                comments++;
                if (trimmed.includes('*/')) inBlockComment = false;
                continue;
            }
            if (trimmed.startsWith('/*')) { comments++; inBlockComment = !trimmed.includes('*/'); continue; }
            if (trimmed.startsWith('//') || trimmed.startsWith('#')) { comments++; continue; }
            code++;
        }

        return { file, lines: lines.length, code, comments, blank, language };
    }

    private getLanguage(ext: string): string {
        const map: Record<string, string> = {
            ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
            py: 'Python', go: 'Go', rs: 'Rust', java: 'Java', rb: 'Ruby',
            css: 'CSS', scss: 'SCSS', html: 'HTML', json: 'JSON', md: 'Markdown'
        };
        return map[ext] || 'Other';
    }

    analyzeProject(projectPath: string): ProjectStats {
        const files = this.getSourceFiles(projectPath);
        const stats: FileStats[] = [];
        const languages: Record<string, number> = {};

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const fileStat = this.analyzeFile(file, content);
                stats.push(fileStat);
                languages[fileStat.language] = (languages[fileStat.language] || 0) + fileStat.code;
            } catch (e) { /* skip */ }
        }

        const totalLines = stats.reduce((s, f) => s + f.lines, 0);
        const totalCode = stats.reduce((s, f) => s + f.code, 0);
        const totalComments = stats.reduce((s, f) => s + f.comments, 0);
        const largestFiles = stats.sort((a, b) => b.lines - a.lines).slice(0, 10);

        return {
            totalFiles: stats.length,
            totalLines,
            totalCode,
            totalComments,
            languages,
            largestFiles,
            avgFileSize: Math.round(totalLines / (stats.length || 1))
        };
    }

    private getSourceFiles(dir: string): string[] {
        const files: string[] = [];
        const exts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.css', '.html'];
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
                    files.push(...this.getSourceFiles(fullPath));
                } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
                    files.push(fullPath);
                }
            }
        } catch (e) { /* skip */ }
        return files;
    }
}

export const codebaseStatistics = CodebaseStatistics.getInstance();
