/**
 * Image Animator - Animate still images
 */
import { EventEmitter } from 'events';

export interface AnimationRequest { id: string; imagePath: string; motion: 'zoom' | 'pan' | 'rotate' | 'parallax' | 'breathing'; duration: number; looping: boolean; status: 'processing' | 'complete'; outputUrl?: string; }

export class ImageAnimatorEngine extends EventEmitter {
    private static instance: ImageAnimatorEngine;
    private requests: Map<string, AnimationRequest> = new Map();
    private constructor() { super(); }
    static getInstance(): ImageAnimatorEngine { if (!ImageAnimatorEngine.instance) ImageAnimatorEngine.instance = new ImageAnimatorEngine(); return ImageAnimatorEngine.instance; }

    async animate(imagePath: string, motion: AnimationRequest['motion'] = 'zoom', duration = 3, looping = true): Promise<AnimationRequest> {
        const req: AnimationRequest = { id: `anim_${Date.now()}`, imagePath, motion, duration, looping, status: 'processing' };
        this.requests.set(req.id, req);
        await new Promise(r => setTimeout(r, 150));
        req.status = 'complete'; req.outputUrl = `https://output.shadow.ai/animations/${req.id}.mp4`;
        this.emit('complete', req); return req;
    }

    async createGIF(imagePath: string, motion: AnimationRequest['motion'], frames = 30): Promise<AnimationRequest> { const req = await this.animate(imagePath, motion, frames / 10, true); req.outputUrl = req.outputUrl?.replace('.mp4', '.gif'); return req; }
    getMotionTypes(): AnimationRequest['motion'][] { return ['zoom', 'pan', 'rotate', 'parallax', 'breathing']; }
    get(requestId: string): AnimationRequest | null { return this.requests.get(requestId) || null; }
}
export function getImageAnimatorEngine(): ImageAnimatorEngine { return ImageAnimatorEngine.getInstance(); }
