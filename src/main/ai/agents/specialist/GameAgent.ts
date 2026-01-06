/**
 * GameAgent - Game Development Specialist
 * 
 * Specializes in Unity, Unreal Engine, Godot, and general game development.
 * Provides engine detection, game architecture patterns, and procedural generation.
 */

import { SpecialistAgent, AgentTask, AgentResult, AgentCapability } from './base/SpecialistAgent';

export type GameEngine = 'unity' | 'unreal' | 'godot' | 'phaser' | 'custom';

export interface GameProject {
    engine: GameEngine;
    engineVersion?: string;
    genre?: string;
    targetPlatforms: string[];
    hasMultiplayer: boolean;
}

export interface GameArchitecture {
    patterns: string[];
    stateMachine?: any;
    components: string[];
    systems: string[];
}

export interface ProceduralAsset {
    type: 'terrain' | 'dungeon' | 'character' | 'item' | 'quest' | 'dialogue';
    parameters: Record<string, any>;
    seed?: number;
}

export class GameAgent extends SpecialistAgent {
    readonly agentType = 'GameAgent';
    readonly capabilities: AgentCapability[] = [
        {
            name: 'game_engine_detection',
            description: 'Detect game engine from project structure',
            confidenceLevel: 0.93
        },
        {
            name: 'game_architecture_design',
            description: 'Design game systems and architecture patterns',
            confidenceLevel: 0.88
        },
        {
            name: 'unity_development',
            description: 'Generate Unity C# scripts and assets',
            confidenceLevel: 0.9
        },
        {
            name: 'unreal_development',
            description: 'Generate Unreal C++ and Blueprint suggestions',
            confidenceLevel: 0.82
        },
        {
            name: 'godot_development',
            description: 'Generate GDScript and Godot scenes',
            confidenceLevel: 0.85
        },
        {
            name: 'procedural_generation',
            description: 'Create procedural content algorithms',
            confidenceLevel: 0.87
        },
        {
            name: 'multiplayer_architecture',
            description: 'Design netcode and multiplayer systems',
            confidenceLevel: 0.8
        },
        {
            name: 'game_balance',
            description: 'Analyze and suggest game balance adjustments',
            confidenceLevel: 0.75
        }
    ];

    async execute(task: AgentTask): Promise<AgentResult> {
        console.log(`🎮 GameAgent executing: ${task.task}`);

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
            // Detect game engine
            const project = await this.detectGameProject(task);

            // Generate game-specific solution
            const solution = await this.generateGameSolution(task, project);

            // Add architecture recommendations
            const architecture = await this.designArchitecture(task, project);

            const result: AgentResult = {
                success: true,
                summary: `Generated ${project.engine} solution with ${architecture.patterns.length} patterns`,
                artifacts: [
                    { type: 'project', data: project },
                    { type: 'solution', data: solution },
                    { type: 'architecture', data: architecture }
                ],
                confidence: 0.86,
                explanation: `Created ${project.engine} solution for ${project.genre || 'game'} development`,
                estimatedEffort: await this.estimateEffort(task)
            };

            this.recordExecution(task.task, true, result.confidence);
            return result;

        } catch (error) {
            this.recordExecution(task.task, false, 0);
            return {
                success: false,
                summary: 'Game development task failed',
                confidence: 0,
                explanation: (error as Error).message
            };
        }
    }

    /**
     * Detect game engine and project structure
     */
    async detectGameProject(task: AgentTask): Promise<GameProject> {
        const prompt = `Analyze this game development task and detect the engine/framework:

Task: ${task.task}
Spec: ${task.spec}
Context: ${JSON.stringify(task.context || {})}

Detect:
1. Game engine (Unity, Unreal, Godot, Phaser, custom)
2. Engine version if mentioned
3. Game genre
4. Target platforms
5. Multiplayer requirements

Response in JSON:
\`\`\`json
{
  "engine": "unity",
  "engineVersion": "2022.3",
  "genre": "RPG",
  "targetPlatforms": ["PC", "Console"],
  "hasMultiplayer": false
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a game development expert who can identify engines and project requirements.'
        );

        const parsed = this.parseJSON(response);
        return {
            engine: parsed.engine || 'unity',
            engineVersion: parsed.engineVersion,
            genre: parsed.genre,
            targetPlatforms: parsed.targetPlatforms || ['PC'],
            hasMultiplayer: parsed.hasMultiplayer || false
        };
    }

    /**
     * Generate engine-specific solution
     */
    async generateGameSolution(task: AgentTask, project: GameProject): Promise<any> {
        const engineGuidelines = this.getEngineGuidelines(project.engine);

        const prompt = `Generate a ${project.engine} solution for this game task:

Task: ${task.task}
Spec: ${task.spec}
Genre: ${project.genre || 'General'}

Engine Guidelines:
${engineGuidelines}

Provide:
1. Complete script/code
2. Component structure
3. Asset requirements
4. Integration notes

Response in JSON:
\`\`\`json
{
  "code": "// Game code here",
  "components": ["PlayerController", "HealthSystem"],
  "assets": ["Player model", "Animations"],
  "integrationNotes": ["Attach to player prefab"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            `You are an expert ${project.engine} developer creating production game systems.`
        );

        return this.parseJSON(response);
    }

    /**
     * Design game architecture
     */
    async designArchitecture(task: AgentTask, project: GameProject): Promise<GameArchitecture> {
        const prompt = `Design game architecture for:

Task: ${task.task}
Engine: ${project.engine}
Genre: ${project.genre || 'General'}
Multiplayer: ${project.hasMultiplayer}

Recommend:
1. Design patterns (ECS, State Machine, etc.)
2. Core systems
3. Component structure

Response in JSON:
\`\`\`json
{
  "patterns": ["Entity-Component-System", "State Machine", "Observer"],
  "systems": ["InputSystem", "MovementSystem", "CombatSystem"],
  "components": ["Transform", "Health", "Inventory"],
  "stateMachine": {
    "states": ["Idle", "Moving", "Attacking"],
    "transitions": [{"from": "Idle", "to": "Moving", "trigger": "input"}]
  }
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a senior game architect designing scalable game systems.'
        );

        const parsed = this.parseJSON(response);
        return {
            patterns: parsed.patterns || ['Component'],
            stateMachine: parsed.stateMachine,
            components: parsed.components || [],
            systems: parsed.systems || []
        };
    }

    /**
     * Generate procedural content
     */
    async generateProcedural(asset: ProceduralAsset, project: GameProject): Promise<string> {
        const prompt = `Generate procedural ${asset.type} algorithm for ${project.engine}:

Parameters: ${JSON.stringify(asset.parameters)}
Seed: ${asset.seed || 'random'}

Create a complete, production-ready procedural generation function
that generates ${asset.type} content with these parameters.

Use engine-appropriate code (C# for Unity, GDScript for Godot, etc.)`;

        const response = await this.callModel(
            prompt,
            `You are a procedural generation expert specializing in ${project.engine}.`
        );

        return response;
    }

    /**
     * Design multiplayer architecture
     */
    async designMultiplayer(task: AgentTask, project: GameProject): Promise<any> {
        const prompt = `Design multiplayer architecture for:

Task: ${task.task}
Engine: ${project.engine}
Target Platforms: ${project.targetPlatforms.join(', ')}

Recommend:
1. Network topology (P2P, Client-Server, etc.)
2. State synchronization approach
3. Lag compensation techniques
4. Netcode patterns

Response in JSON:
\`\`\`json
{
  "topology": "client-server",
  "syncApproach": "state-synchronization",
  "lagCompensation": ["client-side-prediction", "server-reconciliation"],
  "tickRate": 64,
  "libraries": ["Netcode for GameObjects", "Mirror"],
  "considerations": ["NAT traversal", "matchmaking"]
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a multiplayer systems architect specializing in low-latency game networking.'
        );

        return this.parseJSON(response);
    }

    /**
     * Analyze game balance
     */
    async analyzeBalance(gameData: any): Promise<any> {
        const prompt = `Analyze game balance based on this data:

Game Data: ${JSON.stringify(gameData)}

Analyze:
1. Power curves
2. Economy balance
3. Player progression
4. Difficulty scaling

Provide balance recommendations:
\`\`\`json
{
  "issues": ["Weapon X is overpowered by 15%"],
  "recommendations": ["Reduce damage by 10-15%"],
  "economyHealth": 0.85,
  "progressionScore": 0.78
}
\`\`\``;

        const response = await this.callModel(
            prompt,
            'You are a game balance designer with expertise in player psychology and economy systems.'
        );

        return this.parseJSON(response);
    }

    /**
     * Get engine-specific guidelines
     */
    private getEngineGuidelines(engine: GameEngine): string {
        const guidelines: Record<GameEngine, string> = {
            'unity': `
- Use C# with proper MonoBehaviour lifecycle
- Implement object pooling for performance
- Use ScriptableObjects for data
- Follow Unity's ECS where performance-critical
- Use Addressables for asset management`,

            'unreal': `
- Use C++ for performance-critical systems
- Blueprints for rapid prototyping
- Implement proper Gameplay Framework
- Use Behavior Trees for AI
- Follow Unreal's reflection system`,

            'godot': `
- Use GDScript for simplicity
- C# or GDExtension for performance
- Implement signals for communication
- Use scenes as components
- Follow node-based architecture`,

            'phaser': `
- Use TypeScript for type safety
- Implement proper scene management
- Use texture atlases
- Pool game objects
- Optimize for web performance`,

            'custom': `
- Implement core game loop
- Design entity-component system
- Create asset pipeline
- Build rendering abstraction
- Handle input consistently`
        };

        return guidelines[engine] || guidelines['custom'];
    }
}
