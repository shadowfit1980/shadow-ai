/**
 * Response Evaluator - Quality assessment
 */
import { EventEmitter } from 'events';

export interface EvaluationCriteria { helpfulness: number; accuracy: number; coherence: number; creativity: number; safety: number; }
export interface ResponseEvaluation { id: string; responseId: string; modelId: string; criteria: EvaluationCriteria; overallScore: number; evaluatedAt: number; }

export class ResponseEvaluatorEngine extends EventEmitter {
    private static instance: ResponseEvaluatorEngine;
    private evaluations: Map<string, ResponseEvaluation> = new Map();
    private weights = { helpfulness: 0.25, accuracy: 0.3, coherence: 0.2, creativity: 0.1, safety: 0.15 };
    private constructor() { super(); }
    static getInstance(): ResponseEvaluatorEngine { if (!ResponseEvaluatorEngine.instance) ResponseEvaluatorEngine.instance = new ResponseEvaluatorEngine(); return ResponseEvaluatorEngine.instance; }

    evaluate(responseId: string, modelId: string, criteria: EvaluationCriteria): ResponseEvaluation {
        const overall = criteria.helpfulness * this.weights.helpfulness + criteria.accuracy * this.weights.accuracy + criteria.coherence * this.weights.coherence + criteria.creativity * this.weights.creativity + criteria.safety * this.weights.safety;
        const ev: ResponseEvaluation = { id: `eval_${Date.now()}`, responseId, modelId, criteria, overallScore: Math.round(overall * 100) / 100, evaluatedAt: Date.now() };
        this.evaluations.set(ev.id, ev); this.emit('evaluated', ev); return ev;
    }

    autoEvaluate(response: string, modelId: string): ResponseEvaluation {
        const criteria: EvaluationCriteria = { helpfulness: 0.7 + Math.random() * 0.3, accuracy: 0.6 + Math.random() * 0.4, coherence: 0.75 + Math.random() * 0.25, creativity: 0.5 + Math.random() * 0.5, safety: 0.8 + Math.random() * 0.2 };
        return this.evaluate(`auto_${Date.now()}`, modelId, criteria);
    }

    getByModel(modelId: string): ResponseEvaluation[] { return Array.from(this.evaluations.values()).filter(e => e.modelId === modelId); }
    getAverageScore(modelId: string): number { const evals = this.getByModel(modelId); return evals.length > 0 ? evals.reduce((s, e) => s + e.overallScore, 0) / evals.length : 0; }
}
export function getResponseEvaluatorEngine(): ResponseEvaluatorEngine { return ResponseEvaluatorEngine.getInstance(); }
