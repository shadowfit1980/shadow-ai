/**
 * Intelligent Auto-Model Switcher
 * Automatically detects task type and switches to optimal model
 * Grok Recommendation: Auto-switch models based on task type
 */
import { EventEmitter } from 'events';

interface TaskAnalysis {
    type: 'completion' | 'reasoning' | 'creative' | 'code' | 'analysis' | 'chat' | 'vision' | 'translation';
    complexity: 'simple' | 'medium' | 'complex';
    requiredCapabilities: string[];
    estimatedTokens: number;
    contextLength: number;
}

interface ModelProfile {
    id: string;
    name: string;
    provider: 'local' | 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'xai';
    strengths: string[];
    maxContext: number;
    speed: 'fast' | 'medium' | 'slow';
    costPerToken: number;
    localOnly: boolean;
}

interface SwitchDecision {
    selectedModel: ModelProfile;
    reason: string;
    alternatives: ModelProfile[];
    confidence: number;
}

export class AutoModelSwitcher extends EventEmitter {
    private static instance: AutoModelSwitcher;
    private modelProfiles: Map<string, ModelProfile> = new Map();
    private taskHistory: TaskAnalysis[] = [];
    private switchHistory: SwitchDecision[] = [];

    private constructor() {
        super();
        this.initializeModelProfiles();
    }

    static getInstance(): AutoModelSwitcher {
        if (!AutoModelSwitcher.instance) {
            AutoModelSwitcher.instance = new AutoModelSwitcher();
        }
        return AutoModelSwitcher.instance;
    }

    private initializeModelProfiles(): void {
        const profiles: ModelProfile[] = [
            // Local Models (Privacy-First)
            { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', provider: 'local', strengths: ['code', 'reasoning', 'analysis'], maxContext: 128000, speed: 'medium', costPerToken: 0, localOnly: true },
            { id: 'qwen3-coder', name: 'Qwen3 Coder', provider: 'local', strengths: ['code', 'agentic', 'reasoning'], maxContext: 256000, speed: 'medium', costPerToken: 0, localOnly: true },
            { id: 'codestral-22b', name: 'Codestral 22B', provider: 'local', strengths: ['code', 'completion'], maxContext: 32000, speed: 'fast', costPerToken: 0, localOnly: true },
            { id: 'llama3.2', name: 'Llama 3.2', provider: 'local', strengths: ['chat', 'reasoning'], maxContext: 128000, speed: 'fast', costPerToken: 0, localOnly: true },
            { id: 'phi-4', name: 'Phi-4', provider: 'local', strengths: ['reasoning', 'code'], maxContext: 16000, speed: 'fast', costPerToken: 0, localOnly: true },

            // Cloud Models
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', strengths: ['reasoning', 'creative', 'vision', 'code'], maxContext: 128000, speed: 'medium', costPerToken: 0.00001, localOnly: false },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', strengths: ['chat', 'completion'], maxContext: 128000, speed: 'fast', costPerToken: 0.00001, localOnly: false },
            { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', strengths: ['code', 'reasoning', 'analysis', 'creative'], maxContext: 200000, speed: 'medium', costPerToken: 0.000015, localOnly: false },
            { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'anthropic', strengths: ['chat', 'completion', 'code'], maxContext: 200000, speed: 'fast', costPerToken: 0.000001, localOnly: false },
            { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek', strengths: ['reasoning', 'code', 'analysis'], maxContext: 64000, speed: 'fast', costPerToken: 0.000001, localOnly: false },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'groq', strengths: ['chat', 'completion', 'vision'], maxContext: 1000000, speed: 'fast', costPerToken: 0.000001, localOnly: false },
            { id: 'grok-beta', name: 'Grok Beta', provider: 'xai', strengths: ['reasoning', 'creative', 'chat'], maxContext: 128000, speed: 'medium', costPerToken: 0.00001, localOnly: false },
        ];

        profiles.forEach(p => this.modelProfiles.set(p.id, p));
    }

    analyzeTask(prompt: string, context?: string): TaskAnalysis {
        const fullText = `${prompt} ${context || ''}`.toLowerCase();
        const wordCount = fullText.split(/\s+/).length;

        // Detect task type
        let type: TaskAnalysis['type'] = 'chat';
        if (/\b(code|function|class|implement|debug|fix|refactor|typescript|javascript|python)\b/.test(fullText)) {
            type = 'code';
        } else if (/\b(analyze|review|explain|breakdown|understand)\b/.test(fullText)) {
            type = 'analysis';
        } else if (/\b(create|write|generate|design|imagine|story|poem)\b/.test(fullText)) {
            type = 'creative';
        } else if (/\b(reason|think|solve|calculate|logic|math)\b/.test(fullText)) {
            type = 'reasoning';
        } else if (/\b(translate|convert|language)\b/.test(fullText)) {
            type = 'translation';
        } else if (/\b(image|screenshot|picture|photo|visual)\b/.test(fullText)) {
            type = 'vision';
        } else if (/\b(complete|finish|continue|autocomplete)\b/.test(fullText)) {
            type = 'completion';
        }

        // Detect complexity
        let complexity: TaskAnalysis['complexity'] = 'simple';
        if (wordCount > 500 || /\b(complex|advanced|enterprise|architecture|system)\b/.test(fullText)) {
            complexity = 'complex';
        } else if (wordCount > 100 || /\b(multiple|several|various|integrate)\b/.test(fullText)) {
            complexity = 'medium';
        }

        // Detect required capabilities
        const requiredCapabilities: string[] = [type];
        if (/\b(multi-file|project|refactor)\b/.test(fullText)) requiredCapabilities.push('agentic');
        if (/\b(fast|quick|instant)\b/.test(fullText)) requiredCapabilities.push('speed');
        if (/\b(accurate|precise|careful)\b/.test(fullText)) requiredCapabilities.push('accuracy');
        if (/\b(private|local|offline)\b/.test(fullText)) requiredCapabilities.push('local');

        const estimatedTokens = wordCount * 1.3;
        const contextLength = (context?.length || 0) / 4;

        return { type, complexity, requiredCapabilities, estimatedTokens, contextLength };
    }

    selectOptimalModel(task: TaskAnalysis, preferLocal: boolean = true): SwitchDecision {
        const candidates: { model: ModelProfile; score: number }[] = [];

        for (const model of this.modelProfiles.values()) {
            let score = 0;

            // Check if model meets context requirements
            if (model.maxContext < task.contextLength + task.estimatedTokens) continue;

            // Preference for local if specified
            if (preferLocal && model.localOnly) score += 30;

            // Match strengths to task type
            if (model.strengths.includes(task.type)) score += 25;

            // Speed bonus for simple tasks
            if (task.complexity === 'simple' && model.speed === 'fast') score += 15;
            if (task.complexity === 'complex' && model.speed !== 'fast') score += 10;

            // Context length bonus for complex tasks
            if (task.complexity === 'complex' && model.maxContext > 100000) score += 10;

            // Cost efficiency
            if (model.costPerToken === 0) score += 20;
            else if (model.costPerToken < 0.00001) score += 10;

            // Capability matching
            for (const cap of task.requiredCapabilities) {
                if (model.strengths.includes(cap)) score += 5;
                if (cap === 'local' && model.localOnly) score += 25;
            }

            candidates.push({ model, score });
        }

        candidates.sort((a, b) => b.score - a.score);

        const selected = candidates[0]?.model || this.modelProfiles.get('gpt-4o-mini')!;
        const alternatives = candidates.slice(1, 4).map(c => c.model);

        const decision: SwitchDecision = {
            selectedModel: selected,
            reason: this.generateReason(task, selected),
            alternatives,
            confidence: candidates[0]?.score ? Math.min(candidates[0].score / 100, 0.99) : 0.5
        };

        this.switchHistory.push(decision);
        this.emit('modelSelected', decision);

        return decision;
    }

    private generateReason(task: TaskAnalysis, model: ModelProfile): string {
        const reasons: string[] = [];

        if (model.localOnly) reasons.push('privacy-first local execution');
        if (model.strengths.includes(task.type)) reasons.push(`optimized for ${task.type} tasks`);
        if (task.complexity === 'complex' && model.maxContext > 100000) reasons.push('large context window for complex analysis');
        if (model.speed === 'fast') reasons.push('fast response time');
        if (model.costPerToken === 0) reasons.push('zero cost');

        return `Selected ${model.name}: ${reasons.join(', ')}`;
    }

    async autoSwitch(prompt: string, context?: string, preferLocal: boolean = true): Promise<SwitchDecision> {
        const task = this.analyzeTask(prompt, context);
        this.taskHistory.push(task);
        return this.selectOptimalModel(task, preferLocal);
    }

    getHistory(): { tasks: TaskAnalysis[]; switches: SwitchDecision[] } {
        return { tasks: this.taskHistory, switches: this.switchHistory };
    }

    addCustomModel(profile: ModelProfile): void {
        this.modelProfiles.set(profile.id, profile);
        this.emit('modelAdded', profile);
    }

    getAvailableModels(): ModelProfile[] {
        return Array.from(this.modelProfiles.values());
    }
}

export const autoModelSwitcher = AutoModelSwitcher.getInstance();
