import { AgentCoordinator } from '../agents/AgentCoordinator';
import { ModelManager } from '../ai/ModelManager';

export class VoiceService {
    private static instance: VoiceService;
    private coordinator: AgentCoordinator;
    private modelManager: ModelManager;

    private constructor() {
        this.coordinator = AgentCoordinator.getInstance();
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): VoiceService {
        if (!VoiceService.instance) {
            VoiceService.instance = new VoiceService();
        }
        return VoiceService.instance;
    }

    /**
     * Process a voice command
     * Analyzes intent and executes appropriate action
     */
    async processCommand(text: string): Promise<{ type: 'action' | 'chat' | 'error'; content: string }> {
        console.log(`Processing voice command: "${text}"`);

        try {
            // 1. Check for direct commands
            if (text.toLowerCase().startsWith('build')) {
                return await this.executeAction('/build', text);
            }
            if (text.toLowerCase().startsWith('debug') || text.toLowerCase().startsWith('fix')) {
                return await this.executeAction('/debug', text);
            }
            if (text.toLowerCase().startsWith('design')) {
                return await this.executeAction('/design', text);
            }
            if (text.toLowerCase().startsWith('deploy')) {
                return await this.executeAction('/deploy', text);
            }

            // 2. If no direct command, use LLM to determine intent (optional, for now treat as chat)
            // In a more advanced version, we would ask the LLM to classify the intent first.

            // 3. Default to chat
            return {
                type: 'chat',
                content: text
            };

        } catch (error: any) {
            console.error('Voice command error:', error);
            return {
                type: 'error',
                content: `Error processing command: ${error.message}`
            };
        }
    }

    /**
     * Execute an agent action
     */
    private async executeAction(command: string, originalText: string): Promise<{ type: 'action'; content: string }> {
        try {
            const result = await this.coordinator.executeCommand(command, {
                task: originalText,
                context: { source: 'voice' }
            });

            // Format result for speech
            let speechResponse = '';
            if (command === '/build') {
                speechResponse = 'I have started the build process. The architect is designing the system.';
            } else if (command === '/debug') {
                speechResponse = 'I am analyzing the code for issues.';
            } else if (command === '/design') {
                speechResponse = 'I am generating a design based on your request.';
            } else {
                speechResponse = `Executed command ${command}`;
            }

            return {
                type: 'action',
                content: speechResponse
            };
        } catch (error: any) {
            throw error;
        }
    }
}
