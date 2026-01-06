/**
 * 🖥️ Console Commands
 * 
 * In-game developer console:
 * - Command parsing
 * - Auto-complete
 * - History
 * - Custom commands
 */

import { EventEmitter } from 'events';

export interface ConsoleCommand {
    name: string;
    description: string;
    usage: string;
    handler: string;
}

export class ConsoleCommands extends EventEmitter {
    private static instance: ConsoleCommands;
    private commands: Map<string, ConsoleCommand> = new Map();

    private constructor() {
        super();
        this.initializeDefaultCommands();
    }

    static getInstance(): ConsoleCommands {
        if (!ConsoleCommands.instance) {
            ConsoleCommands.instance = new ConsoleCommands();
        }
        return ConsoleCommands.instance;
    }

    private initializeDefaultCommands(): void {
        this.commands.set('help', {
            name: 'help', description: 'Show available commands',
            usage: 'help [command]', handler: 'showHelp'
        });
        this.commands.set('clear', {
            name: 'clear', description: 'Clear console',
            usage: 'clear', handler: 'clearConsole'
        });
        this.commands.set('god', {
            name: 'god', description: 'Toggle god mode',
            usage: 'god', handler: 'toggleGodMode'
        });
        this.commands.set('noclip', {
            name: 'noclip', description: 'Toggle noclip',
            usage: 'noclip', handler: 'toggleNoclip'
        });
        this.commands.set('teleport', {
            name: 'teleport', description: 'Teleport to position',
            usage: 'teleport <x> <y>', handler: 'teleportPlayer'
        });
        this.commands.set('spawn', {
            name: 'spawn', description: 'Spawn entity',
            usage: 'spawn <entity> [x] [y]', handler: 'spawnEntity'
        });
        this.commands.set('kill', {
            name: 'kill', description: 'Kill entity or player',
            usage: 'kill [entity|all]', handler: 'killEntity'
        });
        this.commands.set('give', {
            name: 'give', description: 'Give item to player',
            usage: 'give <item> [amount]', handler: 'giveItem'
        });
        this.commands.set('setvar', {
            name: 'setvar', description: 'Set game variable',
            usage: 'setvar <name> <value>', handler: 'setVariable'
        });
        this.commands.set('timescale', {
            name: 'timescale', description: 'Set time scale',
            usage: 'timescale <0.1-10>', handler: 'setTimeScale'
        });
        this.commands.set('fps', {
            name: 'fps', description: 'Show FPS counter',
            usage: 'fps', handler: 'toggleFPS'
        });
        this.commands.set('stats', {
            name: 'stats', description: 'Show game stats',
            usage: 'stats', handler: 'showStats'
        });
    }

    getCommands(): ConsoleCommand[] {
        return Array.from(this.commands.values());
    }

    generateConsoleCode(): string {
        return `
class DevConsole {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.history = [];
        this.historyIndex = -1;
        this.commands = new Map();
        this.output = [];
        this.input = '';
        this.cursorPos = 0;

        this.setupDefaultCommands();
        this.setupInput();
    }

    setupDefaultCommands() {
        this.register('help', '[cmd]', 'Show help', (args) => {
            if (args[0]) {
                const cmd = this.commands.get(args[0]);
                if (cmd) {
                    this.log(\`\${cmd.name} \${cmd.usage}\`);
                    this.log(\`  \${cmd.description}\`);
                } else {
                    this.log('Unknown command: ' + args[0]);
                }
            } else {
                this.log('Available commands:');
                for (const cmd of this.commands.values()) {
                    this.log(\`  \${cmd.name} - \${cmd.description}\`);
                }
            }
        });

        this.register('clear', '', 'Clear console', () => {
            this.output = [];
        });

        this.register('god', '', 'Toggle god mode', () => {
            this.game.player.invincible = !this.game.player.invincible;
            this.log('God mode: ' + (this.game.player.invincible ? 'ON' : 'OFF'));
        });

        this.register('noclip', '', 'Toggle noclip', () => {
            this.game.player.noclip = !this.game.player.noclip;
            this.log('Noclip: ' + (this.game.player.noclip ? 'ON' : 'OFF'));
        });

        this.register('teleport', '<x> <y>', 'Teleport player', (args) => {
            const x = parseFloat(args[0]);
            const y = parseFloat(args[1]);
            if (!isNaN(x) && !isNaN(y)) {
                this.game.player.x = x;
                this.game.player.y = y;
                this.log(\`Teleported to \${x}, \${y}\`);
            } else {
                this.log('Usage: teleport <x> <y>');
            }
        });

        this.register('spawn', '<entity> [x] [y]', 'Spawn entity', (args) => {
            const type = args[0];
            const x = parseFloat(args[1]) || this.game.player.x + 100;
            const y = parseFloat(args[2]) || this.game.player.y;
            this.game.spawn?.(type, x, y);
            this.log(\`Spawned \${type} at \${x}, \${y}\`);
        });

        this.register('give', '<item> [amount]', 'Give item', (args) => {
            const item = args[0];
            const amount = parseInt(args[1]) || 1;
            this.game.player.inventory?.add(item, amount);
            this.log(\`Gave \${amount}x \${item}\`);
        });

        this.register('timescale', '<scale>', 'Set time scale', (args) => {
            const scale = parseFloat(args[0]);
            if (scale >= 0.1 && scale <= 10) {
                this.game.timeScale = scale;
                this.log('Time scale: ' + scale);
            } else {
                this.log('Scale must be between 0.1 and 10');
            }
        });

        this.register('fps', '', 'Toggle FPS display', () => {
            this.game.showFPS = !this.game.showFPS;
            this.log('FPS display: ' + (this.game.showFPS ? 'ON' : 'OFF'));
        });
    }

    register(name, usage, description, handler) {
        this.commands.set(name, { name, usage, description, handler });
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Backquote') {
                this.toggle();
                e.preventDefault();
                return;
            }

            if (!this.visible) return;

            if (e.code === 'Enter') {
                this.execute(this.input);
                this.history.push(this.input);
                this.historyIndex = this.history.length;
                this.input = '';
            } else if (e.code === 'ArrowUp') {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input = this.history[this.historyIndex] || '';
                }
            } else if (e.code === 'ArrowDown') {
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input = this.history[this.historyIndex] || '';
                } else {
                    this.historyIndex = this.history.length;
                    this.input = '';
                }
            } else if (e.code === 'Tab') {
                this.autocomplete();
                e.preventDefault();
            } else if (e.code === 'Backspace') {
                this.input = this.input.slice(0, -1);
            } else if (e.key.length === 1) {
                this.input += e.key;
            }
        });
    }

    toggle() {
        this.visible = !this.visible;
        this.game.paused = this.visible;
    }

    execute(input) {
        const parts = input.trim().split(/\\s+/);
        const cmdName = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        this.log('> ' + input);

        const cmd = this.commands.get(cmdName);
        if (cmd) {
            try {
                cmd.handler(args);
            } catch (e) {
                this.log('Error: ' + e.message);
            }
        } else {
            this.log('Unknown command: ' + cmdName);
        }
    }

    autocomplete() {
        const matches = [];
        for (const name of this.commands.keys()) {
            if (name.startsWith(this.input.toLowerCase())) {
                matches.push(name);
            }
        }
        if (matches.length === 1) {
            this.input = matches[0] + ' ';
        } else if (matches.length > 1) {
            this.log('Matches: ' + matches.join(', '));
        }
    }

    log(message) {
        this.output.push({ text: message, time: Date.now() });
        if (this.output.length > 100) this.output.shift();
    }

    render(ctx, width, height) {
        if (!this.visible) return;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height / 2);

        // Output
        ctx.font = '14px monospace';
        ctx.fillStyle = '#0f0';
        const lineHeight = 18;
        const startY = (height / 2) - 40;

        this.output.slice(-15).forEach((line, i) => {
            ctx.fillText(line.text, 10, startY - (14 - i) * lineHeight);
        });

        // Input line
        ctx.fillStyle = '#0f0';
        ctx.fillText('> ' + this.input + '_', 10, (height / 2) - 10);
    }
}`;
    }
}

export const consoleCommands = ConsoleCommands.getInstance();
