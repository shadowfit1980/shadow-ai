import { Step, StepResult, ToolDefinition } from '../types';

export abstract class BaseExecutor {
    protected tools: Map<string, ToolDefinition> = new Map();

    registerTool(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
    }

    protected async executeStep(step: Step): Promise<StepResult> {
        const startTime = Date.now();
        let retries = 0;

        step.status = 'running';

        try {
            let result: any;

            if (step.tool) {
                // Execute using registered tool
                const tool = this.tools.get(step.tool);
                if (!tool) {
                    throw new Error(`Tool not found: ${step.tool}`);
                }

                result = await this.executeWithTimeout(
                    () => tool.execute(step.inputs),
                    step.timeout || tool.timeout || 30000
                );
            } else {
                // Execute as generic action
                result = await this.executeAction(step);
            }

            step.status = 'completed';

            return {
                stepId: step.id,
                success: true,
                output: result,
                duration: Date.now() - startTime,
                retries,
            };
        } catch (error: any) {
            step.status = 'failed';

            return {
                stepId: step.id,
                success: false,
                error,
                duration: Date.now() - startTime,
                retries,
            };
        }
    }

    protected async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeout: number
    ): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error('Execution timeout')), timeout)
            ),
        ]);
    }

    protected async executeAction(step: Step): Promise<any> {
        // Default action execution (can be overridden)
        console.log(`Executing action: ${step.action}`);
        return { success: true, message: `Completed: ${step.description}` };
    }

    abstract execute(steps: Step[]): Promise<StepResult[]>;
}
