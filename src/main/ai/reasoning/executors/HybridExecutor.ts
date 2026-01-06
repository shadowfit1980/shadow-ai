import { Step, StepGroup, StepResult } from '../types';
import { SequentialExecutor } from './SequentialExecutor';
import { ParallelExecutor } from './ParallelExecutor';

export class HybridExecutor {
    private sequentialExecutor: SequentialExecutor;
    private parallelExecutor: ParallelExecutor;

    constructor() {
        this.sequentialExecutor = new SequentialExecutor();
        this.parallelExecutor = new ParallelExecutor();
    }

    /**
     * Execute step groups with optimal strategy
     */
    async execute(groups: StepGroup[]): Promise<StepResult[]> {
        const allResults: StepResult[] = [];

        for (const group of groups) {
            console.log(`📊 Executing level ${group.level}: ${group.steps.length} steps`);

            let results: StepResult[];

            if (group.canParallelize && group.steps.length > 1) {
                results = await this.parallelExecutor.execute(group.steps);
            } else {
                results = await this.sequentialExecutor.execute(group.steps);
            }

            allResults.push(...results);

            // Check if any critical step failed
            const hasCriticalFailure = results.some(
                (r, i) => !r.success && !group.steps[i].retryable
            );

            if (hasCriticalFailure) {
                console.error(`❌ Critical failure in level ${group.level}, stopping execution`);
                break;
            }
        }

        return allResults;
    }

    registerTool(tool: any): void {
        this.sequentialExecutor.registerTool(tool);
        this.parallelExecutor.registerTool(tool);
    }
}
