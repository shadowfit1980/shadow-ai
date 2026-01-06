/**
 * Free Cloud Hosting Manager
 * 
 * Deploy websites and apps to free hosting services:
 * Vercel, Netlify, Railway, Fly.io, Render, Firebase Hosting.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export type HostingProvider = 'vercel' | 'netlify' | 'railway' | 'fly' | 'render' | 'firebase' | 'surge' | 'github-pages';

export interface DeploymentConfig {
    provider: HostingProvider;
    projectPath: string;
    name?: string;
    env?: Record<string, string>;
    buildCommand?: string;
    outputDir?: string;
    region?: string;
}

export interface Deployment {
    id: string;
    provider: HostingProvider;
    url: string;
    status: 'pending' | 'building' | 'deployed' | 'failed';
    projectPath: string;
    createdAt: Date;
    logs?: string[];
}

export interface ProviderInfo {
    name: HostingProvider;
    displayName: string;
    free: boolean;
    features: string[];
    limits: string;
    setupCommand: string;
}

// ============================================================================
// CLOUD HOSTING MANAGER
// ============================================================================

export class CloudHostingManager extends EventEmitter {
    private static instance: CloudHostingManager;
    private deployments: Map<string, Deployment> = new Map();

    private providers: ProviderInfo[] = [
        {
            name: 'vercel',
            displayName: 'Vercel',
            free: true,
            features: ['Auto SSL', 'Edge Functions', 'Analytics', 'Preview Deploys'],
            limits: '100GB bandwidth/month, Serverless functions',
            setupCommand: 'npm i -g vercel',
        },
        {
            name: 'netlify',
            displayName: 'Netlify',
            free: true,
            features: ['Auto SSL', 'Forms', 'Functions', 'Identity'],
            limits: '100GB bandwidth/month, 125K serverless requests',
            setupCommand: 'npm i -g netlify-cli',
        },
        {
            name: 'railway',
            displayName: 'Railway',
            free: true,
            features: ['Databases', 'Auto Deploy', 'Logs', 'Metrics'],
            limits: '$5 free credits/month, Hobby plan',
            setupCommand: 'npm i -g @railway/cli',
        },
        {
            name: 'fly',
            displayName: 'Fly.io',
            free: true,
            features: ['Global Edge', 'Machines', 'Postgres', 'Redis'],
            limits: '3 shared VMs, 160GB bandwidth',
            setupCommand: 'curl -L https://fly.io/install.sh | sh',
        },
        {
            name: 'render',
            displayName: 'Render',
            free: true,
            features: ['Auto SSL', 'Global CDN', 'Databases', 'Cron Jobs'],
            limits: '750 hours/month, Spun down when idle',
            setupCommand: 'npm i -g render',
        },
        {
            name: 'firebase',
            displayName: 'Firebase Hosting',
            free: true,
            features: ['CDN', 'SSL', 'Cloud Functions', 'Preview Channels'],
            limits: '10GB storage, 360MB/day transfer',
            setupCommand: 'npm i -g firebase-tools',
        },
        {
            name: 'surge',
            displayName: 'Surge.sh',
            free: true,
            features: ['Instant Deploy', 'Custom Domains', 'SSL'],
            limits: 'Unlimited projects, Basic features',
            setupCommand: 'npm i -g surge',
        },
        {
            name: 'github-pages',
            displayName: 'GitHub Pages',
            free: true,
            features: ['GitHub Integration', 'Custom Domains', 'Actions'],
            limits: '100GB bandwidth/month, 1GB storage',
            setupCommand: 'gh extension install github/gh-pages',
        },
    ];

    private constructor() {
        super();
    }

    static getInstance(): CloudHostingManager {
        if (!CloudHostingManager.instance) {
            CloudHostingManager.instance = new CloudHostingManager();
        }
        return CloudHostingManager.instance;
    }

    // ========================================================================
    // DEPLOYMENT
    // ========================================================================

    /**
     * Deploy to a hosting provider
     */
    async deploy(config: DeploymentConfig): Promise<Deployment> {
        const deployment: Deployment = {
            id: `deploy_${Date.now()}`,
            provider: config.provider,
            url: '',
            status: 'pending',
            projectPath: config.projectPath,
            createdAt: new Date(),
            logs: [],
        };

        this.deployments.set(deployment.id, deployment);
        this.emit('deploy:started', deployment);

        try {
            deployment.status = 'building';

            // Build if needed
            if (config.buildCommand) {
                const { stdout } = await execAsync(config.buildCommand, { cwd: config.projectPath });
                deployment.logs?.push(stdout);
            }

            // Deploy based on provider
            const url = await this.providerDeploy(config);
            deployment.url = url;
            deployment.status = 'deployed';

            this.emit('deploy:completed', deployment);
        } catch (error: any) {
            deployment.status = 'failed';
            deployment.logs?.push(`Error: ${error.message}`);
            this.emit('deploy:failed', { deployment, error: error.message });
        }

        return deployment;
    }

    private async providerDeploy(config: DeploymentConfig): Promise<string> {
        const { provider, projectPath, name, outputDir } = config;
        let output: string;

        switch (provider) {
            case 'vercel':
                const { stdout: vercelOut } = await execAsync(
                    `vercel --prod --yes ${name ? `--name ${name}` : ''}`,
                    { cwd: projectPath }
                );
                output = vercelOut;
                break;

            case 'netlify':
                const { stdout: netlifyOut } = await execAsync(
                    `netlify deploy --prod --dir ${outputDir || 'dist'} --json`,
                    { cwd: projectPath }
                );
                const netlifyData = JSON.parse(netlifyOut);
                return netlifyData.deploy_url || netlifyData.url;

            case 'railway':
                const { stdout: railwayOut } = await execAsync(
                    'railway up --json',
                    { cwd: projectPath }
                );
                output = railwayOut;
                break;

            case 'fly':
                await execAsync(`fly launch --name ${name || 'app'} --auto-confirm`, { cwd: projectPath });
                const { stdout: flyOut } = await execAsync('fly deploy', { cwd: projectPath });
                output = flyOut;
                break;

            case 'firebase':
                await execAsync('firebase deploy --only hosting', { cwd: projectPath });
                const { stdout: fbOut } = await execAsync('firebase hosting:channel:list --json', { cwd: projectPath });
                output = fbOut;
                break;

            case 'surge':
                const { stdout: surgeOut } = await execAsync(
                    `surge ${outputDir || 'dist'} ${name ? `${name}.surge.sh` : ''}`,
                    { cwd: projectPath }
                );
                output = surgeOut;
                break;

            case 'github-pages':
                await execAsync('npm run build', { cwd: projectPath });
                await execAsync(`gh pages --deploy --directory ${outputDir || 'dist'}`, { cwd: projectPath });
                output = 'Deployed to GitHub Pages';
                break;

            case 'render':
                // Render uses dashboard or render.yaml
                output = 'Deploy via Render dashboard or render.yaml';
                break;

            default:
                throw new Error(`Unknown provider: ${provider}`);
        }

        // Extract URL from output
        const urlMatch = output.match(/https?:\/\/[^\s]+/);
        return urlMatch ? urlMatch[0] : `https://${name || 'app'}.${provider}.app`;
    }

    // ========================================================================
    // CONFIGURATION GENERATION
    // ========================================================================

    /**
     * Generate deployment configuration file
     */
    async generateConfig(provider: HostingProvider, projectPath: string): Promise<string> {
        let config: string;
        let filename: string;

        switch (provider) {
            case 'vercel':
                filename = 'vercel.json';
                config = JSON.stringify({
                    version: 2,
                    builds: [{ src: '**', use: '@vercel/static' }],
                    routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index.html' }],
                }, null, 2);
                break;

            case 'netlify':
                filename = 'netlify.toml';
                config = `[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
                break;

            case 'fly':
                filename = 'fly.toml';
                config = `app = "my-app"
primary_region = "iad"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
`;
                break;

            case 'railway':
                filename = 'railway.json';
                config = JSON.stringify({
                    $schema: 'https://railway.app/railway.schema.json',
                    build: { builder: 'NIXPACKS' },
                    deploy: { startCommand: 'npm start', restartPolicyType: 'ON_FAILURE' },
                }, null, 2);
                break;

            case 'render':
                filename = 'render.yaml';
                config = `services:
  - type: web
    name: my-app
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
`;
                break;

            case 'firebase':
                filename = 'firebase.json';
                config = JSON.stringify({
                    hosting: {
                        public: 'dist',
                        ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
                        rewrites: [{ source: '**', destination: '/index.html' }],
                    },
                }, null, 2);
                break;

            default:
                throw new Error(`No config template for ${provider}`);
        }

        const configPath = path.join(projectPath, filename);
        await fs.writeFile(configPath, config);

        this.emit('config:generated', { provider, path: configPath });
        return configPath;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Check if provider CLI is installed
     */
    async checkProviderCLI(provider: HostingProvider): Promise<boolean> {
        const commands: Record<HostingProvider, string> = {
            vercel: 'vercel --version',
            netlify: 'netlify --version',
            railway: 'railway --version',
            fly: 'fly version',
            render: 'render --version',
            firebase: 'firebase --version',
            surge: 'surge --version',
            'github-pages': 'gh --version',
        };

        try {
            await execAsync(commands[provider]);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Install provider CLI
     */
    async installProviderCLI(provider: HostingProvider): Promise<void> {
        const info = this.providers.find(p => p.name === provider);
        if (info) {
            await execAsync(info.setupCommand);
            this.emit('cli:installed', { provider });
        }
    }

    /**
     * Get all providers
     */
    getProviders(): ProviderInfo[] {
        return this.providers;
    }

    /**
     * Get free providers only
     */
    getFreeProviders(): ProviderInfo[] {
        return this.providers.filter(p => p.free);
    }

    /**
     * Get deployments
     */
    getDeployments(): Deployment[] {
        return Array.from(this.deployments.values());
    }

    /**
     * Get deployment by ID
     */
    getDeployment(id: string): Deployment | undefined {
        return this.deployments.get(id);
    }
}

// Export singleton
export const cloudHostingManager = CloudHostingManager.getInstance();
