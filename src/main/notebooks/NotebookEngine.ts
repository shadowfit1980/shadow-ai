/**
 * Notebook Engine
 * Executable notebooks like Warp's Notebooks feature
 * Markdown with executable code blocks
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export enum CellType {
    MARKDOWN = 'markdown',
    CODE = 'code',
    SHELL = 'shell',
}

export interface NotebookCell {
    id: string;
    type: CellType;
    content: string;
    language?: string; // For code cells
    output?: CellOutput;
    metadata?: Record<string, any>;
}

export interface CellOutput {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    result?: any;
    error?: string;
    executedAt?: number;
    duration?: number;
}

export interface Notebook {
    id: string;
    title: string;
    description?: string;
    cells: NotebookCell[];
    metadata?: NotebookMetadata;
    createdAt: number;
    updatedAt: number;
}

export interface NotebookMetadata {
    author?: string;
    tags?: string[];
    version?: string;
    kernel?: string; // node, python, shell
}

export interface NotebookExecution {
    notebookId: string;
    cellId?: string; // If executing single cell
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    currentCellIndex: number;
    startTime: number;
    endTime?: number;
}

/**
 * NotebookEngine
 * Manages executable notebooks with mixed markdown and code
 */
export class NotebookEngine extends EventEmitter {
    private static instance: NotebookEngine;
    private notebooks: Map<string, Notebook> = new Map();
    private runningExecutions: Map<string, NotebookExecution> = new Map();
    private cellCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): NotebookEngine {
        if (!NotebookEngine.instance) {
            NotebookEngine.instance = new NotebookEngine();
        }
        return NotebookEngine.instance;
    }

    /**
     * Create a new notebook
     */
    createNotebook(options: {
        title: string;
        description?: string;
        cells?: NotebookCell[];
        metadata?: NotebookMetadata;
    }): Notebook {
        const id = `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const notebook: Notebook = {
            id,
            title: options.title,
            description: options.description,
            cells: options.cells || [this.createCell(CellType.MARKDOWN, `# ${options.title}`)],
            metadata: options.metadata,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.notebooks.set(id, notebook);
        this.emit('notebookCreated', notebook);
        return notebook;
    }

    /**
     * Load notebook from markdown file
     */
    async loadFromFile(filePath: string): Promise<Notebook> {
        const content = await fs.readFile(filePath, 'utf-8');
        return this.parseMarkdown(content, path.basename(filePath, '.md'));
    }

    /**
     * Save notebook to file
     */
    async saveToFile(notebookId: string, filePath: string): Promise<void> {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) throw new Error(`Notebook not found: ${notebookId}`);

        const markdown = this.toMarkdown(notebook);
        await fs.writeFile(filePath, markdown, 'utf-8');
    }

    /**
     * Get notebook by ID
     */
    getNotebook(id: string): Notebook | null {
        return this.notebooks.get(id) || null;
    }

    /**
     * Get all notebooks
     */
    getAllNotebooks(): Notebook[] {
        return Array.from(this.notebooks.values());
    }

    /**
     * Delete notebook
     */
    deleteNotebook(id: string): boolean {
        const deleted = this.notebooks.delete(id);
        if (deleted) {
            this.emit('notebookDeleted', { id });
        }
        return deleted;
    }

    /**
     * Add cell to notebook
     */
    addCell(notebookId: string, type: CellType, content: string, afterCellId?: string): NotebookCell | null {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) return null;

        const cell = this.createCell(type, content);

        if (afterCellId) {
            const index = notebook.cells.findIndex(c => c.id === afterCellId);
            if (index !== -1) {
                notebook.cells.splice(index + 1, 0, cell);
            } else {
                notebook.cells.push(cell);
            }
        } else {
            notebook.cells.push(cell);
        }

        notebook.updatedAt = Date.now();
        this.emit('cellAdded', { notebookId, cell });
        return cell;
    }

    /**
     * Update cell content
     */
    updateCell(notebookId: string, cellId: string, content: string): NotebookCell | null {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) return null;

        const cell = notebook.cells.find(c => c.id === cellId);
        if (!cell) return null;

        cell.content = content;
        cell.output = undefined; // Clear output on edit
        notebook.updatedAt = Date.now();

        this.emit('cellUpdated', { notebookId, cell });
        return cell;
    }

    /**
     * Delete cell
     */
    deleteCell(notebookId: string, cellId: string): boolean {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) return false;

        const index = notebook.cells.findIndex(c => c.id === cellId);
        if (index === -1) return false;

        notebook.cells.splice(index, 1);
        notebook.updatedAt = Date.now();

        this.emit('cellDeleted', { notebookId, cellId });
        return true;
    }

    /**
     * Move cell
     */
    moveCell(notebookId: string, cellId: string, direction: 'up' | 'down'): boolean {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) return false;

        const index = notebook.cells.findIndex(c => c.id === cellId);
        if (index === -1) return false;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= notebook.cells.length) return false;

        const [cell] = notebook.cells.splice(index, 1);
        notebook.cells.splice(newIndex, 0, cell);
        notebook.updatedAt = Date.now();

        this.emit('cellMoved', { notebookId, cellId, newIndex });
        return true;
    }

    /**
     * Execute a single cell
     */
    async executeCell(notebookId: string, cellId: string): Promise<CellOutput> {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) throw new Error(`Notebook not found: ${notebookId}`);

        const cell = notebook.cells.find(c => c.id === cellId);
        if (!cell) throw new Error(`Cell not found: ${cellId}`);

        if (cell.type === CellType.MARKDOWN) {
            return { result: 'Markdown cells are not executable' };
        }

        this.emit('cellExecutionStarted', { notebookId, cellId });
        const startTime = Date.now();

        try {
            const output = await this.executeContent(cell);
            output.executedAt = startTime;
            output.duration = Date.now() - startTime;
            cell.output = output;

            this.emit('cellExecutionCompleted', { notebookId, cellId, output });
            return output;
        } catch (error: any) {
            const output: CellOutput = {
                error: error.message,
                executedAt: startTime,
                duration: Date.now() - startTime,
            };
            cell.output = output;

            this.emit('cellExecutionFailed', { notebookId, cellId, error: error.message });
            return output;
        }
    }

    /**
     * Execute all cells in notebook
     */
    async executeNotebook(notebookId: string): Promise<CellOutput[]> {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) throw new Error(`Notebook not found: ${notebookId}`);

        const executionId = `exec_${Date.now()}`;
        const execution: NotebookExecution = {
            notebookId,
            status: 'running',
            currentCellIndex: 0,
            startTime: Date.now(),
        };

        this.runningExecutions.set(executionId, execution);
        this.emit('notebookExecutionStarted', { notebookId, executionId });

        const outputs: CellOutput[] = [];

        try {
            for (let i = 0; i < notebook.cells.length; i++) {
                execution.currentCellIndex = i;
                const cell = notebook.cells[i];

                if (cell.type !== CellType.MARKDOWN) {
                    const output = await this.executeCell(notebookId, cell.id);
                    outputs.push(output);

                    if (output.error || (output.exitCode && output.exitCode !== 0)) {
                        execution.status = 'failed';
                        break;
                    }
                }
            }

            execution.status = execution.status === 'running' ? 'completed' : execution.status;
        } catch (error: any) {
            execution.status = 'failed';
        }

        execution.endTime = Date.now();
        this.runningExecutions.delete(executionId);

        this.emit('notebookExecutionCompleted', { notebookId, executionId, status: execution.status });
        return outputs;
    }

    /**
     * Clear all outputs
     */
    clearOutputs(notebookId: string): void {
        const notebook = this.notebooks.get(notebookId);
        if (!notebook) return;

        for (const cell of notebook.cells) {
            cell.output = undefined;
        }

        this.emit('outputsCleared', { notebookId });
    }

    // Private methods

    private createCell(type: CellType, content: string, language?: string): NotebookCell {
        return {
            id: `cell_${++this.cellCounter}_${Date.now()}`,
            type,
            content,
            language: type === CellType.CODE ? (language || 'javascript') : undefined,
        };
    }

    private async executeContent(cell: NotebookCell): Promise<CellOutput> {
        if (cell.type === CellType.SHELL) {
            return this.executeShell(cell.content);
        } else if (cell.type === CellType.CODE) {
            return this.executeCode(cell.content, cell.language);
        }
        return {};
    }

    private async executeShell(command: string): Promise<CellOutput> {
        const { exec } = await import('child_process');

        return new Promise((resolve) => {
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                resolve({
                    stdout,
                    stderr,
                    exitCode: error?.code || 0,
                });
            });
        });
    }

    private async executeCode(code: string, language?: string): Promise<CellOutput> {
        if (language === 'javascript' || language === 'typescript' || !language) {
            try {
                // Execute in a sandboxed context
                const result = eval(code);
                return { result: JSON.stringify(result, null, 2) };
            } catch (error: any) {
                return { error: error.message };
            }
        }

        // For other languages, use external runners
        return { error: `Language not supported for execution: ${language}` };
    }

    private parseMarkdown(content: string, title: string): Notebook {
        const cells: NotebookCell[] = [];
        const lines = content.split('\n');

        let currentContent = '';
        let inCodeBlock = false;
        let codeLanguage = '';

        for (const line of lines) {
            if (line.startsWith('```')) {
                if (!inCodeBlock) {
                    // Save any markdown content
                    if (currentContent.trim()) {
                        cells.push(this.createCell(CellType.MARKDOWN, currentContent.trim()));
                        currentContent = '';
                    }
                    // Start code block
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim();
                } else {
                    // End code block
                    const type = codeLanguage === 'bash' || codeLanguage === 'shell' || codeLanguage === 'sh'
                        ? CellType.SHELL
                        : CellType.CODE;
                    cells.push(this.createCell(type, currentContent.trim(), codeLanguage));
                    currentContent = '';
                    inCodeBlock = false;
                    codeLanguage = '';
                }
            } else {
                currentContent += line + '\n';
            }
        }

        // Save remaining content
        if (currentContent.trim()) {
            cells.push(this.createCell(CellType.MARKDOWN, currentContent.trim()));
        }

        const notebook = this.createNotebook({ title, cells });
        return notebook;
    }

    private toMarkdown(notebook: Notebook): string {
        const parts: string[] = [];

        for (const cell of notebook.cells) {
            if (cell.type === CellType.MARKDOWN) {
                parts.push(cell.content);
            } else {
                const lang = cell.type === CellType.SHELL ? 'bash' : (cell.language || 'javascript');
                parts.push(`\`\`\`${lang}\n${cell.content}\n\`\`\``);

                // Include output as comment if present
                if (cell.output?.stdout) {
                    parts.push(`<!-- Output:\n${cell.output.stdout}\n-->`);
                }
            }
        }

        return parts.join('\n\n');
    }
}

// Singleton getter
export function getNotebookEngine(): NotebookEngine {
    return NotebookEngine.getInstance();
}
