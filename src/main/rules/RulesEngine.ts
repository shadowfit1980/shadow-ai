/**
 * Rules Engine - Project-Specific Instructions
 * Parse and apply .mdc rule files like Cursor
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProjectRule {
    filePath: string;
    description: string;
    globs: string[];
    instructions: string[];
    files: string[];
    rawContent: string;
}

export interface RulesContext {
    currentFile?: string;
    projectPath: string;
    activeRules: ProjectRule[];
}

/**
 * RulesEngine
 * Parses .mdc files and applies project-specific AI instructions
 */
export class RulesEngine extends EventEmitter {
    private static instance: RulesEngine;
    private rulesCache: Map<string, ProjectRule[]> = new Map();
    private memoriesCache: Map<string, string[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): RulesEngine {
        if (!RulesEngine.instance) {
            RulesEngine.instance = new RulesEngine();
        }
        return RulesEngine.instance;
    }

    /**
     * Load all rules from a project directory
     */
    async loadRulesFromProject(projectPath: string): Promise<ProjectRule[]> {
        // Check cache first
        if (this.rulesCache.has(projectPath)) {
            return this.rulesCache.get(projectPath)!;
        }

        const rules: ProjectRule[] = [];

        try {
            // Find all .mdc files in .cursor/rules or project root
            const rulesDir = path.join(projectPath, '.cursor', 'rules');
            const rootRulesDir = path.join(projectPath, '.rules');

            const searchDirs = [rulesDir, rootRulesDir, projectPath];

            for (const dir of searchDirs) {
                try {
                    const files = await this.findMDCFiles(dir);
                    for (const file of files) {
                        const rule = await this.parseRuleFile(file);
                        if (rule) {
                            rules.push(rule);
                        }
                    }
                } catch {
                    // Directory doesn't exist, skip
                }
            }

            this.rulesCache.set(projectPath, rules);
            this.emit('rulesLoaded', { projectPath, count: rules.length });
        } catch (error) {
            console.error('Error loading rules:', error);
        }

        return rules;
    }

    /**
     * Find all .mdc files in a directory
     */
    private async findMDCFiles(dir: string, depth = 2): Promise<string[]> {
        const files: string[] = [];

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isFile() && entry.name.endsWith('.mdc')) {
                    files.push(fullPath);
                } else if (entry.isDirectory() && depth > 0 && !entry.name.startsWith('.')) {
                    const subFiles = await this.findMDCFiles(fullPath, depth - 1);
                    files.push(...subFiles);
                }
            }
        } catch {
            // Directory not accessible
        }

        return files;
    }

    /**
     * Parse a single .mdc rule file
     */
    async parseRuleFile(filePath: string): Promise<ProjectRule | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parseRuleContent(content, filePath);
        } catch {
            return null;
        }
    }

    /**
     * Parse rule content from a string
     */
    parseRuleContent(content: string, filePath: string = ''): ProjectRule | null {
        // Parse YAML frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

        if (!frontmatterMatch) {
            // No frontmatter, treat entire content as instructions
            return {
                filePath,
                description: path.basename(filePath, '.mdc'),
                globs: ['**/*'],
                instructions: this.extractInstructions(content),
                files: [],
                rawContent: content,
            };
        }

        const [, frontmatter, body] = frontmatterMatch;

        // Parse frontmatter
        const description = this.extractYamlValue(frontmatter, 'Description') || '';
        const globsStr = this.extractYamlValue(frontmatter, 'Globs') || '**/*';
        const globs = globsStr.split(',').map(g => g.trim()).filter(Boolean);

        // Extract @file references
        const fileRefs = body.match(/@file\s+([^\s]+)/g) || [];
        const files = fileRefs.map(ref => ref.replace('@file', '').trim());

        return {
            filePath,
            description,
            globs,
            instructions: this.extractInstructions(body),
            files,
            rawContent: content,
        };
    }

    /**
     * Extract a YAML value from frontmatter
     */
    private extractYamlValue(yaml: string, key: string): string | null {
        const match = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'));
        return match ? match[1].trim() : null;
    }

    /**
     * Extract instruction lines from markdown content
     */
    private extractInstructions(content: string): string[] {
        const lines: string[] = [];
        const instructionsMatch = content.match(/##\s*Instructions[:\s]*([\s\S]*?)(?=##|$)/i);

        if (instructionsMatch) {
            const instructionLines = instructionsMatch[1].split('\n');
            for (const line of instructionLines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    lines.push(trimmed.replace(/^[-*]\s*/, ''));
                }
            }
        }

        return lines;
    }

    /**
     * Get rules applicable to a specific file
     */
    async getRulesForFile(projectPath: string, filePath: string): Promise<ProjectRule[]> {
        const allRules = await this.loadRulesFromProject(projectPath);
        const relativePath = path.relative(projectPath, filePath);

        return allRules.filter(rule => {
            return rule.globs.some(glob => this.matchGlob(relativePath, glob));
        });
    }

    /**
     * Simple glob matching
     */
    private matchGlob(filePath: string, glob: string): boolean {
        // Convert glob to regex
        const regexStr = glob
            .replace(/\*\*/g, '<<<DOUBLE>>>')
            .replace(/\*/g, '[^/]*')
            .replace(/<<<DOUBLE>>>/g, '.*')
            .replace(/\?/g, '.');

        const regex = new RegExp(`^${regexStr}$`);
        return regex.test(filePath);
    }

    /**
     * Apply rules to AI prompt context
     */
    async applyRulesToContext(
        projectPath: string,
        currentFile: string | undefined,
        basePrompt: string
    ): Promise<string> {
        const rules = currentFile
            ? await this.getRulesForFile(projectPath, currentFile)
            : await this.loadRulesFromProject(projectPath);

        if (rules.length === 0) {
            return basePrompt;
        }

        // Build rules section
        const rulesSection = rules.map(rule => {
            const header = rule.description ? `## ${rule.description}\n` : '';
            const instructions = rule.instructions.map(i => `- ${i}`).join('\n');
            return `${header}${instructions}`;
        }).join('\n\n');

        return `${basePrompt}\n\n# Project Rules\n\n${rulesSection}`;
    }

    /**
     * Add a memory (persistent instruction)
     */
    async addMemory(projectPath: string, memory: string): Promise<void> {
        const memories = this.memoriesCache.get(projectPath) || [];
        memories.push(memory);
        this.memoriesCache.set(projectPath, memories);

        // Persist to .cursor/memories.md
        const memoriesPath = path.join(projectPath, '.cursor', 'memories.md');
        try {
            await fs.mkdir(path.dirname(memoriesPath), { recursive: true });
            await fs.appendFile(memoriesPath, `\n- ${memory}`);
        } catch {
            // Ignore write errors
        }
    }

    /**
     * Get all memories for a project
     */
    async getMemories(projectPath: string): Promise<string[]> {
        if (this.memoriesCache.has(projectPath)) {
            return this.memoriesCache.get(projectPath)!;
        }

        const memoriesPath = path.join(projectPath, '.cursor', 'memories.md');
        try {
            const content = await fs.readFile(memoriesPath, 'utf-8');
            const memories = content.split('\n')
                .filter(l => l.trim().startsWith('-'))
                .map(l => l.replace(/^[-*]\s*/, '').trim());
            this.memoriesCache.set(projectPath, memories);
            return memories;
        } catch {
            return [];
        }
    }

    /**
     * Clear rules cache
     */
    clearCache(projectPath?: string): void {
        if (projectPath) {
            this.rulesCache.delete(projectPath);
            this.memoriesCache.delete(projectPath);
        } else {
            this.rulesCache.clear();
            this.memoriesCache.clear();
        }
    }

    /**
     * Create a new rule file
     */
    async createRuleFile(
        projectPath: string,
        name: string,
        options: {
            description: string;
            globs: string[];
            instructions: string[];
        }
    ): Promise<string> {
        const rulesDir = path.join(projectPath, '.cursor', 'rules');
        await fs.mkdir(rulesDir, { recursive: true });

        const filePath = path.join(rulesDir, `${name}.mdc`);

        const content = `---
Description: ${options.description}
Globs: ${options.globs.join(', ')}
---

# ${name}

## Instructions

${options.instructions.map(i => `- ${i}`).join('\n')}
`;

        await fs.writeFile(filePath, content);
        this.clearCache(projectPath);

        return filePath;
    }
}

// Singleton getter
export function getRulesEngine(): RulesEngine {
    return RulesEngine.getInstance();
}
