import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
    id: string;
    icon: string;
    label: string;
    description: string;
    category: 'code' | 'debug' | 'test' | 'refactor' | 'docs' | 'security';
    prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
    // Code Actions
    { id: 'explain', icon: '📖', label: 'Explain Code', description: 'Get a detailed explanation', category: 'code', prompt: 'Explain this code in detail:' },
    { id: 'optimize', icon: '⚡', label: 'Optimize', description: 'Improve performance', category: 'refactor', prompt: 'Optimize this code for better performance:' },
    { id: 'convert', icon: '🔄', label: 'Convert', description: 'Convert to another language', category: 'code', prompt: 'Convert this code to:' },
    { id: 'add-types', icon: '🏷️', label: 'Add Types', description: 'Add TypeScript types', category: 'code', prompt: 'Add TypeScript types to this code:' },

    // Debug Actions
    { id: 'find-bugs', icon: '🐛', label: 'Find Bugs', description: 'Detect potential issues', category: 'debug', prompt: 'Find potential bugs in this code:' },
    { id: 'fix-error', icon: '🔧', label: 'Fix Error', description: 'Fix a specific error', category: 'debug', prompt: 'Fix this error:' },
    { id: 'debug-steps', icon: '🔍', label: 'Debug Steps', description: 'Step-by-step debugging', category: 'debug', prompt: 'Help me debug this step by step:' },

    // Test Actions
    { id: 'write-tests', icon: '🧪', label: 'Write Tests', description: 'Generate unit tests', category: 'test', prompt: 'Write unit tests for this code:' },
    { id: 'test-cases', icon: '📋', label: 'Test Cases', description: 'Suggest test cases', category: 'test', prompt: 'Suggest comprehensive test cases for:' },
    { id: 'mock-data', icon: '📊', label: 'Mock Data', description: 'Generate mock data', category: 'test', prompt: 'Generate mock data for testing:' },

    // Refactor Actions
    { id: 'refactor', icon: '♻️', label: 'Refactor', description: 'Improve code structure', category: 'refactor', prompt: 'Refactor this code to improve readability and maintainability:' },
    { id: 'extract', icon: '📤', label: 'Extract', description: 'Extract into function', category: 'refactor', prompt: 'Extract this into a reusable function:' },
    { id: 'simplify', icon: '✨', label: 'Simplify', description: 'Simplify complex code', category: 'refactor', prompt: 'Simplify this complex code:' },

    // Docs Actions
    { id: 'add-comments', icon: '💬', label: 'Add Comments', description: 'Add inline comments', category: 'docs', prompt: 'Add helpful comments to this code:' },
    { id: 'jsdoc', icon: '📝', label: 'Add JSDoc', description: 'Add documentation', category: 'docs', prompt: 'Add JSDoc documentation to this code:' },
    { id: 'readme', icon: '📚', label: 'README', description: 'Generate README', category: 'docs', prompt: 'Generate a README for this project:' },

    // Security Actions
    { id: 'security-scan', icon: '🛡️', label: 'Security Scan', description: 'Find vulnerabilities', category: 'security', prompt: 'Scan this code for security vulnerabilities:' },
    { id: 'sanitize', icon: '🧹', label: 'Sanitize', description: 'Sanitize user inputs', category: 'security', prompt: 'Add input sanitization to this code:' },
    { id: 'auth-check', icon: '🔐', label: 'Auth Check', description: 'Check authentication', category: 'security', prompt: 'Review authentication and authorization in this code:' },
];

const CATEGORY_COLORS: Record<string, string> = {
    code: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    debug: 'bg-red-500/20 text-red-400 border-red-500/50',
    test: 'bg-green-500/20 text-green-400 border-green-500/50',
    refactor: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    docs: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    security: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

interface QuickActionsProps {
    onAction: (prompt: string) => void;
    selectedCode?: string;
}

export default function QuickActions({ onAction, selectedCode }: QuickActionsProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isExpanded, setIsExpanded] = useState(true);

    const categories = ['all', 'code', 'debug', 'test', 'refactor', 'docs', 'security'];

    const filteredActions = selectedCategory === 'all'
        ? QUICK_ACTIONS
        : QUICK_ACTIONS.filter(a => a.category === selectedCategory);

    const handleAction = (action: QuickAction) => {
        const prompt = selectedCode
            ? `${action.prompt}\n\n\`\`\`\n${selectedCode}\n\`\`\``
            : action.prompt;
        onAction(prompt);
    };

    return (
        <div className="cyber-panel">
            <div
                className="p-3 border-b border-gray-800 flex items-center justify-between cursor-pointer hover:bg-gray-800/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="text-sm font-semibold text-neon-cyan flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Quick Actions</span>
                    {selectedCode && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 ml-2">
                            Code Selected
                        </span>
                    )}
                </h3>
                <span className="text-gray-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* Category Filter */}
                        <div className="p-2 flex flex-wrap gap-1 border-b border-gray-800">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2 py-1 text-xs rounded capitalize transition-all ${selectedCategory === cat
                                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Actions Grid */}
                        <div className="p-2 grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {filteredActions.map(action => (
                                <motion.button
                                    key={action.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleAction(action)}
                                    className={`p-2 rounded-lg text-left border transition-all ${CATEGORY_COLORS[action.category]} hover:bg-opacity-30`}
                                >
                                    <div className="text-lg mb-1">{action.icon}</div>
                                    <div className="text-xs font-medium">{action.label}</div>
                                    <div className="text-[10px] opacity-70 truncate">{action.description}</div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
