import { Step, DependencyGraph, StepGroup } from './types';

export class DependencyResolver {
    /**
     * Resolve dependencies and create execution graph
     */
    resolve(steps: Step[]): DependencyGraph {
        const nodes = new Map<string, Step>();
        const edges = new Map<string, string[]>();

        // Build nodes
        steps.forEach(step => {
            nodes.set(step.id, step);
            edges.set(step.id, step.dependencies);
        });

        // Detect circular dependencies
        this.detectCircularDependencies(nodes, edges);

        // Create levels (topological sort)
        const levels = this.topologicalSort(nodes, edges);

        return { nodes, edges, levels };
    }

    /**
     * Topological sort to determine execution order
     */
    private topologicalSort(
        nodes: Map<string, Step>,
        edges: Map<string, string[]>
    ): Step[][] {
        const levels: Step[][] = [];
        const inDegree = new Map<string, number>();
        const processed = new Set<string>();

        // Calculate in-degrees
        nodes.forEach((_, id) => inDegree.set(id, 0));
        edges.forEach(deps => {
            deps.forEach(dep => {
                inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
            });
        });

        // Process levels
        while (processed.size < nodes.size) {
            const currentLevel: Step[] = [];

            // Find nodes with no dependencies
            nodes.forEach((step, id) => {
                if (!processed.has(id) && inDegree.get(id) === 0) {
                    currentLevel.push(step);
                }
            });

            if (currentLevel.length === 0 && processed.size < nodes.size) {
                throw new Error('Circular dependency detected');
            }

            // Mark as processed and update in-degrees
            currentLevel.forEach(step => {
                processed.add(step.id);
                const dependents = this.getDependents(step.id, edges);
                dependents.forEach(depId => {
                    inDegree.set(depId, (inDegree.get(depId) || 0) - 1);
                });
            });

            if (currentLevel.length > 0) {
                levels.push(currentLevel);
            }
        }

        return levels;
    }

    /**
     * Find all nodes that depend on a given node
     */
    private getDependents(nodeId: string, edges: Map<string, string[]>): string[] {
        const dependents: string[] = [];
        edges.forEach((deps, id) => {
            if (deps.includes(nodeId)) {
                dependents.push(id);
            }
        });
        return dependents;
    }

    /**
     * Detect circular dependencies
     */
    private detectCircularDependencies(
        nodes: Map<string, Step>,
        edges: Map<string, string[]>
    ): void {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const hasCycle = (nodeId: string): boolean => {
            visited.add(nodeId);
            recursionStack.add(nodeId);

            const dependencies = edges.get(nodeId) || [];
            for (const dep of dependencies) {
                if (!visited.has(dep)) {
                    if (hasCycle(dep)) return true;
                } else if (recursionStack.has(dep)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of nodes.keys()) {
            if (!visited.has(nodeId)) {
                if (hasCycle(nodeId)) {
                    throw new Error(`Circular dependency detected involving: ${nodeId}`);
                }
            }
        }
    }

    /**
     * Identify groups of steps that can be parallelized
     */
    findParallelGroups(graph: DependencyGraph): StepGroup[] {
        return graph.levels.map((steps, index) => ({
            level: index,
            steps,
            canParallelize: steps.length > 1,
        }));
    }

    /**
     * Estimate total execution time
     */
    estimateDuration(groups: StepGroup[]): number {
        let total = 0;
        groups.forEach(group => {
            if (group.canParallelize) {
                // Parallel: max duration in group
                const maxDuration = Math.max(
                    ...group.steps.map(s => s.timeout || 5000)
                );
                total += maxDuration;
            } else {
                // Sequential: sum of durations
                const sumDuration = group.steps.reduce(
                    (sum, s) => sum + (s.timeout || 5000),
                    0
                );
                total += sumDuration;
            }
        });
        return total;
    }
}
