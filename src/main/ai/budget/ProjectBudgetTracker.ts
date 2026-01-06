/**
 * Project Budget Tracker
 * Track development costs, time, and resource allocation
 * Grok Recommendation: Smart Project Management
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface Budget {
    id: string;
    projectName: string;
    totalBudget: number;
    currency: string;
    startDate: Date;
    endDate: Date;
    categories: BudgetCategory[];
    expenses: Expense[];
    allocations: ResourceAllocation[];
    warnings: BudgetWarning[];
    status: 'on_track' | 'at_risk' | 'over_budget' | 'under_budget';
}

interface BudgetCategory {
    id: string;
    name: string;
    allocated: number;
    spent: number;
    color: string;
}

interface Expense {
    id: string;
    categoryId: string;
    description: string;
    amount: number;
    date: Date;
    type: 'labor' | 'infrastructure' | 'tools' | 'services' | 'other';
    recurring: boolean;
    approved: boolean;
}

interface ResourceAllocation {
    id: string;
    resource: string;
    type: 'developer' | 'designer' | 'pm' | 'infrastructure' | 'service';
    hoursPerWeek: number;
    hourlyRate: number;
    startDate: Date;
    endDate?: Date;
}

interface BudgetWarning {
    type: 'overspend' | 'approaching_limit' | 'unplanned' | 'recurring_increase';
    category: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    date: Date;
}

interface BudgetReport {
    budgetId: string;
    generatedAt: Date;
    period: { start: Date; end: Date };
    summary: {
        totalBudget: number;
        totalSpent: number;
        remaining: number;
        percentUsed: number;
        burnRate: number;
        projectedOverrun: number;
    };
    byCategory: { name: string; allocated: number; spent: number; remaining: number }[];
    byType: { type: string; amount: number; percentage: number }[];
    trends: { date: string; spent: number; budget: number }[];
    recommendations: string[];
}

interface TimeEntry {
    id: string;
    developerId: string;
    date: Date;
    hours: number;
    task: string;
    billable: boolean;
}

const DEFAULT_CATEGORIES: Omit<BudgetCategory, 'id'>[] = [
    { name: 'Development', allocated: 0, spent: 0, color: '#3b82f6' },
    { name: 'Design', allocated: 0, spent: 0, color: '#8b5cf6' },
    { name: 'Infrastructure', allocated: 0, spent: 0, color: '#22c55e' },
    { name: 'Tools & Licenses', allocated: 0, spent: 0, color: '#f59e0b' },
    { name: 'Testing & QA', allocated: 0, spent: 0, color: '#ec4899' },
    { name: 'Contingency', allocated: 0, spent: 0, color: '#6b7280' }
];

export class ProjectBudgetTracker extends EventEmitter {
    private static instance: ProjectBudgetTracker;
    private budgets: Map<string, Budget> = new Map();
    private timeEntries: Map<string, TimeEntry[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ProjectBudgetTracker {
        if (!ProjectBudgetTracker.instance) {
            ProjectBudgetTracker.instance = new ProjectBudgetTracker();
        }
        return ProjectBudgetTracker.instance;
    }

    createBudget(config: {
        projectName: string;
        totalBudget: number;
        currency?: string;
        startDate: Date;
        endDate: Date;
        categoryAllocations?: Record<string, number>;
    }): Budget {
        const categories = DEFAULT_CATEGORIES.map(cat => ({
            ...cat,
            id: crypto.randomUUID(),
            allocated: config.categoryAllocations?.[cat.name] || config.totalBudget / 6
        }));

        const budget: Budget = {
            id: crypto.randomUUID(),
            projectName: config.projectName,
            totalBudget: config.totalBudget,
            currency: config.currency || 'USD',
            startDate: config.startDate,
            endDate: config.endDate,
            categories,
            expenses: [],
            allocations: [],
            warnings: [],
            status: 'on_track'
        };

        this.budgets.set(budget.id, budget);
        this.timeEntries.set(budget.id, []);
        this.emit('budgetCreated', budget);
        return budget;
    }

    addExpense(budgetId: string, expense: Omit<Expense, 'id'>): Expense | null {
        const budget = this.budgets.get(budgetId);
        if (!budget) return null;

        const newExpense: Expense = {
            id: crypto.randomUUID(),
            ...expense
        };

        budget.expenses.push(newExpense);

        // Update category spent
        const category = budget.categories.find(c => c.id === expense.categoryId);
        if (category) {
            category.spent += expense.amount;
        }

        // Check for warnings
        this.checkWarnings(budget);
        this.updateStatus(budget);

        this.emit('expenseAdded', { budgetId, expense: newExpense });
        return newExpense;
    }

    addAllocation(budgetId: string, allocation: Omit<ResourceAllocation, 'id'>): ResourceAllocation | null {
        const budget = this.budgets.get(budgetId);
        if (!budget) return null;

        const newAllocation: ResourceAllocation = {
            id: crypto.randomUUID(),
            ...allocation
        };

        budget.allocations.push(newAllocation);
        this.emit('allocationAdded', { budgetId, allocation: newAllocation });
        return newAllocation;
    }

    logTime(budgetId: string, entry: Omit<TimeEntry, 'id'>): TimeEntry | null {
        const entries = this.timeEntries.get(budgetId);
        if (!entries) return null;

        const newEntry: TimeEntry = {
            id: crypto.randomUUID(),
            ...entry
        };

        entries.push(newEntry);

        // Auto-create expense for billable time
        if (entry.billable) {
            const budget = this.budgets.get(budgetId);
            if (budget) {
                const allocation = budget.allocations.find(a => a.resource === entry.developerId);
                const rate = allocation?.hourlyRate || 100;
                const devCategory = budget.categories.find(c => c.name === 'Development');

                if (devCategory) {
                    this.addExpense(budgetId, {
                        categoryId: devCategory.id,
                        description: `Time entry: ${entry.task}`,
                        amount: entry.hours * rate,
                        date: entry.date,
                        type: 'labor',
                        recurring: false,
                        approved: true
                    });
                }
            }
        }

        return newEntry;
    }

    private checkWarnings(budget: Budget): void {
        budget.warnings = [];

        for (const category of budget.categories) {
            const percentUsed = (category.spent / category.allocated) * 100;

            if (percentUsed >= 100) {
                budget.warnings.push({
                    type: 'overspend',
                    category: category.name,
                    message: `${category.name} is over budget by ${(category.spent - category.allocated).toFixed(2)} ${budget.currency}`,
                    severity: 'critical',
                    date: new Date()
                });
            } else if (percentUsed >= 80) {
                budget.warnings.push({
                    type: 'approaching_limit',
                    category: category.name,
                    message: `${category.name} is at ${percentUsed.toFixed(1)}% of allocated budget`,
                    severity: percentUsed >= 90 ? 'high' : 'medium',
                    date: new Date()
                });
            }
        }

        // Check overall budget
        const totalSpent = budget.categories.reduce((sum, c) => sum + c.spent, 0);
        const percentTotal = (totalSpent / budget.totalBudget) * 100;
        const daysElapsed = Math.ceil((Date.now() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedPercent = (daysElapsed / totalDays) * 100;

        if (percentTotal > expectedPercent + 10) {
            budget.warnings.push({
                type: 'overspend',
                category: 'Overall',
                message: `Spending is ${(percentTotal - expectedPercent).toFixed(1)}% ahead of schedule`,
                severity: percentTotal > expectedPercent + 20 ? 'high' : 'medium',
                date: new Date()
            });
        }
    }

    private updateStatus(budget: Budget): void {
        const totalSpent = budget.categories.reduce((sum, c) => sum + c.spent, 0);
        const percentUsed = (totalSpent / budget.totalBudget) * 100;

        const criticalWarnings = budget.warnings.filter(w => w.severity === 'critical').length;
        const highWarnings = budget.warnings.filter(w => w.severity === 'high').length;

        if (percentUsed > 100 || criticalWarnings > 0) {
            budget.status = 'over_budget';
        } else if (percentUsed > 80 || highWarnings > 0) {
            budget.status = 'at_risk';
        } else if (percentUsed < 30) {
            budget.status = 'under_budget';
        } else {
            budget.status = 'on_track';
        }
    }

    generateReport(budgetId: string, period?: { start: Date; end: Date }): BudgetReport | null {
        const budget = this.budgets.get(budgetId);
        if (!budget) return null;

        const periodStart = period?.start || budget.startDate;
        const periodEnd = period?.end || new Date();

        const periodExpenses = budget.expenses.filter(e =>
            e.date >= periodStart && e.date <= periodEnd
        );

        const totalSpent = budget.categories.reduce((sum, c) => sum + c.spent, 0);
        const daysElapsed = Math.ceil((Date.now() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const burnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
        const daysRemaining = Math.ceil((budget.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const projectedTotal = totalSpent + burnRate * daysRemaining;

        const byCategory = budget.categories.map(c => ({
            name: c.name,
            allocated: c.allocated,
            spent: c.spent,
            remaining: c.allocated - c.spent
        }));

        const byType = this.aggregateByType(periodExpenses);

        const trends = this.calculateTrends(budget.expenses);

        const recommendations = this.generateRecommendations(budget, burnRate, projectedTotal);

        return {
            budgetId,
            generatedAt: new Date(),
            period: { start: periodStart, end: periodEnd },
            summary: {
                totalBudget: budget.totalBudget,
                totalSpent,
                remaining: budget.totalBudget - totalSpent,
                percentUsed: Math.round((totalSpent / budget.totalBudget) * 100),
                burnRate: Math.round(burnRate * 100) / 100,
                projectedOverrun: Math.max(0, projectedTotal - budget.totalBudget)
            },
            byCategory,
            byType,
            trends,
            recommendations
        };
    }

    private aggregateByType(expenses: Expense[]): { type: string; amount: number; percentage: number }[] {
        const byType = new Map<string, number>();
        let total = 0;

        for (const expense of expenses) {
            byType.set(expense.type, (byType.get(expense.type) || 0) + expense.amount);
            total += expense.amount;
        }

        return Array.from(byType.entries()).map(([type, amount]) => ({
            type,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0
        })).sort((a, b) => b.amount - a.amount);
    }

    private calculateTrends(expenses: Expense[]): { date: string; spent: number; budget: number }[] {
        const daily = new Map<string, number>();
        let cumulative = 0;

        const sorted = [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime());

        for (const expense of sorted) {
            const dateKey = expense.date.toISOString().split('T')[0];
            cumulative += expense.amount;
            daily.set(dateKey, cumulative);
        }

        return Array.from(daily.entries()).map(([date, spent]) => ({
            date,
            spent,
            budget: 0 // Would be calculated based on linear budget distribution
        }));
    }

    private generateRecommendations(budget: Budget, burnRate: number, projectedTotal: number): string[] {
        const recommendations: string[] = [];

        if (projectedTotal > budget.totalBudget) {
            const overrun = projectedTotal - budget.totalBudget;
            recommendations.push(`Projected to exceed budget by ${budget.currency} ${overrun.toFixed(2)}. Consider reducing scope or requesting additional funds.`);
        }

        const overBudgetCategories = budget.categories.filter(c => c.spent > c.allocated);
        for (const cat of overBudgetCategories) {
            recommendations.push(`Reallocate funds to ${cat.name} from under-utilized categories.`);
        }

        const underUtilized = budget.categories.filter(c => c.spent < c.allocated * 0.5);
        if (underUtilized.length > 0) {
            recommendations.push(`Consider reallocating from: ${underUtilized.map(c => c.name).join(', ')}`);
        }

        if (budget.warnings.filter(w => w.severity === 'critical').length > 0) {
            recommendations.push('Address critical budget warnings immediately.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Budget is on track. Continue monitoring expenses.');
        }

        return recommendations;
    }

    getBudget(id: string): Budget | undefined {
        return this.budgets.get(id);
    }

    getBudgets(): Budget[] {
        return Array.from(this.budgets.values());
    }

    getTimeEntries(budgetId: string): TimeEntry[] {
        return this.timeEntries.get(budgetId) || [];
    }

    deleteBudget(id: string): boolean {
        this.timeEntries.delete(id);
        return this.budgets.delete(id);
    }
}

export const projectBudgetTracker = ProjectBudgetTracker.getInstance();
