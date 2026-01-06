import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Template {
    id: string;
    name: string;
    description: string;
    category: 'landing' | 'dashboard' | 'saas' | 'ecommerce' | 'portfolio' | 'blog';
    tech: string[];
    preview: string;
    features: string[];
}

const TEMPLATES: Template[] = [
    {
        id: 'landing-startup',
        name: 'Startup Landing',
        description: 'Modern startup landing page with hero, features, pricing, and CTA sections',
        category: 'landing',
        tech: ['React', 'TailwindCSS', 'Framer Motion'],
        preview: '🚀',
        features: ['Hero section', 'Feature grid', 'Pricing table', 'Newsletter signup']
    },
    {
        id: 'landing-saas',
        name: 'SaaS Landing',
        description: 'Professional SaaS product landing with demo video and testimonials',
        category: 'landing',
        tech: ['React', 'TailwindCSS', 'React Query'],
        preview: '💼',
        features: ['Video hero', 'Testimonials', 'FAQ accordion', 'Contact form']
    },
    {
        id: 'dashboard-admin',
        name: 'Admin Dashboard',
        description: 'Full-featured admin dashboard with charts, tables, and data management',
        category: 'dashboard',
        tech: ['React', 'TailwindCSS', 'Recharts', 'React Table'],
        preview: '📊',
        features: ['Analytics cards', 'Data tables', 'Charts', 'User management']
    },
    {
        id: 'dashboard-analytics',
        name: 'Analytics Dashboard',
        description: 'Real-time analytics dashboard with live data visualization',
        category: 'dashboard',
        tech: ['React', 'TailwindCSS', 'D3.js', 'Socket.io'],
        preview: '📈',
        features: ['Real-time charts', 'KPI cards', 'Activity feed', 'Filters']
    },
    {
        id: 'saas-crm',
        name: 'CRM Application',
        description: 'Customer relationship management with contacts, deals, and pipeline',
        category: 'saas',
        tech: ['React', 'TailwindCSS', 'Supabase', 'React DnD'],
        preview: '👥',
        features: ['Contact management', 'Deal pipeline', 'Task tracking', 'Email integration']
    },
    {
        id: 'saas-project',
        name: 'Project Manager',
        description: 'Kanban-style project management with teams and milestones',
        category: 'saas',
        tech: ['React', 'TailwindCSS', 'Supabase', 'React Beautiful DnD'],
        preview: '📋',
        features: ['Kanban boards', 'Team collaboration', 'File attachments', 'Timeline view']
    },
    {
        id: 'ecommerce-store',
        name: 'E-commerce Store',
        description: 'Full online store with cart, checkout, and product management',
        category: 'ecommerce',
        tech: ['React', 'TailwindCSS', 'Stripe', 'Supabase'],
        preview: '🛒',
        features: ['Product catalog', 'Shopping cart', 'Stripe checkout', 'Order tracking']
    },
    {
        id: 'ecommerce-marketplace',
        name: 'Marketplace',
        description: 'Multi-vendor marketplace with seller dashboards',
        category: 'ecommerce',
        tech: ['React', 'TailwindCSS', 'Stripe Connect', 'Supabase'],
        preview: '🏪',
        features: ['Multi-vendor', 'Seller dashboard', 'Reviews', 'Categories']
    },
    {
        id: 'portfolio-developer',
        name: 'Developer Portfolio',
        description: 'Personal portfolio for developers with projects and blog',
        category: 'portfolio',
        tech: ['React', 'TailwindCSS', 'MDX'],
        preview: '💻',
        features: ['Project showcase', 'Skills section', 'Blog', 'Contact form']
    },
    {
        id: 'portfolio-agency',
        name: 'Agency Portfolio',
        description: 'Creative agency portfolio with case studies and team',
        category: 'portfolio',
        tech: ['React', 'TailwindCSS', 'GSAP'],
        preview: '🎨',
        features: ['Case studies', 'Team profiles', 'Services', 'Client logos']
    },
    {
        id: 'blog-minimal',
        name: 'Minimal Blog',
        description: 'Clean, minimal blog with markdown support',
        category: 'blog',
        tech: ['React', 'TailwindCSS', 'MDX', 'Contentlayer'],
        preview: '✍️',
        features: ['Markdown posts', 'Categories', 'Search', 'RSS feed']
    },
    {
        id: 'blog-magazine',
        name: 'Magazine Blog',
        description: 'Magazine-style blog with featured articles and categories',
        category: 'blog',
        tech: ['React', 'TailwindCSS', 'Sanity CMS'],
        preview: '📰',
        features: ['Featured posts', 'Categories', 'Author profiles', 'Newsletter']
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Templates', icon: '🎯' },
    { id: 'landing', label: 'Landing Pages', icon: '🚀' },
    { id: 'dashboard', label: 'Dashboards', icon: '📊' },
    { id: 'saas', label: 'SaaS Apps', icon: '💼' },
    { id: 'ecommerce', label: 'E-commerce', icon: '🛒' },
    { id: 'portfolio', label: 'Portfolios', icon: '🎨' },
    { id: 'blog', label: 'Blogs', icon: '✍️' }
];

export default function TemplateGallery() {
    const [category, setCategory] = useState('all');
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [search, setSearch] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const filteredTemplates = TEMPLATES.filter(t => {
        const matchesCategory = category === 'all' || t.category === category;
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleCreateProject = useCallback(async (template: Template) => {
        setIsCreating(true);
        try {
            // Simulate project creation
            await new Promise(r => setTimeout(r, 2000));
            console.log('Creating project from template:', template.id);
            setSelectedTemplate(null);
        } finally {
            setIsCreating(false);
        }
    }, []);

    return (
        <div className="h-full flex flex-col bg-gray-950 text-gray-100">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-neon-cyan">Template Gallery</h1>
                        <p className="text-xs text-gray-500">Start with a professionally designed template</p>
                    </div>
                    <span className="text-xs text-gray-400">{TEMPLATES.length} templates</span>
                </div>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:border-neon-cyan/50 focus:outline-none"
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-800">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-1 ${category === cat.id
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                : 'bg-gray-900 text-gray-400 border border-gray-700 hover:text-white'
                            }`}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <motion.div
                            key={template.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => setSelectedTemplate(template)}
                            className="p-4 bg-gray-900/50 rounded-xl border border-gray-800 cursor-pointer hover:border-neon-cyan/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-3xl">{template.preview}</span>
                                <span className="text-xs px-2 py-0.5 bg-gray-800 rounded text-gray-400 capitalize">
                                    {template.category}
                                </span>
                            </div>
                            <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {template.tech.slice(0, 3).map(t => (
                                    <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-500">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Template Detail Modal */}
            <AnimatePresence>
                {selectedTemplate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedTemplate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-900 rounded-2xl border border-gray-700 max-w-lg w-full overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-800">
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl">{selectedTemplate.preview}</span>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{selectedTemplate.name}</h2>
                                        <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xs text-gray-500 uppercase mb-2">Technologies</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTemplate.tech.map(t => (
                                            <span key={t} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xs text-gray-500 uppercase mb-2">Features</h3>
                                    <ul className="grid grid-cols-2 gap-2">
                                        {selectedTemplate.features.map(f => (
                                            <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                                                <span className="text-green-400">✓</span> {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-800 flex gap-3">
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleCreateProject(selectedTemplate)}
                                    disabled={isCreating}
                                    className="flex-1 py-2 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 disabled:opacity-50"
                                >
                                    {isCreating ? '⏳ Creating...' : '🚀 Use Template'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
