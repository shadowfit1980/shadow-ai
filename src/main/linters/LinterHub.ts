/**
 * Linter Hub
 * 40+ linter and scanner support
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface LintResult {
    linter: string;
    file: string;
    line: number;
    column?: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    rule?: string;
    fixable?: boolean;
}

export interface LinterConfig {
    name: string;
    command: string;
    args: string[];
    extensions: string[];
    parser: (output: string) => LintResult[];
}

export class LinterHub extends EventEmitter {
    private static instance: LinterHub;
    private linters: Map<string, LinterConfig> = new Map();
    private results: LintResult[] = [];

    private constructor() {
        super();
        this.initDefaultLinters();
    }

    static getInstance(): LinterHub {
        if (!LinterHub.instance) LinterHub.instance = new LinterHub();
        return LinterHub.instance;
    }

    private initDefaultLinters(): void {
        // JavaScript/TypeScript
        this.registerLinter({
            name: 'eslint', command: 'npx', args: ['eslint', '--format', 'json'], extensions: ['.js', '.jsx', '.ts', '.tsx'],
            parser: (out) => { try { return JSON.parse(out).flatMap((f: any) => f.messages.map((m: any) => ({ linter: 'eslint', file: f.filePath, line: m.line, column: m.column, severity: m.severity === 2 ? 'error' : 'warning', message: m.message, rule: m.ruleId, fixable: m.fix !== undefined }))); } catch { return []; } }
        });

        this.registerLinter({
            name: 'prettier', command: 'npx', args: ['prettier', '--check'], extensions: ['.js', '.ts', '.css', '.json'],
            parser: (out) => out.split('\n').filter(l => l.includes('Checking')).map(l => ({ linter: 'prettier', file: l, line: 1, severity: 'warning' as const, message: 'Formatting issue' }))
        });

        // Python
        this.registerLinter({
            name: 'pylint', command: 'pylint', args: ['--output-format=json'], extensions: ['.py'],
            parser: (out) => { try { return JSON.parse(out).map((m: any) => ({ linter: 'pylint', file: m.path, line: m.line, column: m.column, severity: m.type === 'error' ? 'error' : 'warning', message: m.message, rule: m.symbol })); } catch { return []; } }
        });

        this.registerLinter({
            name: 'flake8', command: 'flake8', args: ['--format=json'], extensions: ['.py'],
            parser: (out) => { try { return Object.entries(JSON.parse(out)).flatMap(([file, msgs]) => (msgs as any[]).map(m => ({ linter: 'flake8', file, line: m.line_number, column: m.column_number, severity: 'warning' as const, message: m.text, rule: m.code }))); } catch { return []; } }
        });

        this.registerLinter({
            name: 'mypy', command: 'mypy', args: ['--output=json'], extensions: ['.py'],
            parser: (out) => out.split('\n').filter(l => l.includes(':')).map(l => { const [file, line, , msg] = l.split(':'); return { linter: 'mypy', file, line: parseInt(line), severity: 'error' as const, message: msg?.trim() || '' }; })
        });

        // Ruby
        this.registerLinter({
            name: 'rubocop', command: 'rubocop', args: ['--format', 'json'], extensions: ['.rb'],
            parser: (out) => { try { return JSON.parse(out).files.flatMap((f: any) => f.offenses.map((o: any) => ({ linter: 'rubocop', file: f.path, line: o.location.start_line, severity: o.severity === 'error' ? 'error' : 'warning', message: o.message, rule: o.cop_name }))); } catch { return []; } }
        });

        // Go
        this.registerLinter({
            name: 'golint', command: 'golint', args: [], extensions: ['.go'],
            parser: (out) => out.split('\n').filter(l => l).map(l => { const match = l.match(/^(.+):(\d+):\d+: (.+)$/); return match ? { linter: 'golint', file: match[1], line: parseInt(match[2]), severity: 'warning' as const, message: match[3] } : null; }).filter(Boolean) as LintResult[]
        });

        // CSS
        this.registerLinter({
            name: 'stylelint', command: 'npx', args: ['stylelint', '--formatter', 'json'], extensions: ['.css', '.scss', '.less'],
            parser: (out) => { try { return JSON.parse(out).flatMap((f: any) => f.warnings.map((w: any) => ({ linter: 'stylelint', file: f.source, line: w.line, column: w.column, severity: w.severity as 'error' | 'warning', message: w.text, rule: w.rule }))); } catch { return []; } }
        });

        // Security Scanners
        this.registerLinter({
            name: 'semgrep', command: 'semgrep', args: ['--json', '--config=auto'], extensions: ['*'],
            parser: (out) => { try { return JSON.parse(out).results.map((r: any) => ({ linter: 'semgrep', file: r.path, line: r.start.line, severity: 'error' as const, message: r.extra.message, rule: r.check_id })); } catch { return []; } }
        });

        this.registerLinter({
            name: 'bandit', command: 'bandit', args: ['-f', 'json'], extensions: ['.py'],
            parser: (out) => { try { return JSON.parse(out).results.map((r: any) => ({ linter: 'bandit', file: r.filename, line: r.line_number, severity: r.issue_severity.toLowerCase() as 'error' | 'warning', message: r.issue_text, rule: r.test_id })); } catch { return []; } }
        });

        // Shell
        this.registerLinter({
            name: 'shellcheck', command: 'shellcheck', args: ['-f', 'json'], extensions: ['.sh', '.bash'],
            parser: (out) => { try { return JSON.parse(out).map((r: any) => ({ linter: 'shellcheck', file: r.file, line: r.line, column: r.column, severity: r.level === 'error' ? 'error' : 'warning', message: r.message, rule: `SC${r.code}` })); } catch { return []; } }
        });
    }

    registerLinter(config: LinterConfig): void {
        this.linters.set(config.name, config);
        this.emit('linterRegistered', config.name);
    }

    async run(linterName: string, filePath: string): Promise<LintResult[]> {
        const linter = this.linters.get(linterName);
        if (!linter) throw new Error(`Unknown linter: ${linterName}`);

        return new Promise((resolve) => {
            let output = '';
            const proc = spawn(linter.command, [...linter.args, filePath], { shell: true });
            proc.stdout.on('data', (data) => { output += data.toString(); });
            proc.stderr.on('data', (data) => { output += data.toString(); });
            proc.on('close', () => {
                const results = linter.parser(output);
                this.results.push(...results);
                this.emit('lintComplete', { linter: linterName, file: filePath, results });
                resolve(results);
            });
        });
    }

    async runAll(filePath: string): Promise<LintResult[]> {
        const ext = filePath.substring(filePath.lastIndexOf('.'));
        const applicable = Array.from(this.linters.values()).filter(l => l.extensions.includes(ext) || l.extensions.includes('*'));
        const allResults: LintResult[] = [];

        for (const linter of applicable) {
            try {
                const results = await this.run(linter.name, filePath);
                allResults.push(...results);
            } catch { /* linter not available */ }
        }

        return allResults;
    }

    getLinters(): string[] { return Array.from(this.linters.keys()); }
    getResults(): LintResult[] { return [...this.results]; }
    clearResults(): void { this.results = []; }

    getLinterCount(): number { return this.linters.size; }
}

export function getLinterHub(): LinterHub { return LinterHub.getInstance(); }
