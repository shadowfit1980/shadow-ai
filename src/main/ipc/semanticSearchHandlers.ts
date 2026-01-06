/**
 * Semantic Search IPC Handlers
 * Handlers for semantic code search functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';

// Lazy-loaded to avoid vectordb module errors
let semanticSearch: any = null;
let astAnalyzer: any = null;

async function getSearch() {
    if (!semanticSearch) {
        try {
            const { getSemanticCodeSearch } = await import('../ai/codeSearch/SemanticCodeSearch');
            semanticSearch = getSemanticCodeSearch();
        } catch (error) {
            console.warn('⚠️ SemanticCodeSearch not available:', (error as Error).message);
            return null;
        }
    }
    return semanticSearch;
}

async function getAST() {
    if (!astAnalyzer) {
        try {
            const { getASTAnalyzer } = await import('../ai/codeSearch/ASTAnalyzer');
            astAnalyzer = getASTAnalyzer();
        } catch (error) {
            console.warn('⚠️ ASTAnalyzer not available:', (error as Error).message);
            return null;
        }
    }
    return astAnalyzer;
}

export function registerSemanticSearchHandlers() {

    /**
     * Index a codebase directory
     */
    ipcMain.handle('semantic-search:index', async (event: IpcMainInvokeEvent, rootPath: string, options?: any) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            let progress = 0;

            await search.indexCodebase(rootPath, {
                ...options,
                onProgress: (current: number, total: number) => {
                    const newProgress = Math.floor((current / total) * 100);
                    if (newProgress > progress) {
                        progress = newProgress;
                        event.sender.send('semantic-search:index:progress', { current, total, progress });
                    }
                },
            });

            const stats = search.getStats();

            return {
                success: true,
                stats,
            };
        } catch (error: any) {
            console.error('Semantic search indexing error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Search codebase
     */
    ipcMain.handle('semantic-search:search', async (_event: IpcMainInvokeEvent, query: string, options?: any) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            const results = await search.search(query, options);
            return {
                success: true,
                results,
            };
        } catch (error: any) {
            console.error('Semantic search error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Find related files
     */
    ipcMain.handle('semantic-search:related', async (_event: IpcMainInvokeEvent, filePath: string, maxResults?: number) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            const results = await search.findRelatedFiles(filePath, maxResults);
            return {
                success: true,
                results,
            };
        } catch (error: any) {
            console.error('Find related files error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Get dependency graph
     */
    ipcMain.handle('semantic-search:dependencies', async (_event: IpcMainInvokeEvent, filePath: string) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            const graph = search.getDependencyGraph(filePath);
            return {
                success: true,
                graph,
            };
        } catch (error: any) {
            console.error('Get dependencies error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Find symbol references
     */
    ipcMain.handle('semantic-search:symbol-refs', async (_event: IpcMainInvokeEvent, symbolName: string) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            const references = search.findSymbolReferences(symbolName);
            return {
                success: true,
                references,
            };
        } catch (error: any) {
            console.error('Find symbol references error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Analyze file with AST
     */
    ipcMain.handle('ast:analyze', async (_event: IpcMainInvokeEvent, filePath: string) => {
        try {
            const ast = await getAST();
            if (!ast) return { success: false, error: 'AST analyzer not available' };

            const analysis = await ast.analyzeFile(filePath);
            return {
                success: true,
                analysis,
            };
        } catch (error: any) {
            console.error('AST analysis error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    /**
     * Get index statistics
     */
    ipcMain.handle('semantic-search:stats', async (_event: IpcMainInvokeEvent) => {
        try {
            const search = await getSearch();
            if (!search) return { success: false, error: 'Semantic search not available' };

            const stats = search.getStats();
            return {
                success: true,
                stats,
            };
        } catch (error: any) {
            console.error('Get stats error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    });

    console.log('✅ Semantic search IPC handlers registered');
}
