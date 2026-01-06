/**
 * Autonomous Task Decomposition
 * 
 * Automatically breaks complex tasks into manageable subtasks,
 * tracks dependencies, and executes in optimal order.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface Subtask {
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed';
    priority: number;
    estimatedTime: number; // minutes
    actualTime?: number;
    result?: any;
    error?: string;
}

interface TaskPlan {
    id: string;
    originalTask: string;
    subtasks: Subtask[];
    status: 'planning' | 'executing' | 'completed' | 'failed';
    createdAt: number;
    completedAt?: number;
    progress: number; // 0-100
}

interface DecompositionPattern {
    trigger: RegExp;
    decompose: (task: string) => Subtask[];
}

// ============================================================================
// AUTONOMOUS TASK DECOMPOSITION
// ============================================================================

export class AutonomousTaskDecomposition extends EventEmitter {
    private static instance: AutonomousTaskDecomposition;
    private activePlans: Map<string, TaskPlan> = new Map();
    private patterns: DecompositionPattern[] = [];

    private constructor() {
        super();
        this.initializePatterns();
    }

    static getInstance(): AutonomousTaskDecomposition {
        if (!AutonomousTaskDecomposition.instance) {
            AutonomousTaskDecomposition.instance = new AutonomousTaskDecomposition();
        }
        return AutonomousTaskDecomposition.instance;
    }

    // ========================================================================
    // DECOMPOSITION PATTERNS
    // ========================================================================

    private initializePatterns(): void {
        // E-commerce site pattern
        this.patterns.push({
            trigger: /e-?commerce|online store|shop/i,
            decompose: (task) => [
                this.createSubtask('Setup Project', 'Initialize project with framework', [], 1, 15),
                this.createSubtask('Database Schema', 'Design and create database models', ['Setup Project'], 2, 30),
                this.createSubtask('User Authentication', 'Implement user registration and login', ['Database Schema'], 3, 45),
                this.createSubtask('Product Catalog', 'Create product listing and details', ['Database Schema'], 3, 60),
                this.createSubtask('Shopping Cart', 'Implement cart functionality', ['Product Catalog'], 4, 45),
                this.createSubtask('Checkout Flow', 'Build checkout process', ['Shopping Cart', 'User Authentication'], 5, 60),
                this.createSubtask('Payment Integration', 'Integrate payment gateway', ['Checkout Flow'], 6, 45),
                this.createSubtask('Order Management', 'Handle orders and history', ['Payment Integration'], 7, 30),
                this.createSubtask('Admin Panel', 'Create admin dashboard', ['Product Catalog', 'Order Management'], 8, 60),
                this.createSubtask('Testing', 'Write tests for all features', ['Admin Panel'], 9, 60),
            ],
        });

        // Landing page pattern
        this.patterns.push({
            trigger: /landing page|marketing page|homepage/i,
            decompose: (task) => [
                this.createSubtask('Setup Project', 'Initialize HTML/CSS project', [], 1, 10),
                this.createSubtask('Hero Section', 'Create hero with headline and CTA', ['Setup Project'], 2, 20),
                this.createSubtask('Features Section', 'Display key features/benefits', ['Setup Project'], 2, 25),
                this.createSubtask('Testimonials', 'Add social proof section', ['Setup Project'], 3, 20),
                this.createSubtask('Pricing Section', 'Create pricing table', ['Setup Project'], 3, 25),
                this.createSubtask('FAQ Section', 'Add frequently asked questions', ['Setup Project'], 4, 15),
                this.createSubtask('Footer', 'Create footer with links', ['Setup Project'], 4, 15),
                this.createSubtask('Responsive Design', 'Make mobile-friendly', ['Hero Section', 'Features Section'], 5, 30),
                this.createSubtask('Animations', 'Add scroll animations', ['Responsive Design'], 6, 20),
                this.createSubtask('SEO Optimization', 'Add meta tags and optimize', ['Animations'], 7, 15),
            ],
        });

        // API pattern
        this.patterns.push({
            trigger: /api|rest|backend|server/i,
            decompose: (task) => [
                this.createSubtask('Setup Project', 'Initialize Node.js/Express project', [], 1, 10),
                this.createSubtask('Database Setup', 'Configure database connection', ['Setup Project'], 2, 15),
                this.createSubtask('Models', 'Create data models', ['Database Setup'], 3, 30),
                this.createSubtask('CRUD Endpoints', 'Implement basic endpoints', ['Models'], 4, 45),
                this.createSubtask('Authentication', 'Add JWT auth middleware', ['Setup Project'], 3, 30),
                this.createSubtask('Authorization', 'Implement role-based access', ['Authentication'], 5, 20),
                this.createSubtask('Validation', 'Add input validation', ['CRUD Endpoints'], 5, 20),
                this.createSubtask('Error Handling', 'Implement error middleware', ['Validation'], 6, 15),
                this.createSubtask('API Documentation', 'Generate OpenAPI docs', ['CRUD Endpoints'], 7, 20),
                this.createSubtask('Testing', 'Write API tests', ['API Documentation'], 8, 45),
            ],
        });

        // Full-stack app pattern
        this.patterns.push({
            trigger: /full-?stack|web app|application/i,
            decompose: (task) => [
                this.createSubtask('Project Architecture', 'Plan monorepo structure', [], 1, 15),
                this.createSubtask('Backend Setup', 'Initialize API server', ['Project Architecture'], 2, 20),
                this.createSubtask('Frontend Setup', 'Initialize React app', ['Project Architecture'], 2, 20),
                this.createSubtask('Database Schema', 'Design data models', ['Backend Setup'], 3, 30),
                this.createSubtask('API Endpoints', 'Create REST/GraphQL API', ['Database Schema'], 4, 60),
                this.createSubtask('Authentication', 'Implement auth flow', ['API Endpoints'], 5, 45),
                this.createSubtask('UI Components', 'Build reusable components', ['Frontend Setup'], 4, 60),
                this.createSubtask('State Management', 'Setup Redux/Zustand', ['UI Components'], 5, 30),
                this.createSubtask('API Integration', 'Connect frontend to backend', ['API Endpoints', 'State Management'], 6, 45),
                this.createSubtask('Testing', 'Write E2E and unit tests', ['API Integration'], 7, 60),
                this.createSubtask('Deployment', 'Setup CI/CD and deploy', ['Testing'], 8, 45),
            ],
        });

        // Mobile app pattern
        this.patterns.push({
            trigger: /mobile app|react native|flutter|ios|android/i,
            decompose: (task) => [
                this.createSubtask('Setup Project', 'Initialize React Native/Flutter', [], 1, 20),
                this.createSubtask('Navigation', 'Setup navigation structure', ['Setup Project'], 2, 30),
                this.createSubtask('UI Components', 'Create core components', ['Setup Project'], 2, 45),
                this.createSubtask('State Management', 'Setup state solution', ['UI Components'], 3, 25),
                this.createSubtask('API Integration', 'Connect to backend', ['State Management'], 4, 40),
                this.createSubtask('Authentication', 'Implement auth screens', ['API Integration'], 5, 45),
                this.createSubtask('Core Features', 'Build main app features', ['Authentication'], 6, 90),
                this.createSubtask('Offline Support', 'Add offline capabilities', ['Core Features'], 7, 30),
                this.createSubtask('Push Notifications', 'Integrate notifications', ['Core Features'], 7, 25),
                this.createSubtask('App Store Prep', 'Prepare for submission', ['Offline Support'], 8, 30),
            ],
        });
    }

    private createSubtask(
        title: string,
        description: string,
        dependencies: string[],
        priority: number,
        estimatedTime: number
    ): Subtask {
        return {
            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            title,
            description,
            dependencies,
            status: 'pending',
            priority,
            estimatedTime,
        };
    }

    // ========================================================================
    // TASK DECOMPOSITION
    // ========================================================================

    async decomposeTask(task: string): Promise<TaskPlan> {
        const planId = `plan-${Date.now()}`;

        // Find matching pattern
        let subtasks: Subtask[] = [];

        for (const pattern of this.patterns) {
            if (pattern.trigger.test(task)) {
                subtasks = pattern.decompose(task);
                break;
            }
        }

        // Generic decomposition if no pattern matched
        if (subtasks.length === 0) {
            subtasks = this.genericDecompose(task);
        }

        const plan: TaskPlan = {
            id: planId,
            originalTask: task,
            subtasks,
            status: 'planning',
            createdAt: Date.now(),
            progress: 0,
        };

        this.activePlans.set(planId, plan);
        this.emit('plan:created', plan);

        return plan;
    }

    private genericDecompose(task: string): Subtask[] {
        return [
            this.createSubtask('Analyze Requirements', 'Understand what needs to be built', [], 1, 15),
            this.createSubtask('Design Solution', 'Plan the implementation approach', ['Analyze Requirements'], 2, 20),
            this.createSubtask('Setup Environment', 'Initialize project and dependencies', ['Design Solution'], 3, 15),
            this.createSubtask('Implement Core', 'Build main functionality', ['Setup Environment'], 4, 60),
            this.createSubtask('Add Features', 'Implement additional features', ['Implement Core'], 5, 45),
            this.createSubtask('Testing', 'Test all functionality', ['Add Features'], 6, 30),
            this.createSubtask('Polish', 'Refine and optimize', ['Testing'], 7, 20),
        ];
    }

    // ========================================================================
    // EXECUTION
    // ========================================================================

    async executePlan(
        planId: string,
        executeSubtask: (subtask: Subtask) => Promise<any>
    ): Promise<TaskPlan> {
        const plan = this.activePlans.get(planId);
        if (!plan) throw new Error(`Plan not found: ${planId}`);

        plan.status = 'executing';
        this.emit('plan:started', plan);

        // Execute subtasks in dependency order
        const completedIds = new Set<string>();

        while (completedIds.size < plan.subtasks.length) {
            // Find ready subtasks
            const ready = plan.subtasks.filter(s =>
                s.status === 'pending' &&
                s.dependencies.every(dep =>
                    plan.subtasks.find(d => d.title === dep)?.status === 'completed'
                )
            );

            if (ready.length === 0) {
                // Check for blocked state
                const pending = plan.subtasks.filter(s => s.status === 'pending');
                if (pending.length > 0) {
                    plan.status = 'failed';
                    this.emit('plan:blocked', { plan, pending });
                    break;
                }
                break;
            }

            // Execute ready subtasks in parallel
            await Promise.all(ready.map(async (subtask) => {
                subtask.status = 'in-progress';
                const startTime = Date.now();
                this.emit('subtask:started', subtask);

                try {
                    subtask.result = await executeSubtask(subtask);
                    subtask.status = 'completed';
                    subtask.actualTime = (Date.now() - startTime) / 60000; // minutes
                    completedIds.add(subtask.id);
                    this.emit('subtask:completed', subtask);
                } catch (error) {
                    subtask.status = 'failed';
                    subtask.error = error instanceof Error ? error.message : String(error);
                    this.emit('subtask:failed', subtask);
                }
            }));

            // Update progress
            plan.progress = Math.round((completedIds.size / plan.subtasks.length) * 100);
            this.emit('plan:progress', { planId, progress: plan.progress });
        }

        // Finalize
        const allCompleted = plan.subtasks.every(s => s.status === 'completed');
        plan.status = allCompleted ? 'completed' : 'failed';
        plan.completedAt = Date.now();

        this.emit('plan:completed', plan);
        return plan;
    }

    // ========================================================================
    // PLAN MANAGEMENT
    // ========================================================================

    getPlan(planId: string): TaskPlan | undefined {
        return this.activePlans.get(planId);
    }

    getReadySubtasks(planId: string): Subtask[] {
        const plan = this.activePlans.get(planId);
        if (!plan) return [];

        return plan.subtasks.filter(s =>
            s.status === 'pending' &&
            s.dependencies.every(dep =>
                plan.subtasks.find(d => d.title === dep)?.status === 'completed'
            )
        );
    }

    getEstimatedTime(planId: string): number {
        const plan = this.activePlans.get(planId);
        if (!plan) return 0;

        return plan.subtasks.reduce((sum, s) => sum + s.estimatedTime, 0);
    }

    getProgress(planId: string): number {
        const plan = this.activePlans.get(planId);
        return plan?.progress || 0;
    }
}

export const autonomousTaskDecomposition = AutonomousTaskDecomposition.getInstance();
