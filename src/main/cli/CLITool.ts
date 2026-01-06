/**
 * CLI Tool
 * Standalone command-line interface
 */

import { EventEmitter } from 'events';

export interface CLICommand {
    name: string;
    description: string;
    usage: string;
    handler: (args: string[]) => Promise<void>;
}

export interface CLIOptions {
    file?: string;
    output?: string;
    format?: 'json' | 'text' | 'markdown';
    verbose?: boolean;
}

export class CLITool extends EventEmitter {
    private static instance: CLITool;
    private commands: Map<string, CLICommand> = new Map();

    private constructor() {
        super();
        this.initDefaultCommands();
    }

    static getInstance(): CLITool {
        if (!CLITool.instance) CLITool.instance = new CLITool();
        return CLITool.instance;
    }

    private initDefaultCommands(): void {
        this.register({
            name: 'review', description: 'Review a file for code quality', usage: 'shadow review <file>',
            handler: async (args) => { this.emit('command', { name: 'review', args }); }
        });

        this.register({
            name: 'lint', description: 'Run linters on a file', usage: 'shadow lint <file>',
            handler: async (args) => { this.emit('command', { name: 'lint', args }); }
        });

        this.register({
            name: 'format', description: 'Format code', usage: 'shadow format <file>',
            handler: async (args) => { this.emit('command', { name: 'format', args }); }
        });

        this.register({
            name: 'test', description: 'Generate tests for a file', usage: 'shadow test <file>',
            handler: async (args) => { this.emit('command', { name: 'test', args }); }
        });

        this.register({
            name: 'doc', description: 'Generate documentation', usage: 'shadow doc <file>',
            handler: async (args) => { this.emit('command', { name: 'doc', args }); }
        });

        this.register({
            name: 'diff', description: 'Show diff between files', usage: 'shadow diff <file1> <file2>',
            handler: async (args) => { this.emit('command', { name: 'diff', args }); }
        });

        this.register({
            name: 'analyze', description: 'Analyze code complexity', usage: 'shadow analyze <file>',
            handler: async (args) => { this.emit('command', { name: 'analyze', args }); }
        });

        this.register({
            name: 'security', description: 'Scan for security issues', usage: 'shadow security <file>',
            handler: async (args) => { this.emit('command', { name: 'security', args }); }
        });

        this.register({
            name: 'help', description: 'Show help', usage: 'shadow help [command]',
            handler: async (args) => { this.emit('help', { command: args[0] }); }
        });

        this.register({
            name: 'version', description: 'Show version', usage: 'shadow version',
            handler: async () => { this.emit('version'); }
        });
    }

    register(command: CLICommand): void {
        this.commands.set(command.name, command);
    }

    async execute(name: string, args: string[]): Promise<void> {
        const command = this.commands.get(name);
        if (!command) {
            this.emit('error', { message: `Unknown command: ${name}` });
            return;
        }

        try {
            await command.handler(args);
            this.emit('executed', { name, args });
        } catch (error: any) {
            this.emit('error', { name, error: error.message });
        }
    }

    parseArgs(argv: string[]): { command: string; args: string[]; options: CLIOptions } {
        const command = argv[0] || 'help';
        const args: string[] = [];
        const options: CLIOptions = {};

        for (let i = 1; i < argv.length; i++) {
            const arg = argv[i];
            if (arg.startsWith('--')) {
                const [key, value] = arg.slice(2).split('=');
                (options as any)[key] = value || true;
            } else if (arg.startsWith('-')) {
                const key = arg.slice(1);
                (options as any)[key] = argv[++i] || true;
            } else {
                args.push(arg);
            }
        }

        return { command, args, options };
    }

    getCommands(): CLICommand[] { return Array.from(this.commands.values()); }

    getHelp(): string {
        let help = 'Shadow AI CLI\n\nUsage: shadow <command> [options]\n\nCommands:\n';
        for (const cmd of this.commands.values()) {
            help += `  ${cmd.name.padEnd(12)} ${cmd.description}\n`;
        }
        return help;
    }
}

export function getCLITool(): CLITool { return CLITool.getInstance(); }
