/**
 * Code Sentiment Analyzer
 * Analyze code comments, commit messages, and documentation for sentiment
 * Grok Recommendation: Developer Sentiment Analysis
 */
import { EventEmitter } from 'events';

interface SentimentResult {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'excited' | 'confused';
    score: number;
    confidence: number;
    emotions: { emotion: string; score: number }[];
    keywords: string[];
}

interface CodeHealthReport {
    overallSentiment: number;
    frustrationIndicators: FrustrationIndicator[];
    positiveAreas: string[];
    negativeAreas: string[];
    recommendations: string[];
    timeline: { date: string; sentiment: number }[];
    hotspots: { file: string; line: number; issue: string; severity: number }[];
}

interface FrustrationIndicator {
    type: 'todo' | 'hack' | 'fixme' | 'wtf' | 'angry_comment' | 'confusion' | 'deadline_pressure';
    count: number;
    locations: { file: string; line: number; text: string }[];
    severity: number;
}

interface TeamMorale {
    overall: number;
    trend: 'improving' | 'declining' | 'stable';
    byDeveloper: { name: string; sentiment: number; recentTrend: string }[];
    alerts: { type: string; message: string; severity: string }[];
}

const POSITIVE_PATTERNS = [
    /\b(great|awesome|excellent|perfect|amazing|wonderful|beautiful|elegant|clean|nice|good|love|happy)\b/gi,
    /\b(works|working|fixed|solved|resolved|complete|done|success)\b/gi,
    /\b(thank|thanks|appreciate)\b/gi,
    /🎉|✨|🚀|💪|👍|✅|🙌/g
];

const NEGATIVE_PATTERNS = [
    /\b(fuck|shit|damn|crap|stupid|terrible|awful|horrible|hate|suck|worst)\b/gi,
    /\b(wtf|omg|ugh|argh)\b/gi,
    /\b(bug|broken|fail|error|crash|problem|issue)\b/gi,
    /😤|😠|🤬|💩|😡|🙄|😩/g
];

const FRUSTRATION_PATTERNS = [
    { pattern: /TODO:?\s*(.+)/gi, type: 'todo' as const },
    { pattern: /HACK:?\s*(.+)/gi, type: 'hack' as const },
    { pattern: /FIXME:?\s*(.+)/gi, type: 'fixme' as const },
    { pattern: /WTF:?\s*(.+)/gi, type: 'wtf' as const },
    { pattern: /XXX:?\s*(.+)/gi, type: 'wtf' as const },
    { pattern: /why (does|is|doesn't|won't|can't)/gi, type: 'confusion' as const },
    { pattern: /I don't (understand|know|get)/gi, type: 'confusion' as const },
    { pattern: /deadline|urgent|asap|rush/gi, type: 'deadline_pressure' as const }
];

export class CodeSentimentAnalyzer extends EventEmitter {
    private static instance: CodeSentimentAnalyzer;
    private analysisHistory: SentimentResult[] = [];
    private fileAnalysis: Map<string, SentimentResult[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): CodeSentimentAnalyzer {
        if (!CodeSentimentAnalyzer.instance) {
            CodeSentimentAnalyzer.instance = new CodeSentimentAnalyzer();
        }
        return CodeSentimentAnalyzer.instance;
    }

    analyzeText(text: string): SentimentResult {
        let positiveScore = 0;
        let negativeScore = 0;

        // Count positive patterns
        for (const pattern of POSITIVE_PATTERNS) {
            const matches = text.match(pattern);
            if (matches) positiveScore += matches.length;
        }

        // Count negative patterns
        for (const pattern of NEGATIVE_PATTERNS) {
            const matches = text.match(pattern);
            if (matches) negativeScore += matches.length * 1.5; // Weight negatives more
        }

        const totalScore = positiveScore + negativeScore;
        const score = totalScore > 0 ? (positiveScore - negativeScore) / totalScore : 0;

        let sentiment: SentimentResult['sentiment'];
        if (score > 0.3) sentiment = 'positive';
        else if (score > 0.1) sentiment = 'excited';
        else if (score < -0.3) sentiment = 'frustrated';
        else if (score < -0.1) sentiment = 'negative';
        else if (text.match(/\?{2,}|why|how come|confused/gi)) sentiment = 'confused';
        else sentiment = 'neutral';

        const emotions = [
            { emotion: 'joy', score: positiveScore > 2 ? 0.8 : positiveScore * 0.3 },
            { emotion: 'frustration', score: negativeScore > 2 ? 0.8 : negativeScore * 0.3 },
            { emotion: 'confidence', score: text.match(/\b(sure|certain|definitely|always works)\b/gi) ? 0.7 : 0.2 },
            { emotion: 'uncertainty', score: text.match(/\b(maybe|perhaps|might|not sure|hopefully)\b/gi) ? 0.6 : 0.1 }
        ].filter(e => e.score > 0.1);

        const keywords = this.extractKeywords(text);

        const result: SentimentResult = {
            text: text.substring(0, 200),
            sentiment,
            score: Math.round(score * 100) / 100,
            confidence: Math.min(1, totalScore / 5),
            emotions,
            keywords
        };

        this.analysisHistory.push(result);
        return result;
    }

    private extractKeywords(text: string): string[] {
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which']);

        const wordCount = new Map<string, number>();
        for (const word of words) {
            if (!stopWords.has(word)) {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            }
        }

        return Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }

    analyzeFile(filePath: string, content: string): SentimentResult[] {
        const results: SentimentResult[] = [];
        const lines = content.split('\n');

        // Find comments
        const commentPatterns = [
            /\/\/\s*(.+)/g,                    // Single-line
            /\/\*\s*([\s\S]*?)\s*\*\//g,       // Multi-line
            /#\s*(.+)/g,                        // Python/shell
            /"""\s*([\s\S]*?)\s*"""/g,         // Python docstring
            /<!--\s*([\s\S]*?)\s*-->/g         // HTML
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of commentPatterns) {
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    if (match[1] && match[1].trim().length > 3) {
                        const result = this.analyzeText(match[1]);
                        if (result.sentiment !== 'neutral') {
                            results.push(result);
                        }
                    }
                }
            }
        }

        this.fileAnalysis.set(filePath, results);
        return results;
    }

    analyzeCommits(commits: { message: string; author: string; date: Date }[]): { byCommit: SentimentResult[]; byAuthor: Map<string, number> } {
        const byCommit: SentimentResult[] = [];
        const authorScores = new Map<string, number[]>();

        for (const commit of commits) {
            const result = this.analyzeText(commit.message);
            byCommit.push(result);

            if (!authorScores.has(commit.author)) {
                authorScores.set(commit.author, []);
            }
            authorScores.get(commit.author)!.push(result.score);
        }

        const byAuthor = new Map<string, number>();
        for (const [author, scores] of authorScores) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            byAuthor.set(author, Math.round(avg * 100) / 100);
        }

        return { byCommit, byAuthor };
    }

    generateHealthReport(files: { path: string; content: string }[]): CodeHealthReport {
        const allResults: SentimentResult[] = [];
        const frustrationIndicators: FrustrationIndicator[] = [];
        const hotspots: CodeHealthReport['hotspots'] = [];

        for (const file of files) {
            const results = this.analyzeFile(file.path, file.content);
            allResults.push(...results);

            // Find frustration patterns
            const lines = file.content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];

                for (const { pattern, type } of FRUSTRATION_PATTERNS) {
                    const match = line.match(pattern);
                    if (match) {
                        let indicator = frustrationIndicators.find(f => f.type === type);
                        if (!indicator) {
                            indicator = { type, count: 0, locations: [], severity: 0 };
                            frustrationIndicators.push(indicator);
                        }
                        indicator.count++;
                        indicator.locations.push({ file: file.path, line: i + 1, text: line.trim() });
                        indicator.severity = Math.min(10, indicator.count * (type === 'wtf' ? 3 : 1));

                        if (type === 'wtf' || type === 'hack') {
                            hotspots.push({
                                file: file.path,
                                line: i + 1,
                                issue: `${type.toUpperCase()} found: ${match[0]}`,
                                severity: type === 'wtf' ? 8 : 5
                            });
                        }
                    }
                }
            }
        }

        const overallSentiment = allResults.length > 0
            ? allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length
            : 0;

        const positiveAreas = allResults
            .filter(r => r.sentiment === 'positive' || r.sentiment === 'excited')
            .map(r => r.keywords.join(', '))
            .slice(0, 5);

        const negativeAreas = allResults
            .filter(r => r.sentiment === 'negative' || r.sentiment === 'frustrated')
            .map(r => r.keywords.join(', '))
            .slice(0, 5);

        const recommendations = this.generateRecommendations(frustrationIndicators, overallSentiment);

        return {
            overallSentiment: Math.round(overallSentiment * 100) / 100,
            frustrationIndicators,
            positiveAreas,
            negativeAreas,
            recommendations,
            timeline: [],
            hotspots: hotspots.sort((a, b) => b.severity - a.severity).slice(0, 10)
        };
    }

    private generateRecommendations(indicators: FrustrationIndicator[], sentiment: number): string[] {
        const recommendations: string[] = [];

        const todoCount = indicators.find(i => i.type === 'todo')?.count || 0;
        const hackCount = indicators.find(i => i.type === 'hack')?.count || 0;
        const wtfCount = indicators.find(i => i.type === 'wtf')?.count || 0;

        if (todoCount > 10) {
            recommendations.push(`High TODO count (${todoCount}). Consider scheduling a cleanup sprint.`);
        }

        if (hackCount > 5) {
            recommendations.push(`Multiple HACKs detected (${hackCount}). Technical debt is accumulating.`);
        }

        if (wtfCount > 0) {
            recommendations.push(`WTF/XXX comments found (${wtfCount}). Code review recommended for these sections.`);
        }

        if (sentiment < -0.2) {
            recommendations.push('Overall negative sentiment detected. Team morale check recommended.');
        }

        if (indicators.find(i => i.type === 'deadline_pressure')) {
            recommendations.push('Deadline pressure detected in comments. Consider workload balance.');
        }

        if (indicators.find(i => i.type === 'confusion')) {
            recommendations.push('Confusion indicators found. Documentation improvement may help.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Code health looks good! Keep up the positive momentum.');
        }

        return recommendations;
    }

    getTeamMorale(commits: { message: string; author: string; date: Date }[]): TeamMorale {
        const { byAuthor } = this.analyzeCommits(commits);

        const byDeveloper = Array.from(byAuthor.entries()).map(([name, sentiment]) => ({
            name,
            sentiment,
            recentTrend: sentiment > 0.1 ? 'positive' : sentiment < -0.1 ? 'negative' : 'stable'
        }));

        const overall = byDeveloper.length > 0
            ? byDeveloper.reduce((sum, d) => sum + d.sentiment, 0) / byDeveloper.length
            : 0;

        const alerts: TeamMorale['alerts'] = [];

        for (const dev of byDeveloper) {
            if (dev.sentiment < -0.3) {
                alerts.push({
                    type: 'frustration',
                    message: `${dev.name} may be experiencing frustration (sentiment: ${dev.sentiment})`,
                    severity: 'medium'
                });
            }
        }

        return {
            overall: Math.round(overall * 100) / 100,
            trend: overall > 0 ? 'improving' : overall < 0 ? 'declining' : 'stable',
            byDeveloper,
            alerts
        };
    }

    getHistory(): SentimentResult[] {
        return [...this.analysisHistory];
    }

    getFileAnalysis(filePath: string): SentimentResult[] {
        return this.fileAnalysis.get(filePath) || [];
    }

    clearHistory(): void {
        this.analysisHistory = [];
        this.fileAnalysis.clear();
    }
}

export const codeSentimentAnalyzer = CodeSentimentAnalyzer.getInstance();
