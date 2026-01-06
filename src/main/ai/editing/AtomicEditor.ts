/**
 * AtomicEditor - Multi-File Atomic Operations
 * 
 * Provides transaction-based multi-file editing with:
 * - Automatic import updates when moving/renaming files
 * - Dependency-aware refactoring
 * - Rollback on compilation failure
 * - Atomic commits across multiple files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FileEdit {
    filePath: string;
    operation: 'create' | 'modify' | 'delete' | 'rename';
    content?: string;
    newPath?: string; // For rename operations
    changes?: EditChange[]; // For modify operations - specific line changes
}

export interface EditChange {
    startLine: number;
    endLine: number;
    oldContent: string;
    newContent: string;
}

export interface FileBackup {
    filePath: string;
    content: string | null; // null if file didn't exist
    exists: boolean;
}

export interface TransactionResult {
    success: boolean;
    filesModified: string[];
    errors: string[];
    importUpdates: ImportUpdate[];
    rollbackPerformed: boolean;
}

export interface ImportUpdate {
    file: string;
    oldImport: string;
    newImport: string;
}

export interface EditTransaction {
    id: string;
    edits: FileEdit[];
    backups: Map<string, FileBackup>;
    status: 'pending' | 'executing' | 'completed' | 'rolled_back' | 'failed';
    importUpdates: ImportUpdate[];
    startTime: Date;
    projectRoot: string;
}

/**
 * AtomicEditor provides Claude Code-level multi-file editing
 */
export class AtomicEditor extends EventEmitter {
    private static instance: AtomicEditor;
    private activeTransaction: EditTransaction | null = null;
    private transactionHistory: EditTransaction[] = [];
    private projectRoot: string = '';

    private constructor() {
        super();
    }

    static getInstance(): AtomicEditor {
        if (!AtomicEditor.instance) {
            AtomicEditor.instance = new AtomicEditor();
        }
        return AtomicEditor.instance;
    }

    /**
     * Set the project root directory
     */
    setProjectRoot(root: string): void {
        this.projectRoot = root;
    }

    /**
     * Start a new atomic transaction
     */
    beginTransaction(edits: FileEdit[]): string {
        if (this.activeTransaction) {
            throw new Error('Transaction already in progress. Commit or rollback first.');
        }

        const id = `tx-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        this.activeTransaction = {
            id,
            edits,
            backups: new Map(),
            status: 'pending',
            importUpdates: [],
            startTime: new Date(),
            projectRoot: this.projectRoot,
        };

        console.log(`📝 [AtomicEditor] Transaction ${id} started with ${edits.length} edits`);
        this.emit('transactionStart', { id, editCount: edits.length });

        return id;
    }

    /**
     * Execute and commit the current transaction
     */
    async commitTransaction(): Promise<TransactionResult> {
        if (!this.activeTransaction) {
            throw new Error('No active transaction');
        }

        const tx = this.activeTransaction;
        tx.status = 'executing';

        const result: TransactionResult = {
            success: false,
            filesModified: [],
            errors: [],
            importUpdates: [],
            rollbackPerformed: false,
        };

        try {
            // Step 1: Create backups of all affected files
            console.log(`💾 [AtomicEditor] Creating backups...`);
            await this.createBackups(tx);

            // Step 2: Calculate import updates for renames/moves
            console.log(`🔗 [AtomicEditor] Analyzing imports...`);
            tx.importUpdates = await this.calculateImportUpdates(tx.edits);

            // Step 3: Execute all edits
            console.log(`✏️ [AtomicEditor] Applying ${tx.edits.length} edits...`);
            for (const edit of tx.edits) {
                await this.applyEdit(edit);
                result.filesModified.push(edit.filePath);
            }

            // Step 4: Apply import updates
            if (tx.importUpdates.length > 0) {
                console.log(`🔄 [AtomicEditor] Updating ${tx.importUpdates.length} imports...`);
                for (const update of tx.importUpdates) {
                    await this.applyImportUpdate(update);
                    if (!result.filesModified.includes(update.file)) {
                        result.filesModified.push(update.file);
                    }
                }
            }

            // Step 5: Verify compilation (if TypeScript project)
            console.log(`🔍 [AtomicEditor] Verifying changes...`);
            const compileResult = await this.verifyCompilation();

            if (!compileResult.success) {
                console.log(`❌ [AtomicEditor] Compilation failed, rolling back...`);
                result.errors = compileResult.errors;
                await this.rollbackTransaction();
                result.rollbackPerformed = true;
                tx.status = 'rolled_back';
            } else {
                tx.status = 'completed';
                result.success = true;
                result.importUpdates = tx.importUpdates;
                console.log(`✅ [AtomicEditor] Transaction completed successfully`);
            }

        } catch (error: any) {
            console.error(`❌ [AtomicEditor] Transaction failed:`, error);
            result.errors.push(error.message);

            try {
                await this.rollbackTransaction();
                result.rollbackPerformed = true;
            } catch (rollbackError: any) {
                result.errors.push(`Rollback failed: ${rollbackError.message}`);
            }

            tx.status = 'failed';
        }

        // Save to history and clear active transaction
        this.transactionHistory.push(tx);
        this.activeTransaction = null;
        this.emit('transactionComplete', result);

        return result;
    }

    /**
     * Rollback the current transaction
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.activeTransaction) {
            throw new Error('No active transaction to rollback');
        }

        const tx = this.activeTransaction;
        console.log(`⏪ [AtomicEditor] Rolling back transaction ${tx.id}`);

        // Restore all backups in reverse order
        const backups = [...tx.backups.values()].reverse();

        for (const backup of backups) {
            try {
                if (backup.exists && backup.content !== null) {
                    // Restore original content
                    await fs.writeFile(backup.filePath, backup.content, 'utf-8');
                } else if (!backup.exists) {
                    // Delete file that was created
                    try {
                        await fs.unlink(backup.filePath);
                    } catch {
                        // File may not exist if creation failed
                    }
                }
            } catch (error) {
                console.error(`Failed to rollback ${backup.filePath}:`, error);
            }
        }

        tx.status = 'rolled_back';
        this.transactionHistory.push(tx);
        this.activeTransaction = null;
        this.emit('transactionRolledBack', { id: tx.id });
    }

    /**
     * Create backups of all files that will be modified
     */
    private async createBackups(tx: EditTransaction): Promise<void> {
        const filesToBackup = new Set<string>();

        // Collect all files that need backup
        for (const edit of tx.edits) {
            filesToBackup.add(edit.filePath);
            if (edit.newPath) {
                filesToBackup.add(edit.newPath);
            }
        }

        // Also backup files that will have import updates
        const importFiles = await this.getFilesWithImports(tx.edits);
        importFiles.forEach(f => filesToBackup.add(f));

        // Create backups
        for (const filePath of filesToBackup) {
            let content: string | null = null;
            let exists = false;

            try {
                content = await fs.readFile(filePath, 'utf-8');
                exists = true;
            } catch {
                // File doesn't exist yet
            }

            tx.backups.set(filePath, { filePath, content, exists });
        }

        console.log(`💾 [AtomicEditor] Created ${tx.backups.size} backups`);
    }

    /**
     * Get all files that import the files being modified
     */
    private async getFilesWithImports(edits: FileEdit[]): Promise<string[]> {
        const renamedFiles = edits
            .filter(e => e.operation === 'rename' || e.operation === 'delete')
            .map(e => e.filePath);

        if (renamedFiles.length === 0) return [];

        // Find TypeScript/JavaScript files in project
        const files = await this.findSourceFiles();
        const affectedFiles: string[] = [];

        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf-8');

                for (const renamedFile of renamedFiles) {
                    const relPath = this.getImportPath(file, renamedFile);
                    if (content.includes(relPath) || content.includes(renamedFile)) {
                        affectedFiles.push(file);
                        break;
                    }
                }
            } catch {
                // Skip files that can't be read
            }
        }

        return affectedFiles;
    }

    /**
     * Find all source files in the project
     */
    private async findSourceFiles(): Promise<string[]> {
        const { glob } = await import('glob');

        const patterns = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'];
        const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**'];

        const files: string[] = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: this.projectRoot,
                absolute: true,
                ignore,
            });
            files.push(...matches);
        }

        return files;
    }

    /**
     * Calculate what import updates are needed for file renames/moves
     */
    private async calculateImportUpdates(edits: FileEdit[]): Promise<ImportUpdate[]> {
        const updates: ImportUpdate[] = [];

        const renames = edits.filter(e => e.operation === 'rename' && e.newPath);

        for (const rename of renames) {
            const oldPath = rename.filePath;
            const newPath = rename.newPath!;

            // Find all files that import the old path
            const files = await this.findSourceFiles();

            for (const file of files) {
                if (file === oldPath) continue;

                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const oldImportPath = this.getImportPath(file, oldPath);
                    const newImportPath = this.getImportPath(file, newPath);

                    // Check for various import formats
                    const importPatterns = [
                        new RegExp(`from\\s+['"]${this.escapeRegex(oldImportPath)}['"]`, 'g'),
                        new RegExp(`require\\s*\\(\\s*['"]${this.escapeRegex(oldImportPath)}['"]\\s*\\)`, 'g'),
                        new RegExp(`import\\s*\\(\\s*['"]${this.escapeRegex(oldImportPath)}['"]\\s*\\)`, 'g'),
                    ];

                    for (const pattern of importPatterns) {
                        if (pattern.test(content)) {
                            updates.push({
                                file,
                                oldImport: oldImportPath,
                                newImport: newImportPath,
                            });
                            break;
                        }
                    }
                } catch {
                    // Skip files that can't be read
                }
            }
        }

        return updates;
    }

    /**
     * Get the relative import path from one file to another
     */
    private getImportPath(fromFile: string, toFile: string): string {
        const fromDir = path.dirname(fromFile);
        let relativePath = path.relative(fromDir, toFile);

        // Remove extension for imports
        relativePath = relativePath.replace(/\.(tsx?|jsx?)$/, '');

        // Ensure path starts with . or ..
        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }

        // Normalize path separators
        return relativePath.replace(/\\/g, '/');
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Apply a single file edit
     */
    private async applyEdit(edit: FileEdit): Promise<void> {
        switch (edit.operation) {
            case 'create':
                await this.createFile(edit.filePath, edit.content || '');
                break;

            case 'modify':
                if (edit.content) {
                    await fs.writeFile(edit.filePath, edit.content, 'utf-8');
                } else if (edit.changes) {
                    await this.applyChanges(edit.filePath, edit.changes);
                }
                break;

            case 'delete':
                await fs.unlink(edit.filePath);
                break;

            case 'rename':
                if (!edit.newPath) throw new Error('Rename requires newPath');
                await this.renameFile(edit.filePath, edit.newPath);
                break;
        }
    }

    /**
     * Create a new file (with parent directories)
     */
    private async createFile(filePath: string, content: string): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
    }

    /**
     * Apply specific line-based changes to a file
     */
    private async applyChanges(filePath: string, changes: EditChange[]): Promise<void> {
        let content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        // Sort changes in reverse order (bottom to top) to preserve line numbers
        const sortedChanges = [...changes].sort((a, b) => b.startLine - a.startLine);

        for (const change of sortedChanges) {
            const before = lines.slice(0, change.startLine - 1);
            const after = lines.slice(change.endLine);
            const newLines = change.newContent.split('\n');

            lines.length = 0;
            lines.push(...before, ...newLines, ...after);
        }

        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
    }

    /**
     * Rename/move a file
     */
    private async renameFile(oldPath: string, newPath: string): Promise<void> {
        const newDir = path.dirname(newPath);
        await fs.mkdir(newDir, { recursive: true });
        await fs.rename(oldPath, newPath);
    }

    /**
     * Apply an import update to a file
     */
    private async applyImportUpdate(update: ImportUpdate): Promise<void> {
        let content = await fs.readFile(update.file, 'utf-8');

        // Replace old import with new import
        const patterns = [
            { search: `from '${update.oldImport}'`, replace: `from '${update.newImport}'` },
            { search: `from "${update.oldImport}"`, replace: `from "${update.newImport}"` },
            { search: `require('${update.oldImport}')`, replace: `require('${update.newImport}')` },
            { search: `require("${update.oldImport}")`, replace: `require("${update.newImport}")` },
            { search: `import('${update.oldImport}')`, replace: `import('${update.newImport}')` },
            { search: `import("${update.oldImport}")`, replace: `import("${update.newImport}")` },
        ];

        for (const { search, replace } of patterns) {
            content = content.split(search).join(replace);
        }

        await fs.writeFile(update.file, content, 'utf-8');
    }

    /**
     * Verify compilation after edits
     */
    private async verifyCompilation(): Promise<{ success: boolean; errors: string[] }> {
        // Check if this is a TypeScript project
        const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

        try {
            await fs.access(tsconfigPath);
        } catch {
            // No tsconfig, assume non-TS project - skip verification
            return { success: true, errors: [] };
        }

        try {
            // Run tsc --noEmit for type checking only
            await execAsync('npx tsc --noEmit 2>&1', {
                cwd: this.projectRoot,
                timeout: 60000, // 60 second timeout
            });
            return { success: true, errors: [] };
        } catch (error: any) {
            const output = error.stdout || error.message || '';
            const errors = output.split('\n').filter((line: string) => line.includes('error TS'));
            return { success: false, errors };
        }
    }

    // Public utility methods

    /**
     * Preview what a transaction would do without executing
     */
    async previewTransaction(edits: FileEdit[]): Promise<{
        filesToModify: string[];
        filesToCreate: string[];
        filesToDelete: string[];
        importUpdates: ImportUpdate[];
    }> {
        const filesToModify: string[] = [];
        const filesToCreate: string[] = [];
        const filesToDelete: string[] = [];

        for (const edit of edits) {
            switch (edit.operation) {
                case 'create':
                    filesToCreate.push(edit.filePath);
                    break;
                case 'modify':
                    filesToModify.push(edit.filePath);
                    break;
                case 'delete':
                    filesToDelete.push(edit.filePath);
                    break;
                case 'rename':
                    filesToDelete.push(edit.filePath);
                    if (edit.newPath) filesToCreate.push(edit.newPath);
                    break;
            }
        }

        const importUpdates = await this.calculateImportUpdates(edits);

        return { filesToModify, filesToCreate, filesToDelete, importUpdates };
    }

    /**
     * Get transaction history
     */
    getTransactionHistory(): EditTransaction[] {
        return [...this.transactionHistory];
    }

    /**
     * Get the most recent transaction
     */
    getLastTransaction(): EditTransaction | null {
        return this.transactionHistory[this.transactionHistory.length - 1] || null;
    }

    /**
     * Check if there's an active transaction
     */
    hasActiveTransaction(): boolean {
        return this.activeTransaction !== null;
    }

    /**
     * Convenience method: Edit multiple files atomically
     */
    async editFilesAtomically(
        edits: Array<{ path: string; content: string }>
    ): Promise<TransactionResult> {
        const fileEdits: FileEdit[] = edits.map(e => ({
            filePath: e.path,
            operation: 'modify' as const,
            content: e.content,
        }));

        this.beginTransaction(fileEdits);
        return this.commitTransaction();
    }

    /**
     * Convenience method: Rename a file and update all imports
     */
    async renameFileWithImports(oldPath: string, newPath: string): Promise<TransactionResult> {
        const edits: FileEdit[] = [
            {
                filePath: oldPath,
                operation: 'rename',
                newPath,
            },
        ];

        this.beginTransaction(edits);
        return this.commitTransaction();
    }

    /**
     * Convenience method: Create multiple files atomically
     */
    async createFilesAtomically(
        files: Array<{ path: string; content: string }>
    ): Promise<TransactionResult> {
        const fileEdits: FileEdit[] = files.map(f => ({
            filePath: f.path,
            operation: 'create' as const,
            content: f.content,
        }));

        this.beginTransaction(fileEdits);
        return this.commitTransaction();
    }

    /**
     * Convenience method: Delete multiple files atomically
     */
    async deleteFilesAtomically(paths: string[]): Promise<TransactionResult> {
        const fileEdits: FileEdit[] = paths.map(p => ({
            filePath: p,
            operation: 'delete' as const,
        }));

        this.beginTransaction(fileEdits);
        return this.commitTransaction();
    }
}

export default AtomicEditor;
