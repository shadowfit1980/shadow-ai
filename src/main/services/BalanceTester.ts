/**
 * ⚖️ Balance Tester
 * 
 * Game balance testing:
 * - Automated playtesting
 * - Stats analysis
 * - Difficulty curves
 */

import { EventEmitter } from 'events';

export interface BalanceReport {
    testCount: number;
    winRate: number;
    avgDuration: number;
    difficultyScore: number;
    suggestions: string[];
}

export class BalanceTester extends EventEmitter {
    private static instance: BalanceTester;

    private constructor() { super(); }

    static getInstance(): BalanceTester {
        if (!BalanceTester.instance) {
            BalanceTester.instance = new BalanceTester();
        }
        return BalanceTester.instance;
    }

    generateBalanceCode(): string {
        return `
class BalanceTester {
    constructor() {
        this.testResults = [];
        this.config = {
            iterations: 100,
            simulationSpeed: 10,
            aiSkillLevel: 0.7
        };
    }

    // Run automated game simulations
    async runTests(gameFactory, iterations = this.config.iterations) {
        this.testResults = [];
        
        for (let i = 0; i < iterations; i++) {
            const result = await this.runSingleTest(gameFactory);
            this.testResults.push(result);
            this.onProgress?.(i + 1, iterations, result);
        }
        
        return this.generateReport();
    }

    async runSingleTest(gameFactory) {
        const game = gameFactory();
        const startTime = Date.now();
        
        let turns = 0;
        let victory = false;
        let stats = {};
        
        while (!game.isGameOver()) {
            turns++;
            
            // AI decision making
            const action = this.selectAIAction(game);
            if (action) {
                game.applyAction(action);
            }
            
            // Prevent infinite loops
            if (turns > 10000) break;
            
            // Yield to prevent blocking
            if (turns % 100 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }
        
        victory = game.isVictory?.() || false;
        
        return {
            victory,
            turns,
            duration: Date.now() - startTime,
            stats: game.getStats?.() || {},
            finalState: game.getState?.() || {}
        };
    }

    selectAIAction(game) {
        const actions = game.getValidActions?.() || [];
        if (actions.length === 0) return null;
        
        // Score each action
        const scores = actions.map(action => ({
            action,
            score: this.evaluateAction(game, action)
        }));
        
        // Add randomness based on skill level
        const noise = (1 - this.config.aiSkillLevel) * 0.5;
        scores.forEach(s => s.score += (Math.random() - 0.5) * noise);
        
        // Select best action
        scores.sort((a, b) => b.score - a.score);
        return scores[0].action;
    }

    evaluateAction(game, action) {
        // Simple heuristic scoring
        // Override this for game-specific logic
        let score = 0;
        
        if (action.type === 'attack') score += 0.8;
        if (action.type === 'defend') score += 0.5;
        if (action.type === 'heal') score += (game.player?.health < 30 ? 1.0 : 0.3);
        if (action.damage) score += action.damage * 0.01;
        if (action.priority) score += action.priority;
        
        return score;
    }

    generateReport() {
        const total = this.testResults.length;
        const wins = this.testResults.filter(r => r.victory).length;
        const avgTurns = this.testResults.reduce((s, r) => s + r.turns, 0) / total;
        const avgDuration = this.testResults.reduce((s, r) => s + r.duration, 0) / total;
        
        const winRate = wins / total;
        const difficultyScore = this.calculateDifficulty(winRate, avgTurns);
        
        const suggestions = this.generateSuggestions(winRate, avgTurns);
        
        return {
            testCount: total,
            wins,
            losses: total - wins,
            winRate,
            avgTurns,
            avgDuration,
            turnVariance: this.calculateVariance(this.testResults.map(r => r.turns)),
            difficultyScore,
            suggestions,
            rawResults: this.testResults
        };
    }

    calculateDifficulty(winRate, avgTurns) {
        // 0 = too easy, 100 = too hard, 50 = balanced
        const rateScore = (1 - winRate) * 60;
        const lengthScore = Math.min(40, avgTurns / 10);
        return Math.round(rateScore + lengthScore);
    }

    calculateVariance(values) {
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const sqDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / values.length);
    }

    generateSuggestions(winRate, avgTurns) {
        const suggestions = [];
        
        if (winRate > 0.9) {
            suggestions.push('Game is too easy. Consider increasing enemy stats or reducing player power.');
        } else if (winRate < 0.3) {
            suggestions.push('Game is too hard. Consider reducing enemy stats or increasing player resources.');
        }
        
        if (avgTurns < 10) {
            suggestions.push('Games are very short. Consider adding more phases or increasing enemy health.');
        } else if (avgTurns > 100) {
            suggestions.push('Games are too long. Consider increasing damage values or adding time limits.');
        }
        
        if (this.calculateVariance(this.testResults.map(r => r.turns)) > avgTurns * 0.5) {
            suggestions.push('High variance in game length. Consider more consistent enemy spawning or damage.');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('Game balance appears reasonable. Consider fine-tuning individual mechanics.');
        }
        
        return suggestions;
    }

    // Economy balance testing
    analyzeEconomy(economyData) {
        const {
            incomeSources,
            expenses,
            playerProgression
        } = economyData;
        
        const totalIncome = incomeSources.reduce((s, src) => s + src.amount * src.frequency, 0);
        const totalExpense = expenses.reduce((s, exp) => s + exp.amount * exp.frequency, 0);
        
        const balance = totalIncome - totalExpense;
        const timeToMax = playerProgression.maxCost / balance;
        
        return {
            incomePerUnit: totalIncome,
            expensePerUnit: totalExpense,
            netGain: balance,
            estimatedTimeToMax: timeToMax,
            isBalanced: balance > 0 && timeToMax > 10 && timeToMax < 100,
            suggestions: this.getEconomySuggestions(balance, timeToMax)
        };
    }

    getEconomySuggestions(balance, timeToMax) {
        const suggestions = [];
        
        if (balance <= 0) {
            suggestions.push('Income does not cover expenses! Players will struggle to progress.');
        }
        
        if (timeToMax < 10) {
            suggestions.push('Progression is too fast. Reduce income or increase costs.');
        }
        
        if (timeToMax > 200) {
            suggestions.push('Progression is too slow. Increase income or reduce costs.');
        }
        
        return suggestions;
    }

    // Combat balance
    analyzeCombat(playerStats, enemyStats) {
        const playerDPS = playerStats.damage * playerStats.attackSpeed;
        const enemyDPS = enemyStats.damage * enemyStats.attackSpeed;
        
        const timeToKillEnemy = enemyStats.health / playerDPS;
        const timeToKillPlayer = playerStats.health / enemyDPS;
        
        const favorability = timeToKillPlayer / timeToKillEnemy;
        
        return {
            playerDPS,
            enemyDPS,
            timeToKillEnemy,
            timeToKillPlayer,
            favorability,
            rating: favorability > 2 ? 'Too Easy' : favorability < 0.8 ? 'Too Hard' : 'Balanced',
            suggestions: this.getCombatSuggestions(favorability)
        };
    }

    getCombatSuggestions(favorability) {
        if (favorability > 3) return ['Significantly reduce player damage or increase enemy health'];
        if (favorability > 2) return ['Slightly reduce player power'];
        if (favorability < 0.5) return ['Significantly increase player stats or reduce enemy power'];
        if (favorability < 0.8) return ['Slightly increase player power'];
        return ['Combat balance is acceptable'];
    }

    // Callbacks
    onProgress = null;
}`;
    }
}

export const balanceTester = BalanceTester.getInstance();
