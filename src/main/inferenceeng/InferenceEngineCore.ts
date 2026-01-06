/**
 * Inference Engine - Core inference
 */
import { EventEmitter } from 'events';

export interface InferenceRequest { id: string; modelId: string; prompt: string; options: InferenceOptions; output?: string; tokensGenerated: number; startTime: number; endTime?: number; }
export interface InferenceOptions { temperature: number; topP: number; topK: number; maxTokens: number; stopSequences: string[]; repeatPenalty: number; seed?: number; }

export class InferenceEngineCore extends EventEmitter {
    private static instance: InferenceEngineCore;
    private activeRequests: Map<string, InferenceRequest> = new Map();
    private defaultOptions: InferenceOptions = { temperature: 0.7, topP: 0.9, topK: 40, maxTokens: 2048, stopSequences: [], repeatPenalty: 1.1 };
    private constructor() { super(); }
    static getInstance(): InferenceEngineCore { if (!InferenceEngineCore.instance) InferenceEngineCore.instance = new InferenceEngineCore(); return InferenceEngineCore.instance; }

    async infer(modelId: string, prompt: string, options: Partial<InferenceOptions> = {}): Promise<InferenceRequest> {
        const req: InferenceRequest = { id: `inf_${Date.now()}`, modelId, prompt, options: { ...this.defaultOptions, ...options }, tokensGenerated: 0, startTime: Date.now() };
        this.activeRequests.set(req.id, req);
        req.output = `[${modelId}] Response to: ${prompt.slice(0, 30)}...`; req.tokensGenerated = req.output.split(' ').length * 1.3;
        req.endTime = Date.now(); this.activeRequests.delete(req.id);
        this.emit('complete', req); return req;
    }

    abort(requestId: string): boolean { const req = this.activeRequests.get(requestId); if (!req) return false; this.activeRequests.delete(requestId); this.emit('aborted', requestId); return true; }
    getActiveCount(): number { return this.activeRequests.size; }
    setDefaultOptions(options: Partial<InferenceOptions>): void { Object.assign(this.defaultOptions, options); }
}
export function getInferenceEngineCore(): InferenceEngineCore { return InferenceEngineCore.getInstance(); }
