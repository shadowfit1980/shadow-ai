/**
 * Terminal Agent
 * 
 * Secure shell command execution with validation,
 * suggestions, and output parsing.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';

const execAsync = promisify(exec);

// ============================================================================
// TYPES
// ============================================================================

export interface CommandRequest {
    command: string;
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    requireConfirmation?: boolean;
}

export interface CommandResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
    executionTime: number;
    command: string;
}

export interface CommandValidation {
    safe: boolean;
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    issues: string[];
    suggestions: string[];
    requiresConfirmation: boolean;
}

export interface CommandSuggestion {
    command: string;
    description: string;
    confidence: number;
}

export interface AutoFixSuggestion {
    originalError: string;
    suggestedFix: string;
    explanation: string;
    confidence: number;
    commands: string[];
}

export interface CommandChain {
    id: string;
    commands: CommandRequest[];
    stopOnError: boolean;
    results: CommandResult[];
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface TerminalSession {
    id: string;
    name: string;
    cwd: string;
    env: Record<string, string>;
    history: CommandResult[];
    createdAt: Date;
    lastActiveAt: Date;
}

// ============================================================================
// DANGEROUS PATTERNS
// ============================================================================

const DANGEROUS_PATTERNS = [
    // File system destruction
    { pattern: /rm\s+(-rf?|--force)?\s+[\/~]/, risk: 'critical', reason: 'Recursive delete of system directories' },
    { pattern: /rm\s+-rf?\s+\*/, risk: 'critical', reason: 'Recursive delete with wildcard' },
    { pattern: />\s*\/dev\/sd[a-z]/, risk: 'critical', reason: 'Direct write to disk device' },
    { pattern: /mkfs/, risk: 'critical', reason: 'Format filesystem' },
    { pattern: /dd\s+.*of=\/dev/, risk: 'critical', reason: 'Direct disk write' },

    // System modification
    { pattern: /chmod\s+777/, risk: 'high', reason: 'Insecure permissions' },
    { pattern: /chmod\s+-R/, risk: 'medium', reason: 'Recursive permission change' },
    { pattern: /chown\s+-R/, risk: 'medium', reason: 'Recursive ownership change' },
    { pattern: /sudo\s+/, risk: 'high', reason: 'Elevated privileges' },
    { pattern: /su\s+-/, risk: 'high', reason: 'User switch' },

    // Network/Security
    { pattern: /curl.*\|\s*(ba)?sh/, risk: 'critical', reason: 'Piping remote script to shell' },
    { pattern: /wget.*\|\s*(ba)?sh/, risk: 'critical', reason: 'Piping remote script to shell' },
    { pattern: /eval\s+/, risk: 'high', reason: 'Dynamic code execution' },
    { pattern: /\$\(.*\)/, risk: 'medium', reason: 'Command substitution' },

    // Process control
    { pattern: /kill\s+-9\s+1\b/, risk: 'critical', reason: 'Kill init process' },
    { pattern: /pkill\s+-9/, risk: 'high', reason: 'Force kill processes' },
    { pattern: /shutdown/, risk: 'critical', reason: 'System shutdown' },
    { pattern: /reboot/, risk: 'critical', reason: 'System reboot' },

    // Fork bomb and resource exhaustion
    { pattern: /:\(\)\{.*\}/, risk: 'critical', reason: 'Fork bomb' },
    { pattern: /while\s+true.*do/, risk: 'high', reason: 'Infinite loop' }
];

const SAFE_COMMANDS = [
    'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'grep', 'find', 'echo',
    'which', 'whoami', 'date', 'cal', 'clear', 'history',
    'node', 'npm', 'npx', 'yarn', 'pnpm',
    'python', 'python3', 'pip', 'pip3',
    'git', 'gh',
    'docker', 'docker-compose',
    'make', 'cargo', 'go',
    'code', 'vim', 'nano'
];

// ============================================================================
// TERMINAL AGENT
// ============================================================================

export class TerminalAgent extends EventEmitter {
    private static instance: TerminalAgent;
    private modelManager: ModelManager;
    private commandHistory: CommandResult[] = [];
    private maxHistorySize = 100;
    private sessions: Map<string, TerminalSession> = new Map();
    private activeSessionId: string | null = null;
    private commandChains: Map<string, CommandChain> = new Map();

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        // Create default session
        this.createSession('default');
        this.activeSessionId = 'default';
    }

    static getInstance(): TerminalAgent {
        if (!TerminalAgent.instance) {
            TerminalAgent.instance = new TerminalAgent();
        }
        return TerminalAgent.instance;
    }

    // ========================================================================
    // COMMAND VALIDATION
    // ========================================================================

    /**
     * Validate a command for safety
     */
    validateCommand(command: string): CommandValidation {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let highestRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';

        // Check against dangerous patterns
        for (const { pattern, risk, reason } of DANGEROUS_PATTERNS) {
            if (pattern.test(command)) {
                issues.push(reason);
                if (this.riskLevel(risk) > this.riskLevel(highestRisk)) {
                    highestRisk = risk as any;
                }
            }
        }

        // Check if base command is known safe
        const baseCommand = command.trim().split(/\s+/)[0];
        if (SAFE_COMMANDS.includes(baseCommand)) {
            if (highestRisk === 'safe') {
                return {
                    safe: true,
                    riskLevel: 'safe',
                    issues: [],
                    suggestions: [],
                    requiresConfirmation: false
                };
            }
        }

        // Generate suggestions for risky commands
        if (highestRisk !== 'safe') {
            suggestions.push('Consider running this command manually to verify its effects');
            if (command.includes('rm')) {
                suggestions.push('Use -i flag for interactive deletion');
            }
            if (command.includes('sudo')) {
                suggestions.push('Verify you really need elevated privileges');
            }
        }

        return {
            safe: highestRisk === 'safe' || highestRisk === 'low',
            riskLevel: highestRisk,
            issues,
            suggestions,
            requiresConfirmation: highestRisk !== 'safe'
        };
    }

    private riskLevel(risk: string): number {
        const levels: Record<string, number> = {
            'safe': 0,
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        };
        return levels[risk] || 0;
    }

    // ========================================================================
    // COMMAND EXECUTION
    // ========================================================================

    /**
     * Execute a command with validation
     */
    async execute(request: CommandRequest): Promise<CommandResult> {
        const startTime = Date.now();
        const { command, cwd, env, timeout = 30000 } = request;

        console.log(`🖥️  Executing: ${command}`);
        this.emit('command:started', { command });

        // Validate command
        const validation = this.validateCommand(command);

        if (!validation.safe && !request.requireConfirmation) {
            console.log(`⚠️  Command blocked: ${validation.issues.join(', ')}`);
            return {
                success: false,
                stdout: '',
                stderr: `Command blocked: ${validation.issues.join(', ')}. Risk level: ${validation.riskLevel}`,
                exitCode: 1,
                executionTime: Date.now() - startTime,
                command
            };
        }

        if (validation.riskLevel === 'critical') {
            console.log(`🚫 Critical risk command blocked: ${command}`);
            return {
                success: false,
                stdout: '',
                stderr: 'Critical risk command blocked for safety',
                exitCode: 1,
                executionTime: Date.now() - startTime,
                command
            };
        }

        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: cwd || process.cwd(),
                env: { ...process.env, ...env },
                timeout,
                maxBuffer: 10 * 1024 * 1024 // 10MB
            });

            const result: CommandResult = {
                success: true,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: 0,
                executionTime: Date.now() - startTime,
                command
            };

            this.addToHistory(result);
            this.emit('command:completed', result);

            return result;

        } catch (error: any) {
            const result: CommandResult = {
                success: false,
                stdout: error.stdout?.trim() || '',
                stderr: error.stderr?.trim() || error.message,
                exitCode: error.code || 1,
                executionTime: Date.now() - startTime,
                command
            };

            this.addToHistory(result);
            this.emit('command:failed', result);

            return result;
        }
    }

    /**
     * Execute command and stream output
     */
    async executeStreaming(
        request: CommandRequest,
        onOutput: (type: 'stdout' | 'stderr', data: string) => void
    ): Promise<CommandResult> {
        const startTime = Date.now();
        const { command, cwd, env, timeout = 30000 } = request;

        // Validate first
        const validation = this.validateCommand(command);
        if (validation.riskLevel === 'critical' || validation.riskLevel === 'high') {
            return {
                success: false,
                stdout: '',
                stderr: `Command blocked: ${validation.issues.join(', ')}`,
                exitCode: 1,
                executionTime: 0,
                command
            };
        }

        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';

            const proc = spawn(command, [], {
                cwd: cwd || process.cwd(),
                env: { ...process.env, ...env },
                shell: true
            });

            const timeoutHandle = setTimeout(() => {
                proc.kill('SIGKILL');
            }, timeout);

            proc.stdout.on('data', (data) => {
                const str = data.toString();
                stdout += str;
                onOutput('stdout', str);
            });

            proc.stderr.on('data', (data) => {
                const str = data.toString();
                stderr += str;
                onOutput('stderr', str);
            });

            proc.on('close', (code) => {
                clearTimeout(timeoutHandle);
                const result: CommandResult = {
                    success: code === 0,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code || 0,
                    executionTime: Date.now() - startTime,
                    command
                };
                this.addToHistory(result);
                resolve(result);
            });

            proc.on('error', (error) => {
                clearTimeout(timeoutHandle);
                resolve({
                    success: false,
                    stdout: '',
                    stderr: error.message,
                    exitCode: 1,
                    executionTime: Date.now() - startTime,
                    command
                });
            });
        });
    }

    // ========================================================================
    // COMMAND SUGGESTIONS
    // ========================================================================

    /**
     * Suggest commands based on intent
     */
    async suggestCommands(intent: string, context?: string): Promise<CommandSuggestion[]> {
        const prompt = `Based on this intent, suggest shell commands.

Intent: ${intent}
${context ? `Context: ${context}` : ''}
Recent commands: ${this.commandHistory.slice(-5).map(h => h.command).join(', ')}

Provide 3-5 command suggestions in JSON:
\`\`\`json
{
    "suggestions": [
        {
            "command": "the actual command",
            "description": "what it does",
            "confidence": 0.0-1.0
        }
    ]
}
\`\`\`

Only suggest safe, common commands. Avoid destructive operations.`;

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a helpful terminal assistant. Suggest safe, practical shell commands.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            const parsed = this.parseJSON(response);
            return parsed.suggestions || [];
        } catch {
            return [];
        }
    }

    /**
     * Parse command output and extract structured information
     */
    async parseOutput(output: string, context?: string): Promise<{
        summary: string;
        keyInfo: string[];
        actions: string[];
        errors: string[];
    }> {
        const prompt = `Parse this terminal output and extract key information.

Output:
\`\`\`
${output.slice(0, 2000)}
\`\`\`

${context ? `Context: ${context}` : ''}

Respond in JSON:
\`\`\`json
{
    "summary": "brief summary of what the output shows",
    "keyInfo": ["important pieces of information"],
    "actions": ["suggested follow-up actions"],
    "errors": ["any errors or warnings found"]
}
\`\`\``;

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are a terminal output parser. Extract structured information from command outputs.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            return this.parseJSON(response);
        } catch {
            return {
                summary: 'Unable to parse output',
                keyInfo: [],
                actions: [],
                errors: []
            };
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private addToHistory(result: CommandResult): void {
        this.commandHistory.push(result);
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }
    }

    private parseJSON(text: string): any {
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonStr);
        } catch {
            return {};
        }
    }

    getHistory(): CommandResult[] {
        return [...this.commandHistory];
    }

    clearHistory(): void {
        this.commandHistory = [];
    }

    getStats() {
        const successful = this.commandHistory.filter(c => c.success).length;
        return {
            totalCommands: this.commandHistory.length,
            successfulCommands: successful,
            failedCommands: this.commandHistory.length - successful,
            avgExecutionTime: this.commandHistory.length > 0
                ? this.commandHistory.reduce((sum, c) => sum + c.executionTime, 0) / this.commandHistory.length
                : 0
        };
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    /**
     * Create a new terminal session
     */
    createSession(name: string, cwd?: string): TerminalSession {
        const session: TerminalSession = {
            id: name,
            name,
            cwd: cwd || process.cwd(),
            env: {},
            history: [],
            createdAt: new Date(),
            lastActiveAt: new Date()
        };
        this.sessions.set(name, session);
        this.emit('session:created', session);
        return session;
    }

    /**
     * Switch to a different session
     */
    switchSession(sessionId: string): boolean {
        if (this.sessions.has(sessionId)) {
            this.activeSessionId = sessionId;
            const session = this.sessions.get(sessionId)!;
            session.lastActiveAt = new Date();
            this.emit('session:switched', session);
            return true;
        }
        return false;
    }

    /**
     * Get current or specific session
     */
    getSession(sessionId?: string): TerminalSession | null {
        const id = sessionId || this.activeSessionId;
        if (id && this.sessions.has(id)) {
            return this.sessions.get(id)!;
        }
        return null;
    }

    /**
     * List all sessions
     */
    listSessions(): TerminalSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Set environment variable for session
     */
    setSessionEnv(key: string, value: string, sessionId?: string): void {
        const session = this.getSession(sessionId);
        if (session) {
            session.env[key] = value;
        }
    }

    /**
     * Close a session
     */
    closeSession(sessionId: string): boolean {
        if (sessionId === 'default') return false; // Can't close default
        const deleted = this.sessions.delete(sessionId);
        if (deleted && this.activeSessionId === sessionId) {
            this.activeSessionId = 'default';
        }
        return deleted;
    }

    // ========================================================================
    // COMMAND CHAINING
    // ========================================================================

    /**
     * Create a new command chain
     */
    createChain(commands: CommandRequest[], options: { stopOnError?: boolean } = {}): CommandChain {
        const chain: CommandChain = {
            id: `chain_${Date.now()}`,
            commands,
            stopOnError: options.stopOnError ?? true,
            results: [],
            status: 'pending'
        };
        this.commandChains.set(chain.id, chain);
        return chain;
    }

    /**
     * Execute a command chain
     */
    async executeChain(chainId: string): Promise<CommandChain> {
        const chain = this.commandChains.get(chainId);
        if (!chain) {
            throw new Error(`Chain ${chainId} not found`);
        }

        chain.status = 'running';
        this.emit('chain:started', chain);

        const session = this.getSession();

        for (const request of chain.commands) {
            // Use session context if available
            const enhancedRequest: CommandRequest = {
                ...request,
                cwd: request.cwd || session?.cwd,
                env: { ...session?.env, ...request.env }
            };

            const result = await this.execute(enhancedRequest);
            chain.results.push(result);

            this.emit('chain:step', { chain, result });

            if (!result.success && chain.stopOnError) {
                chain.status = 'failed';
                this.emit('chain:failed', chain);
                return chain;
            }
        }

        chain.status = 'completed';
        this.emit('chain:completed', chain);
        return chain;
    }

    /**
     * Get chain status
     */
    getChain(chainId: string): CommandChain | undefined {
        return this.commandChains.get(chainId);
    }

    // ========================================================================
    // AUTO-FIX SUGGESTIONS
    // ========================================================================

    /**
     * Suggest fixes for a failed command
     */
    async suggestAutoFix(failedResult: CommandResult): Promise<AutoFixSuggestion | null> {
        if (failedResult.success) return null;

        const prompt = `A command failed. Suggest how to fix it.

Command: ${failedResult.command}
Exit Code: ${failedResult.exitCode}
Error Output:
\`\`\`
${failedResult.stderr.slice(0, 1500)}
\`\`\`
${failedResult.stdout ? `Standard Output:\n\`\`\`\n${failedResult.stdout.slice(0, 500)}\n\`\`\`` : ''}

Analyze the error and provide a fix. Respond in JSON:
\`\`\`json
{
    "originalError": "brief description of what went wrong",
    "suggestedFix": "what needs to be done to fix it",
    "explanation": "why this fix works",
    "confidence": 0.0-1.0,
    "commands": ["command1", "command2"]
}
\`\`\`

Only suggest safe commands. If unsure, set confidence low.`;

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert terminal troubleshooter. Analyze errors and suggest safe fixes.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);

            const parsed = this.parseJSON(response);
            if (parsed.originalError && parsed.commands) {
                return parsed as AutoFixSuggestion;
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Execute command with automatic retry on failure
     */
    async executeWithAutoFix(
        request: CommandRequest,
        options: { maxRetries?: number; autoApply?: boolean } = {}
    ): Promise<{ result: CommandResult; fixes: AutoFixSuggestion[] }> {
        const { maxRetries = 2, autoApply = false } = options;
        const fixes: AutoFixSuggestion[] = [];

        let result = await this.execute(request);
        let attempts = 0;

        while (!result.success && attempts < maxRetries) {
            const fix = await this.suggestAutoFix(result);
            if (!fix || fix.confidence < 0.7) {
                break; // Can't fix or not confident enough
            }

            fixes.push(fix);
            this.emit('autofix:suggested', fix);

            if (autoApply && fix.commands.length > 0) {
                // Execute fix commands
                for (const cmd of fix.commands) {
                    const fixResult = await this.execute({
                        ...request,
                        command: cmd
                    });

                    if (!fixResult.success) {
                        break; // Fix command failed
                    }
                }

                // Retry original command
                result = await this.execute(request);
                this.emit('autofix:applied', { fix, result });
            } else {
                break; // Manual fix required
            }

            attempts++;
        }

        return { result, fixes };
    }

    /**
     * Get common fixes for error patterns
     */
    getQuickFix(error: string): string | null {
        const quickFixes: Record<string, string> = {
            'command not found': 'Try installing the missing package with: npm install -g <package> or brew install <package>',
            'permission denied': 'You may need elevated privileges. Consider using sudo (carefully) or checking file permissions',
            'ENOENT': 'File or directory not found. Verify the path exists with: ls <path>',
            'EACCES': 'Permission denied. Check file permissions with: ls -la <path>',
            'ECONNREFUSED': 'Connection refused. Ensure the service is running and the port is correct',
            'MODULE_NOT_FOUND': 'Module not found. Try: npm install',
            'SyntaxError': 'Check your code syntax. Look for missing brackets, quotes, or semicolons',
        };

        for (const [pattern, fix] of Object.entries(quickFixes)) {
            if (error.toLowerCase().includes(pattern.toLowerCase())) {
                return fix;
            }
        }
        return null;
    }
}

// Export singleton
export const terminalAgent = TerminalAgent.getInstance();
