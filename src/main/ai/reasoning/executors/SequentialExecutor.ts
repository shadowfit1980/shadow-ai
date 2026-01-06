import { Step, StepResult } from '../types';
import { BaseExecutor } from './BaseExecutor';

export class SequentialExecutor extends BaseExecutor {
    /**
     * Execute steps one by one in order
     */
    async execute(steps: Step[]): Promise<StepResult[]> {
        const results: StepResult[] = [];

        for (const step of steps) {
            console.log(`⚙️ Executing step: ${step.description}`);

            const result = await this.executeStep(step);
            results.push(result);

            if (!result.success) {
                console.error(`❌ Step failed: ${step.id}`, result.error);

                // Stop on first failure unless step is optional
                if (step.retryable) {
                    const retryResult = await this.retryStep(step);
                    if (retryResult.success) {
                        results[results.length - 1] = retryResult;
                        continue;
                    }
                }

                // Stop execution on critical failure
                break;
            }

            console.log(`✅ Step completed: ${step.id}`);
        }

        return results;
    }

    private async retryStep(step: Step, maxRetries: number = 3): Promise<StepResult> {
        for (let i = 0; i < maxRetries; i++) {
            console.log(`🔄 Retry ${i + 1}/${maxRetries} for step: ${step.id}`);

            await this.delay(Math.pow(2, i) * 1000); // Exponential backoff

            const result = await this.executeStep(step);
            if (result.success) {
                return result;
            }
        }

        // All retries failed
        return await this.executeStep(step);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
