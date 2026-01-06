/**
 * 🧬 CodebaseDNAVisualizer - 3D Codebase Fingerprinting
 * 
 * Creates visual representations of codebase "DNA":
 * - 3D scatter plots of code similarity
 * - Dependency graphs
 * - Architectural diagrams
 * - Evolution animations
 * 
 * Turn abstract code into visible, comparable fingerprints.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface DNAProfile {
    id: string;
    projectPath: string;
    name: string;
    createdAt: Date;
    fingerprint: number[]; // 4096-dimensional vector
    metrics: CodebaseMetrics;
    patterns: PatternAnalysis;
    structure: StructureGraph;
    evolution: EvolutionPoint[];
}

export interface CodebaseMetrics {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    avgComplexity: number;
    avgFileSize: number;
    testCoverage: number;
    documentation: number;
    dependencies: number;
}

export interface PatternAnalysis {
    designPatterns: DesignPattern[];
    antiPatterns: AntiPattern[];
    codeSmells: CodeSmell[];
    architectureStyle: string;
    dominantParadigm: 'oop' | 'functional' | 'procedural' | 'mixed';
}

export interface DesignPattern {
    name: string;
    occurrences: number;
    locations: string[];
    confidence: number;
}

export interface AntiPattern {
    name: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    locations: string[];
}

export interface CodeSmell {
    type: string;
    file: string;
    line: number;
    description: string;
}

export interface StructureGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    clusters: Cluster[];
}

export interface GraphNode {
    id: string;
    label: string;
    type: 'file' | 'directory' | 'module' | 'class' | 'function';
    size: number;
    color: string;
    x?: number;
    y?: number;
    z?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    type: 'import' | 'inheritance' | 'composition' | 'dependency';
}

export interface Cluster {
    id: string;
    label: string;
    nodes: string[];
    color: string;
}

export interface EvolutionPoint {
    commitHash: string;
    date: Date;
    fingerprint: number[];
    metrics: Partial<CodebaseMetrics>;
    summary: string;
}

export interface Visualization {
    type: '3d_scatter' | 'force_graph' | 'treemap' | 'sunburst' | 'evolution';
    data: any;
    html: string;
}

export interface SimilarityResult {
    targetProject: string;
    similarity: number; // 0-1
    sharedPatterns: string[];
    differences: string[];
}

// Color palette for visualizations
const COLORS = {
    typescript: '#3178c6',
    javascript: '#f7df1e',
    python: '#3776ab',
    rust: '#dea584',
    go: '#00add8',
    java: '#b07219',
    ruby: '#cc342d',
    css: '#563d7c',
    html: '#e34c26',
    default: '#6b7280'
};

// ============================================================================
// CODEBASE DNA VISUALIZER
// ============================================================================

export class CodebaseDNAVisualizer extends EventEmitter {
    private static instance: CodebaseDNAVisualizer;
    private profiles: Map<string, DNAProfile> = new Map();
    private outputDir: string;

    private constructor() {
        super();
        this.outputDir = path.join(process.cwd(), '.shadow-ai', 'dna-profiles');
    }

    public static getInstance(): CodebaseDNAVisualizer {
        if (!CodebaseDNAVisualizer.instance) {
            CodebaseDNAVisualizer.instance = new CodebaseDNAVisualizer();
        }
        return CodebaseDNAVisualizer.instance;
    }

    /**
     * Initialize the visualizer
     */
    public async initialize(): Promise<void> {
        await fs.mkdir(this.outputDir, { recursive: true });
        await this.loadProfiles();
    }

    /**
     * Generate DNA profile for a project
     */
    public async generateProfile(projectPath: string): Promise<DNAProfile> {
        console.log(`🧬 Generating DNA profile for ${projectPath}...`);
        this.emit('profile:generating', { projectPath });

        const metrics = await this.analyzeMetrics(projectPath);
        const patterns = await this.analyzePatterns(projectPath);
        const structure = await this.buildStructureGraph(projectPath);
        const fingerprint = this.generateFingerprint(metrics, patterns, structure);

        const profile: DNAProfile = {
            id: this.generateId(),
            projectPath,
            name: path.basename(projectPath),
            createdAt: new Date(),
            fingerprint,
            metrics,
            patterns,
            structure,
            evolution: []
        };

        this.profiles.set(profile.id, profile);
        await this.saveProfile(profile);

        this.emit('profile:generated', profile);
        console.log(`✅ DNA profile generated: ${profile.name}`);

        return profile;
    }

    /**
     * Generate 3D scatter plot visualization
     */
    public async visualize3D(profileId: string): Promise<Visualization> {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        // Project fingerprint to 3D space using PCA-like reduction
        const points = this.projectTo3D(profile.structure.nodes);

        const html = this.generate3DScatterHTML(points, profile);

        return {
            type: '3d_scatter',
            data: points,
            html
        };
    }

    /**
     * Generate force-directed graph
     */
    public async visualizeForceGraph(profileId: string): Promise<Visualization> {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const html = this.generateForceGraphHTML(profile.structure);

        return {
            type: 'force_graph',
            data: profile.structure,
            html
        };
    }

    /**
     * Generate treemap visualization
     */
    public async visualizeTreemap(profileId: string): Promise<Visualization> {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const treemapData = this.buildTreemapData(profile);
        const html = this.generateTreemapHTML(treemapData, profile);

        return {
            type: 'treemap',
            data: treemapData,
            html
        };
    }

    /**
     * Generate evolution animation
     */
    public async visualizeEvolution(profileId: string): Promise<Visualization> {
        const profile = this.profiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const html = this.generateEvolutionHTML(profile.evolution);

        return {
            type: 'evolution',
            data: profile.evolution,
            html
        };
    }

    /**
     * Compare two codebases
     */
    public compareDNA(profileId1: string, profileId2: string): SimilarityResult {
        const profile1 = this.profiles.get(profileId1);
        const profile2 = this.profiles.get(profileId2);

        if (!profile1 || !profile2) {
            throw new Error('One or both profiles not found');
        }

        // Calculate cosine similarity between fingerprints
        const similarity = this.cosineSimilarity(profile1.fingerprint, profile2.fingerprint);

        // Find shared patterns
        const sharedPatterns: string[] = [];
        for (const p1 of profile1.patterns.designPatterns) {
            if (profile2.patterns.designPatterns.find(p2 => p2.name === p1.name)) {
                sharedPatterns.push(p1.name);
            }
        }

        // Find differences
        const differences: string[] = [];
        if (profile1.patterns.architectureStyle !== profile2.patterns.architectureStyle) {
            differences.push(`Architecture: ${profile1.patterns.architectureStyle} vs ${profile2.patterns.architectureStyle}`);
        }
        if (profile1.patterns.dominantParadigm !== profile2.patterns.dominantParadigm) {
            differences.push(`Paradigm: ${profile1.patterns.dominantParadigm} vs ${profile2.patterns.dominantParadigm}`);
        }

        return {
            targetProject: profile2.name,
            similarity,
            sharedPatterns,
            differences
        };
    }

    /**
     * Find similar projects
     */
    public findSimilar(profileId: string, limit: number = 5): SimilarityResult[] {
        const results: SimilarityResult[] = [];
        const sourceProfile = this.profiles.get(profileId);

        if (!sourceProfile) {
            return results;
        }

        for (const [id, profile] of this.profiles) {
            if (id === profileId) continue;

            const similarity = this.cosineSimilarity(sourceProfile.fingerprint, profile.fingerprint);
            results.push({
                targetProject: profile.name,
                similarity,
                sharedPatterns: [],
                differences: []
            });
        }

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * Get all profiles
     */
    public getProfiles(): DNAProfile[] {
        return Array.from(this.profiles.values());
    }

    /**
     * Get a specific profile
     */
    public getProfile(id: string): DNAProfile | undefined {
        return this.profiles.get(id);
    }

    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================

    private async analyzeMetrics(projectPath: string): Promise<CodebaseMetrics> {
        const metrics: CodebaseMetrics = {
            totalFiles: 0,
            totalLines: 0,
            languages: {},
            avgComplexity: 0,
            avgFileSize: 0,
            testCoverage: 0,
            documentation: 0,
            dependencies: 0
        };

        const ignorePatterns = ['node_modules', '.git', 'dist', 'build', '.next'];
        let complexitySum = 0;

        const scanDir = async (dir: string) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (ignorePatterns.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await scanDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).slice(1);
                        if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'rb'].includes(ext)) {
                            metrics.totalFiles++;
                            metrics.languages[ext] = (metrics.languages[ext] || 0) + 1;

                            try {
                                const content = await fs.readFile(fullPath, 'utf-8');
                                const lines = content.split('\n').length;
                                metrics.totalLines += lines;

                                // Estimate complexity
                                const branches = (content.match(/if\s*\(|for\s*\(|while\s*\(/g) || []).length;
                                complexitySum += branches / Math.max(lines / 100, 1);
                            } catch {
                                // Skip unreadable files
                            }
                        }
                    }
                }
            } catch {
                // Directory access error
            }
        };

        await scanDir(projectPath);

        metrics.avgComplexity = metrics.totalFiles > 0 ? complexitySum / metrics.totalFiles : 0;
        metrics.avgFileSize = metrics.totalFiles > 0 ? metrics.totalLines / metrics.totalFiles : 0;

        // Check for package.json dependencies
        try {
            const pkgPath = path.join(projectPath, 'package.json');
            const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
            metrics.dependencies = Object.keys(pkg.dependencies || {}).length +
                Object.keys(pkg.devDependencies || {}).length;
        } catch {
            // No package.json
        }

        return metrics;
    }

    private async analyzePatterns(projectPath: string): Promise<PatternAnalysis> {
        const designPatterns: DesignPattern[] = [];
        const antiPatterns: AntiPattern[] = [];
        const codeSmells: CodeSmell[] = [];

        // Pattern detection through file/code analysis
        const patternDetectors: Record<string, RegExp[]> = {
            'Singleton': [/getInstance\s*\(\)/g, /private\s+static\s+instance/g],
            'Factory': [/create\w+\s*\(/g, /Factory/g],
            'Observer': [/addEventListener|emit|subscribe/g],
            'Strategy': [/Strategy|Policy/g],
            'Repository': [/Repository/g, /findBy|findAll|save/g]
        };

        await this.scanForPatterns(projectPath, patternDetectors, designPatterns);

        // Determine architecture style
        let architectureStyle = 'monolith';
        if (designPatterns.find(p => p.name === 'Repository')) {
            architectureStyle = 'layered';
        }

        // Determine paradigm
        const paradigm = await this.detectParadigm(projectPath);

        return {
            designPatterns,
            antiPatterns,
            codeSmells,
            architectureStyle,
            dominantParadigm: paradigm
        };
    }

    private async buildStructureGraph(projectPath: string): Promise<StructureGraph> {
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        const clusters: Cluster[] = [];

        const ignorePatterns = ['node_modules', '.git', 'dist'];
        const fileNodes: Map<string, GraphNode> = new Map();

        const scanDir = async (dir: string, depth: number = 0) => {
            if (depth > 5) return;

            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (ignorePatterns.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);
                    const relativePath = path.relative(projectPath, fullPath);

                    if (entry.isDirectory()) {
                        nodes.push({
                            id: relativePath,
                            label: entry.name,
                            type: 'directory',
                            size: 20,
                            color: '#6b7280'
                        });
                        await scanDir(fullPath, depth + 1);
                    } else {
                        const ext = path.extname(entry.name).slice(1);
                        const stats = await fs.stat(fullPath);

                        const node: GraphNode = {
                            id: relativePath,
                            label: entry.name,
                            type: 'file',
                            size: Math.log10(stats.size + 1) * 5,
                            color: COLORS[ext as keyof typeof COLORS] || COLORS.default
                        };

                        nodes.push(node);
                        fileNodes.set(relativePath, node);

                        // Parse imports to create edges
                        if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
                            try {
                                const content = await fs.readFile(fullPath, 'utf-8');
                                const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];

                                for (const imp of imports) {
                                    const match = imp.match(/from\s+['"]([^'"]+)['"]/);
                                    if (match && match[1].startsWith('.')) {
                                        const targetPath = path.normalize(
                                            path.join(path.dirname(relativePath), match[1])
                                        );
                                        edges.push({
                                            source: relativePath,
                                            target: targetPath,
                                            weight: 1,
                                            type: 'import'
                                        });
                                    }
                                }
                            } catch {
                                // Skip
                            }
                        }
                    }
                }
            } catch {
                // Skip
            }
        };

        await scanDir(projectPath);

        // Create clusters based on top-level directories
        const topDirs = new Set(nodes.filter(n => n.type === 'directory' && !n.id.includes('/')).map(n => n.id));
        for (const dir of topDirs) {
            clusters.push({
                id: dir,
                label: dir,
                nodes: nodes.filter(n => n.id.startsWith(dir)).map(n => n.id),
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }

        return { nodes, edges, clusters };
    }

    private generateFingerprint(
        metrics: CodebaseMetrics,
        patterns: PatternAnalysis,
        structure: StructureGraph
    ): number[] {
        // Generate a 4096-dimensional fingerprint
        const fingerprint = new Array(4096).fill(0);

        // Encode metrics (first 100 dimensions)
        fingerprint[0] = Math.log10(metrics.totalFiles + 1) / 5;
        fingerprint[1] = Math.log10(metrics.totalLines + 1) / 7;
        fingerprint[2] = metrics.avgComplexity / 10;
        fingerprint[3] = metrics.avgFileSize / 500;
        fingerprint[4] = Math.log10(metrics.dependencies + 1) / 3;

        // Encode language distribution (dimensions 100-200)
        const languages = Object.entries(metrics.languages);
        for (let i = 0; i < languages.length && i < 100; i++) {
            fingerprint[100 + i] = languages[i][1] / metrics.totalFiles;
        }

        // Encode patterns (dimensions 200-300)
        const patternNames = patterns.designPatterns.map(p => p.name);
        const knownPatterns = ['Singleton', 'Factory', 'Observer', 'Strategy', 'Repository'];
        for (let i = 0; i < knownPatterns.length; i++) {
            fingerprint[200 + i] = patternNames.includes(knownPatterns[i]) ? 1 : 0;
        }

        // Encode structure (dimensions 300-1000)
        fingerprint[300] = structure.nodes.length / 1000;
        fingerprint[301] = structure.edges.length / 5000;
        fingerprint[302] = structure.clusters.length / 20;

        // Hash remaining structural data for rest of dimensions
        const structureHash = crypto.createHash('sha256')
            .update(JSON.stringify(structure.nodes.map(n => n.label)))
            .digest();

        for (let i = 0; i < Math.min(structureHash.length, 256); i++) {
            fingerprint[1000 + i] = structureHash[i] / 255;
        }

        return fingerprint;
    }

    private projectTo3D(nodes: GraphNode[]): { x: number; y: number; z: number; node: GraphNode }[] {
        // Simple layout algorithm
        return nodes.map((node, i) => {
            const angle1 = (i / nodes.length) * Math.PI * 2;
            const angle2 = ((i * 1.618) % 1) * Math.PI; // Golden ratio distribution

            return {
                x: Math.cos(angle1) * (node.size * 10 + 50),
                y: Math.sin(angle1) * (node.size * 10 + 50),
                z: Math.cos(angle2) * 50,
                node
            };
        });
    }

    private generate3DScatterHTML(points: any[], profile: DNAProfile): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>DNA Profile: ${profile.name}</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body { margin: 0; background: #0d1117; color: #fff; font-family: -apple-system, sans-serif; }
        #plot { width: 100vw; height: 100vh; }
        .info { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="info">
        <h2>🧬 ${profile.name}</h2>
        <p>Files: ${profile.metrics.totalFiles} | Lines: ${profile.metrics.totalLines.toLocaleString()}</p>
    </div>
    <div id="plot"></div>
    <script>
        const data = [{
            x: ${JSON.stringify(points.map(p => p.x))},
            y: ${JSON.stringify(points.map(p => p.y))},
            z: ${JSON.stringify(points.map(p => p.z))},
            mode: 'markers',
            marker: {
                size: ${JSON.stringify(points.map(p => p.node.size))},
                color: ${JSON.stringify(points.map(p => p.node.color))},
                opacity: 0.8
            },
            text: ${JSON.stringify(points.map(p => p.node.label))},
            type: 'scatter3d'
        }];
        
        Plotly.newPlot('plot', data, {
            paper_bgcolor: '#0d1117',
            plot_bgcolor: '#0d1117',
            scene: {
                xaxis: { showgrid: false, zeroline: false, showticklabels: false },
                yaxis: { showgrid: false, zeroline: false, showticklabels: false },
                zaxis: { showgrid: false, zeroline: false, showticklabels: false }
            }
        });
    </script>
</body>
</html>`;
    }

    private generateForceGraphHTML(structure: StructureGraph): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Dependency Graph</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body { margin: 0; background: #0d1117; }
        svg { width: 100vw; height: 100vh; }
        .node { cursor: pointer; }
        .link { stroke: #30363d; stroke-opacity: 0.6; }
        text { fill: #c9d1d9; font-size: 10px; }
    </style>
</head>
<body>
    <svg></svg>
    <script>
        const nodes = ${JSON.stringify(structure.nodes)};
        const links = ${JSON.stringify(structure.edges.map(e => ({ source: e.source, target: e.target })))};
        
        const svg = d3.select("svg");
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(width / 2, height / 2));
        
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("class", "link");
        
        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => d.size)
            .attr("fill", d => d.color);
        
        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
            node.attr("cx", d => d.x).attr("cy", d => d.y);
        });
    </script>
</body>
</html>`;
    }

    private generateTreemapHTML(data: any, profile: DNAProfile): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Treemap: ${profile.name}</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body { margin: 0; background: #0d1117; }
        #plot { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="plot"></div>
    <script>
        Plotly.newPlot('plot', [{
            type: 'treemap',
            labels: ${JSON.stringify(data.labels)},
            parents: ${JSON.stringify(data.parents)},
            values: ${JSON.stringify(data.values)},
            marker: { colors: ${JSON.stringify(data.colors)} }
        }], {
            paper_bgcolor: '#0d1117'
        });
    </script>
</body>
</html>`;
    }

    private generateEvolutionHTML(evolution: EvolutionPoint[]): string {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Evolution Timeline</title>
    <style>
        body { margin: 0; padding: 40px; background: #0d1117; color: #c9d1d9; font-family: -apple-system, sans-serif; }
        .timeline { position: relative; padding: 20px 0; }
        .point { display: flex; margin-bottom: 20px; }
        .date { width: 120px; color: #8b949e; }
        .content { flex: 1; background: #161b22; padding: 15px; border-radius: 8px; border-left: 3px solid #58a6ff; }
    </style>
</head>
<body>
    <h1>🧬 Codebase Evolution</h1>
    <div class="timeline">
        ${evolution.map(e => `
            <div class="point">
                <div class="date">${new Date(e.date).toLocaleDateString()}</div>
                <div class="content">
                    <strong>${e.commitHash.substring(0, 7)}</strong>
                    <p>${e.summary}</p>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    private buildTreemapData(profile: DNAProfile): { labels: string[]; parents: string[]; values: number[]; colors: string[] } {
        const labels: string[] = [profile.name];
        const parents: string[] = [''];
        const values: number[] = [0];
        const colors: string[] = ['#161b22'];

        for (const [lang, count] of Object.entries(profile.metrics.languages)) {
            labels.push(lang);
            parents.push(profile.name);
            values.push(count);
            colors.push(COLORS[lang as keyof typeof COLORS] || COLORS.default);
        }

        return { labels, parents, values, colors };
    }

    private async scanForPatterns(
        projectPath: string,
        detectors: Record<string, RegExp[]>,
        patterns: DesignPattern[]
    ): Promise<void> {
        const ignorePatterns = ['node_modules', '.git'];

        const scan = async (dir: string) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (ignorePatterns.includes(entry.name)) continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await scan(fullPath);
                    } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
                        try {
                            const content = await fs.readFile(fullPath, 'utf-8');

                            for (const [patternName, regexes] of Object.entries(detectors)) {
                                for (const regex of regexes) {
                                    const matches = content.match(regex);
                                    if (matches && matches.length > 0) {
                                        let existing = patterns.find(p => p.name === patternName);
                                        if (!existing) {
                                            existing = { name: patternName, occurrences: 0, locations: [], confidence: 0.5 };
                                            patterns.push(existing);
                                        }
                                        existing.occurrences += matches.length;
                                        existing.locations.push(path.relative(projectPath, fullPath));
                                        existing.confidence = Math.min(0.95, existing.confidence + 0.1);
                                    }
                                }
                            }
                        } catch {
                            // Skip unreadable files
                        }
                    }
                }
            } catch {
                // Directory error
            }
        };

        await scan(projectPath);
    }

    private async detectParadigm(projectPath: string): Promise<'oop' | 'functional' | 'procedural' | 'mixed'> {
        let classCount = 0;
        let functionCount = 0;
        let arrowCount = 0;

        try {
            const scan = async (dir: string) => {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    if (entry.name === 'node_modules' || entry.name === '.git') continue;

                    const fullPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await scan(fullPath);
                    } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
                        try {
                            const content = await fs.readFile(fullPath, 'utf-8');
                            classCount += (content.match(/class\s+\w+/g) || []).length;
                            functionCount += (content.match(/function\s+\w+/g) || []).length;
                            arrowCount += (content.match(/=>\s*{/g) || []).length;
                        } catch {
                            // Skip
                        }
                    }
                }
            };

            await scan(projectPath);
        } catch {
            // Error scanning
        }

        const total = classCount + functionCount + arrowCount;
        if (total === 0) return 'procedural';

        if (classCount / total > 0.5) return 'oop';
        if ((arrowCount + functionCount) / total > 0.7) return 'functional';
        return 'mixed';
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    private async loadProfiles(): Promise<void> {
        try {
            const files = await fs.readdir(this.outputDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(this.outputDir, file), 'utf-8');
                    const profile = JSON.parse(content) as DNAProfile;
                    this.profiles.set(profile.id, profile);
                }
            }
        } catch {
            // Directory might not exist
        }
    }

    private async saveProfile(profile: DNAProfile): Promise<void> {
        const filePath = path.join(this.outputDir, `${profile.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(profile, null, 2));
    }

    private generateId(): string {
        return crypto.randomBytes(8).toString('hex');
    }
}

// Export singleton
export const codebaseDNAVisualizer = CodebaseDNAVisualizer.getInstance();
