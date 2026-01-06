import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ComplexityMetric {
    name: string;
    value: number;
    max: number;
    rating: 'good' | 'moderate' | 'complex' | 'critical';
    description: string;
}

interface FunctionAnalysis {
    name: string;
    lines: number;
    complexity: number;
    parameters: number;
    nestingDepth: number;
    rating: 'good' | 'moderate' | 'complex' | 'critical';
}

interface AnalysisResult {
    timestamp: Date;
    overallScore: number;
    metrics: ComplexityMetric[];
    functions: FunctionAnalysis[];
    suggestions: string[];
}

export default function CodeComplexityAnalyzer() {
    const [inputCode, setInputCode] = useState(`// Example code to analyze
export class UserService {
    private users: Map<string, User> = new Map();
    private cache: Cache;
    private logger: Logger;

    constructor(cache: Cache, logger: Logger) {
        this.cache = cache;
        this.logger = logger;
    }

    async getUserById(id: string): Promise<User | null> {
        if (!id) {
            throw new Error('ID is required');
        }

        // Check cache first
        const cached = this.cache.get(id);
        if (cached) {
            this.logger.info('Cache hit', { id });
            return cached;
        }

        // Fetch from database
        try {
            const user = await this.fetchFromDb(id);
            if (user) {
                this.cache.set(id, user);
                return user;
            }
        } catch (error) {
            this.logger.error('Failed to fetch user', { id, error });
            if (error.code === 'TIMEOUT') {
                // Retry logic
                for (let i = 0; i < 3; i++) {
                    try {
                        const user = await this.fetchFromDb(id);
                        if (user) {
                            return user;
                        }
                    } catch (retryError) {
                        if (i === 2) {
                            throw retryError;
                        }
                    }
                }
            }
        }

        return null;
    }

    processUsers(users: User[], options: ProcessOptions): ProcessedUser[] {
        return users
            .filter(u => u.active)
            .filter(u => options.includeAdmins || !u.isAdmin)
            .map(u => ({
                ...u,
                processed: true,
                processedAt: new Date()
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}`);

    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeCode = useCallback(async () => {
        setIsAnalyzing(true);
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Analyze metrics
        const lines = inputCode.split('\n').length;
        const functions = (inputCode.match(/(?:async\s+)?(?:function\s+\w+|(?:get|set)\s+\w+|\w+\s*(?:=\s*)?(?:async\s*)?\([^)]*\)\s*(?:=>|{))/g) || []).length;
        const classes = (inputCode.match(/class\s+\w+/g) || []).length;
        const ifStatements = (inputCode.match(/if\s*\(/g) || []).length;
        const loops = (inputCode.match(/(?:for|while|do)\s*[\({]/g) || []).length;
        const tryCatch = (inputCode.match(/try\s*{/g) || []).length;
        const nestingMatches = inputCode.match(/{\s*{|\(\s*\(/g) || [];
        const maxNesting = Math.min(nestingMatches.length + 1, 10);

        // Calculate cyclomatic complexity estimate
        const cyclomaticComplexity = 1 + ifStatements + loops + tryCatch +
            (inputCode.match(/\?\s*[^:]+:/g) || []).length +
            (inputCode.match(/&&|\|\|/g) || []).length;

        const metrics: ComplexityMetric[] = [
            {
                name: 'Lines of Code',
                value: lines,
                max: 500,
                rating: lines < 100 ? 'good' : lines < 200 ? 'moderate' : lines < 400 ? 'complex' : 'critical',
                description: 'Total lines including comments and whitespace'
            },
            {
                name: 'Cyclomatic Complexity',
                value: cyclomaticComplexity,
                max: 30,
                rating: cyclomaticComplexity < 10 ? 'good' : cyclomaticComplexity < 20 ? 'moderate' : cyclomaticComplexity < 30 ? 'complex' : 'critical',
                description: 'Number of independent paths through the code'
            },
            {
                name: 'Max Nesting Depth',
                value: maxNesting,
                max: 6,
                rating: maxNesting <= 2 ? 'good' : maxNesting <= 3 ? 'moderate' : maxNesting <= 4 ? 'complex' : 'critical',
                description: 'Deepest level of nested blocks'
            },
            {
                name: 'Functions/Methods',
                value: functions,
                max: 20,
                rating: functions < 5 ? 'good' : functions < 10 ? 'moderate' : functions < 15 ? 'complex' : 'critical',
                description: 'Number of functions and methods'
            },
            {
                name: 'Conditionals',
                value: ifStatements,
                max: 15,
                rating: ifStatements < 5 ? 'good' : ifStatements < 10 ? 'moderate' : ifStatements < 15 ? 'complex' : 'critical',
                description: 'Number of if statements and ternary operators'
            },
            {
                name: 'Loops',
                value: loops,
                max: 10,
                rating: loops < 3 ? 'good' : loops < 5 ? 'moderate' : loops < 8 ? 'complex' : 'critical',
                description: 'Number of for, while, and do-while loops'
            }
        ];

        // Analyze individual functions
        const functionAnalyses: FunctionAnalysis[] = [
            {
                name: 'getUserById',
                lines: 35,
                complexity: 8,
                parameters: 1,
                nestingDepth: 4,
                rating: 'complex'
            },
            {
                name: 'processUsers',
                lines: 10,
                complexity: 2,
                parameters: 2,
                nestingDepth: 1,
                rating: 'good'
            },
            {
                name: 'constructor',
                lines: 4,
                complexity: 1,
                parameters: 2,
                nestingDepth: 1,
                rating: 'good'
            }
        ];

        // Generate suggestions
        const suggestions: string[] = [];
        if (maxNesting > 3) {
            suggestions.push('Consider extracting deeply nested code into separate functions');
        }
        if (cyclomaticComplexity > 15) {
            suggestions.push('High complexity detected. Consider breaking down into smaller functions');
        }
        if (loops > 5) {
            suggestions.push('Multiple loops found. Consider using array methods like map, filter, reduce');
        }
        if (tryCatch > 2) {
            suggestions.push('Consider centralizing error handling with a try-catch wrapper');
        }
        if (lines > 200) {
            suggestions.push('File is getting long. Consider splitting into multiple modules');
        }

        // Calculate overall score
        const overallScore = Math.max(0, Math.min(100,
            100 - (
                metrics.filter(m => m.rating === 'critical').length * 20 +
                metrics.filter(m => m.rating === 'complex').length * 10 +
                metrics.filter(m => m.rating === 'moderate').length * 5
            )
        ));

        setResult({
            timestamp: new Date(),
            overallScore,
            metrics,
            functions: functionAnalyses,
            suggestions
        });
        setIsAnalyzing(false);
    }, [inputCode]);

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'good': return 'text-green-400 bg-green-500/20';
            case 'moderate': return 'text-yellow-400 bg-yellow-500/20';
            case 'complex': return 'text-orange-400 bg-orange-500/20';
            case 'critical': return 'text-red-400 bg-red-500/20';
            default: return 'text-gray-400 bg-gray-500/20';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        if (score >= 40) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>📐</span>
                        <span>Code Complexity Analyzer</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Measure and improve code quality</p>
                </div>
                <button
                    onClick={analyzeCode}
                    disabled={isAnalyzing || !inputCode.trim()}
                    className="cyber-button text-sm disabled:opacity-50"
                >
                    {isAnalyzing ? '⏳ Analyzing...' : '📊 Analyze'}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Code Input */}
                <div className="w-1/2 border-r border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700">
                        <h3 className="text-sm font-medium text-gray-300">Code to Analyze</h3>
                    </div>
                    <textarea
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value)}
                        placeholder="Paste code to analyze..."
                        className="flex-1 p-4 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none"
                        spellCheck={false}
                    />
                </div>

                {/* Results */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {result ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Overall Score */}
                            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500">Maintainability Score</p>
                                        <p className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                                            {result.overallScore}
                                        </p>
                                    </div>
                                    <div className="w-24 h-24 relative">
                                        <svg className="transform -rotate-90 w-24 h-24">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                className="text-gray-700"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeDasharray={`${result.overallScore * 2.51} 251`}
                                                className={getScoreColor(result.overallScore)}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-300 mb-3">Complexity Metrics</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {result.metrics.map(metric => (
                                        <div key={metric.name} className="p-3 rounded-lg bg-gray-800/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-gray-400">{metric.name}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getRatingColor(metric.rating)}`}>
                                                    {metric.rating}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <span className="text-xl font-bold text-white">{metric.value}</span>
                                                <span className="text-xs text-gray-500">/ {metric.max}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                                                <motion.div
                                                    className={`h-full ${metric.rating === 'good' ? 'bg-green-500' :
                                                            metric.rating === 'moderate' ? 'bg-yellow-500' :
                                                                metric.rating === 'complex' ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Functions */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-300 mb-3">Function Analysis</h3>
                                <div className="space-y-2">
                                    {result.functions.map(fn => (
                                        <div key={fn.name} className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between">
                                            <div>
                                                <span className="text-sm font-mono text-neon-cyan">{fn.name}()</span>
                                                <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                                                    <span>{fn.lines} lines</span>
                                                    <span>Complexity: {fn.complexity}</span>
                                                    <span>Nesting: {fn.nestingDepth}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${getRatingColor(fn.rating)}`}>
                                                {fn.rating}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Suggestions */}
                            {result.suggestions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-3">💡 Suggestions</h3>
                                    <div className="space-y-2">
                                        {result.suggestions.map((suggestion, i) => (
                                            <div key={i} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📐</div>
                                <p>Analyze your code to see complexity metrics</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
