/**
 * MobileAgent - Mobile Development Specialist
 * 
 * Specializes in iOS, Android, React Native, Flutter, and SwiftUI development.
 * Provides device detection, platform-specific code generation, and app store optimization.
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export interface MobilePlatform {
    type: 'ios' | 'android' | 'react-native' | 'flutter' | 'swift' | 'kotlin';
    name: string;
    version?: string;
}

export interface AppStoreMetadata {
    title: string;
    subtitle: string;
    description: string;
    keywords: string[];
    category: string;
    screenshots: string[];
    previewVideo?: string;
}

export interface MobilePerformanceProfile {
    fps: number;
    memoryUsage: number;
    batteryImpact: 'low' | 'medium' | 'high';
    networkUsage: number;
    startupTime: number;
    recommendations: string[];
}

export class MobileAgent extends SpecialistAgent {
    readonly agentType = 'MobileAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'mobile_platform_detection',
            description: 'Detect mobile platform and framework from project structure',
            confidenceLevel: 0.95
        },
        {
            name: 'cross_platform_code_gen',
            description: 'Generate React Native/Flutter code from specifications',
            confidenceLevel: 0.88
        },
        {
            name: 'native_code_gen',
            description: 'Generate Swift/Kotlin native code',
            confidenceLevel: 0.85
        },
        {
            name: 'app_store_optimization',
            description: 'Generate ASO metadata, descriptions, keywords',
            confidenceLevel: 0.9
        },
        {
            name: 'mobile_performance_analysis',
            description: 'Analyze and optimize mobile app performance',
            confidenceLevel: 0.82
        },
        {
            name: 'ui_component_generation',
            description: 'Generate platform-idiomatic UI components',
            confidenceLevel: 0.87
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`📱 MobileAgent executing: ${task.task}`);

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
            // Detect platform from context
            const platform = await this.detectPlatform(task);

            // Generate platform-specific solution
            const solution = await this.generateMobileSolution(task, platform);

            // Add performance recommendations
            const perfProfile = await this.analyzePerformance(task, solution);

            const result: AgentResult = {
                success: true,
                summary: `Generated ${platform.type} solution with ${perfProfile.recommendations.length} optimizations`,
                artifacts: [
                    { type: 'platform', data: platform },
                    { type: 'solution', data: solution },
                    { type: 'performance', data: perfProfile }
                ],
                confidence: 0.87,
                explanation: `Created ${platform.type} solution targeting ${platform.name}`,
                estimatedEffort: await this.estimateEffort(task)
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Mobile development task failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    /**
     * Detect mobile platform from project structure or task context
     */
    async detectPlatform(task: AgentTask): Promise<MobilePlatform> {
        const prompt = `Analyze this mobile development task and detect the platform:

Task: ${task.task}
Spec: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Detect the mobile platform and framework being used or requested.
Response in JSON:
\`\`\`json
{
  "type": "react-native",
  "name": "React Native",
  "version": "0.73",
  "reasoning": "Task mentions React Native components"
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a mobile development expert who can identify platforms from minimal context.'
        );

        const parsed = this.parseJSON(response);
        return {
            type: parsed.type || 'react-native',
            name: parsed.name || 'React Native',
            version: parsed.version
        };
    }

    /**
     * Generate mobile solution based on platform
     */
    async generateMobileSolution(task: AgentTask, platform: MobilePlatform): Promise<any> {
        const platformGuidelines = this.getPlatformGuidelines(platform);

        const prompt = `Generate a ${platform.name} solution for this task:

Task: ${task.task}
Spec: ${task.spec}

Platform Guidelines:
${platformGuidelines}

Provide:
1. Complete component code
2. State management approach
3. Navigation if needed
4. Platform-specific optimizations

Response in JSON:
\`\`\`json
{
  "code": "// Component code here",
  "stateManagement": "useState/Redux/etc",
  "navigation": "stack/tab/drawer",
  "optimizations": ["Lazy loading", "Memoization"],
  "dependencies": ["package1", "package2"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are an expert ${platform.name} developer following best practices.`
        );

        return this.parseJSON(response);
    }

    /**
     * Generate App Store metadata
     */
    async generateAppStoreMetadata(appDescription: string, platform: 'ios' | 'android'): Promise<AppStoreMetadata> {
        const storeType = platform === 'ios' ? 'App Store' : 'Google Play';

        const prompt = `Generate ${storeType} metadata for this app:

App Description: ${appDescription}

Create compelling, SEO-optimized metadata:
\`\`\`json
{
  "title": "App Name (max 30 chars)",
  "subtitle": "Catchy subtitle (max 30 chars)",
  "description": "Full description with keywords",
  "keywords": ["keyword1", "keyword2"],
  "category": "Productivity",
  "screenshotDescriptions": ["Screenshot 1 desc", "Screenshot 2 desc"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are an App Store Optimization (ASO) expert maximizing app visibility.`
        );

        const parsed = this.parseJSON(response);
        return {
            title: parsed.title || 'App',
            subtitle: parsed.subtitle || '',
            description: parsed.description || appDescription,
            keywords: parsed.keywords || [],
            category: parsed.category || 'Utilities',
            screenshots: parsed.screenshotDescriptions || []
        };
    }

    /**
     * Analyze and recommend performance optimizations
     */
    async analyzePerformance(task: AgentTask, solution: any): Promise<MobilePerformanceProfile> {
        const prompt = `Analyze mobile performance for this solution:

Task: ${task.task}
Solution: ${JSON.stringify(solution)}

Identify performance issues and recommendations:
\`\`\`json
{
  "estimatedFps": 60,
  "memoryUsage": "medium",
  "batteryImpact": "low",
  "startupImpact": "minimal",
  "recommendations": [
    "Use FlatList instead of ScrollView for large lists",
    "Implement React.memo for repeated components"
  ]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a mobile performance optimization expert.'
        );

        const parsed = this.parseJSON(response);
        return {
            fps: parsed.estimatedFps || 60,
            memoryUsage: parsed.memoryUsage === 'high' ? 100 : parsed.memoryUsage === 'medium' ? 50 : 25,
            batteryImpact: parsed.batteryImpact || 'low',
            networkUsage: parsed.networkUsage || 0,
            startupTime: parsed.startupTime || 0,
            recommendations: parsed.recommendations || []
        };
    }

    /**
     * Generate platform-specific component
     */
    async generateComponent(componentSpec: string, platform: MobilePlatform): Promise<string> {
        const prompt = `Generate a ${platform.name} component:

Component Spec: ${componentSpec}

Create a production-ready component with:
- Proper styling (platform conventions)
- Accessibility support
- Animation where appropriate
- TypeScript types

Provide the complete code:`;

        const response = await this.callModel(
            prompt,
            `You are an expert ${platform.name} developer creating polished UI components.`
        );

        return response;
    }

    /**
     * Get platform-specific code guidelines
     */
    private getPlatformGuidelines(platform: MobilePlatform): string {
        const guidelines: Record<string, string> = {
            'react-native': `
- Use StyleSheet.create for styles
- Prefer FlatList for lists
- Use React Navigation for routing
- Implement proper error boundaries
- Consider Reanimated for animations`,

            'flutter': `
- Use StatelessWidget when possible
- Implement const constructors
- Use Provider/Riverpod for state
- Follow Material/Cupertino guidelines
- Use flutter_hooks for lifecycle`,

            'swift': `
- Use SwiftUI where possible
- Implement @State and @Binding correctly
- Follow Human Interface Guidelines
- Use Combine for reactive patterns
- Implement proper error handling`,

            'kotlin': `
- Use Jetpack Compose for UI
- Implement ViewModel + LiveData/StateFlow
- Follow Material Design 3 guidelines
- Use Coroutines for async operations
- Implement proper lifecycle handling`,

            'ios': `
- Follow Apple HIG
- Use UIKit with proper lifecycle
- Implement proper Auto Layout
- Consider accessibility (VoiceOver)
- Use Core Data for persistence`,

            'android': `
- Follow Material Design guidelines
- Use Jetpack libraries
- Implement proper lifecycle handling
- Consider accessibility
- Use Room for persistence`
        };

        return guidelines[platform.type] || guidelines['react-native'];
    }
}
