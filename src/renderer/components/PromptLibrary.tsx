/**
 * Prompt Library Component
 * 
 * Reusable AI prompt templates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    category: 'code' | 'refactor' | 'testing' | 'docs' | 'debug' | 'custom';
    prompt: string;
    variables: string[];
    isFavorite: boolean;
    usageCount: number;
}

const defaultTemplates: PromptTemplate[] = [
    {
        id: 'explain-code',
        name: 'Explain Code',
        description: 'Get a detailed explanation of code',
        category: 'code',
        prompt: 'Explain this code in detail:\n\n{{code}}\n\nProvide:\n1. What it does\n2. How it works\n3. Any potential issues',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'refactor-improve',
        name: 'Refactor & Improve',
        description: 'Improve code quality and readability',
        category: 'refactor',
        prompt: 'Refactor this code to improve:\n- Readability\n- Performance\n- Best practices\n\n{{code}}\n\nProvide the improved code with explanations.',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'generate-tests',
        name: 'Generate Unit Tests',
        description: 'Create comprehensive unit tests',
        category: 'testing',
        prompt: 'Generate comprehensive unit tests for:\n\n{{code}}\n\nUse {{framework}} testing framework. Cover:\n1. Happy path\n2. Edge cases\n3. Error handling',
        variables: ['code', 'framework'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'add-types',
        name: 'Add TypeScript Types',
        description: 'Add type annotations to JavaScript',
        category: 'code',
        prompt: 'Convert this JavaScript code to TypeScript with proper type annotations:\n\n{{code}}\n\nAdd interfaces/types where appropriate.',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'document-code',
        name: 'Generate Documentation',
        description: 'Add JSDoc comments and README',
        category: 'docs',
        prompt: 'Add comprehensive JSDoc documentation to:\n\n{{code}}\n\nInclude:\n- Function descriptions\n- Parameter types and descriptions\n- Return value documentation\n- Usage examples',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'debug-issue',
        name: 'Debug Issue',
        description: 'Find and fix bugs in code',
        category: 'debug',
        prompt: 'Debug this code. The issue is: {{issue}}\n\nCode:\n{{code}}\n\nFind the bug and provide a fix with explanation.',
        variables: ['code', 'issue'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'optimize-perf',
        name: 'Optimize Performance',
        description: 'Improve code performance',
        category: 'refactor',
        prompt: 'Optimize this code for better performance:\n\n{{code}}\n\nAnalyze:\n1. Time complexity\n2. Space complexity\n3. Bottlenecks\n\nProvide optimized version.',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'api-docs',
        name: 'Generate API Documentation',
        description: 'Create OpenAPI/Swagger docs',
        category: 'docs',
        prompt: 'Generate OpenAPI 3.0 documentation for these API endpoints:\n\n{{code}}\n\nInclude request/response schemas.',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'security-review',
        name: 'Security Review',
        description: 'Find security vulnerabilities',
        category: 'debug',
        prompt: 'Perform a security review on this code:\n\n{{code}}\n\nCheck for:\n1. Injection vulnerabilities\n2. Authentication issues\n3. Data exposure\n4. OWASP top 10',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
    {
        id: 'code-review',
        name: 'Code Review',
        description: 'Comprehensive code review',
        category: 'code',
        prompt: 'Review this code like a senior developer:\n\n{{code}}\n\nProvide feedback on:\n1. Code quality\n2. Best practices\n3. Potential bugs\n4. Suggestions for improvement',
        variables: ['code'],
        isFavorite: false,
        usageCount: 0,
    },
];

const categoryIcons: Record<string, string> = {
    code: '💻',
    refactor: '🔄',
    testing: '🧪',
    docs: '📝',
    debug: '🐛',
    custom: '✨',
};

const PromptLibrary: React.FC<{ onSelectPrompt?: (prompt: string) => void; onClose?: () => void }> = ({ onSelectPrompt, onClose }) => {
    const [templates, setTemplates] = useState<PromptTemplate[]>(defaultTemplates);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const saved = await (window as any).shadowAPI?.prompts?.getTemplates?.();
            if (saved && saved.length > 0) {
                setTemplates(saved);
            } else {
                setTemplates(defaultTemplates);
            }
        } catch (err) {
            console.error('Failed to load prompts:', err);
            setTemplates(defaultTemplates);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleUsePrompt = () => {
        if (!selectedTemplate) return;

        let prompt = selectedTemplate.prompt;
        Object.entries(variables).forEach(([key, value]) => {
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });

        // Update usage count locally (and ideally persist)
        setTemplates(prev => prev.map(t =>
            t.id === selectedTemplate.id ? { ...t, usageCount: t.usageCount + 1 } : t
        ));

        onSelectPrompt?.(prompt);
        onClose?.();
    };

    const categories = ['all', 'code', 'refactor', 'testing', 'docs', 'debug', 'custom'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#161b22] w-full max-w-5xl h-[80vh] rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>📚</span>
                        <span>Prompt Library</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-60 border-r border-gray-700 bg-gray-800/20 p-4 flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Search prompts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="cyber-input w-full mb-2 text-sm"
                        />

                        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${selectedCategory === cat
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <span>{cat === 'all' ? '📑' : categoryIcons[cat]}</span>
                                    <span className="capitalize">{cat}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="cyber-button w-full mt-2 text-sm py-2"
                        >
                            + New Template
                        </button>
                    </div>

                    {/* Template List */}
                    <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
                        {filteredTemplates.map((template) => (
                            <motion.div
                                key={template.id}
                                onClick={() => {
                                    setSelectedTemplate(template);
                                    setVariables({}); // Reset vars on select
                                }}
                                whileHover={{ scale: 1.01 }}
                                className={`p-4 rounded-lg border cursor-pointer transition-all relative group ${selectedTemplate?.id === template.id
                                    ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                    : 'bg-gray-800/30 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{categoryIcons[template.category]}</span>
                                        <h3 className={`font-semibold ${selectedTemplate?.id === template.id ? 'text-neon-cyan' : 'text-gray-200'
                                            }`}>{template.name}</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTemplates(prev => prev.map(t =>
                                                    t.id === template.id ? { ...t, isFavorite: !t.isFavorite } : t
                                                ));
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${template.isFavorite ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
                                                }`}
                                        >
                                            ★
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete this template?')) {
                                                    try {
                                                        await (window as any).shadowAPI?.prompts?.deleteTemplate?.(template.id);
                                                        setTemplates(prev => prev.filter(t => t.id !== template.id));
                                                        if (selectedTemplate?.id === template.id) {
                                                            setSelectedTemplate(null);
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to delete prompt:', err);
                                                    }
                                                }
                                            }}
                                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{template.description}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                        {template.variables.length} variables
                                    </span>
                                    <span>Used {template.usageCount} times</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Preview Panel */}
                    <div className="w-96 border-l border-gray-700 bg-gray-800/20 p-4 overflow-y-auto">
                        {selectedTemplate ? (
                            <div className="h-full flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                                        {categoryIcons[selectedTemplate.category]}
                                        {selectedTemplate.name}
                                    </h3>
                                    <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                                </div>

                                {selectedTemplate.variables.length > 0 && (
                                    <div className="mb-6 space-y-4">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configure Variables</h4>
                                        {selectedTemplate.variables.map((variable) => (
                                            <div key={variable}>
                                                <label className="block text-xs font-mono text-neon-cyan mb-1.5">{`{{${variable}}}`}</label>
                                                <textarea
                                                    value={variables[variable] || ''}
                                                    onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                                                    placeholder={`Enter content for ${variable}...`}
                                                    className="cyber-input w-full min-h-[60px] text-xs font-mono"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex-1 flex flex-col min-h-0">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</h4>
                                    <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap border border-gray-800">
                                        {(() => {
                                            let prompt = selectedTemplate.prompt;
                                            Object.entries(variables).forEach(([key, value]) => {
                                                prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
                                            });
                                            return prompt;
                                        })()}
                                    </div>
                                </div>

                                <button
                                    onClick={handleUsePrompt}
                                    className="cyber-button w-full mt-4 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                                >
                                    <span>⚡</span> Use Prompt
                                </button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <span className="text-4xl mb-4">👈</span>
                                <p>Select a template to preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PromptLibrary;
