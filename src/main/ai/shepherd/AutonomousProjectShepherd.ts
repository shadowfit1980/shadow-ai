/**
 * Autonomous Project Shepherd
 * 
 * A guardian system that watches over projects, anticipates issues,
 * maintains health, and guides development towards success.
 */

import { EventEmitter } from 'events';

export interface Project {
    id: string;
    name: string;
    path: string;
    health: ProjectHealth;
    vitals: ProjectVitals;
    guardians: Guardian[];
    alerts: Alert[];
    goals: Goal[];
    timeline: ProjectEvent[];
    status: ProjectStatus;
    createdAt: Date;
    lastCheck: Date;
}

export type ProjectStatus = 'healthy' | 'warning' | 'critical' | 'dormant';

export interface ProjectHealth {
    overall: number;
    codeQuality: number;
    testCoverage: number;
    security: number;
    performance: number;
    documentation: number;
    dependencies: number;
}

export interface ProjectVitals {
    linesOfCode: number;
    filesCount: number;
    dependencies: number;
    lastCommit: Date;
    openIssues: number;
    technicalDebt: number;
    buildTime: number;
    testPassRate: number;
}

export interface Guardian {
    id: string;
    name: string;
    type: GuardianType;
    active: boolean;
    triggers: Trigger[];
    actions: GuardianAction[];
    lastTriggered?: Date;
}

export type GuardianType =
    | 'quality'
    | 'security'
    | 'performance'
    | 'dependency'
    | 'deadline'
    | 'complexity';

export interface Trigger {
    condition: string;
    threshold: number;
    comparison: 'above' | 'below' | 'equals';
}

export interface GuardianAction {
    type: 'alert' | 'fix' | 'report' | 'notify';
    description: string;
    automated: boolean;
}

export interface Alert {
    id: string;
    guardianId: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    suggestions: string[];
    acknowledged: boolean;
    createdAt: Date;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    progress: number;
    milestones: Milestone[];
    status: 'pending' | 'in_progress' | 'completed' | 'at_risk';
}

export interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: Date;
}

export interface ProjectEvent {
    timestamp: Date;
    type: EventType;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    data?: any;
}

export type EventType =
    | 'health_check'
    | 'guardian_triggered'
    | 'goal_updated'
    | 'alert_created'
    | 'fix_applied'
    | 'milestone_reached';

export interface HealthReport {
    projectId: string;
    generatedAt: Date;
    summary: string;
    healthScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: Recommendation[];
    forecast: Forecast;
}

export interface Recommendation {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    effort: 'small' | 'medium' | 'large';
    impact: 'small' | 'medium' | 'large';
}

export interface Forecast {
    trend: 'improving' | 'stable' | 'declining';
    riskLevel: number;
    predictedIssues: string[];
    opportunities: string[];
}

export class AutonomousProjectShepherd extends EventEmitter {
    private static instance: AutonomousProjectShepherd;
    private projects: Map<string, Project> = new Map();
    private checkInterval?: NodeJS.Timeout;

    private constructor() {
        super();
    }

    static getInstance(): AutonomousProjectShepherd {
        if (!AutonomousProjectShepherd.instance) {
            AutonomousProjectShepherd.instance = new AutonomousProjectShepherd();
        }
        return AutonomousProjectShepherd.instance;
    }

    // ========================================================================
    // PROJECT MANAGEMENT
    // ========================================================================

    async createProject(name: string, path: string): Promise<Project> {
        const project: Project = {
            id: `proj_${Date.now()}`,
            name,
            path,
            health: {
                overall: 80,
                codeQuality: 75,
                testCoverage: 60,
                security: 85,
                performance: 70,
                documentation: 50,
                dependencies: 80,
            },
            vitals: {
                linesOfCode: 0,
                filesCount: 0,
                dependencies: 0,
                lastCommit: new Date(),
                openIssues: 0,
                technicalDebt: 0,
                buildTime: 0,
                testPassRate: 100,
            },
            guardians: this.createDefaultGuardians(),
            alerts: [],
            goals: [],
            timeline: [],
            status: 'healthy',
            createdAt: new Date(),
            lastCheck: new Date(),
        };

        this.projects.set(project.id, project);
        this.addEvent(project, 'health_check', 'Project created and initial health check performed', 'neutral');
        this.emit('project:created', project);

        return project;
    }

    private createDefaultGuardians(): Guardian[] {
        return [
            {
                id: 'guard_quality',
                name: 'Code Quality Guardian',
                type: 'quality',
                active: true,
                triggers: [
                    { condition: 'codeQuality', threshold: 70, comparison: 'below' },
                ],
                actions: [
                    { type: 'alert', description: 'Create code quality alert', automated: true },
                    { type: 'report', description: 'Generate quality report', automated: true },
                ],
            },
            {
                id: 'guard_security',
                name: 'Security Guardian',
                type: 'security',
                active: true,
                triggers: [
                    { condition: 'security', threshold: 80, comparison: 'below' },
                ],
                actions: [
                    { type: 'alert', description: 'Security vulnerability detected', automated: true },
                ],
            },
            {
                id: 'guard_tests',
                name: 'Test Coverage Guardian',
                type: 'quality',
                active: true,
                triggers: [
                    { condition: 'testCoverage', threshold: 50, comparison: 'below' },
                ],
                actions: [
                    { type: 'alert', description: 'Test coverage is low', automated: true },
                ],
            },
            {
                id: 'guard_deps',
                name: 'Dependency Guardian',
                type: 'dependency',
                active: true,
                triggers: [
                    { condition: 'dependencies', threshold: 60, comparison: 'below' },
                ],
                actions: [
                    { type: 'notify', description: 'Outdated dependencies detected', automated: true },
                ],
            },
            {
                id: 'guard_perf',
                name: 'Performance Guardian',
                type: 'performance',
                active: true,
                triggers: [
                    { condition: 'performance', threshold: 60, comparison: 'below' },
                ],
                actions: [
                    { type: 'report', description: 'Performance degradation detected', automated: true },
                ],
            },
        ];
    }

    // ========================================================================
    // HEALTH MONITORING
    // ========================================================================

    async checkHealth(projectId: string): Promise<ProjectHealth | undefined> {
        const project = this.projects.get(projectId);
        if (!project) return undefined;

        this.emit('health:checking', project);

        // Simulate health check (in practice, this would analyze actual code)
        const health = await this.analyzeHealth(project);
        project.health = health;
        project.lastCheck = new Date();

        // Calculate overall status
        project.status = this.calculateStatus(health);

        // Run guardians
        await this.runGuardians(project);

        this.addEvent(project, 'health_check', `Health check completed. Score: ${health.overall}`,
            health.overall >= 70 ? 'positive' : 'negative');

        this.emit('health:checked', { project, health });
        return health;
    }

    private async analyzeHealth(project: Project): Promise<ProjectHealth> {
        // Simulate analysis - in practice would analyze actual code
        const current = project.health;

        // Slight random variations to simulate real changes
        const vary = (value: number) => Math.max(0, Math.min(100, value + (Math.random() - 0.5) * 5));

        const health: ProjectHealth = {
            codeQuality: vary(current.codeQuality),
            testCoverage: vary(current.testCoverage),
            security: vary(current.security),
            performance: vary(current.performance),
            documentation: vary(current.documentation),
            dependencies: vary(current.dependencies),
            overall: 0,
        };

        // Calculate overall as weighted average
        health.overall = Math.round(
            health.codeQuality * 0.25 +
            health.testCoverage * 0.15 +
            health.security * 0.2 +
            health.performance * 0.15 +
            health.documentation * 0.1 +
            health.dependencies * 0.15
        );

        return health;
    }

    private calculateStatus(health: ProjectHealth): ProjectStatus {
        if (health.overall >= 80) return 'healthy';
        if (health.overall >= 60) return 'warning';
        if (health.overall >= 40) return 'critical';
        return 'dormant';
    }

    // ========================================================================
    // GUARDIANS
    // ========================================================================

    private async runGuardians(project: Project): Promise<void> {
        for (const guardian of project.guardians) {
            if (!guardian.active) continue;

            for (const trigger of guardian.triggers) {
                const value = project.health[trigger.condition as keyof ProjectHealth];
                const triggered = this.evaluateTrigger(value, trigger);

                if (triggered) {
                    guardian.lastTriggered = new Date();
                    await this.executeGuardianActions(project, guardian);
                    this.addEvent(project, 'guardian_triggered',
                        `${guardian.name} triggered: ${trigger.condition}`, 'negative');
                }
            }
        }
    }

    private evaluateTrigger(value: number, trigger: Trigger): boolean {
        switch (trigger.comparison) {
            case 'above': return value > trigger.threshold;
            case 'below': return value < trigger.threshold;
            case 'equals': return value === trigger.threshold;
            default: return false;
        }
    }

    private async executeGuardianActions(project: Project, guardian: Guardian): Promise<void> {
        for (const action of guardian.actions) {
            if (!action.automated) continue;

            if (action.type === 'alert') {
                const alert: Alert = {
                    id: `alert_${Date.now()}`,
                    guardianId: guardian.id,
                    level: guardian.type === 'security' ? 'critical' : 'warning',
                    title: `${guardian.name} Alert`,
                    message: action.description,
                    suggestions: this.generateSuggestions(guardian.type),
                    acknowledged: false,
                    createdAt: new Date(),
                };
                project.alerts.push(alert);
                this.emit('alert:created', { project, alert });
            }
        }
    }

    private generateSuggestions(type: GuardianType): string[] {
        const suggestions: Record<GuardianType, string[]> = {
            quality: [
                'Run linter and fix all warnings',
                'Refactor complex functions',
                'Add more descriptive variable names',
            ],
            security: [
                'Update vulnerable dependencies',
                'Review authentication flows',
                'Audit external API calls',
            ],
            performance: [
                'Profile slow endpoints',
                'Optimize database queries',
                'Consider implementing caching',
            ],
            dependency: [
                'Update outdated packages',
                'Remove unused dependencies',
                'Check for security advisories',
            ],
            deadline: [
                'Prioritize critical features',
                'Consider scope reduction',
                'Increase team velocity',
            ],
            complexity: [
                'Break down large modules',
                'Extract reusable components',
                'Simplify control flow',
            ],
        };
        return suggestions[type] || [];
    }

    // ========================================================================
    // GOALS
    // ========================================================================

    addGoal(projectId: string, title: string, description: string, targetDate: Date): Goal | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;

        const goal: Goal = {
            id: `goal_${Date.now()}`,
            title,
            description,
            targetDate,
            progress: 0,
            milestones: [],
            status: 'pending',
        };

        project.goals.push(goal);
        this.addEvent(project, 'goal_updated', `New goal added: ${title}`, 'positive');
        this.emit('goal:added', { project, goal });
        return goal;
    }

    updateGoalProgress(projectId: string, goalId: string, progress: number): void {
        const project = this.projects.get(projectId);
        if (!project) return;

        const goal = project.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = Math.max(0, Math.min(100, progress));
            goal.status = progress >= 100 ? 'completed' :
                progress > 0 ? 'in_progress' : 'pending';

            // Check if at risk
            if (goal.status !== 'completed' && new Date() > goal.targetDate) {
                goal.status = 'at_risk';
            }

            this.addEvent(project, 'goal_updated',
                `Goal "${goal.title}" progress: ${goal.progress}%`,
                progress >= 100 ? 'positive' : 'neutral');
        }
    }

    addMilestone(projectId: string, goalId: string, title: string): Milestone | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;

        const goal = project.goals.find(g => g.id === goalId);
        if (!goal) return undefined;

        const milestone: Milestone = {
            id: `ms_${Date.now()}`,
            title,
            completed: false,
        };

        goal.milestones.push(milestone);
        return milestone;
    }

    completeMilestone(projectId: string, goalId: string, milestoneId: string): void {
        const project = this.projects.get(projectId);
        if (!project) return;

        const goal = project.goals.find(g => g.id === goalId);
        const milestone = goal?.milestones.find(m => m.id === milestoneId);

        if (milestone && !milestone.completed) {
            milestone.completed = true;
            milestone.completedAt = new Date();

            // Update goal progress based on milestones
            if (goal) {
                const completedMilestones = goal.milestones.filter(m => m.completed).length;
                goal.progress = (completedMilestones / goal.milestones.length) * 100;
            }

            this.addEvent(project, 'milestone_reached',
                `Milestone completed: ${milestone.title}`, 'positive');
            this.emit('milestone:completed', { project, goal, milestone });
        }
    }

    // ========================================================================
    // REPORTS
    // ========================================================================

    async generateHealthReport(projectId: string): Promise<HealthReport | undefined> {
        const project = this.projects.get(projectId);
        if (!project) return undefined;

        // Ensure we have fresh health data
        await this.checkHealth(projectId);

        const health = project.health;
        const strengths: string[] = [];
        const weaknesses: string[] = [];

        if (health.security >= 80) strengths.push('Strong security posture');
        else if (health.security < 60) weaknesses.push('Security needs attention');

        if (health.testCoverage >= 80) strengths.push('Excellent test coverage');
        else if (health.testCoverage < 50) weaknesses.push('Low test coverage');

        if (health.codeQuality >= 80) strengths.push('High code quality');
        else if (health.codeQuality < 60) weaknesses.push('Code quality improvements needed');

        if (health.documentation >= 70) strengths.push('Well documented');
        else if (health.documentation < 40) weaknesses.push('Documentation is sparse');

        const recommendations = this.generateRecommendations(health, weaknesses);
        const forecast = this.generateForecast(project);

        const report: HealthReport = {
            projectId,
            generatedAt: new Date(),
            summary: this.generateSummary(project, health),
            healthScore: health.overall,
            strengths,
            weaknesses,
            recommendations,
            forecast,
        };

        this.emit('report:generated', { project, report });
        return report;
    }

    private generateSummary(project: Project, health: ProjectHealth): string {
        if (health.overall >= 80) {
            return `${project.name} is in excellent health. Keep up the great work!`;
        } else if (health.overall >= 60) {
            return `${project.name} is in good health with room for improvement.`;
        } else {
            return `${project.name} needs attention. Several areas require improvement.`;
        }
    }

    private generateRecommendations(health: ProjectHealth, weaknesses: string[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        if (health.testCoverage < 60) {
            recommendations.push({
                priority: 'high',
                title: 'Increase Test Coverage',
                description: 'Add unit and integration tests to improve reliability',
                effort: 'large',
                impact: 'large',
            });
        }

        if (health.documentation < 50) {
            recommendations.push({
                priority: 'medium',
                title: 'Improve Documentation',
                description: 'Add JSDoc comments and update README',
                effort: 'medium',
                impact: 'medium',
            });
        }

        if (health.dependencies < 70) {
            recommendations.push({
                priority: 'high',
                title: 'Update Dependencies',
                description: 'Update outdated packages to latest stable versions',
                effort: 'small',
                impact: 'medium',
            });
        }

        return recommendations;
    }

    private generateForecast(project: Project): Forecast {
        const recentAlerts = project.alerts.filter(
            a => Date.now() - a.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000
        ).length;

        const trend = recentAlerts === 0 ? 'improving' :
            recentAlerts <= 2 ? 'stable' : 'declining';

        return {
            trend,
            riskLevel: Math.min(1, recentAlerts / 5),
            predictedIssues: recentAlerts > 0 ? ['Potential quality issues if trend continues'] : [],
            opportunities: project.health.overall < 80 ?
                ['Improving code quality can boost team velocity'] : [],
        };
    }

    // ========================================================================
    // TIMELINE
    // ========================================================================

    private addEvent(project: Project, type: EventType, description: string, impact: ProjectEvent['impact']): void {
        project.timeline.push({
            timestamp: new Date(),
            type,
            description,
            impact,
        });
    }

    // ========================================================================
    // CONTINUOUS MONITORING
    // ========================================================================

    startContinuousMonitoring(intervalMs: number = 300000): void {
        if (this.checkInterval) return;

        this.checkInterval = setInterval(async () => {
            for (const project of this.projects.values()) {
                await this.checkHealth(project.id);
            }
        }, intervalMs);

        this.emit('monitoring:started', { interval: intervalMs });
    }

    stopContinuousMonitoring(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
            this.emit('monitoring:stopped');
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getProject(id: string): Project | undefined {
        return this.projects.get(id);
    }

    getAllProjects(): Project[] {
        return Array.from(this.projects.values());
    }

    getActiveAlerts(projectId: string): Alert[] {
        const project = this.projects.get(projectId);
        return project?.alerts.filter(a => !a.acknowledged) || [];
    }

    acknowledgeAlert(projectId: string, alertId: string): void {
        const project = this.projects.get(projectId);
        if (project) {
            const alert = project.alerts.find(a => a.id === alertId);
            if (alert) {
                alert.acknowledged = true;
                this.emit('alert:acknowledged', { project, alert });
            }
        }
    }

    getStats(): {
        totalProjects: number;
        healthyProjects: number;
        totalAlerts: number;
        avgHealthScore: number;
    } {
        const projects = Array.from(this.projects.values());
        return {
            totalProjects: projects.length,
            healthyProjects: projects.filter(p => p.status === 'healthy').length,
            totalAlerts: projects.reduce((s, p) => s + p.alerts.filter(a => !a.acknowledged).length, 0),
            avgHealthScore: projects.length > 0 ?
                projects.reduce((s, p) => s + p.health.overall, 0) / projects.length : 0,
        };
    }
}

export const autonomousProjectShepherd = AutonomousProjectShepherd.getInstance();
