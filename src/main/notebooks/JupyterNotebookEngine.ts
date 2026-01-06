/**
 * Notebook Engine (Datalore equivalent)
 * Jupyter-style notebook support for Shadow AI
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface NotebookCell {
    id: string;
    type: 'code' | 'markdown' | 'raw';
    source: string;
    outputs: CellOutput[];
    metadata: Record<string, any>;
    executionCount?: number;
}

export interface CellOutput {
    type: 'text' | 'error' | 'display' | 'stream';
    content: any;
    mimeType?: string;
}

export interface Notebook {
    id: string;
    name: string;
    cells: NotebookCell[];
    metadata: {
        language: string;
        kernel?: string;
    };
    path?: string;
    modified: boolean;
}

/**
 * JupyterNotebookEngine
 * Manages Jupyter-style notebooks
 */
export class JupyterNotebookEngine extends EventEmitter {
    private static instance: JupyterNotebookEngine;
    private notebooks: Map<string, Notebook> = new Map();
    private activeNotebook: string | null = null;

    private constructor() {
        super();
    }

    static getInstance(): JupyterNotebookEngine {
        if (!JupyterNotebookEngine.instance) {
            JupyterNotebookEngine.instance = new JupyterNotebookEngine();
        }
        return JupyterNotebookEngine.instance;
    }

    /**
     * Create a new notebook
     */
    createNotebook(name: string, language = 'python'): Notebook {
        const id = `notebook_${Date.now()}`;

        const notebook: Notebook = {
            id,
            name,
            cells: [
                {
                    id: `cell_${Date.now()}`,
                    type: 'code',
                    source: '',
                    outputs: [],
                    metadata: {},
                },
            ],
            metadata: { language },
            modified: false,
        };

        this.notebooks.set(id, notebook);
        this.activeNotebook = id;

        this.emit('notebookCreated', notebook);
        return notebook;
    }

    /**
     * Open a notebook file
     */
    async openNotebook(filePath: string): Promise<Notebook> {
        const content = await fs.readFile(filePath, 'utf-8');
        const nbData = JSON.parse(content);

        const id = `notebook_${Date.now()}`;
        const notebook: Notebook = {
            id,
            name: path.basename(filePath, '.ipynb'),
            cells: (nbData.cells || []).map((cell: any, idx: number) => ({
                id: `cell_${idx}`,
                type: cell.cell_type || 'code',
                source: Array.isArray(cell.source) ? cell.source.join('') : cell.source || '',
                outputs: this.parseOutputs(cell.outputs || []),
                metadata: cell.metadata || {},
                executionCount: cell.execution_count,
            })),
            metadata: {
                language: nbData.metadata?.language_info?.name || 'python',
                kernel: nbData.metadata?.kernelspec?.name,
            },
            path: filePath,
            modified: false,
        };

        this.notebooks.set(id, notebook);
        this.activeNotebook = id;
        return notebook;
    }

    /**
     * Save notebook to file
     */
    async saveNotebook(notebookId?: string): Promise<void> {
        const id = notebookId || this.activeNotebook;
        if (!id) throw new Error('No notebook to save');

        const notebook = this.notebooks.get(id);
        if (!notebook) throw new Error('Notebook not found');

        const nbData = {
            cells: notebook.cells.map(cell => ({
                cell_type: cell.type,
                source: cell.source.split('\n').map(l => l + '\n'),
                outputs: [],
                metadata: cell.metadata,
                execution_count: cell.executionCount,
            })),
            metadata: {
                language_info: { name: notebook.metadata.language },
            },
            nbformat: 4,
            nbformat_minor: 5,
        };

        const filePath = notebook.path || `${notebook.name}.ipynb`;
        await fs.writeFile(filePath, JSON.stringify(nbData, null, 2));
        notebook.modified = false;
    }

    /**
     * Add a cell to notebook
     */
    addCell(type: NotebookCell['type'] = 'code'): NotebookCell {
        const notebook = this.getActiveNotebook();
        if (!notebook) throw new Error('No active notebook');

        const cell: NotebookCell = {
            id: `cell_${Date.now()}`,
            type,
            source: '',
            outputs: [],
            metadata: {},
        };

        notebook.cells.push(cell);
        notebook.modified = true;
        return cell;
    }

    /**
     * Update cell source
     */
    updateCellSource(cellId: string, source: string): void {
        const notebook = this.getActiveNotebook();
        if (!notebook) return;

        const cell = notebook.cells.find(c => c.id === cellId);
        if (cell) {
            cell.source = source;
            notebook.modified = true;
        }
    }

    /**
     * Delete a cell
     */
    deleteCell(cellId: string): void {
        const notebook = this.getActiveNotebook();
        if (!notebook) return;

        notebook.cells = notebook.cells.filter(c => c.id !== cellId);
        notebook.modified = true;
    }

    /**
     * Get active notebook
     */
    getActiveNotebook(): Notebook | null {
        if (!this.activeNotebook) return null;
        return this.notebooks.get(this.activeNotebook) || null;
    }

    /**
     * Get all notebooks
     */
    getAllNotebooks(): Notebook[] {
        return Array.from(this.notebooks.values());
    }

    /**
     * Close notebook
     */
    closeNotebook(notebookId?: string): void {
        const id = notebookId || this.activeNotebook;
        if (!id) return;

        this.notebooks.delete(id);
        if (this.activeNotebook === id) {
            this.activeNotebook = null;
        }
    }

    private parseOutputs(outputs: any[]): CellOutput[] {
        return outputs.map(out => ({
            type: out.output_type === 'stream' ? 'stream' : 'text',
            content: out.text || out.data?.['text/plain'] || '',
        }));
    }
}

// Singleton getter
export function getJupyterNotebookEngine(): JupyterNotebookEngine {
    return JupyterNotebookEngine.getInstance();
}
