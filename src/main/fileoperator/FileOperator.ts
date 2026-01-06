/**
 * File Operator - Agent file ops
 */
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface FileOp { id: string; type: 'read' | 'write' | 'delete' | 'list' | 'mkdir'; path: string; content?: string; result?: string; timestamp: number; }

export class FileOperator extends EventEmitter {
    private static instance: FileOperator;
    private history: FileOp[] = [];
    private workDir = process.cwd();
    private constructor() { super(); }
    static getInstance(): FileOperator { if (!FileOperator.instance) FileOperator.instance = new FileOperator(); return FileOperator.instance; }

    setWorkDir(dir: string): void { this.workDir = dir; }

    async read(filePath: string): Promise<string> { const fullPath = path.resolve(this.workDir, filePath); const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : ''; this.history.push({ id: `fop_${Date.now()}`, type: 'read', path: filePath, result: content.slice(0, 100), timestamp: Date.now() }); return content; }
    async write(filePath: string, content: string): Promise<boolean> { try { const fullPath = path.resolve(this.workDir, filePath); fs.mkdirSync(path.dirname(fullPath), { recursive: true }); fs.writeFileSync(fullPath, content); this.history.push({ id: `fop_${Date.now()}`, type: 'write', path: filePath, content: content.slice(0, 50), timestamp: Date.now() }); return true; } catch { return false; } }
    async list(dirPath: string): Promise<string[]> { const fullPath = path.resolve(this.workDir, dirPath); return fs.existsSync(fullPath) ? fs.readdirSync(fullPath) : []; }
    getHistory(): FileOp[] { return [...this.history]; }
}
export function getFileOperator(): FileOperator { return FileOperator.getInstance(); }
