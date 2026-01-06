/**
 * DomainModelRouter
 * 
 * Specialized model routing for domain-specific tasks.
 * Routes mobile, game, and desktop development tasks to optimal models.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

// ============================================================================
// TYPES
// ============================================================================

export type DomainType = 'mobile' | 'game' | 'desktop' | 'general';

export interface DomainRoutingConfig {
    domain: DomainType;
    preferredModels: string[];
    fallbackModels: string[];
    requirements: {
        minContext: number;
        preferCode: boolean;
        preferVision?: boolean;
        preferReasoning?: boolean;
    };
}

export interface RoutingResult {
    selectedModel: string;
    domain: DomainType;
    confidence: number;
    reasoning: string;
}

// ============================================================================
// DOMAIN MODEL ROUTER
// ============================================================================

export class DomainModelRouter extends EventEmitter {
    private static instance: DomainModelRouter;
    private modelManager: ModelManager;

    // Domain-specific routing configurations
    private domainConfigs: Map<DomainType, DomainRoutingConfig> = new Map([
        ['mobile', {
            domain: 'mobile',
            preferredModels: ['claude-3.5-sonnet', 'gpt-4-turbo', 'gemini-1.5-pro'],
            fallbackModels: ['claude-3-haiku', 'gpt-4o-mini'],
            requirements: {
                minContext: 32000,
                preferCode: true,
                preferVision: true  // For UI screenshot analysis
            }
        }],
        ['game', {
            domain: 'game',
            preferredModels: ['claude-3.5-sonnet', 'gpt-4-turbo', 'gemini-1.5-pro'],
            fallbackModels: ['claude-3-haiku', 'gpt-4o-mini'],
            requirements: {
                minContext: 64000,  // Game code can be complex
                preferCode: true,
                preferReasoning: true  // For architecture decisions
            }
        }],
        ['desktop', {
            domain: 'desktop',
            preferredModels: ['claude-3.5-sonnet', 'gpt-4-turbo', 'gemini-1.5-pro'],
            fallbackModels: ['claude-3-haiku', 'gpt-4o-mini'],
            requirements: {
                minContext: 32000,
                preferCode: true,
                preferReasoning: true  // For system integration
            }
        }],
        ['general', {
            domain: 'general',
            preferredModels: ['claude-3.5-sonnet', 'gpt-4o', 'gemini-1.5-pro'],
            fallbackModels: ['claude-3-haiku', 'gpt-4o-mini'],
            requirements: {
                minContext: 16000,
                preferCode: false
            }
        }]
    ]);

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): DomainModelRouter {
        if (!DomainModelRouter.instance) {
            DomainModelRouter.instance = new DomainModelRouter();
        }
        return DomainModelRouter.instance;
    }

    // -------------------------------------------------------------------------
    // Domain Detection
    // -------------------------------------------------------------------------

    /**
     * Detect domain from task description
     */
    detectDomain(task: string, context?: Record<string, any>): DomainType {
        const taskLower = task.toLowerCase();

        // Mobile indicators
        const mobileKeywords = ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'app store', 'play store'];
        if (mobileKeywords.some(k => taskLower.includes(k))) {
            return 'mobile';
        }

        // Game indicators
        const gameKeywords = ['game', 'unity', 'unreal', 'godot', 'procedural', 'multiplayer', 'player', 'level', 'shader'];
        if (gameKeywords.some(k => taskLower.includes(k))) {
            return 'game';
        }

        // Desktop indicators
        const desktopKeywords = ['desktop', 'electron', 'tauri', 'windows', 'macos', 'linux', 'native', 'installer', 'system tray'];
        if (desktopKeywords.some(k => taskLower.includes(k))) {
            return 'desktop';
        }

        // Check context for hints
        if (context?.domain) {
            return context.domain as DomainType;
        }

        return 'general';
    }

    // -------------------------------------------------------------------------
    // Model Routing
    // -------------------------------------------------------------------------

    /**
     * Route task to optimal model based on domain
     */
    async routeTask(task: string, context?: Record<string, any>): Promise<RoutingResult> {
        const domain = this.detectDomain(task, context);
        const config = this.domainConfigs.get(domain)!;

        // Get available models
        const availableModels = await this.modelManager.listModels();
        const availableIds = availableModels.map(m => m.id);

        // Try preferred models first
        for (const modelId of config.preferredModels) {
            const isAvailable = availableIds.some(id => id.includes(modelId) || modelId.includes(id));
            if (isAvailable) {
                return {
                    selectedModel: modelId,
                    domain,
                    confidence: 0.9,
                    reasoning: `Selected ${modelId} as preferred model for ${domain} domain`
                };
            }
        }

        // Try fallback models
        for (const modelId of config.fallbackModels) {
            const isAvailable = availableIds.some(id => id.includes(modelId) || modelId.includes(id));
            if (isAvailable) {
                return {
                    selectedModel: modelId,
                    domain,
                    confidence: 0.7,
                    reasoning: `Selected ${modelId} as fallback model for ${domain} domain`
                };
            }
        }

        // Use whatever is available
        if (availableModels.length > 0) {
            return {
                selectedModel: availableModels[0].id,
                domain,
                confidence: 0.5,
                reasoning: `Using first available model ${availableModels[0].id}`
            };
        }

        return {
            selectedModel: 'unknown',
            domain,
            confidence: 0,
            reasoning: 'No models available'
        };
    }

    /**
     * Execute task with automatic model routing
     */
    async executeWithRouting(task: string, messages: any[], context?: Record<string, any>): Promise<{
        response: string;
        model: string;
        domain: DomainType;
    }> {
        const routing = await this.routeTask(task, context);

        // Add domain context to system prompt
        const domainContext = this.getDomainSystemPrompt(routing.domain);

        const response = await this.modelManager.chat([
            { role: 'system', content: domainContext, timestamp: new Date() },
            ...messages
        ]);

        this.emit('taskRouted', {
            task: task.substring(0, 100),
            model: routing.selectedModel,
            domain: routing.domain
        });

        return {
            response,
            model: routing.selectedModel,
            domain: routing.domain
        };
    }

    // -------------------------------------------------------------------------
    // Domain Prompts
    // -------------------------------------------------------------------------

    private getDomainSystemPrompt(domain: DomainType): string {
        const prompts: Record<DomainType, string> = {
            mobile: `You are an expert mobile developer specializing in iOS, Android, React Native, and Flutter. 
Focus on platform-specific best practices, performance optimization, and app store guidelines.
Consider device constraints, offline capabilities, and responsive design.`,

            game: `You are an expert game developer specializing in Unity, Unreal Engine, and Godot.
Focus on game architecture, performance optimization, and player experience.
Consider ECS patterns, procedural generation, and multiplayer networking.`,

            desktop: `You are an expert desktop application developer specializing in Electron, Tauri, and native development.
Focus on cross-platform compatibility, system integration, and native APIs.
Consider security, packaging, and auto-updates.`,

            general: `You are an expert software developer.
Provide clear, well-structured code with best practices.`
        };

        return prompts[domain];
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    updateDomainConfig(domain: DomainType, config: Partial<DomainRoutingConfig>): void {
        const existing = this.domainConfigs.get(domain);
        if (existing) {
            this.domainConfigs.set(domain, { ...existing, ...config });
        }
    }

    getDomainConfig(domain: DomainType): DomainRoutingConfig | undefined {
        return this.domainConfigs.get(domain);
    }

    getAllConfigs(): Record<DomainType, DomainRoutingConfig> {
        return Object.fromEntries(this.domainConfigs) as Record<DomainType, DomainRoutingConfig>;
    }
}

// Export singleton
export const domainModelRouter = DomainModelRouter.getInstance();
