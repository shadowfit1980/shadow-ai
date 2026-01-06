/**
 * Deployment Manager
 * 
 * One-click deployment to popular platforms.
 * Inspired by Lovable, Bolt.new, and Firebase Studio.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type DeploymentProvider =
    | 'vercel'
    | 'netlify'
    | 'firebase'
    | 'railway'
    | 'render'
    | 'github-pages';

export interface DeploymentConfig {
    provider: DeploymentProvider;
    projectPath: string;
    projectName?: string;
    environment?: Record<string, string>;
    production?: boolean;
}

export interface DeploymentResult {
    success: boolean;
    provider: DeploymentProvider;
    url?: string;
    deploymentId?: string;
    logs: string[];
    error?: string;
    duration: number;
}

export interface ProviderStatus {
    provider: DeploymentProvider;
    installed: boolean;
    authenticated: boolean;
    version?: string;
}

// ============================================================================
// DEPLOYMENT MANAGER
// ============================================================================

export class DeploymentManager extends EventEmitter {
    private static instance: DeploymentManager;

    private constructor() {
        super();
    }

    static getInstance(): DeploymentManager {
        if (!DeploymentManager.instance) {
            DeploymentManager.instance = new DeploymentManager();
        }
        return DeploymentManager.instance;
    }

    // ========================================================================
    // PROVIDER STATUS
    // ========================================================================

    /**
     * Check if a deployment CLI is installed and authenticated
     */
    async checkProvider(provider: DeploymentProvider): Promise<ProviderStatus> {
        const commands: Record<DeploymentProvider, { check: string; auth: string }> = {
            'vercel': { check: 'vercel --version', auth: 'vercel whoami' },
            'netlify': { check: 'netlify --version', auth: 'netlify status' },
            'firebase': { check: 'firebase --version', auth: 'firebase login:list' },
            'railway': { check: 'railway --version', auth: 'railway whoami' },
            'render': { check: 'render --version', auth: 'render whoami' },
            'github-pages': { check: 'gh --version', auth: 'gh auth status' },
        };

        const status: ProviderStatus = {
            provider,
            installed: false,
            authenticated: false,
        };

        try {
            const { stdout } = await execAsync(commands[provider].check);
            status.installed = true;
            status.version = stdout.trim().split('\n')[0];

            try {
                await execAsync(commands[provider].auth);
                status.authenticated = true;
            } catch {
                // Not authenticated
            }
        } catch {
            // Not installed
        }

        return status;
    }

    /**
     * Check all providers
     */
    async checkAllProviders(): Promise<ProviderStatus[]> {
        const providers: DeploymentProvider[] = [
            'vercel', 'netlify', 'firebase', 'railway', 'render', 'github-pages'
        ];
        return Promise.all(providers.map(p => this.checkProvider(p)));
    }

    // ========================================================================
    // DEPLOYMENT
    // ========================================================================

    /**
     * Deploy project to specified provider
     */
    async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
        const startTime = Date.now();
        const logs: string[] = [];

        this.emit('deploy:started', { provider: config.provider, projectPath: config.projectPath });

        try {
            let result: DeploymentResult;

            switch (config.provider) {
                case 'vercel':
                    result = await this.deployToVercel(config, logs);
                    break;
                case 'netlify':
                    result = await this.deployToNetlify(config, logs);
                    break;
                case 'firebase':
                    result = await this.deployToFirebase(config, logs);
                    break;
                case 'railway':
                    result = await this.deployToRailway(config, logs);
                    break;
                case 'github-pages':
                    result = await this.deployToGitHubPages(config, logs);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${config.provider}`);
            }

            result.duration = Date.now() - startTime;
            this.emit('deploy:completed', result);
            return result;

        } catch (error: any) {
            const result: DeploymentResult = {
                success: false,
                provider: config.provider,
                logs,
                error: error.message,
                duration: Date.now() - startTime,
            };
            this.emit('deploy:failed', result);
            return result;
        }
    }

    // ========================================================================
    // PROVIDER IMPLEMENTATIONS
    // ========================================================================

    private async deployToVercel(config: DeploymentConfig, logs: string[]): Promise<DeploymentResult> {
        const { projectPath, production = false, environment = {} } = config;

        // Build environment variable flags
        const envFlags = Object.entries(environment)
            .map(([key, value]) => `-e ${key}="${value}"`)
            .join(' ');

        const prodFlag = production ? '--prod' : '';
        const cmd = `vercel ${prodFlag} ${envFlags} --yes`;

        logs.push(`Running: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd, { cwd: projectPath });
        logs.push(stdout);
        if (stderr) logs.push(stderr);

        // Extract URL from output
        const urlMatch = stdout.match(/https:\/\/[^\s]+\.vercel\.app/);

        return {
            success: true,
            provider: 'vercel',
            url: urlMatch?.[0],
            logs,
            duration: 0,
        };
    }

    private async deployToNetlify(config: DeploymentConfig, logs: string[]): Promise<DeploymentResult> {
        const { projectPath, production = false } = config;

        // Check for netlify.toml or create one
        const tomlPath = join(projectPath, 'netlify.toml');
        if (!existsSync(tomlPath)) {
            const tomlContent = `[build]
  publish = "dist"
  command = "npm run build"
`;
            writeFileSync(tomlPath, tomlContent);
            logs.push('Created netlify.toml');
        }

        const prodFlag = production ? '--prod' : '';
        const cmd = `netlify deploy ${prodFlag} --dir=dist`;

        logs.push(`Running: ${cmd}`);
        const { stdout, stderr } = await execAsync(cmd, { cwd: projectPath });
        logs.push(stdout);
        if (stderr) logs.push(stderr);

        const urlMatch = stdout.match(/https:\/\/[^\s]+\.netlify\.app/);

        return {
            success: true,
            provider: 'netlify',
            url: urlMatch?.[0],
            logs,
            duration: 0,
        };
    }

    private async deployToFirebase(config: DeploymentConfig, logs: string[]): Promise<DeploymentResult> {
        const { projectPath, projectName } = config;

        // Check for firebase.json or create one
        const firebasePath = join(projectPath, 'firebase.json');
        if (!existsSync(firebasePath)) {
            const firebaseConfig = {
                hosting: {
                    public: 'dist',
                    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
                    rewrites: [{ source: '**', destination: '/index.html' }],
                },
            };
            writeFileSync(firebasePath, JSON.stringify(firebaseConfig, null, 2));
            logs.push('Created firebase.json');
        }

        const cmd = `firebase deploy --only hosting`;
        logs.push(`Running: ${cmd}`);

        const { stdout, stderr } = await execAsync(cmd, { cwd: projectPath });
        logs.push(stdout);
        if (stderr) logs.push(stderr);

        const urlMatch = stdout.match(/https:\/\/[^\s]+\.web\.app/);

        return {
            success: true,
            provider: 'firebase',
            url: urlMatch?.[0],
            logs,
            duration: 0,
        };
    }

    private async deployToRailway(config: DeploymentConfig, logs: string[]): Promise<DeploymentResult> {
        const { projectPath } = config;

        const cmd = 'railway up';
        logs.push(`Running: ${cmd}`);

        const { stdout, stderr } = await execAsync(cmd, { cwd: projectPath });
        logs.push(stdout);
        if (stderr) logs.push(stderr);

        const urlMatch = stdout.match(/https:\/\/[^\s]+\.railway\.app/);

        return {
            success: true,
            provider: 'railway',
            url: urlMatch?.[0],
            logs,
            duration: 0,
        };
    }

    private async deployToGitHubPages(config: DeploymentConfig, logs: string[]): Promise<DeploymentResult> {
        const { projectPath } = config;

        // Build the project first
        logs.push('Building project...');
        await execAsync('npm run build', { cwd: projectPath });

        // Deploy using gh-pages or git
        const cmd = 'npx gh-pages -d dist';
        logs.push(`Running: ${cmd}`);

        const { stdout, stderr } = await execAsync(cmd, { cwd: projectPath });
        logs.push(stdout);
        if (stderr) logs.push(stderr);

        // Get repo URL for pages
        const { stdout: remoteUrl } = await execAsync('git remote get-url origin', { cwd: projectPath });
        const repoMatch = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
        const pagesUrl = repoMatch
            ? `https://${repoMatch[1].replace('/', '.github.io/')}`
            : undefined;

        return {
            success: true,
            provider: 'github-pages',
            url: pagesUrl,
            logs,
            duration: 0,
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Install deployment CLI for a provider
     */
    async installProvider(provider: DeploymentProvider): Promise<boolean> {
        const installCommands: Record<DeploymentProvider, string> = {
            'vercel': 'npm install -g vercel',
            'netlify': 'npm install -g netlify-cli',
            'firebase': 'npm install -g firebase-tools',
            'railway': 'npm install -g @railway/cli',
            'render': 'npm install -g @render/cli',
            'github-pages': 'npm install -g gh',
        };

        try {
            await execAsync(installCommands[provider]);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Login to a provider
     */
    async loginProvider(provider: DeploymentProvider): Promise<boolean> {
        const loginCommands: Record<DeploymentProvider, string> = {
            'vercel': 'vercel login',
            'netlify': 'netlify login',
            'firebase': 'firebase login',
            'railway': 'railway login',
            'render': 'render login',
            'github-pages': 'gh auth login',
        };

        try {
            await execAsync(loginCommands[provider]);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get recommended provider based on project type
     */
    getRecommendedProvider(projectPath: string): DeploymentProvider {
        const pkgPath = join(projectPath, 'package.json');

        if (existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

                // Next.js -> Vercel
                if (pkg.dependencies?.next) return 'vercel';

                // Static sites -> Netlify
                if (pkg.devDependencies?.vite) return 'netlify';

                // Backend -> Railway
                if (pkg.dependencies?.express) return 'railway';

            } catch {
                // Ignore parse errors
            }
        }

        // Check for Python (FastAPI/Flask)
        if (existsSync(join(projectPath, 'requirements.txt'))) {
            return 'railway';
        }

        return 'vercel'; // Default
    }
}

// Export singleton
export const deploymentManager = DeploymentManager.getInstance();
