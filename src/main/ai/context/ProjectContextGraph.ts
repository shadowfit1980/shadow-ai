/**
 * Project Context Graph
 * 
 * Deep codebase understanding with:
 * - Import/export relationship tracking
 * - Function call graphs
 * - Type dependencies
 * - Impact analysis for changes
 * - Symbol resolution across files
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileNode {
    id: string;
    path: string;
    relativePath: string;
    type: 'file' | 'module' | 'package';
    language: string;
    exports: ExportInfo[];
    imports: ImportInfo[];
    symbols: SymbolInfo[];
    lastAnalyzed: Date;
}

export interface ExportInfo {
    name: string;
    type: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'enum' | 'default';
    line: number;
    isDefault: boolean;
}

export interface ImportInfo {
    source: string;
    resolvedPath?: string;
    imports: string[];
    isNamespaceImport: boolean;
    line: number;
}

export interface SymbolInfo {
    name: string;
    type: 'function' | 'class' | 'method' | 'property' | 'variable' | 'type' | 'interface';
    startLine: number;
    endLine: number;
    signature?: string;
    references: SymbolReference[];
}

export interface SymbolReference {
    file: string;
    line: number;
    type: 'call' | 'import' | 'extend' | 'implement' | 'type-use';
}

export interface Dependency {
    from: string;
    to: string;
    type: 'import' | 'call' | 'extend' | 'implement';
    symbols: string[];
}

export interface ImpactAnalysis {
    file: string;
    directlyAffected: string[];
    indirectlyAffected: string[];
    importedBy: string[];
    exports: string[];
    riskLevel: 'high' | 'medium' | 'low';
    suggestions: string[];
}

export interface GraphStats {
    totalFiles: number;
    totalSymbols: number;
    totalDependencies: number;
    mostConnectedFiles: { file: string; connections: number }[];
    circularDependencies: string[][];
}

/**
 * ProjectContextGraph builds and maintains a codebase knowledge graph
 */
export class ProjectContextGraph extends EventEmitter {
    private static instance: ProjectContextGraph;
    private nodes: Map<string, FileNode> = new Map();
    private dependencies: Dependency[] = [];
    private projectRoot: string = '';
    private isBuilding: boolean = false;

    private constructor() {
        super();
    }

    static getInstance(): ProjectContextGraph {
        if (!ProjectContextGraph.instance) {
            ProjectContextGraph.instance = new ProjectContextGraph();
        }
        return ProjectContextGraph.instance;
    }

    /**
     * Build the context graph for a project
     */
    async buildGraph(projectPath: string): Promise<GraphStats> {
        if (this.isBuilding) {
            throw new Error('Graph building already in progress');
        }

        this.isBuilding = true;
        this.projectRoot = projectPath;
        this.nodes.clear();
        this.dependencies = [];

        this.emit('build:started', { projectPath });
        console.log(`📊 [ProjectContextGraph] Building graph for: ${projectPath}`);

        try {
            // Collect all source files
            const files = await this.collectSourceFiles(projectPath);
            console.log(`📊 [ProjectContextGraph] Found ${files.length} source files`);

            // Analyze each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.emit('build:progress', { current: i + 1, total: files.length, file });
                await this.analyzeFile(file);
            }

            // Resolve import paths
            await this.resolveImports();

            // Build dependency relationships
            this.buildDependencies();

            // Detect circular dependencies
            const circular = this.detectCircularDependencies();

            const stats = this.getStats();
            this.emit('build:completed', stats);

            console.log(`✅ [ProjectContextGraph] Graph built: ${stats.totalFiles} files, ${stats.totalSymbols} symbols, ${stats.totalDependencies} dependencies`);

            return stats;

        } finally {
            this.isBuilding = false;
        }
    }

    /**
     * Collect source files
     */
    private async collectSourceFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage', '__tests__'];

        async function scan(dir: string) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        if (!excludeDirs.includes(entry.name)) {
                            await scan(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch {
                // Ignore read errors
            }
        }

        await scan(dirPath);
        return files;
    }

    /**
     * Analyze a single file
     */
    private async analyzeFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            const relativePath = path.relative(this.projectRoot, filePath);
            const language = this.getLanguage(filePath);

            const node: FileNode = {
                id: relativePath,
                path: filePath,
                relativePath,
                type: 'file',
                language,
                exports: [],
                imports: [],
                symbols: [],
                lastAnalyzed: new Date(),
            };

            // Parse imports
            node.imports = this.parseImports(content, lines);

            // Parse exports
            node.exports = this.parseExports(content, lines);

            // Parse symbols (functions, classes, etc.)
            node.symbols = this.parseSymbols(content, lines, language);

            this.nodes.set(relativePath, node);

        } catch (error: any) {
            console.warn(`Failed to analyze ${filePath}:`, error.message);
        }
    }

    /**
     * Parse imports from file content
     */
    private parseImports(content: string, lines: string[]): ImportInfo[] {
        const imports: ImportInfo[] = [];

        // ES6 imports
        const importRegex = /import\s+(?:(?:\{([^}]+)\})|(?:(\*)\s+as\s+(\w+))|(?:(\w+)))\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const line = beforeMatch.split('\n').length;

            const namedImports = match[1]?.split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean) || [];
            const isNamespace = !!match[2];
            const namespaceAs = match[3];
            const defaultImport = match[4];
            const source = match[5];

            const importedNames = [
                ...namedImports,
                ...(namespaceAs ? [namespaceAs] : []),
                ...(defaultImport ? [defaultImport] : []),
            ];

            imports.push({
                source,
                imports: importedNames,
                isNamespaceImport: isNamespace,
                line,
            });
        }

        // require statements
        const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const line = beforeMatch.split('\n').length;

            const namedImports = match[1]?.split(',').map(s => s.trim()).filter(Boolean) || [];
            const defaultImport = match[2];
            const source = match[3];

            imports.push({
                source,
                imports: [...namedImports, ...(defaultImport ? [defaultImport] : [])],
                isNamespaceImport: false,
                line,
            });
        }

        return imports;
    }

    /**
     * Parse exports from file content
     */
    private parseExports(content: string, lines: string[]): ExportInfo[] {
        const exports: ExportInfo[] = [];

        // Named exports
        const namedExportRegex = /export\s+(?:async\s+)?(?:(function|class|const|let|var|interface|type|enum)\s+)(\w+)/g;
        let match;

        while ((match = namedExportRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const line = beforeMatch.split('\n').length;

            exports.push({
                name: match[2],
                type: this.mapExportType(match[1]),
                line,
                isDefault: false,
            });
        }

        // Default exports
        const defaultExportRegex = /export\s+default\s+(?:(?:async\s+)?(?:function|class)\s+)?(\w+)?/g;
        while ((match = defaultExportRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const line = beforeMatch.split('\n').length;

            exports.push({
                name: match[1] || 'default',
                type: 'default',
                line,
                isDefault: true,
            });
        }

        return exports;
    }

    /**
     * Parse symbols from content
     */
    private parseSymbols(content: string, lines: string[], language: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = [];

        // Functions
        const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;

        while ((match = funcRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const startLine = beforeMatch.split('\n').length;

            symbols.push({
                name: match[1],
                type: 'function',
                startLine,
                endLine: startLine, // Would need proper parsing for accurate end
                signature: `function ${match[1]}(${match[2]})`,
                references: [],
            });
        }

        // Classes
        const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?/g;
        while ((match = classRegex.exec(content)) !== null) {
            const beforeMatch = content.substring(0, match.index);
            const startLine = beforeMatch.split('\n').length;

            symbols.push({
                name: match[1],
                type: 'class',
                startLine,
                endLine: startLine,
                signature: `class ${match[1]}${match[2] ? ` extends ${match[2]}` : ''}`,
                references: [],
            });
        }

        // Interfaces (TypeScript)
        if (language === 'typescript') {
            const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
            while ((match = interfaceRegex.exec(content)) !== null) {
                const beforeMatch = content.substring(0, match.index);
                const startLine = beforeMatch.split('\n').length;

                symbols.push({
                    name: match[1],
                    type: 'interface',
                    startLine,
                    endLine: startLine,
                    references: [],
                });
            }
        }

        return symbols;
    }

    /**
     * Resolve import paths to actual files
     */
    private async resolveImports(): Promise<void> {
        for (const node of this.nodes.values()) {
            for (const imp of node.imports) {
                imp.resolvedPath = await this.resolveImportPath(imp.source, node.path);
            }
        }
    }

    /**
     * Resolve a single import path
     */
    private async resolveImportPath(source: string, fromFile: string): Promise<string | undefined> {
        if (source.startsWith('.')) {
            // Relative import
            const fromDir = path.dirname(fromFile);
            const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];

            for (const ext of extensions) {
                const fullPath = path.resolve(fromDir, source + ext);
                const relativePath = path.relative(this.projectRoot, fullPath);
                if (this.nodes.has(relativePath)) {
                    return relativePath;
                }
            }
        }

        // Package import - return as-is
        return undefined;
    }

    /**
     * Build dependency edges
     */
    private buildDependencies(): void {
        this.dependencies = [];

        for (const node of this.nodes.values()) {
            for (const imp of node.imports) {
                if (imp.resolvedPath) {
                    this.dependencies.push({
                        from: node.relativePath,
                        to: imp.resolvedPath,
                        type: 'import',
                        symbols: imp.imports,
                    });
                }
            }
        }
    }

    /**
     * Detect circular dependencies
     */
    private detectCircularDependencies(): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const parent: Map<string, string> = new Map();

        const dfs = (nodeId: string, path: string[]) => {
            if (recursionStack.has(nodeId)) {
                // Found cycle
                const cycleStart = path.indexOf(nodeId);
                if (cycleStart !== -1) {
                    cycles.push(path.slice(cycleStart));
                }
                return;
            }

            if (visited.has(nodeId)) return;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoing = this.dependencies.filter(d => d.from === nodeId);
            for (const dep of outgoing) {
                dfs(dep.to, [...path, nodeId]);
            }

            recursionStack.delete(nodeId);
        };

        for (const nodeId of this.nodes.keys()) {
            dfs(nodeId, []);
        }

        return cycles;
    }

    /**
     * Get impact analysis for a file change
     */
    getImpactAnalysis(filePath: string): ImpactAnalysis {
        const relativePath = path.relative(this.projectRoot, filePath);
        const node = this.nodes.get(relativePath);

        if (!node) {
            return {
                file: relativePath,
                directlyAffected: [],
                indirectlyAffected: [],
                importedBy: [],
                exports: [],
                riskLevel: 'low',
                suggestions: ['File not found in project graph'],
            };
        }

        // Files that import this file
        const importedBy = this.dependencies
            .filter(d => d.to === relativePath)
            .map(d => d.from);

        // Find indirect dependents
        const indirectlyAffected = new Set<string>();
        const queue = [...importedBy];
        const visited = new Set<string>(importedBy);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const dependents = this.dependencies
                .filter(d => d.to === current)
                .map(d => d.from);

            for (const dep of dependents) {
                if (!visited.has(dep)) {
                    visited.add(dep);
                    indirectlyAffected.add(dep);
                    queue.push(dep);
                }
            }
        }

        const exports = node.exports.map(e => e.name);
        const totalAffected = importedBy.length + indirectlyAffected.size;

        let riskLevel: 'high' | 'medium' | 'low';
        if (totalAffected > 10 || exports.length > 5) {
            riskLevel = 'high';
        } else if (totalAffected > 3) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }

        const suggestions: string[] = [];
        if (importedBy.length > 5) {
            suggestions.push('Consider breaking this module into smaller pieces');
        }
        if (exports.length > 10) {
            suggestions.push('This file exports many symbols - consider splitting');
        }

        return {
            file: relativePath,
            directlyAffected: importedBy,
            indirectlyAffected: [...indirectlyAffected],
            importedBy,
            exports,
            riskLevel,
            suggestions,
        };
    }

    /**
     * Find all usages of a symbol
     */
    findSymbolUsages(symbolName: string): SymbolReference[] {
        const usages: SymbolReference[] = [];

        for (const node of this.nodes.values()) {
            for (const imp of node.imports) {
                if (imp.imports.includes(symbolName)) {
                    usages.push({
                        file: node.relativePath,
                        line: imp.line,
                        type: 'import',
                    });
                }
            }
        }

        return usages;
    }

    /**
     * Get graph statistics
     */
    getStats(): GraphStats {
        const symbolCount = [...this.nodes.values()].reduce(
            (sum, node) => sum + node.symbols.length,
            0
        );

        // Most connected files
        const connections: Map<string, number> = new Map();
        for (const dep of this.dependencies) {
            connections.set(dep.from, (connections.get(dep.from) || 0) + 1);
            connections.set(dep.to, (connections.get(dep.to) || 0) + 1);
        }

        const mostConnected = [...connections.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([file, count]) => ({ file, connections: count }));

        return {
            totalFiles: this.nodes.size,
            totalSymbols: symbolCount,
            totalDependencies: this.dependencies.length,
            mostConnectedFiles: mostConnected,
            circularDependencies: this.detectCircularDependencies(),
        };
    }

    /**
     * Get file node
     */
    getNode(relativePath: string): FileNode | undefined {
        return this.nodes.get(relativePath);
    }

    /**
     * Get all nodes
     */
    getAllNodes(): FileNode[] {
        return [...this.nodes.values()];
    }

    /**
     * Get dependencies for a file
     */
    getDependencies(relativePath: string): Dependency[] {
        return this.dependencies.filter(d => d.from === relativePath || d.to === relativePath);
    }

    // Helper methods
    private getLanguage(filePath: string): string {
        const ext = path.extname(filePath);
        switch (ext) {
            case '.ts':
            case '.tsx':
                return 'typescript';
            case '.js':
            case '.jsx':
                return 'javascript';
            default:
                return 'unknown';
        }
    }

    private mapExportType(keyword: string): ExportInfo['type'] {
        switch (keyword) {
            case 'function': return 'function';
            case 'class': return 'class';
            case 'interface': return 'interface';
            case 'type': return 'type';
            case 'enum': return 'enum';
            default: return 'variable';
        }
    }
}

export default ProjectContextGraph;
