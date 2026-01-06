/**
 * Deployment Agent
 * 
 * Automated deployment to popular hosting platforms.
 * Supports Vercel, Netlify, Firebase, and AWS Amplify.
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export type DeploymentPlatform = 'vercel' | 'netlify' | 'firebase' | 'amplify';
export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'success' | 'failed';

export interface DeploymentConfig {
    platform: DeploymentPlatform;
    projectPath: string;
    projectName?: string;
    buildCommand?: string;
    outputDir?: string;
    environment?: 'production' | 'preview';
    envVars?: Record<string, string>;
}

export interface DeploymentResult {
    id: string;
    platform: DeploymentPlatform;
    status: DeploymentStatus;
    url?: string;
    buildUrl?: string;
    logs: string[];
    error?: string;
    startTime: number;
    endTime?: number;
}

interface PlatformConfig {
    name: string;
    cliCommand: string;
    installCommand: string;
    deployCommand: (config: DeploymentConfig) => string;
    parseUrl: (output: string) => string | undefined;
}

export class DeploymentAgent extends EventEmitter {
    private static instance: DeploymentAgent;
    private deployments: Map<string, DeploymentResult> = new Map();
    private platforms: Map<DeploymentPlatform, PlatformConfig>;

    static getInstance(): DeploymentAgent {
        if (!DeploymentAgent.instance) {
            DeploymentAgent.instance = new DeploymentAgent();
        }
        return DeploymentAgent.instance;
    }

    constructor() {
        super();
        this.platforms = new Map([
            ['vercel', {
                name: 'Vercel',
                cliCommand: 'vercel',
                installCommand: 'npm install -g vercel',
                deployCommand: (config) => {
                    const args = ['vercel'];
                    if (config.environment === 'production') args.push('--prod');
                    args.push('--yes'); // Auto-confirm
                    return args.join(' ');
                },
                parseUrl: (output) => {
                    const match = output.match(/https:\/\/[^\s]+\.vercel\.app/);
                    return match?.[0];
                }
            }],
            ['netlify', {
                name: 'Netlify',
                cliCommand: 'netlify',
                installCommand: 'npm install -g netlify-cli',
                deployCommand: (config) => {
                    const args = ['netlify', 'deploy'];
                    if (config.environment === 'production') args.push('--prod');
                    if (config.outputDir) args.push(`--dir=${config.outputDir}`);
                    return args.join(' ');
                },
                parseUrl: (output) => {
                    const match = output.match(/https:\/\/[^\s]+\.netlify\.app/);
                    return match?.[0];
                }
            }],
            ['firebase', {
                name: 'Firebase',
                cliCommand: 'firebase',
                installCommand: 'npm install -g firebase-tools',
                deployCommand: () => 'firebase deploy --only hosting',
                parseUrl: (output) => {
                    const match = output.match(/https:\/\/[^\s]+\.web\.app/);
                    return match?.[0];
                }
            }],
            ['amplify', {
                name: 'AWS Amplify',
                cliCommand: 'amplify',
                installCommand: 'npm install -g @aws-amplify/cli',
                deployCommand: () => 'amplify publish --yes',
                parseUrl: (output) => {
                    const match = output.match(/https:\/\/[^\s]+\.amplifyapp\.com/);
                    return match?.[0];
                }
            }]
        ]);
    }

    /**
     * Deploy project to specified platform
     */
    async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
        const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const result: DeploymentResult = {
            id: deploymentId,
            platform: config.platform,
            status: 'pending',
            logs: [],
            startTime: Date.now()
        };

        this.deployments.set(deploymentId, result);
        this.emit('deployment-started', result);

        try {
            // Check CLI availability
            await this.ensureCLI(config.platform, result);

            // Build project if needed
            if (config.buildCommand) {
                result.status = 'building';
                this.emit('deployment-updated', result);
                await this.runBuild(config, result);
            }

            // Deploy
            result.status = 'deploying';
            this.emit('deployment-updated', result);
            await this.runDeploy(config, result);

            result.status = 'success';
            result.endTime = Date.now();
            this.emit('deployment-completed', result);

        } catch (error) {
            result.status = 'failed';
            result.error = error instanceof Error ? error.message : 'Unknown error';
            result.endTime = Date.now();
            this.emit('deployment-failed', result);
        }

        return result;
    }

    /**
     * Ensure CLI is installed
     */
    private async ensureCLI(platform: DeploymentPlatform, result: DeploymentResult): Promise<void> {
        const platformConfig = this.platforms.get(platform);
        if (!platformConfig) throw new Error(`Unknown platform: ${platform}`);

        result.logs.push(`Checking ${platformConfig.name} CLI...`);

        try {
            await execAsync(`which ${platformConfig.cliCommand}`);
            result.logs.push(`✓ ${platformConfig.name} CLI found`);
        } catch {
            result.logs.push(`Installing ${platformConfig.name} CLI...`);
            try {
                await execAsync(platformConfig.installCommand);
                result.logs.push(`✓ ${platformConfig.name} CLI installed`);
            } catch (error) {
                throw new Error(`Failed to install ${platformConfig.name} CLI`);
            }
        }
    }

    /**
     * Run build command
     */
    private async runBuild(config: DeploymentConfig, result: DeploymentResult): Promise<void> {
        if (!config.buildCommand) return;

        result.logs.push(`Building project: ${config.buildCommand}`);

        try {
            const { stdout, stderr } = await execAsync(config.buildCommand, {
                cwd: config.projectPath,
                env: { ...process.env, ...config.envVars }
            });

            if (stdout) result.logs.push(stdout.slice(-500)); // Last 500 chars
            if (stderr && !stderr.includes('warning')) {
                result.logs.push(`Build warnings: ${stderr.slice(-200)}`);
            }

            result.logs.push('✓ Build completed');
        } catch (error) {
            throw new Error(`Build failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }

    /**
     * Run deployment command
     */
    private async runDeploy(config: DeploymentConfig, result: DeploymentResult): Promise<void> {
        const platformConfig = this.platforms.get(config.platform);
        if (!platformConfig) throw new Error(`Unknown platform: ${config.platform}`);

        const deployCmd = platformConfig.deployCommand(config);
        result.logs.push(`Deploying: ${deployCmd}`);

        try {
            const { stdout, stderr } = await execAsync(deployCmd, {
                cwd: config.projectPath,
                env: { ...process.env, ...config.envVars }
            });

            const output = stdout + stderr;
            result.logs.push(output.slice(-1000)); // Last 1000 chars

            // Extract URL
            const url = platformConfig.parseUrl(output);
            if (url) {
                result.url = url;
                result.logs.push(`✓ Deployed to: ${url}`);
            } else {
                result.logs.push('✓ Deployment completed (URL not detected)');
            }

        } catch (error) {
            throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }

    /**
     * Quick deploy with auto-detected settings
     */
    async quickDeploy(projectPath: string, platform: DeploymentPlatform = 'vercel'): Promise<DeploymentResult> {
        // Auto-detect build settings
        const packageJsonPath = path.join(projectPath, 'package.json');
        let buildCommand = 'npm run build';
        let outputDir = 'dist';

        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                if (pkg.scripts?.build) {
                    buildCommand = 'npm run build';
                }
                // Detect framework output dirs
                if (fs.existsSync(path.join(projectPath, 'next.config.js'))) {
                    outputDir = '.next';
                } else if (fs.existsSync(path.join(projectPath, 'vite.config.ts'))) {
                    outputDir = 'dist';
                }
            } catch { }
        }

        return this.deploy({
            platform,
            projectPath,
            buildCommand,
            outputDir,
            environment: 'production'
        });
    }

    /**
     * Get deployment status
     */
    getDeployment(id: string): DeploymentResult | undefined {
        return this.deployments.get(id);
    }

    /**
     * List all deployments
     */
    listDeployments(): DeploymentResult[] {
        return Array.from(this.deployments.values());
    }

    /**
     * Get supported platforms
     */
    getSupportedPlatforms(): { id: DeploymentPlatform; name: string }[] {
        return Array.from(this.platforms.entries()).map(([id, config]) => ({
            id,
            name: config.name
        }));
    }
}

export const deploymentAgent = DeploymentAgent.getInstance();
