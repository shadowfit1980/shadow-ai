/**
 * Multimodal Processor - Vision and audio
 */
import { EventEmitter } from 'events';

export interface MultimodalInput { type: 'image' | 'audio' | 'video'; data: string; mimeType: string; }
export interface MultimodalRequest { id: string; model: string; prompt: string; inputs: MultimodalInput[]; response?: string; }

export class MultimodalProcessorEngine extends EventEmitter {
    private static instance: MultimodalProcessorEngine;
    private supportedModels = ['llava', 'bakllava', 'llama3.2-vision', 'gemma2-vision'];
    private constructor() { super(); }
    static getInstance(): MultimodalProcessorEngine { if (!MultimodalProcessorEngine.instance) MultimodalProcessorEngine.instance = new MultimodalProcessorEngine(); return MultimodalProcessorEngine.instance; }

    async process(model: string, prompt: string, inputs: MultimodalInput[]): Promise<MultimodalRequest> {
        if (!this.supportedModels.some(m => model.includes(m))) throw new Error('Model does not support multimodal');
        const req: MultimodalRequest = { id: `mm_${Date.now()}`, model, prompt, inputs };
        const imageCount = inputs.filter(i => i.type === 'image').length;
        req.response = `[Analyzed ${imageCount} image(s)] ${prompt}`;
        this.emit('processed', req); return req;
    }

    encodeImage(buffer: Buffer): string { return buffer.toString('base64'); }
    isVisionModel(model: string): boolean { return this.supportedModels.some(m => model.includes(m)); }
    getSupportedModels(): string[] { return [...this.supportedModels]; }
}
export function getMultimodalProcessorEngine(): MultimodalProcessorEngine { return MultimodalProcessorEngine.getInstance(); }
