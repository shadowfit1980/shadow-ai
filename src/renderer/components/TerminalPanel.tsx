import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLine {
    id: string;
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
    timestamp: Date;
}

interface TerminalPanelProps {
    initialDirectory?: string;
    onCommand?: (command: string) => void;
}

export default function TerminalPanel({ initialDirectory = '~', onCommand }: TerminalPanelProps) {
    const [lines, setLines] = useState<TerminalLine[]>([
        { id: '1', type: 'system', content: '🖥️  Shadow AI Terminal v1.0', timestamp: new Date() },
        { id: '2', type: 'system', content: `📂 ${initialDirectory}`, timestamp: new Date() },
        { id: '3', type: 'system', content: 'Type "help" for available commands\n', timestamp: new Date() },
    ]);
    const [currentInput, setCurrentInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPath, setCurrentPath] = useState(initialDirectory);

    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [lines]);

    // Focus input on click
    const handleTerminalClick = () => {
        inputRef.current?.focus();
    };

    const addLine = (type: TerminalLine['type'], content: string) => {
        setLines(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content,
            timestamp: new Date()
        }]);
    };

    const executeCommand = useCallback(async (command: string) => {
        const trimmedCmd = command.trim();
        if (!trimmedCmd) return;

        // Add command to history
        setHistory(prev => [...prev, trimmedCmd]);
        setHistoryIndex(-1);

        // Show input line
        addLine('input', `$ ${trimmedCmd}`);
        onCommand?.(trimmedCmd);

        setIsProcessing(true);

        // Parse command
        const [cmd, ...args] = trimmedCmd.split(' ');

        try {
            switch (cmd.toLowerCase()) {
                case 'help':
                    addLine('output', `
Available Commands:
  help          - Show this help message
  clear         - Clear terminal
  pwd           - Print working directory
  ls            - List directory contents
  cd <dir>      - Change directory
  echo <text>   - Echo text
  date          - Show current date/time
  node -v       - Node.js version
  npm -v        - npm version
  git status    - Show git status
  git branch    - Show branches
  about         - About Shadow AI
  
AI Commands:
  ai <prompt>   - Ask AI for help
  generate      - Generate code
  analyze       - Analyze current file
`);
                    break;

                case 'clear':
                    setLines([]);
                    break;

                case 'pwd':
                    addLine('output', currentPath);
                    break;

                case 'ls':
                    // Simulate ls output
                    addLine('output', `
📁 node_modules/    📁 src/         📁 public/
📁 dist/            📁 tests/       📁 .git/
📄 package.json     📄 tsconfig.json
📄 vite.config.ts   📄 README.md
`);
                    break;

                case 'cd':
                    if (args[0]) {
                        const newPath = args[0] === '..'
                            ? currentPath.split('/').slice(0, -1).join('/') || '~'
                            : args[0].startsWith('/')
                                ? args[0]
                                : `${currentPath}/${args[0]}`;
                        setCurrentPath(newPath);
                        addLine('system', `📂 ${newPath}`);
                    } else {
                        addLine('error', 'cd: missing directory argument');
                    }
                    break;

                case 'echo':
                    addLine('output', args.join(' '));
                    break;

                case 'date':
                    addLine('output', new Date().toString());
                    break;

                case 'node':
                    if (args[0] === '-v') {
                        addLine('output', 'v20.10.0');
                    }
                    break;

                case 'npm':
                    if (args[0] === '-v') {
                        addLine('output', '10.2.3');
                    }
                    break;

                case 'git':
                    if (args[0] === 'status') {
                        addLine('output', `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/main/index.ts
  modified:   src/renderer/App.tsx

Untracked files:
  src/main/ai/intelligence/
`);
                    } else if (args[0] === 'branch') {
                        addLine('output', `* main
  develop
  feature/model-selector
  feature/code-validation
`);
                    } else {
                        addLine('output', `git ${args.join(' ')}: Command executed`);
                    }
                    break;

                case 'about':
                    addLine('output', `
🌟 Shadow AI v3.0
━━━━━━━━━━━━━━━━━━━━━━━
Autonomous AI Coding Agent
Built with Electron + React + TypeScript

Features:
• 44+ AI models available
• Code validation & auto-fix
• Multi-language support
• Real-time collaboration
`);
                    break;

                case 'ai':
                    if (args.length === 0) {
                        addLine('error', 'ai: missing prompt. Usage: ai <your prompt>');
                    } else {
                        addLine('system', '🤖 Processing AI request...');
                        // Simulate AI response delay
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        addLine('output', `AI Response: Based on your request "${args.join(' ')}", I recommend starting with a clear project structure and modular components.`);
                    }
                    break;

                case 'generate':
                    addLine('system', '⚡ Opening Project Generator...');
                    break;

                case 'analyze':
                    addLine('system', '🔍 Analyzing current file...');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    addLine('output', `
Analysis Complete:
  ✅ No syntax errors
  ✅ 12 functions analyzed
  ⚠️ 2 potential improvements found
  📊 Complexity score: 7.2/10
`);
                    break;

                default:
                    addLine('error', `Command not found: ${cmd}. Type "help" for available commands.`);
            }
        } catch (error) {
            addLine('error', `Error executing command: ${error}`);
        }

        setIsProcessing(false);
    }, [currentPath, onCommand]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeCommand(currentInput);
            setCurrentInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
                setHistoryIndex(newIndex);
                setCurrentInput(history[history.length - 1 - newIndex] || '');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCurrentInput(history[history.length - 1 - newIndex] || '');
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCurrentInput('');
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Simple tab completion
            const commands = ['help', 'clear', 'pwd', 'ls', 'cd', 'echo', 'date', 'git', 'node', 'npm', 'ai', 'generate', 'analyze', 'about'];
            const match = commands.find(c => c.startsWith(currentInput));
            if (match) {
                setCurrentInput(match);
            }
        }
    };

    const getLineColor = (type: TerminalLine['type']) => {
        switch (type) {
            case 'input': return 'text-green-400';
            case 'output': return 'text-gray-300';
            case 'error': return 'text-red-400';
            case 'system': return 'text-cyan-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className="cyber-panel h-full flex flex-col bg-gray-950">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-900">
                <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-gray-400 ml-4">Terminal - {currentPath}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 text-xs">
                    {isProcessing && <span className="animate-pulse">⏳</span>}
                    <span>{lines.length} lines</span>
                </div>
            </div>

            {/* Terminal Content */}
            <div
                ref={terminalRef}
                onClick={handleTerminalClick}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm cursor-text"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            >
                <AnimatePresence>
                    {lines.map(line => (
                        <motion.div
                            key={line.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`whitespace-pre-wrap ${getLineColor(line.type)}`}
                        >
                            {line.content}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Input Line */}
                <div className="flex items-center mt-2">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={e => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                        className="flex-1 bg-transparent outline-none text-gray-100 caret-cyan-400"
                        placeholder={isProcessing ? 'Processing...' : ''}
                        autoFocus
                    />
                    <span className="animate-pulse text-cyan-400">▐</span>
                </div>
            </div>
        </div>
    );
}
