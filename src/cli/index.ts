#!/usr/bin/env node
/**
 * Shadow AI CLI
 * Command-line interface for Shadow AI
 * Similar to Cursor's CLI tool
 */

import { program } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';

// CLI version from package.json
const VERSION = '3.0.0';

program
    .name('shadow-ai')
    .description('Shadow AI Command Line Interface')
    .version(VERSION);

/**
 * Open command - Open project or file in Shadow AI
 */
program
    .command('open [path]')
    .description('Open a project or file in Shadow AI')
    .option('-n, --new-window', 'Open in a new window')
    .option('-g, --goto <line>', 'Go to specific line number')
    .option('-w, --wait', 'Wait for Shadow AI to close')
    .action(async (path: string | undefined, options) => {
        const targetPath = path ? resolve(process.cwd(), path) : process.cwd();

        if (!existsSync(targetPath)) {
            console.error(`❌ Path does not exist: ${targetPath}`);
            process.exit(1);
        }

        console.log(`🚀 Opening in Shadow AI: ${targetPath}`);

        // Build deeplink URL
        let url = `shadow-ai://open?path=${encodeURIComponent(targetPath)}`;
        if (options.newWindow) url += '&newWindow=true';
        if (options.goto) url += `&line=${options.goto}`;

        // Open using system's default handler
        const { exec } = await import('child_process');
        const command = process.platform === 'darwin' ? `open "${url}"` :
            process.platform === 'win32' ? `start "" "${url}"` :
                `xdg-open "${url}"`;

        exec(command, (error) => {
            if (error) {
                console.error('❌ Failed to open Shadow AI:', error.message);
                console.log('💡 Make sure Shadow AI is installed and the deeplink handler is registered.');
                process.exit(1);
            }

            if (!options.wait) {
                process.exit(0);
            }
        });
    });

/**
 * Task command - Submit a task to Shadow AI
 */
program
    .command('task <description>')
    .description('Submit a task to Shadow AI')
    .option('-p, --priority <level>', 'Task priority (low, normal, high, critical)', 'normal')
    .option('-w, --workspace <path>', 'Workspace path for the task')
    .action(async (description: string, options) => {
        console.log(`📋 Submitting task: ${description}`);

        // Build deeplink URL
        let url = `shadow-ai://task?description=${encodeURIComponent(description)}`;
        url += `&priority=${options.priority}`;
        if (options.workspace) {
            url += `&workspace=${encodeURIComponent(resolve(options.workspace))}`;
        }

        const { exec } = await import('child_process');
        const command = process.platform === 'darwin' ? `open "${url}"` :
            process.platform === 'win32' ? `start "" "${url}"` :
                `xdg-open "${url}"`;

        exec(command, (error) => {
            if (error) {
                console.error('❌ Failed to submit task:', error.message);
                process.exit(1);
            }
            console.log('✅ Task submitted to Shadow AI');
            process.exit(0);
        });
    });

/**
 * Chat command - Send a message to Shadow AI
 */
program
    .command('chat <message>')
    .description('Send a chat message to Shadow AI')
    .option('-c, --context <file>', 'Include file as context')
    .action(async (message: string, options) => {
        console.log(`💬 Sending message: ${message}`);

        let url = `shadow-ai://chat?message=${encodeURIComponent(message)}`;
        if (options.context) {
            url += `&context=${encodeURIComponent(resolve(options.context))}`;
        }

        const { exec } = await import('child_process');
        const command = process.platform === 'darwin' ? `open "${url}"` :
            process.platform === 'win32' ? `start "" "${url}"` :
                `xdg-open "${url}"`;

        exec(command, (error) => {
            if (error) {
                console.error('❌ Failed to send message:', error.message);
                process.exit(1);
            }
            console.log('✅ Message sent to Shadow AI');
            process.exit(0);
        });
    });

/**
 * Status command - Check Shadow AI status
 */
program
    .command('status')
    .description('Check Shadow AI status')
    .action(async () => {
        console.log('📊 Shadow AI Status\n');

        // Check if Shadow AI is running by trying to connect to its local server
        try {
            const response = await fetch('http://localhost:51777/api/status', {
                signal: AbortSignal.timeout(2000),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Shadow AI is running');
                console.log(`   Version: ${data.version || 'unknown'}`);
                console.log(`   Active tasks: ${data.activeTasks || 0}`);
                console.log(`   Uptime: ${data.uptime || 'unknown'}`);
            } else {
                console.log('⚠️ Shadow AI is running but status unavailable');
            }
        } catch (error) {
            console.log('❌ Shadow AI is not running or not reachable');
            console.log('\n💡 Start Shadow AI to use CLI commands.');
        }
    });

/**
 * Config command - Manage Shadow AI configuration
 */
program
    .command('config')
    .description('Manage Shadow AI configuration')
    .option('-l, --list', 'List all configuration')
    .option('-g, --get <key>', 'Get a configuration value')
    .option('-s, --set <key=value>', 'Set a configuration value')
    .option('-r, --reset', 'Reset to defaults')
    .action(async (options) => {
        if (options.list) {
            console.log('📋 Shadow AI Configuration\n');
            // Would need to implement IPC or local config reading
            console.log('Configuration listing requires Shadow AI to be running.');
            console.log('Use the Settings panel in the app for full configuration.');
        } else if (options.get) {
            console.log(`Getting config: ${options.get}`);
            // Implementation would require IPC
        } else if (options.set) {
            const [key, value] = options.set.split('=');
            console.log(`Setting ${key} = ${value}`);
            // Implementation would require IPC
        } else if (options.reset) {
            console.log('Resetting configuration to defaults...');
        } else {
            console.log('Use --help to see available config commands');
        }
    });

/**
 * Completion command - Generate shell completions
 */
program
    .command('completion <shell>')
    .description('Generate shell completion script (bash, zsh, fish)')
    .action((shell: string) => {
        const validShells = ['bash', 'zsh', 'fish'];

        if (!validShells.includes(shell)) {
            console.error(`❌ Invalid shell: ${shell}`);
            console.log(`Valid options: ${validShells.join(', ')}`);
            process.exit(1);
        }

        console.log(`# Shadow AI ${shell} completion`);
        console.log(`# Add this to your shell config file\n`);

        if (shell === 'bash') {
            console.log(`
# Shadow AI bash completion
_shadow_ai_completion() {
    local cur="\${COMP_WORDS[COMP_CWORD]}"
    local commands="open task chat status config completion"
    COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
}
complete -F _shadow_ai_completion shadow-ai
`);
        } else if (shell === 'zsh') {
            console.log(`
# Shadow AI zsh completion
_shadow_ai() {
    local -a commands
    commands=(
        'open:Open project or file'
        'task:Submit a task'
        'chat:Send a message'
        'status:Check status'
        'config:Manage configuration'
        'completion:Generate shell completion'
    )
    _describe 'command' commands
}
compdef _shadow_ai shadow-ai
`);
        } else if (shell === 'fish') {
            console.log(`
# Shadow AI fish completion
complete -c shadow-ai -f
complete -c shadow-ai -n "__fish_use_subcommand" -a "open" -d "Open project or file"
complete -c shadow-ai -n "__fish_use_subcommand" -a "task" -d "Submit a task"
complete -c shadow-ai -n "__fish_use_subcommand" -a "chat" -d "Send a message"
complete -c shadow-ai -n "__fish_use_subcommand" -a "status" -d "Check status"
complete -c shadow-ai -n "__fish_use_subcommand" -a "config" -d "Manage configuration"
`);
        }
    });

// Parse arguments
program.parse();
