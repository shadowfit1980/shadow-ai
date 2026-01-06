import { Step, StepResult } from '../types';
import { BaseExecutor } from './BaseExecutor';

export class ParallelExecutor extends BaseExecutor {
    /**
     * Execute all steps concurrently
     */
    async execute(steps: Step[]): Promise<StepResult[]> {
        console.log(`⚡ Executing ${steps.length} steps in parallel`);

        const promises = steps.map(step => this.executeStep(step));
        const results = await Promise.all(promises);

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ Completed: ${successCount}/${steps.length} steps successful`);

        return results;
    }

    /**
     * Execute steps with concurrency limit
     */
    async executeWithLimit(steps: Step[], limit: number): Promise<StepResult[]> {
        const results: StepResult[] = [];
        const executing: Promise<void>[] = [];

        for (const step of steps) {
            const promise = this.executeStep(step).then(result => {
                results.push(result);
            });

            executing.push(promise);

            if (executing.length >= limit) {
                await Promise.race(executing);
                executing.splice(
                    executing.findIndex(p => p === promise),
                    1
                );
            }
        }

        await Promise.all(executing);
        return results;
    }
}
