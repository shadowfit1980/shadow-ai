// Tabs Generator - Tabs, tabs list, and tab panels
import Anthropic from '@anthropic-ai/sdk';

class TabsGenerator {
    private anthropic: Anthropic | null = null;

    generateTabs(): string {
        return `import { useState, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabsContextValue {
    activeTab: string;
    setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    children: ReactNode;
    className?: string;
}

export function Tabs({ defaultValue, value, onChange, children, className = '' }: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const activeTab = value !== undefined ? value : internalValue;

    const setActiveTab = (id: string) => {
        if (value === undefined) setInternalValue(id);
        onChange?.(id);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={\`flex border-b border-gray-200 dark:border-gray-700 \${className}\`} role="tablist">
            {children}
        </div>
    );
}

interface TabTriggerProps {
    value: string;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

export function TabTrigger({ value, children, disabled, className = '' }: TabTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabTrigger must be used within Tabs');
    const isActive = context.activeTab === value;

    return (
        <button role="tab" aria-selected={isActive} disabled={disabled}
            onClick={() => !disabled && context.setActiveTab(value)}
            className={\`relative px-4 py-2 text-sm font-medium transition-colors
                \${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}
                \${disabled ? 'opacity-50 cursor-not-allowed' : ''} \${className}\`}>
            {children}
            {isActive && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
        </button>
    );
}

interface TabContentProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export function TabContent({ value, children, className = '' }: TabContentProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabContent must be used within Tabs');

    return (
        <AnimatePresence mode="wait">
            {context.activeTab === value && (
                <motion.div role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className={className}>
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
`;
    }

    generatePillTabs(): string {
        return `import { motion } from 'framer-motion';

interface PillTabsProps {
    tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
    activeTab: string;
    onChange: (id: string) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function PillTabs({ tabs, activeTab, onChange, size = 'md', className = '' }: PillTabsProps) {
    const sizes = { sm: 'px-3 py-1 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

    return (
        <div className={\`inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg \${className}\`}>
            {tabs.map((tab) => (
                <button key={tab.id} onClick={() => onChange(tab.id)}
                    className={\`relative flex items-center gap-2 rounded-md font-medium transition-colors \${sizes[size]}
                        \${activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}\`}>
                    {activeTab === tab.id && (
                        <motion.div layoutId="pillTab" className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                    )}
                    <span className="relative z-10">{tab.icon}</span>
                    <span className="relative z-10">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
`;
    }

    generateVerticalTabs(): string {
        return `import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface VerticalTabsProps {
    tabs: Array<{ id: string; label: string; icon?: ReactNode; badge?: number }>;
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function VerticalTabs({ tabs, activeTab, onChange, className = '' }: VerticalTabsProps) {
    return (
        <nav className={\`flex flex-col space-y-1 \${className}\`}>
            {tabs.map((tab) => (
                <button key={tab.id} onClick={() => onChange(tab.id)}
                    className={\`relative flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-colors
                        \${activeTab === tab.id 
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}\`}>
                    <div className="flex items-center gap-3">
                        {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
                        <span className="font-medium">{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && (
                        <span className={\`px-2 py-0.5 text-xs font-medium rounded-full \${
                            activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }\`}>{tab.badge}</span>
                    )}
                    {activeTab === tab.id && (
                        <motion.div layoutId="verticalTabIndicator"
                            className="absolute left-0 w-1 h-full bg-blue-500 rounded-r-full"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                    )}
                </button>
            ))}
        </nav>
    );
}
`;
    }

    generateScrollableTabs(): string {
        return `import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ScrollableTabsProps {
    tabs: Array<{ id: string; label: string }>;
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function ScrollableTabs({ tabs, activeTab, onChange, className = '' }: ScrollableTabsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const checkScroll = () => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(scrollLeft + clientWidth < scrollWidth);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [tabs]);

    const scroll = (direction: 'left' | 'right') => {
        if (!containerRef.current) return;
        containerRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    };

    return (
        <div className={\`relative \${className}\`}>
            {showLeft && (
                <button onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-start">
                    ‹
                </button>
            )}
            <div ref={containerRef} onScroll={checkScroll}
                className="flex overflow-x-auto scrollbar-none border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => onChange(tab.id)}
                        className={\`relative shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap
                            \${activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}>
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div layoutId="scrollableTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>
            {showRight && (
                <button onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-end">
                    ›
                </button>
            )}
        </div>
    );
}
`;
    }
}

export const tabsGenerator = new TabsGenerator();
