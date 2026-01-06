import { useState } from 'react';
import { motion } from 'framer-motion';

interface ProjectTemplate {
    id: string;
    name: string;
    icon: string;
    description: string;
    tech: string[];
    category: 'web' | 'mobile' | 'desktop' | 'api' | 'fullstack';
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
    // Web Projects
    { id: 'react-vite', name: 'React + Vite', icon: '⚛️', description: 'Fast React app with Vite', tech: ['React', 'Vite', 'TypeScript'], category: 'web' },
    { id: 'nextjs', name: 'Next.js', icon: '▲', description: 'Full-stack React framework', tech: ['Next.js', 'React', 'TypeScript'], category: 'fullstack' },
    { id: 'vue-vite', name: 'Vue 3 + Vite', icon: '💚', description: 'Vue 3 with Composition API', tech: ['Vue', 'Vite', 'TypeScript'], category: 'web' },
    { id: 'svelte', name: 'SvelteKit', icon: '🔥', description: 'Fast Svelte framework', tech: ['Svelte', 'SvelteKit', 'TypeScript'], category: 'fullstack' },

    // Mobile Projects
    { id: 'react-native', name: 'React Native', icon: '📱', description: 'Cross-platform mobile app', tech: ['React Native', 'Expo', 'TypeScript'], category: 'mobile' },
    { id: 'flutter', name: 'Flutter', icon: '🦋', description: 'Beautiful native apps', tech: ['Flutter', 'Dart'], category: 'mobile' },

    // Desktop Projects
    { id: 'electron', name: 'Electron', icon: '💻', description: 'Desktop app with web tech', tech: ['Electron', 'React', 'TypeScript'], category: 'desktop' },
    { id: 'tauri', name: 'Tauri', icon: '🦀', description: 'Lightweight desktop app', tech: ['Tauri', 'Rust', 'React'], category: 'desktop' },

    // API Projects
    { id: 'express-api', name: 'Express API', icon: '🚀', description: 'Node.js REST API', tech: ['Express', 'Node.js', 'TypeScript'], category: 'api' },
    { id: 'fastapi', name: 'FastAPI', icon: '🐍', description: 'Modern Python API', tech: ['FastAPI', 'Python', 'Pydantic'], category: 'api' },
    { id: 'graphql', name: 'GraphQL API', icon: '📊', description: 'GraphQL server', tech: ['Apollo', 'GraphQL', 'TypeScript'], category: 'api' },
    { id: 'nestjs', name: 'NestJS', icon: '🐱', description: 'Enterprise Node.js', tech: ['NestJS', 'TypeScript', 'Prisma'], category: 'api' },

    // Full Stack
    { id: 't3-stack', name: 'T3 Stack', icon: '🏗️', description: 'Next.js + tRPC + Prisma', tech: ['T3', 'Next.js', 'tRPC', 'Prisma'], category: 'fullstack' },
    { id: 'mern', name: 'MERN Stack', icon: '🥞', description: 'MongoDB, Express, React, Node', tech: ['MongoDB', 'Express', 'React', 'Node'], category: 'fullstack' },
    { id: 'remix', name: 'Remix', icon: '💿', description: 'Full stack web framework', tech: ['Remix', 'React', 'TypeScript'], category: 'fullstack' },
];

interface ProjectGeneratorProps {
    onGenerate?: (template: ProjectTemplate, options: any) => void;
}

export default function ProjectGenerator({ onGenerate }: ProjectGeneratorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
    const [projectName, setProjectName] = useState('my-project');
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [isGenerating, setIsGenerating] = useState(false);

    const categories = ['all', 'web', 'mobile', 'desktop', 'api', 'fullstack'];

    const filteredTemplates = filter === 'all'
        ? PROJECT_TEMPLATES
        : PROJECT_TEMPLATES.filter(t => t.category === filter);

    const ADDITIONAL_FEATURES = [
        { id: 'auth', label: '🔐 Authentication', description: 'User login/signup' },
        { id: 'db', label: '💾 Database', description: 'Database integration' },
        { id: 'api', label: '🔗 API Layer', description: 'REST/GraphQL API' },
        { id: 'testing', label: '🧪 Testing', description: 'Unit & E2E tests' },
        { id: 'docker', label: '🐳 Docker', description: 'Container setup' },
        { id: 'cicd', label: '🔄 CI/CD', description: 'GitHub Actions' },
        { id: 'pwa', label: '📲 PWA', description: 'Progressive Web App' },
        { id: 'i18n', label: '🌍 i18n', description: 'Internationalization' },
    ];

    const handleGenerate = async () => {
        if (!selectedTemplate) return;

        setIsGenerating(true);
        try {
            // Call the AI to generate project structure
            const api = (window as any).shadowAPI;
            const prompt = `Generate a ${selectedTemplate.name} project called "${projectName}" with the following features: ${selectedFeatures.join(', ')}. 
            
            Please create:
            1. Project structure with all necessary files
            2. Package.json with dependencies
            3. Configuration files
            4. Basic components/modules
            5. README with setup instructions
            
            Technologies: ${selectedTemplate.tech.join(', ')}`;

            if (api?.chat) {
                await api.chat([{ role: 'user', content: prompt }]);
            }

            onGenerate?.(selectedTemplate, {
                name: projectName,
                features: selectedFeatures
            });
        } catch (err) {
            console.error('Generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleFeature = (featureId: string) => {
        setSelectedFeatures(prev =>
            prev.includes(featureId)
                ? prev.filter(f => f !== featureId)
                : [...prev, featureId]
        );
    };

    return (
        <div className="cyber-panel p-4">
            <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center space-x-2">
                <span>🚀</span>
                <span>Project Generator</span>
            </h3>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all ${filter === cat
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 max-h-48 overflow-y-auto">
                {filteredTemplates.map(template => (
                    <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-3 rounded-lg text-left border transition-all ${selectedTemplate?.id === template.id
                                ? 'bg-neon-cyan/20 border-neon-cyan/50 text-white'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600'
                            }`}
                    >
                        <div className="text-2xl mb-1">{template.icon}</div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-gray-500 truncate">{template.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {template.tech.slice(0, 2).map(t => (
                                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Configuration */}
            {selectedTemplate && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-gray-700 pt-4 mt-4"
                >
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 mb-1 block">Project Name</label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                            className="cyber-input w-full"
                            placeholder="my-project"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-gray-400 mb-2 block">Additional Features</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ADDITIONAL_FEATURES.map(feature => (
                                <button
                                    key={feature.id}
                                    onClick={() => toggleFeature(feature.id)}
                                    className={`p-2 rounded text-xs text-center border transition-all ${selectedFeatures.includes(feature.id)
                                            ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    {feature.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full cyber-button py-3 text-center"
                    >
                        {isGenerating ? (
                            <span className="flex items-center justify-center space-x-2">
                                <span className="animate-spin">⏳</span>
                                <span>Generating...</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center space-x-2">
                                <span>🚀</span>
                                <span>Generate {selectedTemplate.name} Project</span>
                            </span>
                        )}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
