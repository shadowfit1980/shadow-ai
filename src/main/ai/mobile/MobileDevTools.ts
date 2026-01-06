/**
 * Mobile Development Tools
 * 
 * Comprehensive support for JavaScript, TypeScript, Python, C, and mobile
 * development with React Native, Flutter, and native iOS/Android.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type MobileFramework = 'react-native' | 'flutter' | 'ionic' | 'capacitor' | 'expo' | 'native-ios' | 'native-android';
export type Language = 'javascript' | 'typescript' | 'python' | 'c' | 'cpp' | 'swift' | 'kotlin' | 'dart';

export interface MobileProject {
    name: string;
    framework: MobileFramework;
    path: string;
    platforms: ('ios' | 'android' | 'web')[];
    dependencies: string[];
}

export interface LanguageRuntime {
    name: string;
    version: string;
    path: string;
    available: boolean;
}

export interface CodeSnippet {
    name: string;
    language: Language;
    code: string;
    description: string;
}

// ============================================================================
// MOBILE DEVELOPMENT TOOLS
// ============================================================================

export class MobileDevTools extends EventEmitter {
    private static instance: MobileDevTools;
    private modelManager: ModelManager;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): MobileDevTools {
        if (!MobileDevTools.instance) {
            MobileDevTools.instance = new MobileDevTools();
        }
        return MobileDevTools.instance;
    }

    // ========================================================================
    // LANGUAGE RUNTIMES
    // ========================================================================

    /**
     * Check available language runtimes
     */
    async checkRuntimes(): Promise<LanguageRuntime[]> {
        const runtimes: LanguageRuntime[] = [];

        // Node.js
        try {
            const { stdout } = await execAsync('node --version');
            runtimes.push({ name: 'node', version: stdout.trim(), path: 'node', available: true });
        } catch {
            runtimes.push({ name: 'node', version: '', path: '', available: false });
        }

        // Python
        try {
            const { stdout } = await execAsync('python3 --version');
            runtimes.push({ name: 'python', version: stdout.trim(), path: 'python3', available: true });
        } catch {
            runtimes.push({ name: 'python', version: '', path: '', available: false });
        }

        // C/C++ (GCC)
        try {
            const { stdout } = await execAsync('gcc --version');
            const version = stdout.split('\n')[0];
            runtimes.push({ name: 'gcc', version, path: 'gcc', available: true });
        } catch {
            runtimes.push({ name: 'gcc', version: '', path: '', available: false });
        }

        // Flutter
        try {
            const { stdout } = await execAsync('flutter --version');
            const version = stdout.split('\n')[0];
            runtimes.push({ name: 'flutter', version, path: 'flutter', available: true });
        } catch {
            runtimes.push({ name: 'flutter', version: '', path: '', available: false });
        }

        // React Native CLI
        try {
            const { stdout } = await execAsync('npx react-native --version');
            runtimes.push({ name: 'react-native', version: stdout.trim(), path: 'npx react-native', available: true });
        } catch {
            runtimes.push({ name: 'react-native', version: '', path: '', available: false });
        }

        return runtimes;
    }

    // ========================================================================
    // PROJECT SCAFFOLDING
    // ========================================================================

    /**
     * Create a new mobile project
     */
    async createProject(options: {
        name: string;
        framework: MobileFramework;
        path: string;
        typescript?: boolean;
    }): Promise<{ success: boolean; project?: MobileProject; error?: string }> {
        const { name, framework, path: projectPath, typescript = true } = options;

        this.emit('project:creating', { name, framework });

        try {
            let command: string;

            switch (framework) {
                case 'expo':
                    command = `npx create-expo-app@latest ${name} ${typescript ? '-t expo-template-blank-typescript' : ''}`;
                    break;
                case 'react-native':
                    command = `npx react-native@latest init ${name} ${typescript ? '--template react-native-template-typescript' : ''}`;
                    break;
                case 'flutter':
                    command = `flutter create ${name}`;
                    break;
                case 'ionic':
                    command = `npx @ionic/cli start ${name} blank ${typescript ? '--type=react' : ''}`;
                    break;
                case 'capacitor':
                    command = `npm init @capacitor/app ${name}`;
                    break;
                default:
                    return { success: false, error: `Unknown framework: ${framework}` };
            }

            await execAsync(command, { cwd: projectPath });

            const project: MobileProject = {
                name,
                framework,
                path: path.join(projectPath, name),
                platforms: ['ios', 'android'],
                dependencies: [],
            };

            this.emit('project:created', project);
            return { success: true, project };

        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    /**
     * Generate mobile component code
     */
    async generateComponent(options: {
        name: string;
        framework: MobileFramework;
        type: 'screen' | 'component' | 'hook' | 'service';
        features?: string[];
    }): Promise<string> {
        const { name, framework, type, features = [] } = options;

        const prompt = `Generate a ${type} for ${framework} named "${name}".
Features: ${features.join(', ') || 'basic functionality'}

Requirements:
1. Use TypeScript
2. Include proper types
3. Follow best practices
4. Add comments

Return only the code.`;

        return this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);
    }

    /**
     * Generate API integration code
     */
    async generateAPIClient(options: {
        language: Language;
        baseUrl: string;
        endpoints: Array<{ method: string; path: string; name: string }>;
    }): Promise<string> {
        const { language, baseUrl, endpoints } = options;

        const prompt = `Generate an API client in ${language}.
Base URL: ${baseUrl}
Endpoints:
${endpoints.map(e => `- ${e.method} ${e.path} → ${e.name}`).join('\n')}

Requirements:
1. Proper error handling
2. TypeScript types (if applicable)
3. Async/await pattern
4. Request/response interceptors

Return only the code.`;

        return this.modelManager.chat([
            { role: 'user', content: prompt, timestamp: new Date() }
        ]);
    }

    // ========================================================================
    // LANGUAGE-SPECIFIC UTILITIES
    // ========================================================================

    /**
     * Run JavaScript/TypeScript code
     */
    async runJavaScript(code: string, useTs = false): Promise<{ output: string; error?: string }> {
        const ext = useTs ? 'ts' : 'js';
        const tmpFile = `/tmp/shadow_run_${Date.now()}.${ext}`;

        try {
            await fs.writeFile(tmpFile, code);
            const runner = useTs ? 'npx tsx' : 'node';
            const { stdout, stderr } = await execAsync(`${runner} ${tmpFile}`);
            await fs.unlink(tmpFile);
            return { output: stdout, error: stderr || undefined };
        } catch (error: any) {
            return { output: '', error: error.message };
        }
    }

    /**
     * Run Python code
     */
    async runPython(code: string): Promise<{ output: string; error?: string }> {
        const tmpFile = `/tmp/shadow_run_${Date.now()}.py`;

        try {
            await fs.writeFile(tmpFile, code);
            const { stdout, stderr } = await execAsync(`python3 ${tmpFile}`);
            await fs.unlink(tmpFile);
            return { output: stdout, error: stderr || undefined };
        } catch (error: any) {
            return { output: '', error: error.message };
        }
    }

    /**
     * Compile and run C code
     */
    async runC(code: string): Promise<{ output: string; error?: string }> {
        const tmpFile = `/tmp/shadow_run_${Date.now()}.c`;
        const outFile = `/tmp/shadow_run_${Date.now()}`;

        try {
            await fs.writeFile(tmpFile, code);
            await execAsync(`gcc ${tmpFile} -o ${outFile}`);
            const { stdout, stderr } = await execAsync(outFile);
            await fs.unlink(tmpFile);
            await fs.unlink(outFile);
            return { output: stdout, error: stderr || undefined };
        } catch (error: any) {
            return { output: '', error: error.message };
        }
    }

    // ========================================================================
    // CODE SNIPPETS LIBRARY
    // ========================================================================

    /**
     * Get common code snippets
     */
    getSnippets(language: Language): CodeSnippet[] {
        const snippets: Record<Language, CodeSnippet[]> = {
            javascript: [
                {
                    name: 'Fetch API', language: 'javascript', description: 'HTTP request with fetch',
                    code: `const response = await fetch(url);\nconst data = await response.json();`
                },
                {
                    name: 'Event Handler', language: 'javascript', description: 'Event listener pattern',
                    code: `element.addEventListener('click', (e) => {\n  console.log(e.target);\n});`
                },
            ],
            typescript: [
                {
                    name: 'Interface', language: 'typescript', description: 'TypeScript interface',
                    code: `interface User {\n  id: string;\n  name: string;\n  email: string;\n}`
                },
                {
                    name: 'Generic Function', language: 'typescript', description: 'Generic async function',
                    code: `async function fetchData<T>(url: string): Promise<T> {\n  const res = await fetch(url);\n  return res.json();\n}`
                },
            ],
            python: [
                {
                    name: 'HTTP Request', language: 'python', description: 'Requests library',
                    code: `import requests\nresponse = requests.get(url)\ndata = response.json()`
                },
                {
                    name: 'Class Definition', language: 'python', description: 'Python class',
                    code: `class User:\n    def __init__(self, name: str):\n        self.name = name`
                },
            ],
            c: [
                {
                    name: 'Main Function', language: 'c', description: 'C main entry point',
                    code: `#include <stdio.h>\nint main() {\n    printf("Hello\\n");\n    return 0;\n}`
                },
            ],
            cpp: [],
            swift: [],
            kotlin: [],
            dart: [],
        };

        return snippets[language] || [];
    }

    // ========================================================================
    // BUILD & RUN
    // ========================================================================

    /**
     * Build mobile project
     */
    async buildProject(projectPath: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
        try {
            const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));

            // Detect framework
            if (packageJson.dependencies?.expo) {
                await execAsync(`npx expo build:${platform}`, { cwd: projectPath });
            } else if (packageJson.dependencies?.['react-native']) {
                if (platform === 'android') {
                    await execAsync('npx react-native run-android --variant=release', { cwd: projectPath });
                } else {
                    await execAsync('npx react-native run-ios --configuration Release', { cwd: projectPath });
                }
            }

            this.emit('project:built', { path: projectPath, platform });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Start development server
     */
    async startDevServer(projectPath: string): Promise<{ success: boolean; url?: string }> {
        try {
            const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));

            let command = 'npm start';
            let port = 3000;

            if (packageJson.dependencies?.expo) {
                command = 'npx expo start';
                port = 19000;
            }

            exec(command, { cwd: projectPath });

            return { success: true, url: `http://localhost:${port}` };
        } catch {
            return { success: false };
        }
    }
}

// Export singleton
export const mobileDevTools = MobileDevTools.getInstance();
