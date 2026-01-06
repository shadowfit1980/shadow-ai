/**
 * Full-Stack Framework Manager
 * 
 * Unified support for Android, Dart/Flutter, Expo, Node Express,
 * Laravel, Java, .NET, Python Django, Go, React Native, and Genkit.
 */

import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type FrameworkType =
    | 'android'
    | 'flutter'
    | 'expo'
    | 'react-native'
    | 'express'
    | 'laravel'
    | 'django'
    | 'dotnet'
    | 'spring'
    | 'go'
    | 'genkit';

export interface FrameworkConfig {
    type: FrameworkType;
    name: string;
    version?: string;
    template?: string;
    options?: Record<string, any>;
}

export interface ProjectInfo {
    path: string;
    framework: FrameworkType;
    name: string;
    port?: number;
    status: 'created' | 'running' | 'stopped' | 'error';
    process?: ChildProcess;
}

export interface PreviewServer {
    url: string;
    port: number;
    framework: FrameworkType;
    process: ChildProcess;
}

// ============================================================================
// FRAMEWORK MANAGER
// ============================================================================

export class FrameworkManager extends EventEmitter {
    private static instance: FrameworkManager;
    private projects: Map<string, ProjectInfo> = new Map();
    private servers: Map<string, PreviewServer> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): FrameworkManager {
        if (!FrameworkManager.instance) {
            FrameworkManager.instance = new FrameworkManager();
        }
        return FrameworkManager.instance;
    }

    // ========================================================================
    // PROJECT CREATION
    // ========================================================================

    /**
     * Create a new project
     */
    async createProject(config: FrameworkConfig, targetPath: string): Promise<ProjectInfo> {
        this.emit('project:creating', { config, targetPath });

        const command = this.getCreateCommand(config);

        try {
            await fs.mkdir(targetPath, { recursive: true });
            await execAsync(command, { cwd: targetPath });

            const project: ProjectInfo = {
                path: targetPath,
                framework: config.type,
                name: config.name,
                status: 'created',
            };

            this.projects.set(targetPath, project);
            this.emit('project:created', project);

            return project;
        } catch (error: any) {
            throw new Error(`Failed to create ${config.type} project: ${error.message}`);
        }
    }

    private getCreateCommand(config: FrameworkConfig): string {
        const { type, name, template } = config;

        switch (type) {
            // Mobile
            case 'android':
                return `npx @anthropic-ai/create-android-app ${name}`;
            case 'flutter':
                return `flutter create ${template ? `-t ${template}` : ''} ${name}`;
            case 'expo':
                return `npx create-expo-app@latest ${name} ${template ? `--template ${template}` : ''}`;
            case 'react-native':
                return `npx react-native init ${name} ${template ? `--template ${template}` : ''}`;

            // Backend - Node
            case 'express':
                return `npx express-generator ${name} --no-view && cd ${name} && npm install`;

            // Backend - PHP
            case 'laravel':
                return `composer create-project laravel/laravel ${name}`;

            // Backend - Python
            case 'django':
                return `django-admin startproject ${name}`;

            // Backend - .NET
            case 'dotnet':
                return `dotnet new webapi -n ${name}`;

            // Backend - Java
            case 'spring':
                return `curl https://start.spring.io/starter.zip -d dependencies=web -d name=${name} -o ${name}.zip && unzip ${name}.zip`;

            // Backend - Go
            case 'go':
                return `mkdir ${name} && cd ${name} && go mod init ${name}`;

            // AI Framework
            case 'genkit':
                return `npx genkit init ${name}`;

            default:
                throw new Error(`Unknown framework: ${type}`);
        }
    }

    // ========================================================================
    // PROJECT COMMANDS
    // ========================================================================

    /**
     * Start development server
     */
    async startDevServer(projectPath: string): Promise<PreviewServer> {
        const project = this.projects.get(projectPath);
        if (!project) {
            // Try to detect framework
            const detected = await this.detectFramework(projectPath);
            if (!detected) throw new Error('Project not found and framework not detected');
            this.projects.set(projectPath, {
                path: projectPath,
                framework: detected,
                name: path.basename(projectPath),
                status: 'created',
            });
        }

        const framework = this.projects.get(projectPath)!.framework;
        const { command, port } = this.getDevCommand(framework);

        const child = spawn(command.split(' ')[0], command.split(' ').slice(1), {
            cwd: projectPath,
            shell: true,
            stdio: 'pipe',
        });

        const server: PreviewServer = {
            url: `http://localhost:${port}`,
            port,
            framework,
            process: child,
        };

        this.servers.set(projectPath, server);
        this.projects.get(projectPath)!.status = 'running';
        this.projects.get(projectPath)!.port = port;

        this.emit('server:started', { projectPath, url: server.url });

        return server;
    }

    private getDevCommand(framework: FrameworkType): { command: string; port: number } {
        switch (framework) {
            case 'android':
                return { command: 'npx react-native start', port: 8081 };
            case 'flutter':
                return { command: 'flutter run -d chrome', port: 8080 };
            case 'expo':
                return { command: 'npx expo start --web', port: 8081 };
            case 'react-native':
                return { command: 'npx react-native start', port: 8081 };
            case 'express':
                return { command: 'npm run dev', port: 3000 };
            case 'laravel':
                return { command: 'php artisan serve', port: 8000 };
            case 'django':
                return { command: 'python manage.py runserver', port: 8000 };
            case 'dotnet':
                return { command: 'dotnet run', port: 5000 };
            case 'spring':
                return { command: './mvnw spring-boot:run', port: 8080 };
            case 'go':
                return { command: 'go run .', port: 8080 };
            case 'genkit':
                return { command: 'npx genkit start', port: 4000 };
            default:
                return { command: 'npm run dev', port: 3000 };
        }
    }

    /**
     * Stop development server
     */
    async stopDevServer(projectPath: string): Promise<boolean> {
        const server = this.servers.get(projectPath);
        if (!server) return false;

        server.process.kill();
        this.servers.delete(projectPath);

        const project = this.projects.get(projectPath);
        if (project) project.status = 'stopped';

        this.emit('server:stopped', { projectPath });
        return true;
    }

    /**
     * Build project
     */
    async buildProject(projectPath: string): Promise<string> {
        const project = this.projects.get(projectPath);
        const framework = project?.framework || await this.detectFramework(projectPath);
        if (!framework) throw new Error('Unknown project framework');

        const command = this.getBuildCommand(framework);
        const { stdout } = await execAsync(command, { cwd: projectPath });

        this.emit('project:built', { projectPath, framework });
        return stdout;
    }

    private getBuildCommand(framework: FrameworkType): string {
        switch (framework) {
            case 'flutter':
                return 'flutter build apk';
            case 'expo':
                return 'npx expo export';
            case 'react-native':
                return 'npx react-native build-android --mode=release';
            case 'express':
            case 'genkit':
                return 'npm run build';
            case 'laravel':
                return 'composer install --optimize-autoloader && npm run build';
            case 'django':
                return 'python manage.py collectstatic --noinput';
            case 'dotnet':
                return 'dotnet publish -c Release';
            case 'spring':
                return './mvnw package';
            case 'go':
                return 'go build -o app .';
            default:
                return 'npm run build';
        }
    }

    // ========================================================================
    // FRAMEWORK DETECTION
    // ========================================================================

    /**
     * Detect framework from project files
     */
    async detectFramework(projectPath: string): Promise<FrameworkType | null> {
        try {
            const files = await fs.readdir(projectPath);

            // Flutter
            if (files.includes('pubspec.yaml')) return 'flutter';

            // Expo
            if (files.includes('app.json')) {
                const appJson = JSON.parse(await fs.readFile(path.join(projectPath, 'app.json'), 'utf-8'));
                if (appJson.expo) return 'expo';
            }

            // React Native
            if (files.includes('metro.config.js') || files.includes('react-native.config.js')) {
                return 'react-native';
            }

            // Laravel
            if (files.includes('artisan')) return 'laravel';

            // Django
            if (files.includes('manage.py')) return 'django';

            // .NET
            if (files.some(f => f.endsWith('.csproj'))) return 'dotnet';

            // Spring Boot
            if (files.includes('pom.xml') || files.includes('build.gradle')) return 'spring';

            // Go
            if (files.includes('go.mod')) return 'go';

            // Genkit
            if (files.includes('genkit.config.ts')) return 'genkit';

            // Express/Node (fallback for package.json with express)
            if (files.includes('package.json')) {
                const pkg = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
                if (pkg.dependencies?.express) return 'express';
            }

            return null;
        } catch {
            return null;
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Check if framework CLI is available
     */
    async checkFrameworkAvailability(framework: FrameworkType): Promise<boolean> {
        const checks: Record<FrameworkType, string> = {
            android: 'adb --version',
            flutter: 'flutter --version',
            expo: 'npx expo --version',
            'react-native': 'npx react-native --version',
            express: 'node --version',
            laravel: 'composer --version',
            django: 'python -c "import django"',
            dotnet: 'dotnet --version',
            spring: 'java --version',
            go: 'go version',
            genkit: 'npx genkit --version',
        };

        try {
            await execAsync(checks[framework]);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get all running servers
     */
    getRunningServers(): PreviewServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get all projects
     */
    getProjects(): ProjectInfo[] {
        return Array.from(this.projects.values());
    }

    /**
     * Stop all servers
     */
    async stopAllServers(): Promise<void> {
        for (const path of this.servers.keys()) {
            await this.stopDevServer(path);
        }
    }
}

// Export singleton
export const frameworkManager = FrameworkManager.getInstance();
