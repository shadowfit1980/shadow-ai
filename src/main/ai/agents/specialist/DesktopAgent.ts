/**
 * DesktopAgent - Desktop Application Development Specialist
 * 
 * Specializes in native Windows, macOS, and Linux application development.
 * Provides native API generation, cross-platform abstraction, and installer creation.
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export type DesktopPlatform = 'windows' | 'macos' | 'linux' | 'cross-platform';
export type DesktopFramework = 'electron' | 'tauri' | 'qt' | 'gtk' | 'wxwidgets' | 'native' | '.net-maui' | 'avalonia';

export interface DesktopProject {
    platform: DesktopPlatform;
    framework: DesktopFramework;
    targetVersions: string[];
    features: string[];
}

export interface InstallerConfig {
    type: 'msi' | 'dmg' | 'appimage' | 'deb' | 'rpm' | 'nsis' | 'wix';
    appName: string;
    version: string;
    publisher: string;
    signing?: {
        enabled: boolean;
        certificate?: string;
    };
    autoUpdate?: boolean;
}

export interface NativeAPIBinding {
    platform: DesktopPlatform;
    api: string;
    binding: string;
    safetyLevel: 'safe' | 'unsafe' | 'requires-admin';
}

export class DesktopAgent extends SpecialistAgent {
    readonly agentType = 'DesktopAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'native_api_generation',
            description: 'Generate native Windows/macOS/Linux API bindings',
            confidenceLevel: 0.85
        },
        {
            name: 'cross_platform_abstraction',
            description: 'Create cross-platform abstraction layers',
            confidenceLevel: 0.9
        },
        {
            name: 'installer_creation',
            description: 'Generate installer configurations (MSI, DMG, AppImage)',
            confidenceLevel: 0.92
        },
        {
            name: 'electron_development',
            description: 'Electron main/renderer process development',
            confidenceLevel: 0.95
        },
        {
            name: 'tauri_development',
            description: 'Tauri Rust backend and frontend integration',
            confidenceLevel: 0.85
        },
        {
            name: 'system_integration',
            description: 'System tray, notifications, file associations',
            confidenceLevel: 0.88
        },
        {
            name: 'native_performance',
            description: 'Optimize for native desktop performance',
            confidenceLevel: 0.82
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`🖥️  DesktopAgent executing: ${task.task}`);

        const validation = await this.validateTask(task);
        if (!validation.valid) {
            return {
                success: false,
                summary: 'Validation failed',
                confidence: 0,
                explanation: validation.errors.join(', ')
            };
        }

        try {
            // Detect desktop platform/framework
            const project = await this.detectDesktopProject(task);

            // Generate platform-specific solution
            const solution = await this.generateDesktopSolution(task, project);

            // Generate cross-platform considerations
            const crossPlatform = await this.analyzeCrossPlatform(task, project);

            const result: AgentResult = {
                success: true,
                summary: `Generated ${project.framework} solution for ${project.platform}`,
                artifacts: [
                    { type: 'project', data: project },
                    { type: 'solution', data: solution },
                    { type: 'crossPlatform', data: crossPlatform }
                ],
                confidence: 0.88,
                explanation: `Created ${project.framework} desktop application for ${project.platform}`,
                estimatedEffort: await this.estimateEffort(task)
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Desktop development task failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    /**
     * Detect desktop platform and framework
     */
    async detectDesktopProject(task: AgentTask): Promise<DesktopProject> {
        const prompt = `Analyze this desktop development task:

Task: ${task.task}
Spec: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Detect:
1. Target platform (windows, macos, linux, cross-platform)
2. Framework (electron, tauri, qt, native, etc.)
3. Target OS versions
4. Required features

Response in JSON:
\`\`\`json
{
  "platform": "cross-platform",
  "framework": "electron",
  "targetVersions": ["Windows 10+", "macOS 12+", "Ubuntu 22+"],
  "features": ["system-tray", "auto-update", "notifications"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a desktop application expert who can identify platforms and requirements.'
        );

        const parsed = this.parseJSON(response);
        return {
            platform: parsed.platform || 'cross-platform',
            framework: parsed.framework || 'electron',
            targetVersions: parsed.targetVersions || [],
            features: parsed.features || []
        };
    }

    /**
     * Generate framework-specific solution
     */
    async generateDesktopSolution(task: AgentTask, project: DesktopProject): Promise<any> {
        const frameworkGuidelines = this.getFrameworkGuidelines(project.framework);

        const prompt = `Generate a ${project.framework} solution for this desktop task:

Task: ${task.task}
Spec: ${task.spec}
Platform: ${project.platform}
Features: ${project.features.join(', ')}

Framework Guidelines:
${frameworkGuidelines}

Provide:
1. Main process/backend code
2. UI/renderer code
3. IPC communication
4. Platform-specific handling

Response in JSON:
\`\`\`json
{
  "mainCode": "// Main process code",
  "rendererCode": "// UI code",
  "ipc": ["channel1", "channel2"],
  "platformSpecific": {
    "windows": "// Windows-specific",
    "macos": "// macOS-specific"
  },
  "dependencies": ["package1"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are an expert ${project.framework} developer creating production desktop applications.`
        );

        return this.parseJSON(response);
    }

    /**
     * Generate installer configuration
     */
    async generateInstallerConfig(config: InstallerConfig, project: DesktopProject): Promise<string> {
        const prompt = `Generate installer configuration for ${project.framework}:

App Name: ${config.appName}
Version: ${config.version}
Publisher: ${config.publisher}
Installer Type: ${config.type}
Code Signing: ${config.signing?.enabled ? 'Yes' : 'No'}
Auto-Update: ${config.autoUpdate ? 'Yes' : 'No'}

Generate complete configuration file for ${config.type} installer:`;

        const response = await this.callModel(
            prompt,
            `You are an expert in ${config.type} installer creation and code signing.`
        );

        return response;
    }

    /**
     * Generate native API binding
     */
    async generateNativeBinding(api: string, platform: DesktopPlatform): Promise<NativeAPIBinding> {
        const prompt = `Generate native API binding for:

API: ${api}
Platform: ${platform}

Create a safe binding with:
1. Proper error handling
2. Type-safe interface
3. Memory management
4. Cross-platform fallback

Response in JSON:
\`\`\`json
{
  "platform": "${platform}",
  "api": "${api}",
  "binding": "// Binding code",
  "safetyLevel": "safe",
  "fallback": "// Fallback for other platforms"
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are a systems programmer expert in ${platform} native APIs.`
        );

        const parsed = this.parseJSON(response);
        return {
            platform: parsed.platform || platform,
            api: parsed.api || api,
            binding: parsed.binding || '',
            safetyLevel: parsed.safetyLevel || 'safe'
        };
    }

    /**
     * Analyze cross-platform considerations
     */
    async analyzeCrossPlatform(task: AgentTask, project: DesktopProject): Promise<any> {
        const prompt = `Analyze cross-platform considerations for:

Task: ${task.task}
Framework: ${project.framework}
Target Platforms: ${project.platform}

Identify:
1. Platform-specific behaviors
2. UI/UX adaptations needed
3. File system differences
4. Permission requirements

Response in JSON:
\`\`\`json
{
  "platformDifferences": {
    "windows": ["Uses registry", "Different paths"],
    "macos": ["Uses plist", "App sandboxing"],
    "linux": ["XDG directories", "Varies by distro"]
  },
  "uiAdaptations": ["Menu bar placement", "Keyboard shortcuts"],
  "permissions": {
    "windows": ["Administrator for certain features"],
    "macos": ["Security & Privacy permissions"],
    "linux": ["PolicyKit for elevated access"]
  },
  "recommendations": ["Use platform-agnostic paths", "Abstract native APIs"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a cross-platform desktop expert who understands OS differences deeply.'
        );

        return this.parseJSON(response);
    }

    /**
     * Generate system integration code
     */
    async generateSystemIntegration(feature: string, project: DesktopProject): Promise<string> {
        const prompt = `Generate ${feature} integration for ${project.framework}:

Feature: ${feature}
Framework: ${project.framework}
Platforms: ${project.platform}

Create production-ready code for:
- System tray
- Native notifications
- File associations
- Deep links
- Auto-start

Provide complete, working code:`;

        const response = await this.callModel(
            prompt,
            `You are a ${project.framework} expert specializing in system integrations.`
        );

        return response;
    }

    /**
     * Get framework-specific guidelines
     */
    private getFrameworkGuidelines(framework: DesktopFramework): string {
        const guidelines: Record<DesktopFramework, string> = {
            'electron': `
- Separate main and renderer processes
- Use contextBridge for IPC
- Enable contextIsolation
- Use electron-builder for packaging
- Implement proper security practices`,

            'tauri': `
- Rust backend for performance
- Use Tauri commands for IPC
- Implement proper error handling
- Use tauri-plugin ecosystem
- Optimize bundle size`,

            'qt': `
- Use Qt Quick/QML for modern UI
- Implement proper signal/slot connections
- Follow Qt coding conventions
- Use Qt Installer Framework
- Handle high-DPI properly`,

            'gtk': `
- Use GTK4 where possible
- Implement GObject patterns
- Use Meson build system
- Follow GNOME HIG
- Handle Wayland/X11 differences`,

            'wxwidgets': `
- Use wxWidgets 3.2+
- Implement proper event handling
- Use sizers for layout
- Handle platform look and feel
- Use wxInstall for deployment`,

            'native': `
- Use platform-specific APIs directly
- Implement proper memory management
- Handle all error cases
- Follow platform guidelines
- Consider backward compatibility`,

            '.net-maui': `
- Use XAML for UI
- Implement MVVM pattern
- Use dependency injection
- Handle platform specifics with handlers
- Use MSIX for Windows packaging`,

            'avalonia': `
- Cross-platform XAML framework
- Use ReactiveUI for MVVM
- Implement proper styling
- Handle platform detection
- Use ICY for installers`
        };

        return guidelines[framework] || guidelines['electron'];
    }
}
