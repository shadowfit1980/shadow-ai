/**
 * Model Validator - Validate model files
 */
import { EventEmitter } from 'events';

export interface ValidationResult { valid: boolean; format: string; architecture: string; contextLength: number; parameterCount: string; quantization?: string; errors: string[]; warnings: string[]; }

export class ModelValidatorEngine extends EventEmitter {
    private static instance: ModelValidatorEngine;
    private validFormats = ['gguf', 'safetensors', 'bin', 'pth'];
    private constructor() { super(); }
    static getInstance(): ModelValidatorEngine { if (!ModelValidatorEngine.instance) ModelValidatorEngine.instance = new ModelValidatorEngine(); return ModelValidatorEngine.instance; }

    async validate(filePath: string): Promise<ValidationResult> {
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const errors: string[] = []; const warnings: string[] = [];
        if (!this.validFormats.includes(ext)) errors.push(`Unsupported format: ${ext}`);
        const result: ValidationResult = { valid: errors.length === 0, format: ext, architecture: 'llama', contextLength: 4096, parameterCount: '7B', quantization: ext === 'gguf' ? 'Q4_K_M' : undefined, errors, warnings };
        if (result.valid) this.emit('validated', { filePath, result });
        return result;
    }

    checkCompatibility(modelPath: string, hardware: { vram: number; ram: number }): { compatible: boolean; recommendation: string } {
        const size = 4000000000; // Simulated
        if (hardware.vram >= size) return { compatible: true, recommendation: 'Full GPU inference' };
        if (hardware.ram >= size) return { compatible: true, recommendation: 'CPU inference with GPU offload' };
        return { compatible: false, recommendation: 'Try a smaller quantization' };
    }

    getSupportedFormats(): string[] { return [...this.validFormats]; }
}
export function getModelValidatorEngine(): ModelValidatorEngine { return ModelValidatorEngine.getInstance(); }
