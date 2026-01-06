/**
 * Neural Interface Bridge
 * Preparation for future BCI (Brain-Computer Interface) integration
 * Grok Recommendation: Neural Interface Bridge
 */
import { EventEmitter } from 'events';

interface NeuralSignal {
    timestamp: Date;
    type: 'focus' | 'stress' | 'intention' | 'emotion' | 'motor' | 'attention';
    value: number;
    confidence: number;
    raw?: number[];
}

interface IntentPattern {
    id: string;
    name: string;
    description: string;
    signalPattern: number[];
    confidence: number;
    action: string;
}

interface BrainState {
    focusLevel: number;
    stressLevel: number;
    fatigueLevel: number;
    alertness: number;
    cognitiveLoad: number;
    emotionalValence: number;
    timestamp: Date;
}

interface NeuralDevice {
    id: string;
    name: string;
    type: 'eeg' | 'fnirs' | 'emg' | 'hybrid' | 'simulated';
    channels: number;
    sampleRate: number;
    connected: boolean;
    batteryLevel: number;
}

interface CommandMapping {
    intent: string;
    action: string;
    requiredConfidence: number;
    cooldownMs: number;
    lastTriggered?: Date;
}

export class NeuralInterfaceBridge extends EventEmitter {
    private static instance: NeuralInterfaceBridge;
    private connectedDevice: NeuralDevice | null = null;
    private currentState: BrainState;
    private intentPatterns: Map<string, IntentPattern> = new Map();
    private commandMappings: Map<string, CommandMapping> = new Map();
    private signalBuffer: NeuralSignal[] = [];
    private isProcessing: boolean = false;
    private calibrationData: Map<string, number[]> = new Map();

    private constructor() {
        super();
        this.currentState = this.getDefaultState();
        this.initializePatterns();
        this.initializeCommandMappings();
    }

    static getInstance(): NeuralInterfaceBridge {
        if (!NeuralInterfaceBridge.instance) {
            NeuralInterfaceBridge.instance = new NeuralInterfaceBridge();
        }
        return NeuralInterfaceBridge.instance;
    }

    private getDefaultState(): BrainState {
        return {
            focusLevel: 50,
            stressLevel: 30,
            fatigueLevel: 20,
            alertness: 70,
            cognitiveLoad: 40,
            emotionalValence: 60,
            timestamp: new Date()
        };
    }

    private initializePatterns(): void {
        const patterns: IntentPattern[] = [
            { id: 'scroll_down', name: 'Scroll Down', description: 'Intent to scroll down', signalPattern: [0.8, 0.2, 0.1], confidence: 0.7, action: 'editor.scrollDown' },
            { id: 'scroll_up', name: 'Scroll Up', description: 'Intent to scroll up', signalPattern: [0.2, 0.8, 0.1], confidence: 0.7, action: 'editor.scrollUp' },
            { id: 'accept', name: 'Accept/Confirm', description: 'Mental confirmation', signalPattern: [0.9, 0.9, 0.5], confidence: 0.8, action: 'suggestion.accept' },
            { id: 'reject', name: 'Reject/Cancel', description: 'Mental rejection', signalPattern: [0.1, 0.1, 0.9], confidence: 0.8, action: 'suggestion.reject' },
            { id: 'focus_mode', name: 'Enter Focus', description: 'High concentration detected', signalPattern: [0.95, 0.3, 0.2], confidence: 0.85, action: 'mode.focus' },
            { id: 'break_needed', name: 'Break Needed', description: 'Fatigue detected', signalPattern: [0.2, 0.8, 0.7], confidence: 0.75, action: 'suggest.break' },
            { id: 'thinking', name: 'Deep Thinking', description: 'Problem solving mode', signalPattern: [0.7, 0.6, 0.4], confidence: 0.7, action: 'mode.thinking' },
            { id: 'ready_to_code', name: 'Ready to Code', description: 'Optimal coding state', signalPattern: [0.85, 0.25, 0.3], confidence: 0.8, action: 'mode.coding' },
        ];

        patterns.forEach(p => this.intentPatterns.set(p.id, p));
    }

    private initializeCommandMappings(): void {
        const mappings: CommandMapping[] = [
            { intent: 'scroll_down', action: 'window.scrollBy(0, 100)', requiredConfidence: 0.7, cooldownMs: 500 },
            { intent: 'scroll_up', action: 'window.scrollBy(0, -100)', requiredConfidence: 0.7, cooldownMs: 500 },
            { intent: 'accept', action: 'acceptCurrentSuggestion()', requiredConfidence: 0.85, cooldownMs: 1000 },
            { intent: 'reject', action: 'rejectCurrentSuggestion()', requiredConfidence: 0.85, cooldownMs: 1000 },
            { intent: 'focus_mode', action: 'enableFocusMode()', requiredConfidence: 0.9, cooldownMs: 5000 },
            { intent: 'break_needed', action: 'showBreakReminder()', requiredConfidence: 0.75, cooldownMs: 60000 },
        ];

        mappings.forEach(m => this.commandMappings.set(m.intent, m));
    }

    async connectDevice(deviceType: NeuralDevice['type'] = 'simulated'): Promise<NeuralDevice> {
        const device: NeuralDevice = {
            id: `device_${Date.now()}`,
            name: deviceType === 'simulated' ? 'Simulated BCI' : `${deviceType.toUpperCase()} Device`,
            type: deviceType,
            channels: deviceType === 'eeg' ? 8 : deviceType === 'fnirs' ? 4 : 2,
            sampleRate: deviceType === 'eeg' ? 256 : 100,
            connected: true,
            batteryLevel: 100
        };

        this.connectedDevice = device;
        this.emit('deviceConnected', device);

        if (deviceType === 'simulated') {
            this.startSimulation();
        }

        return device;
    }

    disconnectDevice(): boolean {
        if (!this.connectedDevice) return false;

        this.isProcessing = false;
        const device = this.connectedDevice;
        this.connectedDevice = null;
        this.emit('deviceDisconnected', device);
        return true;
    }

    private startSimulation(): void {
        this.isProcessing = true;

        const simulationLoop = () => {
            if (!this.isProcessing || !this.connectedDevice) return;

            // Simulate neural signals
            const signal: NeuralSignal = {
                timestamp: new Date(),
                type: this.randomSignalType(),
                value: Math.random(),
                confidence: 0.5 + Math.random() * 0.5,
                raw: Array(this.connectedDevice.channels).fill(0).map(() => Math.random())
            };

            this.processSignal(signal);

            if (this.isProcessing) {
                setTimeout(simulationLoop, 100); // 10 Hz simulation
            }
        };

        simulationLoop();
    }

    private randomSignalType(): NeuralSignal['type'] {
        const types: NeuralSignal['type'][] = ['focus', 'stress', 'intention', 'emotion', 'motor', 'attention'];
        return types[Math.floor(Math.random() * types.length)];
    }

    processSignal(signal: NeuralSignal): void {
        this.signalBuffer.push(signal);

        // Keep buffer size manageable
        if (this.signalBuffer.length > 100) {
            this.signalBuffer.shift();
        }

        this.updateBrainState(signal);
        this.detectIntent(signal);
        this.emit('signalReceived', signal);
    }

    private updateBrainState(signal: NeuralSignal): void {
        const smoothingFactor = 0.1;

        switch (signal.type) {
            case 'focus':
                this.currentState.focusLevel = this.smooth(this.currentState.focusLevel, signal.value * 100, smoothingFactor);
                break;
            case 'stress':
                this.currentState.stressLevel = this.smooth(this.currentState.stressLevel, signal.value * 100, smoothingFactor);
                break;
            case 'attention':
                this.currentState.alertness = this.smooth(this.currentState.alertness, signal.value * 100, smoothingFactor);
                break;
            case 'emotion':
                this.currentState.emotionalValence = this.smooth(this.currentState.emotionalValence, signal.value * 100, smoothingFactor);
                break;
        }

        // Update fatigue based on time and stress
        this.currentState.fatigueLevel = Math.min(100, this.currentState.fatigueLevel + 0.01);
        this.currentState.cognitiveLoad = (this.currentState.focusLevel + this.currentState.stressLevel) / 2;
        this.currentState.timestamp = new Date();

        this.emit('stateUpdated', this.currentState);
    }

    private smooth(current: number, target: number, factor: number): number {
        return current + (target - current) * factor;
    }

    private detectIntent(signal: NeuralSignal): void {
        if (signal.type !== 'intention' || signal.confidence < 0.6) return;

        // Match against patterns (simplified pattern matching)
        for (const [id, pattern] of this.intentPatterns) {
            if (this.matchPattern(signal, pattern)) {
                this.triggerIntent(id, signal.confidence);
                break;
            }
        }
    }

    private matchPattern(signal: NeuralSignal, pattern: IntentPattern): boolean {
        if (!signal.raw || signal.raw.length === 0) return false;

        // Simplified pattern matching
        const avg = signal.raw.reduce((a, b) => a + b, 0) / signal.raw.length;
        const patternMatch = pattern.signalPattern[0]; // Compare to first pattern element

        return Math.abs(avg - patternMatch) < 0.3 && signal.confidence >= pattern.confidence;
    }

    private triggerIntent(intentId: string, confidence: number): void {
        const mapping = this.commandMappings.get(intentId);
        if (!mapping) return;

        if (confidence < mapping.requiredConfidence) return;

        const now = new Date();
        if (mapping.lastTriggered && (now.getTime() - mapping.lastTriggered.getTime()) < mapping.cooldownMs) {
            return; // Still in cooldown
        }

        mapping.lastTriggered = now;
        this.emit('intentDetected', { intentId, confidence, action: mapping.action });
    }

    async calibrate(calibrationType: 'baseline' | 'focus' | 'relax'): Promise<{ success: boolean; message: string }> {
        this.emit('calibrationStarted', calibrationType);

        // Simulate calibration (would collect real data)
        await new Promise(resolve => setTimeout(resolve, 3000));

        const calibrationSamples = this.signalBuffer.slice(-30).map(s => s.value);
        this.calibrationData.set(calibrationType, calibrationSamples);

        this.emit('calibrationComplete', { type: calibrationType, samples: calibrationSamples.length });
        return { success: true, message: `${calibrationType} calibration complete` };
    }

    getBrainState(): BrainState {
        return { ...this.currentState };
    }

    getDevice(): NeuralDevice | null {
        return this.connectedDevice ? { ...this.connectedDevice } : null;
    }

    getPatterns(): IntentPattern[] {
        return Array.from(this.intentPatterns.values());
    }

    addPattern(pattern: IntentPattern): void {
        this.intentPatterns.set(pattern.id, pattern);
        this.emit('patternAdded', pattern);
    }

    removePattern(patternId: string): boolean {
        const removed = this.intentPatterns.delete(patternId);
        if (removed) {
            this.emit('patternRemoved', patternId);
        }
        return removed;
    }

    setCommandMapping(intent: string, action: string, requiredConfidence: number = 0.8): void {
        this.commandMappings.set(intent, {
            intent,
            action,
            requiredConfidence,
            cooldownMs: 1000
        });
    }

    getSignalQuality(): { quality: number; issues: string[] } {
        const issues: string[] = [];
        let quality = 100;

        if (!this.connectedDevice) {
            return { quality: 0, issues: ['No device connected'] };
        }

        if (this.connectedDevice.batteryLevel < 20) {
            quality -= 20;
            issues.push('Low battery');
        }

        if (this.signalBuffer.length < 10) {
            quality -= 30;
            issues.push('Insufficient signal data');
        }

        const avgConfidence = this.signalBuffer.reduce((sum, s) => sum + s.confidence, 0) / (this.signalBuffer.length || 1);
        if (avgConfidence < 0.5) {
            quality -= 25;
            issues.push('Low signal confidence');
        }

        return { quality: Math.max(0, quality), issues };
    }

    getSupportedDevices(): { name: string; type: NeuralDevice['type']; description: string }[] {
        return [
            { name: 'Simulated BCI', type: 'simulated', description: 'Simulated device for testing' },
            { name: 'EEG Headset', type: 'eeg', description: 'Electroencephalography headset' },
            { name: 'fNIRS Device', type: 'fnirs', description: 'Functional near-infrared spectroscopy' },
            { name: 'EMG Armband', type: 'emg', description: 'Electromyography for gesture control' },
            { name: 'Hybrid System', type: 'hybrid', description: 'Multi-modal neural interface' }
        ];
    }

    getStats(): {
        signalsProcessed: number;
        intentsDetected: number;
        uptime: number;
    } {
        return {
            signalsProcessed: this.signalBuffer.length,
            intentsDetected: Array.from(this.commandMappings.values()).filter(m => m.lastTriggered).length,
            uptime: this.isProcessing ? Date.now() : 0
        };
    }
}

export const neuralInterfaceBridge = NeuralInterfaceBridge.getInstance();
