/**
 * Help System Component
 * 
 * In-app documentation and help
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpTopic {
    id: string;
    title: string;
    icon: string;
    content: string[];
}

interface HelpSection {
    name: string;
    topics: HelpTopic[];
}

const helpSections: HelpSection[] = [
    {
        name: 'Getting Started',
        topics: [
            {
                id: 'intro',
                title: 'Introduction',
                icon: '👋',
                content: [
                    'Shadow AI is an AI-powered coding assistant that helps you write, refactor, and understand code faster.',
                    'Use the sidebar to navigate between different features and the main panel to interact with AI.',
                ],
            },
            {
                id: 'first-chat',
                title: 'Your First Chat',
                icon: '💬',
                content: [
                    'Click on the chat input at the bottom of the screen.',
                    'Type your question or paste code you want help with.',
                    'Press Enter or click Send to get an AI response.',
                ],
            },
            {
                id: 'model-selection',
                title: 'Choosing AI Models',
                icon: '🤖',
                content: [
                    'Go to Settings (⌘,) to configure AI providers.',
                    'Add API keys for providers like OpenAI, Anthropic, or Gemini.',
                    'Select your preferred model from the model selector.',
                ],
            },
        ],
    },
    {
        name: 'Features',
        topics: [
            {
                id: 'code-analysis',
                title: 'Code Analysis',
                icon: '🔍',
                content: [
                    'Select code and use "Explain Code" (⌘⇧E) to understand what it does.',
                    'The AI will break down the code structure and logic.',
                    'You can ask follow-up questions for more details.',
                ],
            },
            {
                id: 'refactoring',
                title: 'Refactoring',
                icon: '🔧',
                content: [
                    'Select code and use "Refactor Code" (⌘⇧R) to improve it.',
                    'The AI will suggest improvements for readability and performance.',
                    'Review changes before applying them to your code.',
                ],
            },
            {
                id: 'testing',
                title: 'Test Generation',
                icon: '🧪',
                content: [
                    'Use "Generate Tests" (⌘⇧T) to create unit tests for your code.',
                    'Specify the testing framework in the prompt (Jest, Mocha, etc.).',
                    'Tests cover happy path, edge cases, and error handling.',
                ],
            },
            {
                id: 'workflow',
                title: 'Visual Workflow',
                icon: '🔄',
                content: [
                    'Go to the Workflow tab to build automation workflows.',
                    'Drag and drop nodes to create trigger → action chains.',
                    'Connect nodes to define the flow of execution.',
                ],
            },
        ],
    },
    {
        name: 'Keyboard Shortcuts',
        topics: [
            {
                id: 'navigation',
                title: 'Navigation',
                icon: '🧭',
                content: [
                    '⌘1 - Go to Code tab',
                    '⌘2 - Go to Chat tab',
                    '⌘3 - Go to Preview tab',
                    '⌘B - Toggle sidebar',
                    '⌘, - Open settings',
                ],
            },
            {
                id: 'ai-commands',
                title: 'AI Commands',
                icon: '✨',
                content: [
                    '⌘K - Open command palette',
                    '⌘N - New AI chat',
                    '⌘⇧E - Explain selected code',
                    '⌘⇧R - Refactor selected code',
                    '⌘⇧T - Generate tests',
                ],
            },
            {
                id: 'editing',
                title: 'Editing',
                icon: '✏️',
                content: [
                    '⌘S - Save file',
                    '⌘⇧F - Format code',
                    '⌘Z - Undo',
                    '⌘⇧Z - Redo',
                    '⌘P - Quick file search',
                ],
            },
        ],
    },
    {
        name: 'Troubleshooting',
        topics: [
            {
                id: 'api-errors',
                title: 'API Errors',
                icon: '⚠️',
                content: [
                    'Check that your API key is correct in Settings.',
                    'Ensure you have sufficient credits/quota with your provider.',
                    'Try switching to a different model or provider.',
                ],
            },
            {
                id: 'performance',
                title: 'Performance Issues',
                icon: '🐢',
                content: [
                    'Large files may slow down analysis - try selecting specific sections.',
                    'Close unused tabs to free up memory.',
                    'Restart the app if it becomes unresponsive.',
                ],
            },
        ],
    },
];

const HelpSystem: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(helpSections[0].topics[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSections = helpSections.map(section => ({
        ...section,
        topics: section.topics.filter(topic =>
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.content.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
    })).filter(section => section.topics.length > 0);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#161b22] w-full max-w-4xl h-[70vh] rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>❓</span>
                        <span>Help & Documentation</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-gray-700 bg-gray-800/20 p-4 flex flex-col">
                        <input
                            type="text"
                            placeholder="Search help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="cyber-input w-full mb-4 text-sm"
                        />

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {filteredSections.map((section) => (
                                <div key={section.name}>
                                    <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-2">
                                        {section.name}
                                    </h4>
                                    <div className="space-y-1">
                                        {section.topics.map((topic) => (
                                            <button
                                                key={topic.id}
                                                onClick={() => setSelectedTopic(topic)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${selectedTopic?.id === topic.id
                                                        ? 'bg-gray-800 text-neon-cyan border border-gray-700 font-medium'
                                                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                                    }`}
                                            >
                                                <span>{topic.icon}</span>
                                                <span>{topic.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-[#0d1117]">
                        <AnimatePresence mode="wait">
                            {selectedTopic ? (
                                <motion.div
                                    key={selectedTopic.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="max-w-2xl mx-auto"
                                >
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                                        <div className="text-3xl">{selectedTopic.icon}</div>
                                        <h3 className="text-2xl font-semibold text-white">{selectedTopic.title}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {selectedTopic.content.map((paragraph, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-500 font-mono mt-0.5 border border-gray-700">
                                                    {i + 1}
                                                </div>
                                                <p className="flex-1 text-gray-300 leading-relaxed text-sm">
                                                    {paragraph}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    <p>Select a topic to view documentation</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 bg-gray-800/30 flex justify-center gap-6">
                    <a href="#" className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
                        <span>📖</span> Full Documentation
                    </a>
                    <a href="#" className="text-xs text-neon-cyan hover:underline flex items-center gap-1">
                        <span>🐛</span> Report Issue
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default HelpSystem;
