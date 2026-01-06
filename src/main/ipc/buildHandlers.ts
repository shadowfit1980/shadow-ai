/**
 * Build Service IPC Handlers
 * Exposes build/export capabilities to renderer process
 */

import { ipcMain, dialog, shell } from 'electron';
import { buildService, BuildTarget } from '../services/AppBuildService';
import * as path from 'path';

export function registerBuildHandlers(): void {
    console.log('📦 Registering build handlers...');

    // Build project for target platform
    ipcMain.handle('build:create', async (_event, target: BuildTarget, projectPath: string, options?: any) => {
        try {
            console.log(`📦 Building ${target} from ${projectPath}...`);

            const result = await buildService.build({
                target,
                projectPath,
                options
            });

            if (result.success && result.outputPath) {
                // Open output folder
                shell.showItemInFolder(result.outputPath);
            }

            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get available build targets for a project
    ipcMain.handle('build:getTargets', async (_event, projectPath: string) => {
        try {
            const targets = await buildService.getAvailableTargets(projectPath);
            return { success: true, targets };
        } catch (error: any) {
            return { success: false, error: error.message, targets: ['web'] };
        }
    });

    // Export code to HTML file
    ipcMain.handle('build:exportHtml', async (_event, code: string, filename?: string) => {
        try {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Export HTML',
                defaultPath: filename || 'app.html',
                filters: [{ name: 'HTML Files', extensions: ['html'] }]
            });

            if (!filePath) {
                return { success: false, error: 'Export cancelled' };
            }

            const result = await buildService.exportToHtml(code, filePath);

            if (result.success) {
                shell.showItemInFolder(filePath);
            }

            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Quick export (downloads folder)
    ipcMain.handle('build:quickExport', async (_event, code: string, format: 'html' | 'js' | 'css' = 'html') => {
        try {
            const { app } = require('electron');
            const downloadsPath = app.getPath('downloads');
            const timestamp = Date.now();
            const filename = `shadow-ai-export-${timestamp}.${format}`;
            const filePath = path.join(downloadsPath, filename);

            const result = await buildService.exportToHtml(code, filePath);

            if (result.success) {
                shell.showItemInFolder(filePath);
            }

            return { ...result, filename };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Build status listener
    buildService.on('build:start', (config) => {
        console.log(`🔨 Build started: ${config.target}`);
    });

    buildService.on('build:complete', (result) => {
        console.log(`✅ Build complete: ${result.target} → ${result.outputPath}`);
    });

    buildService.on('build:error', (result) => {
        console.error(`❌ Build failed: ${result.target} - ${result.error}`);
    });

    // Docker commands
    ipcMain.handle('docker:build', async (_event, projectPath: string, imageName?: string) => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const name = imageName || 'shadow-ai-app';
            console.log(`🐳 Building Docker image: ${name}`);

            const { stdout, stderr } = await execAsync(`docker build -t ${name}:latest .`, { cwd: projectPath });
            return { success: true, output: stdout, imageName: name };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('docker:run', async (_event, imageName: string, options?: { port?: number }) => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const port = options?.port || 3000;
            console.log(`🐳 Running Docker container: ${imageName}`);

            const { stdout } = await execAsync(`docker run -d -p ${port}:${port} ${imageName}:latest`);
            return { success: true, containerId: stdout.trim(), port };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('docker:status', async () => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const { stdout } = await execAsync('docker --version');
            const { stdout: containers } = await execAsync('docker ps --format "{{.Names}}: {{.Status}}"');

            return {
                success: true,
                version: stdout.trim(),
                containers: containers.trim().split('\n').filter(Boolean)
            };
        } catch (error: any) {
            return { success: false, error: error.message, available: false };
        }
    });

    // Flutter commands
    ipcMain.handle('flutter:create', async (_event, projectName: string, template?: string) => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            const { app } = require('electron');

            const projectsPath = app.getPath('documents');
            const projectPath = path.join(projectsPath, 'ShadowAI-Projects', projectName);

            console.log(`📱 Creating Flutter project: ${projectName}`);

            const templateArg = template ? `-t ${template}` : '';
            await execAsync(`mkdir -p "${path.dirname(projectPath)}" && cd "${path.dirname(projectPath)}" && flutter create ${templateArg} ${projectName}`);

            return { success: true, projectPath, projectName };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flutter:run', async (_event, projectPath: string, device?: string) => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const deviceArg = device ? `-d ${device}` : '-d chrome';
            console.log(`📱 Running Flutter app: ${projectPath}`);

            // Start flutter run in background
            const { stdout } = await execAsync(`flutter run ${deviceArg}`, { cwd: projectPath, timeout: 60000 });
            return { success: true, output: stdout };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flutter:build', async (_event, projectPath: string, target: 'apk' | 'ios' | 'web' = 'apk') => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            console.log(`📱 Building Flutter ${target}: ${projectPath}`);

            let command = '';
            let outputPath = '';

            switch (target) {
                case 'apk':
                    command = 'flutter build apk --release';
                    outputPath = path.join(projectPath, 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk');
                    break;
                case 'ios':
                    command = 'flutter build ios --release';
                    outputPath = path.join(projectPath, 'build', 'ios', 'iphoneos', 'Runner.app');
                    break;
                case 'web':
                    command = 'flutter build web --release';
                    outputPath = path.join(projectPath, 'build', 'web');
                    break;
            }

            const { stdout } = await execAsync(command, { cwd: projectPath });
            return { success: true, output: stdout, outputPath, target };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flutter:status', async () => {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const { stdout: version } = await execAsync('flutter --version');
            const { stdout: devices } = await execAsync('flutter devices');

            return {
                success: true,
                version: version.split('\n')[0],
                devices: devices.trim().split('\n').filter((l: string) => l.includes('•'))
            };
        } catch (error: any) {
            return { success: false, error: error.message, available: false };
        }
    });

    console.log('✅ Build handlers registered');
}
