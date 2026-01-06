/**
 * Application Build/Export Service
 * Enables building EXE, APK, and packaging web apps
 */

import { EventEmitter } from 'events';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);

export type BuildTarget = 'exe' | 'apk' | 'web' | 'dmg' | 'deb' | 'docker';

export interface BuildConfig {
    target: BuildTarget;
    projectPath: string;
    outputPath?: string;
    options?: Record<string, any>;
}

export interface BuildResult {
    success: boolean;
    target: BuildTarget;
    outputPath?: string;
    fileSize?: number;
    duration?: number;
    error?: string;
}

export class AppBuildService extends EventEmitter {
    private static instance: AppBuildService;
    private buildQueue: BuildConfig[] = [];
    private isBuilding = false;

    private constructor() {
        super();
    }

    static getInstance(): AppBuildService {
        if (!AppBuildService.instance) {
            AppBuildService.instance = new AppBuildService();
        }
        return AppBuildService.instance;
    }

    /**
     * Build application for target platform
     */
    async build(config: BuildConfig): Promise<BuildResult> {
        const startTime = Date.now();
        this.emit('build:start', config);

        try {
            let result: BuildResult;

            switch (config.target) {
                case 'exe':
                    result = await this.buildWindowsExe(config);
                    break;
                case 'apk':
                    result = await this.buildAndroidApk(config);
                    break;
                case 'dmg':
                    result = await this.buildMacApp(config);
                    break;
                case 'deb':
                    result = await this.buildLinuxPackage(config);
                    break;
                case 'web':
                    result = await this.buildWebApp(config);
                    break;
                case 'docker':
                    result = await this.buildDockerImage(config);
                    break;
                default:
                    throw new Error(`Unsupported build target: ${config.target}`);
            }

            result.duration = Date.now() - startTime;
            this.emit('build:complete', result);
            return result;

        } catch (error: any) {
            const result: BuildResult = {
                success: false,
                target: config.target,
                error: error.message,
                duration: Date.now() - startTime
            };
            this.emit('build:error', result);
            return result;
        }
    }

    /**
     * Build Windows EXE using Electron Builder or pkg
     */
    private async buildWindowsExe(config: BuildConfig): Promise<BuildResult> {
        const { projectPath, outputPath } = config;

        // Check if it's an Electron project
        const pkgPath = path.join(projectPath, 'package.json');
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

        const output = outputPath || path.join(projectPath, 'dist');
        await fs.mkdir(output, { recursive: true });

        if (pkg.devDependencies?.['electron-builder'] || pkg.dependencies?.electron) {
            // Electron project - use electron-builder
            console.log('📦 Building Electron app for Windows...');
            await execAsync('npx electron-builder --win --x64', { cwd: projectPath });
        } else {
            // Node.js app - use pkg
            console.log('📦 Packaging Node.js app for Windows...');
            await execAsync(`npx pkg . --targets node18-win-x64 --output ${path.join(output, 'app.exe')}`, { cwd: projectPath });
        }

        const exePath = path.join(output, 'app.exe');
        const stats = await fs.stat(exePath).catch(() => null);

        return {
            success: true,
            target: 'exe',
            outputPath: exePath,
            fileSize: stats?.size
        };
    }

    /**
     * Build Android APK using Flutter or React Native
     */
    private async buildAndroidApk(config: BuildConfig): Promise<BuildResult> {
        const { projectPath, outputPath } = config;

        // Detect framework
        const files = await fs.readdir(projectPath);

        let apkPath: string;

        if (files.includes('pubspec.yaml')) {
            // Flutter project
            console.log('📱 Building Flutter APK...');
            await execAsync('flutter build apk --release', { cwd: projectPath });
            apkPath = path.join(projectPath, 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk');

        } else if (files.includes('android')) {
            // React Native project
            console.log('📱 Building React Native APK...');
            await execAsync('cd android && ./gradlew assembleRelease', { cwd: projectPath });
            apkPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

        } else if (files.includes('capacitor.config.ts') || files.includes('capacitor.config.json')) {
            // Capacitor project
            console.log('📱 Building Capacitor APK...');
            await execAsync('npx cap sync android && cd android && ./gradlew assembleRelease', { cwd: projectPath });
            apkPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

        } else {
            throw new Error('No Android project detected. Need Flutter, React Native, or Capacitor project.');
        }

        // Copy to output path if specified
        if (outputPath) {
            await fs.copyFile(apkPath, outputPath);
            apkPath = outputPath;
        }

        const stats = await fs.stat(apkPath).catch(() => null);

        return {
            success: true,
            target: 'apk',
            outputPath: apkPath,
            fileSize: stats?.size
        };
    }

    /**
     * Build Mac DMG
     */
    private async buildMacApp(config: BuildConfig): Promise<BuildResult> {
        const { projectPath, outputPath } = config;

        console.log('🍎 Building macOS app...');
        await execAsync('npx electron-builder --mac', { cwd: projectPath });

        const dmgPath = path.join(projectPath, 'dist', '*.dmg');

        return {
            success: true,
            target: 'dmg',
            outputPath: dmgPath
        };
    }

    /**
     * Build Linux DEB package
     */
    private async buildLinuxPackage(config: BuildConfig): Promise<BuildResult> {
        const { projectPath } = config;

        console.log('🐧 Building Linux package...');
        await execAsync('npx electron-builder --linux deb', { cwd: projectPath });

        return {
            success: true,
            target: 'deb',
            outputPath: path.join(projectPath, 'dist', '*.deb')
        };
    }

    /**
     * Build optimized web bundle
     */
    private async buildWebApp(config: BuildConfig): Promise<BuildResult> {
        const { projectPath, outputPath } = config;

        console.log('🌐 Building web app...');

        // Try different build commands
        try {
            await execAsync('npm run build', { cwd: projectPath });
        } catch {
            try {
                await execAsync('npx vite build', { cwd: projectPath });
            } catch {
                await execAsync('npx next build', { cwd: projectPath });
            }
        }

        // Create ZIP of dist folder
        const distPath = path.join(projectPath, 'dist');
        const buildPath = path.join(projectPath, 'build');
        const outPath = path.join(projectPath, '.next');

        let webPath = distPath;
        if (await fs.access(buildPath).then(() => true).catch(() => false)) {
            webPath = buildPath;
        } else if (await fs.access(outPath).then(() => true).catch(() => false)) {
            webPath = outPath;
        }

        return {
            success: true,
            target: 'web',
            outputPath: webPath
        };
    }

    /**
     * Build Docker image
     */
    private async buildDockerImage(config: BuildConfig): Promise<BuildResult> {
        const { projectPath, options } = config;
        const imageName = options?.imageName || 'shadow-ai-app';

        console.log('🐳 Building Docker image...');

        // Check for Dockerfile
        const dockerfilePath = path.join(projectPath, 'Dockerfile');
        const hasDockerfile = await fs.access(dockerfilePath).then(() => true).catch(() => false);

        if (!hasDockerfile) {
            // Create a basic Dockerfile
            const dockerfile = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]`;
            await fs.writeFile(dockerfilePath, dockerfile);
        }

        await execAsync(`docker build -t ${imageName}:latest .`, { cwd: projectPath });

        return {
            success: true,
            target: 'docker',
            outputPath: `${imageName}:latest`
        };
    }

    /**
     * Get available build targets for a project
     */
    async getAvailableTargets(projectPath: string): Promise<BuildTarget[]> {
        const targets: BuildTarget[] = ['web'];

        try {
            const files = await fs.readdir(projectPath);
            const pkgPath = path.join(projectPath, 'package.json');

            // Check for Electron
            if (await fs.access(pkgPath).then(() => true).catch(() => false)) {
                const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
                if (pkg.dependencies?.electron || pkg.devDependencies?.electron) {
                    targets.push('exe', 'dmg', 'deb');
                }
            }

            // Check for mobile frameworks
            if (files.includes('pubspec.yaml')) targets.push('apk');
            if (files.includes('android')) targets.push('apk');
            if (files.includes('capacitor.config.ts')) targets.push('apk');

            // Docker is always available
            targets.push('docker');

        } catch {
            // Default to web and docker
        }

        return [...new Set(targets)];
    }

    /**
     * Quick web app export to HTML file
     */
    async exportToHtml(code: string, outputPath: string): Promise<BuildResult> {
        try {
            await fs.writeFile(outputPath, code, 'utf-8');
            const stats = await fs.stat(outputPath);

            return {
                success: true,
                target: 'web',
                outputPath,
                fileSize: stats.size
            };
        } catch (error: any) {
            return {
                success: false,
                target: 'web',
                error: error.message
            };
        }
    }
}

export const buildService = AppBuildService.getInstance();
