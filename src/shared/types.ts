/**
 * Shared type definitions used across main and renderer processes
 */

export interface AIModel {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'mistral' | 'deepseek' | 'gemini' | 'ollama' | 'gpt4all' | 'lmstudio';
    type: 'cloud' | 'local';
    available: boolean;
    performance?: ModelPerformance;
}

export interface ModelPerformance {
    responseTime: number; // milliseconds
    accuracy: number; // 0-1
    tokensPerSecond: number;
    lastUsed: Date;
}

export interface AgentMessage {
    role: 'user' | 'assistant' | 'system' | 'agent';
    content: string;
    agentType?: AgentType;
    timestamp: Date;
}

export type AgentType = 'architect' | 'builder' | 'debugger' | 'ux' | 'communicator';

export interface ProjectConfig {
    name: string;
    type: 'nextjs' | 'react' | 'vue' | 'astro' | 'flask' | 'express' | 'rust' | 'go';
    path: string;
    framework?: string;
    dependencies?: string[];
}

export interface BuildResult {
    success: boolean;
    output: string;
    errors?: string[];
    warnings?: string[];
    artifacts?: string[];
}

export interface FileAnalysis {
    type: 'image' | 'pdf' | 'audio' | 'website' | 'code';
    content: string;
    metadata: Record<string, any>;
    extractedData?: any;
}

export interface Command {
    name: string;
    description: string;
    handler: string; // Agent type that handles this command
    parameters?: Record<string, any>;
}

export const COMMANDS: Command[] = [
    { name: '/build', description: 'Build a complete project', handler: 'builder' },
    { name: '/debug', description: 'Detect and fix code issues', handler: 'debugger' },
    { name: '/design', description: 'Generate or import UI design', handler: 'ux' },
    { name: '/deploy', description: 'Deploy website or app', handler: 'builder' },
    { name: '/evolve', description: 'Improve agent intelligence', handler: 'architect' },
    { name: '/analyze', description: 'Analyze files or code', handler: 'architect' },
];
