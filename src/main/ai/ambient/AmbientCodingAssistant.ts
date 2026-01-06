/**
 * Ambient Coding Assistant
 * AI that listens and codes while user relaxes
 * Grok Recommendation: Ambient Coding / Telepresence Control
 */
import { EventEmitter } from 'events';

interface AmbientTask {
    id: string;
    description: string;
    status: 'queued' | 'listening' | 'processing' | 'coding' | 'complete' | 'paused';
    progress: number;
    output: CodeOutput[];
    startTime: Date;
    endTime?: Date;
    voiceLog: VoiceEntry[];
}

interface VoiceEntry {
    timestamp: Date;
    text: string;
    type: 'user' | 'assistant' | 'system';
    intent?: string;
}

interface CodeOutput {
    type: 'file' | 'modification' | 'command' | 'explanation';
    path?: string;
    content: string;
    timestamp: Date;
}

interface AmbientSettings {
    listenContinuously: boolean;
    autoConfirm: boolean;
    musicMode: boolean;
    breakReminders: boolean;
    calmMode: boolean;
    voiceFeedback: boolean;
    ambientSound: 'none' | 'rain' | 'cafe' | 'nature' | 'whitenoise';
}

interface ContextualAwareness {
    currentFile: string | null;
    recentActions: string[];
    userMood: 'focused' | 'relaxed' | 'tired' | 'unknown';
    sessionDuration: number;
    tasksCompleted: number;
}

export class AmbientCodingAssistant extends EventEmitter {
    private static instance: AmbientCodingAssistant;
    private currentTask: AmbientTask | null = null;
    private taskHistory: AmbientTask[] = [];
    private settings: AmbientSettings;
    private context: ContextualAwareness;
    private isListening: boolean = false;
    private ambientQueue: string[] = [];

    private constructor() {
        super();
        this.settings = this.getDefaultSettings();
        this.context = this.getDefaultContext();
    }

    static getInstance(): AmbientCodingAssistant {
        if (!AmbientCodingAssistant.instance) {
            AmbientCodingAssistant.instance = new AmbientCodingAssistant();
        }
        return AmbientCodingAssistant.instance;
    }

    private getDefaultSettings(): AmbientSettings {
        return {
            listenContinuously: true,
            autoConfirm: false,
            musicMode: false,
            breakReminders: true,
            calmMode: true,
            voiceFeedback: true,
            ambientSound: 'rain'
        };
    }

    private getDefaultContext(): ContextualAwareness {
        return {
            currentFile: null,
            recentActions: [],
            userMood: 'unknown',
            sessionDuration: 0,
            tasksCompleted: 0
        };
    }

    startAmbientMode(): { success: boolean; message: string } {
        if (this.isListening) {
            return { success: false, message: 'Already in ambient mode' };
        }

        this.isListening = true;
        this.emit('ambientStarted', { settings: this.settings });

        if (this.settings.ambientSound !== 'none') {
            this.emit('playAmbientSound', this.settings.ambientSound);
        }

        return {
            success: true,
            message: 'Ambient mode activated. Relax, I\'m listening and ready to help.'
        };
    }

    stopAmbientMode(): void {
        this.isListening = false;
        this.emit('ambientStopped');
    }

    processVoiceInput(transcript: string): void {
        if (!this.isListening) return;

        const entry: VoiceEntry = {
            timestamp: new Date(),
            text: transcript,
            type: 'user',
            intent: this.detectIntent(transcript)
        };

        if (this.currentTask) {
            this.currentTask.voiceLog.push(entry);
        }

        this.emit('voiceReceived', entry);

        // Process based on intent
        switch (entry.intent) {
            case 'create_file':
                this.handleCreateFile(transcript);
                break;
            case 'modify_code':
                this.handleModifyCode(transcript);
                break;
            case 'explain':
                this.handleExplain(transcript);
                break;
            case 'pause':
                this.pauseTask();
                break;
            case 'resume':
                this.resumeTask();
                break;
            case 'stop':
                this.stopAmbientMode();
                break;
            case 'status':
                this.reportStatus();
                break;
            default:
                this.queueAmbientRequest(transcript);
        }
    }

    private detectIntent(text: string): string {
        const lower = text.toLowerCase();

        if (/create|make|new|add\s+(a\s+)?file|component|function/i.test(lower)) return 'create_file';
        if (/change|modify|update|edit|fix/i.test(lower)) return 'modify_code';
        if (/explain|what|how|why/i.test(lower)) return 'explain';
        if (/pause|wait|hold on/i.test(lower)) return 'pause';
        if (/resume|continue|go on/i.test(lower)) return 'resume';
        if (/stop|quit|exit/i.test(lower)) return 'stop';
        if (/status|progress|how.*going/i.test(lower)) return 'status';

        return 'general';
    }

    private handleCreateFile(transcript: string): void {
        const task = this.createTask(`Create: ${transcript}`);

        // Simulate file creation based on voice
        const fileName = this.extractFileName(transcript);
        const fileType = this.detectFileType(transcript);

        const output: CodeOutput = {
            type: 'file',
            path: `src/${fileName}.${fileType}`,
            content: this.generateFileContent(fileName, fileType, transcript),
            timestamp: new Date()
        };

        task.output.push(output);
        task.progress = 100;
        task.status = 'complete';
        task.endTime = new Date();

        this.speak(`Created ${fileName}.${fileType}`);
        this.emit('fileCreated', output);
    }

    private handleModifyCode(transcript: string): void {
        const task = this.createTask(`Modify: ${transcript}`);

        const output: CodeOutput = {
            type: 'modification',
            path: this.context.currentFile || 'current file',
            content: `// Modification based on: "${transcript}"\n// Changes applied...`,
            timestamp: new Date()
        };

        task.output.push(output);
        task.progress = 100;
        task.status = 'complete';
        task.endTime = new Date();

        this.speak('Changes applied');
        this.emit('codeModified', output);
    }

    private handleExplain(transcript: string): void {
        const explanation = this.generateExplanation(transcript);

        const output: CodeOutput = {
            type: 'explanation',
            content: explanation,
            timestamp: new Date()
        };

        if (this.currentTask) {
            this.currentTask.output.push(output);
        }

        this.speak(explanation);
        this.emit('explanation', explanation);
    }

    private extractFileName(transcript: string): string {
        const match = transcript.match(/(?:called|named)\s+(\w+)/i);
        if (match) return match[1];

        const typeMatch = transcript.match(/(component|function|hook|service|util|helper|page)\s+(\w+)/i);
        if (typeMatch) return typeMatch[2];

        return 'NewFile';
    }

    private detectFileType(transcript: string): string {
        if (/component|react|jsx/i.test(transcript)) return 'tsx';
        if (/style|css|scss/i.test(transcript)) return 'css';
        if (/test|spec/i.test(transcript)) return 'test.ts';
        if (/json|config/i.test(transcript)) return 'json';
        return 'ts';
    }

    private generateFileContent(name: string, type: string, description: string): string {
        if (type === 'tsx') {
            return `import React from 'react';\n\n// Generated from: "${description}"\nexport const ${name}: React.FC = () => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name};\n`;
        }
        if (type === 'css') {
            return `/* ${name} styles */\n/* Generated from: "${description}" */\n\n.${name.toLowerCase()} {\n  display: flex;\n  flex-direction: column;\n}\n`;
        }
        return `// ${name}\n// Generated from: "${description}"\n\nexport function ${name}() {\n  // TODO: Implement\n}\n`;
    }

    private generateExplanation(query: string): string {
        // Simplified explanation generation
        if (/how.*work/i.test(query)) {
            return 'This code works by processing the input and returning a transformed output.';
        }
        if (/what.*is/i.test(query)) {
            return 'This is a module that handles a specific functionality in the application.';
        }
        if (/why/i.test(query)) {
            return 'This approach was chosen for its simplicity and maintainability.';
        }
        return 'I can see the code here. Would you like me to explain a specific part?';
    }

    private queueAmbientRequest(request: string): void {
        this.ambientQueue.push(request);
        this.speak('Got it, I\'ll work on that');
        this.emit('taskQueued', request);

        // Process queue in background
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        while (this.ambientQueue.length > 0 && this.isListening) {
            const request = this.ambientQueue.shift()!;
            const task = this.createTask(request);

            task.status = 'processing';
            this.emit('taskProcessing', task);

            // Simulate work
            await new Promise(resolve => setTimeout(resolve, 2000));

            task.status = 'complete';
            task.progress = 100;
            task.endTime = new Date();
            this.context.tasksCompleted++;

            this.emit('taskComplete', task);
        }
    }

    private createTask(description: string): AmbientTask {
        const task: AmbientTask = {
            id: `task_${Date.now()}`,
            description,
            status: 'queued',
            progress: 0,
            output: [],
            startTime: new Date(),
            voiceLog: []
        };

        this.currentTask = task;
        this.taskHistory.push(task);
        this.emit('taskCreated', task);

        return task;
    }

    pauseTask(): void {
        if (this.currentTask) {
            this.currentTask.status = 'paused';
            this.speak('Paused. Let me know when to continue.');
            this.emit('taskPaused', this.currentTask);
        }
    }

    resumeTask(): void {
        if (this.currentTask && this.currentTask.status === 'paused') {
            this.currentTask.status = 'processing';
            this.speak('Resuming...');
            this.emit('taskResumed', this.currentTask);
        }
    }

    private reportStatus(): void {
        const status = this.currentTask
            ? `Working on: ${this.currentTask.description}. Progress: ${this.currentTask.progress}%`
            : 'No active task. I\'m ready when you are.';

        this.speak(status);
        this.emit('statusReport', { status, context: this.context });
    }

    private speak(text: string): void {
        if (this.settings.voiceFeedback) {
            this.emit('speak', text);
        }

        const entry: VoiceEntry = {
            timestamp: new Date(),
            text,
            type: 'assistant'
        };

        if (this.currentTask) {
            this.currentTask.voiceLog.push(entry);
        }
    }

    setCurrentFile(filePath: string): void {
        this.context.currentFile = filePath;
        this.emit('contextUpdated', this.context);
    }

    updateSettings(newSettings: Partial<AmbientSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.emit('settingsUpdated', this.settings);
    }

    getSettings(): AmbientSettings {
        return { ...this.settings };
    }

    getContext(): ContextualAwareness {
        return { ...this.context };
    }

    getHistory(): AmbientTask[] {
        return [...this.taskHistory];
    }

    getCurrentTask(): AmbientTask | null {
        return this.currentTask;
    }

    isActive(): boolean {
        return this.isListening;
    }

    getAmbientSounds(): string[] {
        return ['none', 'rain', 'cafe', 'nature', 'whitenoise'];
    }

    getCalmingMessage(): string {
        const messages = [
            'Take your time, I\'m here when you need me.',
            'Feel free to relax, I\'ll handle the details.',
            'No rush. Quality work takes time.',
            'I\'m working quietly in the background.',
            'Everything is under control.'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

export const ambientCodingAssistant = AmbientCodingAssistant.getInstance();
