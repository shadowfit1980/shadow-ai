import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeSnippet {
    id: string;
    title: string;
    description: string;
    language: string;
    code: string;
    tags: string[];
    category: string;
    createdAt: Date;
    favorite: boolean;
}

interface CodeSnippetsProps {
    onInsert?: (code: string) => void;
}

const DEFAULT_SNIPPETS: CodeSnippet[] = [
    {
        id: 'react-hook',
        title: 'Custom React Hook',
        description: 'Template for creating custom hooks',
        language: 'typescript',
        code: `import { useState, useEffect } from 'react';

export function useCustomHook<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Effect logic here
  }, [value]);

  return { value, setValue, loading, error };
}`,
        tags: ['react', 'hooks', 'typescript'],
        category: 'React',
        createdAt: new Date(),
        favorite: true,
    },
    {
        id: 'fetch-api',
        title: 'Fetch API Wrapper',
        description: 'Async fetch with error handling',
        language: 'typescript',
        code: `async function fetchData<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}`,
        tags: ['fetch', 'api', 'async'],
        category: 'Utilities',
        createdAt: new Date(),
        favorite: false,
    },
    {
        id: 'debounce',
        title: 'Debounce Function',
        description: 'Delay function execution',
        language: 'typescript',
        code: `function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}`,
        tags: ['debounce', 'performance', 'utility'],
        category: 'Utilities',
        createdAt: new Date(),
        favorite: true,
    },
    {
        id: 'prisma-crud',
        title: 'Prisma CRUD',
        description: 'Basic Prisma database operations',
        language: 'typescript',
        code: `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const db = {
  // Create
  async create(data: any) {
    return prisma.model.create({ data });
  },
  
  // Read
  async findMany(where?: any) {
    return prisma.model.findMany({ where });
  },
  
  async findById(id: string) {
    return prisma.model.findUnique({ where: { id } });
  },
  
  // Update
  async update(id: string, data: any) {
    return prisma.model.update({ where: { id }, data });
  },
  
  // Delete
  async delete(id: string) {
    return prisma.model.delete({ where: { id } });
  },
};`,
        tags: ['prisma', 'database', 'crud'],
        category: 'Backend',
        createdAt: new Date(),
        favorite: false,
    },
    {
        id: 'express-route',
        title: 'Express Route Handler',
        description: 'RESTful route with validation',
        language: 'typescript',
        code: `import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    // Process data
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;`,
        tags: ['express', 'api', 'validation'],
        category: 'Backend',
        createdAt: new Date(),
        favorite: false,
    },
];

export default function CodeSnippets({ onInsert }: CodeSnippetsProps) {
    const [snippets, setSnippets] = useState<CodeSnippet[]>(DEFAULT_SNIPPETS);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newSnippet, setNewSnippet] = useState({ title: '', description: '', language: 'typescript', code: '', tags: '' });

    const categories = ['all', ...new Set(snippets.map(s => s.category))];

    const filteredSnippets = snippets.filter(s => {
        if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
        if (search) {
            const searchLower = search.toLowerCase();
            return s.title.toLowerCase().includes(searchLower) ||
                s.description.toLowerCase().includes(searchLower) ||
                s.tags.some(t => t.toLowerCase().includes(searchLower));
        }
        return true;
    });

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const handleInsert = (snippet: CodeSnippet) => {
        onInsert?.(snippet.code);
    };

    const toggleFavorite = (id: string) => {
        setSnippets(prev => prev.map(s =>
            s.id === id ? { ...s, favorite: !s.favorite } : s
        ));
    };

    const handleAddSnippet = () => {
        if (!newSnippet.title || !newSnippet.code) return;

        const snippet: CodeSnippet = {
            id: `custom-${Date.now()}`,
            title: newSnippet.title,
            description: newSnippet.description,
            language: newSnippet.language,
            code: newSnippet.code,
            tags: newSnippet.tags.split(',').map(t => t.trim()).filter(Boolean),
            category: 'Custom',
            createdAt: new Date(),
            favorite: false,
        };

        setSnippets(prev => [snippet, ...prev]);
        setNewSnippet({ title: '', description: '', language: 'typescript', code: '', tags: '' });
        setIsAddingNew(false);
    };

    const getLanguageColor = (lang: string): string => {
        switch (lang) {
            case 'typescript': return 'text-blue-400';
            case 'javascript': return 'text-yellow-400';
            case 'python': return 'text-green-400';
            case 'rust': return 'text-orange-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="cyber-panel flex flex-col h-full">
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>📋</span>
                        <span>Code Snippets</span>
                    </h3>
                    <button
                        onClick={() => setIsAddingNew(true)}
                        className="cyber-button-secondary text-sm px-3 py-1"
                    >
                        ➕ Add
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search snippets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="cyber-input w-full mb-2"
                />

                <div className="flex flex-wrap gap-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2 py-1 text-xs rounded capitalize ${selectedCategory === cat
                                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredSnippets.map(snippet => (
                    <motion.div
                        key={snippet.id}
                        layout
                        onClick={() => setSelectedSnippet(snippet.id === selectedSnippet?.id ? null : snippet)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${selectedSnippet?.id === snippet.id
                                ? 'bg-gray-800 border border-neon-cyan/50'
                                : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium text-white">{snippet.title}</span>
                                    <span className={`text-xs ${getLanguageColor(snippet.language)}`}>
                                        {snippet.language}
                                    </span>
                                    {snippet.favorite && <span className="text-yellow-400">★</span>}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{snippet.description}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(snippet.id); }}
                                className="text-gray-500 hover:text-yellow-400"
                            >
                                {snippet.favorite ? '★' : '☆'}
                            </button>
                        </div>

                        <AnimatePresence>
                            {selectedSnippet?.id === snippet.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-3 overflow-hidden"
                                >
                                    <pre className="p-3 rounded bg-gray-900 text-xs text-gray-300 overflow-x-auto max-h-40">
                                        <code>{snippet.code}</code>
                                    </pre>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex flex-wrap gap-1">
                                            {snippet.tags.map(tag => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCopy(snippet.code); }}
                                                className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            >
                                                📋 Copy
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleInsert(snippet); }}
                                                className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                                            >
                                                ➕ Insert
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {/* Add New Snippet Modal */}
            <AnimatePresence>
                {isAddingNew && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                        onClick={() => setIsAddingNew(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="cyber-panel w-full max-w-lg p-4"
                        >
                            <h4 className="text-lg font-semibold text-neon-cyan mb-4">Add New Snippet</h4>

                            <input
                                type="text"
                                placeholder="Title"
                                value={newSnippet.title}
                                onChange={(e) => setNewSnippet(prev => ({ ...prev, title: e.target.value }))}
                                className="cyber-input w-full mb-2"
                            />

                            <input
                                type="text"
                                placeholder="Description"
                                value={newSnippet.description}
                                onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                                className="cyber-input w-full mb-2"
                            />

                            <div className="flex space-x-2 mb-2">
                                <select
                                    value={newSnippet.language}
                                    onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                                    className="cyber-input flex-1"
                                >
                                    <option value="typescript">TypeScript</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="rust">Rust</option>
                                    <option value="go">Go</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Tags (comma-separated)"
                                    value={newSnippet.tags}
                                    onChange={(e) => setNewSnippet(prev => ({ ...prev, tags: e.target.value }))}
                                    className="cyber-input flex-1"
                                />
                            </div>

                            <textarea
                                placeholder="Code..."
                                value={newSnippet.code}
                                onChange={(e) => setNewSnippet(prev => ({ ...prev, code: e.target.value }))}
                                className="cyber-input w-full h-40 font-mono text-sm mb-4"
                            />

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsAddingNew(false)}
                                    className="cyber-button-secondary px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSnippet}
                                    className="cyber-button px-4 py-2"
                                >
                                    Save Snippet
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
