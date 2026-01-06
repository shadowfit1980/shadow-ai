/**
 * ProjectContext - Deep Codebase Understanding
 * 
 * Provides intelligent project analysis, architecture detection,
 * and codebase summarization for Claude Code-level understanding.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { EventEmitter } from 'events';

export interface FileInfo {
    path: string;
    relativePath: string;
    language: string;
    size: number;
    imports: string[];
    exports: string[];
    functions: string[];
    classes: string[];
    lastModified: Date;
}

export interface ProjectArchitecture {
    type: 'monorepo' | 'frontend' | 'backend' | 'fullstack' | 'library' | 'cli' | 'unknown';
    frameworks: string[];
    languages: string[];
    patterns: ArchitecturePattern[];
    entryPoints: string[];
    structure: DirectoryStructure;
}

export interface ArchitecturePattern {
    name: string;
    confidence: number;
    evidence: string[];
}

export interface DirectoryStructure {
    name: string;
    type: 'dir' | 'file';
    purpose?: string;
    children?: DirectoryStructure[];
}

export interface DependencyGraph {
    nodes: Map<string, FileNode>;
    edges: Map<string, string[]>;
}

export interface FileNode {
    path: string;
    imports: string[];
    importedBy: string[];
    depth: number; // Distance from entry point
}

export interface ProjectSummary {
    name: string;
    description: string;
    architecture: ProjectArchitecture;
    mainTechnologies: string[];
    keyFiles: string[];
    statistics: ProjectStats;
    conventions: CodeConvention[];
}

export interface ProjectStats {
    totalFiles: number;
    totalLines: number;
    byLanguage: Record<string, { files: number; lines: number }>;
    averageFileSize: number;
    largestFiles: Array<{ path: string; lines: number }>;
}

export interface CodeConvention {
    type: 'naming' | 'structure' | 'imports' | 'exports' | 'comments';
    pattern: string;
    examples: string[];
    confidence: number;
}

/**
 * ProjectContext provides deep understanding of the entire codebase
 */
export class ProjectContext extends EventEmitter {
    private static instance: ProjectContext;
    private projectRoot: string = '';
    private fileCache: Map<string, FileInfo> = new Map();
    private dependencyGraph: DependencyGraph = { nodes: new Map(), edges: new Map() };
    private architecture: ProjectArchitecture | null = null;
    private isIndexed: boolean = false;
    private indexProgress: number = 0;

    private constructor() {
        super();
    }

    static getInstance(): ProjectContext {
        if (!ProjectContext.instance) {
            ProjectContext.instance = new ProjectContext();
        }
        return ProjectContext.instance;
    }

    /**
     * Initialize and index a project
     */
    async indexProject(projectPath: string): Promise<ProjectSummary> {
        this.projectRoot = projectPath;
        this.fileCache.clear();
        this.dependencyGraph = { nodes: new Map(), edges: new Map() };
        this.isIndexed = false;
        this.indexProgress = 0;

        console.log(`📊 [ProjectContext] Indexing project: ${projectPath}`);
        this.emit('indexStart', { path: projectPath });

        try {
            // Step 1: Discover all source files
            const files = await this.discoverFiles(projectPath);
            console.log(`📁 [ProjectContext] Found ${files.length} source files`);

            // Step 2: Parse and analyze each file
            let processed = 0;
            for (const file of files) {
                const fileInfo = await this.analyzeFile(file);
                this.fileCache.set(file, fileInfo);
                processed++;
                this.indexProgress = (processed / files.length) * 100;

                if (processed % 50 === 0 || processed === files.length) {
                    this.emit('indexProgress', {
                        processed,
                        total: files.length,
                        percent: this.indexProgress
                    });
                }
            }

            // Step 3: Build dependency graph
            await this.buildDependencyGraph();

            // Step 4: Detect architecture
            this.architecture = await this.detectArchitecture();

            // Step 5: Generate summary
            const summary = await this.generateSummary();

            this.isIndexed = true;
            this.emit('indexComplete', summary);

            console.log(`✅ [ProjectContext] Indexing complete`);
            return summary;

        } catch (error) {
            console.error(`❌ [ProjectContext] Indexing failed:`, error);
            this.emit('indexError', error);
            throw error;
        }
    }

    /**
     * Discover all source files in the project
     */
    private async discoverFiles(projectPath: string): Promise<string[]> {
        const patterns = [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.py',
            '**/*.go',
            '**/*.rs',
            '**/*.java',
            '**/*.vue',
            '**/*.svelte',
        ];

        const ignorePatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/coverage/**',
            '**/__pycache__/**',
            '**/target/**',
            '**/vendor/**',
        ];

        const files: string[] = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: projectPath,
                absolute: true,
                ignore: ignorePatterns,
            });
            files.push(...matches);
        }

        return [...new Set(files)]; // Remove duplicates
    }

    /**
     * Analyze a single file for structure and dependencies
     */
    private async analyzeFile(filePath: string): Promise<FileInfo> {
        const content = await fs.readFile(filePath, 'utf-8');
        const relativePath = path.relative(this.projectRoot, filePath);
        const ext = path.extname(filePath);
        const stats = await fs.stat(filePath);

        const language = this.detectLanguage(ext);
        const imports = this.extractImports(content, language);
        const exports = this.extractExports(content, language);
        const functions = this.extractFunctions(content, language);
        const classes = this.extractClasses(content, language);

        return {
            path: filePath,
            relativePath,
            language,
            size: stats.size,
            imports,
            exports,
            functions,
            classes,
            lastModified: stats.mtime,
        };
    }

    private detectLanguage(ext: string): string {
        const langMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.vue': 'vue',
            '.svelte': 'svelte',
        };
        return langMap[ext] || 'unknown';
    }

    private extractImports(content: string, language: string): string[] {
        const imports: string[] = [];

        if (language === 'typescript' || language === 'javascript') {
            // ES6 imports
            const es6Regex = /import\s+(?:[\w{},*\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
            let match;
            while ((match = es6Regex.exec(content)) !== null) {
                imports.push(match[1]);
            }

            // CommonJS require
            const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            while ((match = cjsRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }
        } else if (language === 'python') {
            const pyImportRegex = /(?:from\s+(\S+)\s+)?import\s+(\S+)/g;
            let match;
            while ((match = pyImportRegex.exec(content)) !== null) {
                imports.push(match[1] || match[2]);
            }
        } else if (language === 'go') {
            const goImportRegex = /import\s+(?:\(\s*)?["']([^"']+)["']/g;
            let match;
            while ((match = goImportRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }
        }

        return [...new Set(imports)];
    }

    private extractExports(content: string, language: string): string[] {
        const exports: string[] = [];

        if (language === 'typescript' || language === 'javascript') {
            // Named exports
            const namedRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
            let match;
            while ((match = namedRegex.exec(content)) !== null) {
                exports.push(match[1]);
            }

            // Default export
            if (/export\s+default/.test(content)) {
                exports.push('default');
            }
        } else if (language === 'python') {
            // Python uses __all__ for explicit exports, but we'll extract top-level definitions
            const pyDefRegex = /^(?:def|class)\s+(\w+)/gm;
            let match;
            while ((match = pyDefRegex.exec(content)) !== null) {
                if (!match[1].startsWith('_')) {
                    exports.push(match[1]);
                }
            }
        }

        return exports;
    }

    private extractFunctions(content: string, language: string): string[] {
        const functions: string[] = [];

        if (language === 'typescript' || language === 'javascript') {
            // Function declarations and expressions
            const funcRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>|(\w+)\s*(?::\s*\([^)]*\)\s*=>|\([^)]*\)\s*\{))/g;
            let match;
            while ((match = funcRegex.exec(content)) !== null) {
                const name = match[1] || match[2] || match[3];
                if (name) functions.push(name);
            }
        } else if (language === 'python') {
            const pyFuncRegex = /^def\s+(\w+)/gm;
            let match;
            while ((match = pyFuncRegex.exec(content)) !== null) {
                functions.push(match[1]);
            }
        }

        return [...new Set(functions)];
    }

    private extractClasses(content: string, language: string): string[] {
        const classes: string[] = [];

        if (language === 'typescript' || language === 'javascript') {
            const classRegex = /class\s+(\w+)/g;
            let match;
            while ((match = classRegex.exec(content)) !== null) {
                classes.push(match[1]);
            }
        } else if (language === 'python') {
            const pyClassRegex = /^class\s+(\w+)/gm;
            let match;
            while ((match = pyClassRegex.exec(content)) !== null) {
                classes.push(match[1]);
            }
        }

        return classes;
    }

    /**
     * Build the dependency graph from analyzed files
     */
    private async buildDependencyGraph(): Promise<void> {
        const nodes = new Map<string, FileNode>();
        const edges = new Map<string, string[]>();

        // Create nodes for all files
        for (const [filePath, fileInfo] of this.fileCache) {
            nodes.set(filePath, {
                path: filePath,
                imports: fileInfo.imports,
                importedBy: [],
                depth: Infinity,
            });
            edges.set(filePath, []);
        }

        // Build edges by resolving imports
        for (const [filePath, fileInfo] of this.fileCache) {
            for (const importPath of fileInfo.imports) {
                const resolvedPath = this.resolveImport(filePath, importPath);
                if (resolvedPath && nodes.has(resolvedPath)) {
                    edges.get(filePath)?.push(resolvedPath);
                    nodes.get(resolvedPath)!.importedBy.push(filePath);
                }
            }
        }

        // Calculate depth from entry points
        const entryPoints = this.findEntryPoints();
        for (const entry of entryPoints) {
            if (nodes.has(entry)) {
                this.calculateDepth(entry, 0, nodes, edges, new Set());
            }
        }

        this.dependencyGraph = { nodes, edges };
    }

    private resolveImport(fromFile: string, importPath: string): string | null {
        // Skip external packages
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }

        const baseDir = path.dirname(fromFile);
        let resolved = path.resolve(baseDir, importPath);

        // Try common extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
        for (const ext of extensions) {
            const withExt = resolved + ext;
            if (this.fileCache.has(withExt)) {
                return withExt;
            }

            // Try index file
            const indexPath = path.join(resolved, `index${ext}`);
            if (this.fileCache.has(indexPath)) {
                return indexPath;
            }
        }

        return null;
    }

    private findEntryPoints(): string[] {
        const entryPoints: string[] = [];
        const patterns = [
            'src/main/index.ts',
            'src/index.ts',
            'src/main.ts',
            'index.ts',
            'main.ts',
            'src/renderer/index.tsx',
            'src/App.tsx',
            'app.py',
            'main.py',
            'main.go',
            'src/main.rs',
        ];

        for (const pattern of patterns) {
            const fullPath = path.join(this.projectRoot, pattern);
            if (this.fileCache.has(fullPath)) {
                entryPoints.push(fullPath);
            }
        }

        return entryPoints;
    }

    private calculateDepth(
        node: string,
        depth: number,
        nodes: Map<string, FileNode>,
        edges: Map<string, string[]>,
        visited: Set<string>
    ): void {
        if (visited.has(node)) return;
        visited.add(node);

        const fileNode = nodes.get(node);
        if (fileNode && depth < fileNode.depth) {
            fileNode.depth = depth;
        }

        const deps = edges.get(node) || [];
        for (const dep of deps) {
            this.calculateDepth(dep, depth + 1, nodes, edges, visited);
        }
    }

    /**
     * Detect the architecture and patterns of the project
     */
    private async detectArchitecture(): Promise<ProjectArchitecture> {
        const frameworks = this.detectFrameworks();
        const languages = this.detectLanguages();
        const patterns = this.detectPatterns();
        const entryPoints = this.findEntryPoints();
        const structure = await this.analyzeStructure();
        const type = this.determineProjectType(frameworks, structure);

        return {
            type,
            frameworks,
            languages,
            patterns,
            entryPoints,
            structure,
        };
    }

    private detectFrameworks(): string[] {
        const frameworks: string[] = [];

        // Check package.json for JS/TS projects
        try {
            const pkgPath = path.join(this.projectRoot, 'package.json');
            const pkgContent = require(pkgPath);
            const deps = { ...pkgContent.dependencies, ...pkgContent.devDependencies };

            if (deps['react']) frameworks.push('React');
            if (deps['vue']) frameworks.push('Vue');
            if (deps['@angular/core']) frameworks.push('Angular');
            if (deps['svelte']) frameworks.push('Svelte');
            if (deps['next']) frameworks.push('Next.js');
            if (deps['nuxt']) frameworks.push('Nuxt');
            if (deps['express']) frameworks.push('Express');
            if (deps['fastify']) frameworks.push('Fastify');
            if (deps['nestjs'] || deps['@nestjs/core']) frameworks.push('NestJS');
            if (deps['electron']) frameworks.push('Electron');
            if (deps['vite']) frameworks.push('Vite');
        } catch {
            // Not a Node.js project
        }

        // Check for Python frameworks
        const requirementsFiles = ['requirements.txt', 'pyproject.toml', 'setup.py'];
        for (const file of requirementsFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (this.fileCache.has(filePath)) {
                // Would need to parse these for framework detection
            }
        }

        return frameworks;
    }

    private detectLanguages(): string[] {
        const langCounts = new Map<string, number>();
        for (const fileInfo of this.fileCache.values()) {
            const count = langCounts.get(fileInfo.language) || 0;
            langCounts.set(fileInfo.language, count + 1);
        }

        return [...langCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);
    }

    private detectPatterns(): ArchitecturePattern[] {
        const patterns: ArchitecturePattern[] = [];

        // Check for common patterns based on directory structure
        const dirs = new Set<string>();
        for (const filePath of this.fileCache.keys()) {
            const rel = path.relative(this.projectRoot, filePath);
            const parts = rel.split(path.sep);
            if (parts.length > 1) {
                dirs.add(parts[0]);
                if (parts.length > 2) {
                    dirs.add(`${parts[0]}/${parts[1]}`);
                }
            }
        }

        // MVC Pattern
        if (dirs.has('models') && dirs.has('views') && dirs.has('controllers')) {
            patterns.push({
                name: 'MVC',
                confidence: 0.9,
                evidence: ['models/', 'views/', 'controllers/ directories'],
            });
        }

        // Component-based
        if (dirs.has('components') || dirs.has('src/components')) {
            patterns.push({
                name: 'Component-Based',
                confidence: 0.8,
                evidence: ['components/ directory'],
            });
        }

        // Service Layer
        if (dirs.has('services') || dirs.has('src/services')) {
            patterns.push({
                name: 'Service Layer',
                confidence: 0.8,
                evidence: ['services/ directory'],
            });
        }

        // Repository Pattern
        if (dirs.has('repositories') || dirs.has('src/repositories')) {
            patterns.push({
                name: 'Repository Pattern',
                confidence: 0.8,
                evidence: ['repositories/ directory'],
            });
        }

        // Feature-based (vertical slices)
        if (dirs.has('features') || dirs.has('src/features') || dirs.has('modules')) {
            patterns.push({
                name: 'Feature-Based',
                confidence: 0.7,
                evidence: ['features/ or modules/ directory'],
            });
        }

        return patterns;
    }

    private determineProjectType(
        frameworks: string[],
        structure: DirectoryStructure
    ): ProjectArchitecture['type'] {
        // Check for monorepo indicators
        const hasPackages = structure.children?.some(c =>
            c.name === 'packages' || c.name === 'apps' || c.name === 'libs'
        );
        if (hasPackages) return 'monorepo';

        // Check for full-stack (both frontend and backend)
        const hasServer = structure.children?.some(c =>
            c.name === 'server' || c.name === 'api' || c.name === 'backend'
        );
        const hasClient = structure.children?.some(c =>
            c.name === 'client' || c.name === 'frontend' || c.name === 'web'
        );
        if (hasServer && hasClient) return 'fullstack';

        // Framework-based detection
        if (frameworks.includes('React') || frameworks.includes('Vue') || frameworks.includes('Angular')) {
            return 'frontend';
        }

        if (frameworks.includes('Express') || frameworks.includes('NestJS') || frameworks.includes('Fastify')) {
            return 'backend';
        }

        if (frameworks.includes('Electron')) {
            return 'fullstack';
        }

        // Check for library indicators
        const hasSrc = structure.children?.some(c => c.name === 'src');
        const hasLib = structure.children?.some(c => c.name === 'lib');
        if (hasSrc || hasLib) {
            // Could be a library
        }

        return 'unknown';
    }

    private async analyzeStructure(): Promise<DirectoryStructure> {
        const rootChildren: DirectoryStructure[] = [];

        try {
            const entries = await fs.readdir(this.projectRoot, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

                if (entry.isDirectory()) {
                    rootChildren.push({
                        name: entry.name,
                        type: 'dir',
                        purpose: this.inferPurpose(entry.name),
                    });
                } else {
                    rootChildren.push({
                        name: entry.name,
                        type: 'file',
                    });
                }
            }
        } catch (error) {
            console.error('Error analyzing structure:', error);
        }

        return {
            name: path.basename(this.projectRoot),
            type: 'dir',
            children: rootChildren,
        };
    }

    private inferPurpose(dirName: string): string | undefined {
        const purposes: Record<string, string> = {
            'src': 'Source code',
            'lib': 'Library code',
            'test': 'Test files',
            'tests': 'Test files',
            '__tests__': 'Test files',
            'spec': 'Test specifications',
            'docs': 'Documentation',
            'public': 'Static assets',
            'static': 'Static assets',
            'assets': 'Assets and resources',
            'config': 'Configuration files',
            'scripts': 'Build/utility scripts',
            'components': 'UI components',
            'pages': 'Page components',
            'api': 'API routes',
            'services': 'Business logic services',
            'utils': 'Utility functions',
            'helpers': 'Helper functions',
            'hooks': 'React hooks',
            'store': 'State management',
            'types': 'Type definitions',
            'models': 'Data models',
            'controllers': 'Request handlers',
            'middleware': 'Middleware functions',
        };

        return purposes[dirName.toLowerCase()];
    }

    /**
     * Generate a comprehensive project summary
     */
    private async generateSummary(): Promise<ProjectSummary> {
        const stats = this.calculateStats();
        const conventions = this.detectConventions();
        const keyFiles = this.identifyKeyFiles();

        let pkgName = path.basename(this.projectRoot);
        let description = 'A software project';

        try {
            const pkgPath = path.join(this.projectRoot, 'package.json');
            const pkg = require(pkgPath);
            pkgName = pkg.name || pkgName;
            description = pkg.description || description;
        } catch {
            // Not a Node.js project
        }

        return {
            name: pkgName,
            description,
            architecture: this.architecture!,
            mainTechnologies: [
                ...this.architecture!.frameworks,
                ...this.architecture!.languages.slice(0, 3),
            ],
            keyFiles,
            statistics: stats,
            conventions,
        };
    }

    private calculateStats(): ProjectStats {
        const byLanguage: Record<string, { files: number; lines: number }> = {};
        const fileSizes: Array<{ path: string; lines: number }> = [];
        let totalLines = 0;

        for (const fileInfo of this.fileCache.values()) {
            // Estimate lines from file size (rough approximation)
            const lines = Math.ceil(fileInfo.size / 40); // avg 40 bytes per line
            totalLines += lines;

            if (!byLanguage[fileInfo.language]) {
                byLanguage[fileInfo.language] = { files: 0, lines: 0 };
            }
            byLanguage[fileInfo.language].files++;
            byLanguage[fileInfo.language].lines += lines;

            fileSizes.push({ path: fileInfo.relativePath, lines });
        }

        fileSizes.sort((a, b) => b.lines - a.lines);

        return {
            totalFiles: this.fileCache.size,
            totalLines,
            byLanguage,
            averageFileSize: totalLines / this.fileCache.size,
            largestFiles: fileSizes.slice(0, 10),
        };
    }

    private detectConventions(): CodeConvention[] {
        const conventions: CodeConvention[] = [];

        // Analyze naming conventions
        const functionNames: string[] = [];
        const classNames: string[] = [];

        for (const fileInfo of this.fileCache.values()) {
            functionNames.push(...fileInfo.functions);
            classNames.push(...fileInfo.classes);
        }

        // Check camelCase for functions
        const camelCaseFuncs = functionNames.filter(n => /^[a-z][a-zA-Z]*$/.test(n));
        if (camelCaseFuncs.length / functionNames.length > 0.7) {
            conventions.push({
                type: 'naming',
                pattern: 'camelCase for functions',
                examples: camelCaseFuncs.slice(0, 3),
                confidence: camelCaseFuncs.length / functionNames.length,
            });
        }

        // Check PascalCase for classes
        const pascalCaseClasses = classNames.filter(n => /^[A-Z][a-zA-Z]*$/.test(n));
        if (pascalCaseClasses.length / classNames.length > 0.7) {
            conventions.push({
                type: 'naming',
                pattern: 'PascalCase for classes',
                examples: pascalCaseClasses.slice(0, 3),
                confidence: pascalCaseClasses.length / classNames.length,
            });
        }

        return conventions;
    }

    private identifyKeyFiles(): string[] {
        const keyFiles: string[] = [];

        // Entry points
        keyFiles.push(...this.findEntryPoints().map(f => path.relative(this.projectRoot, f)));

        // Most imported files
        const importCounts = new Map<string, number>();
        for (const node of this.dependencyGraph.nodes.values()) {
            if (node.importedBy.length > 0) {
                importCounts.set(node.path, node.importedBy.length);
            }
        }

        const mostImported = [...importCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([p]) => path.relative(this.projectRoot, p));

        keyFiles.push(...mostImported);

        return [...new Set(keyFiles)];
    }

    // Public API methods

    /**
     * Get files that depend on a given file
     */
    getDependents(filePath: string): string[] {
        const node = this.dependencyGraph.nodes.get(filePath);
        return node?.importedBy || [];
    }

    /**
     * Get files that a given file depends on
     */
    getDependencies(filePath: string): string[] {
        return this.dependencyGraph.edges.get(filePath) || [];
    }

    /**
     * Get all files in a feature/module group
     */
    getFileGroup(directory: string): FileInfo[] {
        const files: FileInfo[] = [];
        for (const [filePath, info] of this.fileCache) {
            if (filePath.startsWith(path.join(this.projectRoot, directory))) {
                files.push(info);
            }
        }
        return files;
    }

    /**
     * Find files related to a given file (dependencies + dependents + same directory)
     */
    getRelatedFiles(filePath: string, maxDepth: number = 2): string[] {
        const related = new Set<string>();
        const visited = new Set<string>();

        const explore = (file: string, depth: number) => {
            if (depth > maxDepth || visited.has(file)) return;
            visited.add(file);

            // Add dependencies
            const deps = this.getDependencies(file);
            deps.forEach(d => {
                related.add(d);
                explore(d, depth + 1);
            });

            // Add dependents
            const dependents = this.getDependents(file);
            dependents.forEach(d => {
                related.add(d);
                explore(d, depth + 1);
            });
        };

        explore(filePath, 0);

        // Add files in same directory
        const dir = path.dirname(filePath);
        for (const [f] of this.fileCache) {
            if (path.dirname(f) === dir && f !== filePath) {
                related.add(f);
            }
        }

        related.delete(filePath);
        return [...related];
    }

    /**
     * Get a compact context for AI consumption
     */
    getAIContext(focusFiles?: string[]): string {
        if (!this.isIndexed || !this.architecture) {
            return 'Project not indexed. Call indexProject() first.';
        }

        let context = `# Project: ${path.basename(this.projectRoot)}\n\n`;
        context += `**Type**: ${this.architecture.type}\n`;
        context += `**Frameworks**: ${this.architecture.frameworks.join(', ') || 'None detected'}\n`;
        context += `**Languages**: ${this.architecture.languages.join(', ')}\n`;
        context += `**Files**: ${this.fileCache.size}\n\n`;

        if (this.architecture.patterns.length > 0) {
            context += `**Patterns**: ${this.architecture.patterns.map(p => p.name).join(', ')}\n\n`;
        }

        if (focusFiles && focusFiles.length > 0) {
            context += `## Focus Files\n`;
            for (const file of focusFiles) {
                const info = this.fileCache.get(file);
                if (info) {
                    context += `\n### ${info.relativePath}\n`;
                    context += `- Exports: ${info.exports.join(', ') || 'none'}\n`;
                    context += `- Imports: ${info.imports.slice(0, 5).join(', ')}${info.imports.length > 5 ? '...' : ''}\n`;

                    const related = this.getRelatedFiles(file, 1);
                    if (related.length > 0) {
                        context += `- Related: ${related.slice(0, 3).map(r => path.basename(r)).join(', ')}${related.length > 3 ? '...' : ''}\n`;
                    }
                }
            }
        }

        return context;
    }

    /**
     * Check if the project is indexed
     */
    isProjectIndexed(): boolean {
        return this.isIndexed;
    }

    /**
     * Get current indexing progress
     */
    getIndexProgress(): number {
        return this.indexProgress;
    }

    /**
     * Get the architecture analysis
     */
    getArchitecture(): ProjectArchitecture | null {
        return this.architecture;
    }

    /**
     * Get all indexed files
     */
    getAllFiles(): FileInfo[] {
        return [...this.fileCache.values()];
    }
}

export default ProjectContext;
