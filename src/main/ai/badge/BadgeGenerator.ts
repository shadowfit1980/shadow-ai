// Badge Generator - Badges, tags, and status indicators
import Anthropic from '@anthropic-ai/sdk';

class BadgeGenerator {
    private anthropic: Anthropic | null = null;

    generateBadge(): string {
        return `import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    rounded?: boolean;
    dot?: boolean;
    removable?: boolean;
    onRemove?: () => void;
    className?: string;
}

const variants: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
};

const sizes: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
};

export function Badge({ children, variant = 'default', size = 'md', rounded = true, dot, removable, onRemove, className = '' }: BadgeProps) {
    return (
        <span className={\`inline-flex items-center font-medium \${variants[variant]} \${sizes[size]} \${rounded ? 'rounded-full' : 'rounded'} \${className}\`}>
            {dot && <span className={\`w-1.5 h-1.5 rounded-full mr-1.5 \${variant === 'success' ? 'bg-green-500' : variant === 'danger' ? 'bg-red-500' : 'bg-current'}\`} />}
            {children}
            {removable && (
                <button onClick={onRemove} className="ml-1 -mr-1 hover:opacity-70">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                </button>
            )}
        </span>
    );
}
`;
    }

    generateStatusBadge(): string {
        return `type Status = 'online' | 'offline' | 'busy' | 'away' | 'pending' | 'active' | 'inactive';

interface StatusBadgeProps {
    status: Status;
    label?: string;
    showDot?: boolean;
    className?: string;
}

const statusConfig: Record<Status, { color: string; bg: string; label: string }> = {
    online: { color: 'bg-green-500', bg: 'bg-green-100 text-green-800', label: 'Online' },
    offline: { color: 'bg-gray-400', bg: 'bg-gray-100 text-gray-800', label: 'Offline' },
    busy: { color: 'bg-red-500', bg: 'bg-red-100 text-red-800', label: 'Busy' },
    away: { color: 'bg-yellow-500', bg: 'bg-yellow-100 text-yellow-800', label: 'Away' },
    pending: { color: 'bg-orange-500', bg: 'bg-orange-100 text-orange-800', label: 'Pending' },
    active: { color: 'bg-green-500', bg: 'bg-green-100 text-green-800', label: 'Active' },
    inactive: { color: 'bg-gray-400', bg: 'bg-gray-100 text-gray-800', label: 'Inactive' },
};

export function StatusBadge({ status, label, showDot = true, className = '' }: StatusBadgeProps) {
    const config = statusConfig[status];
    return (
        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium \${config.bg} \${className}\`}>
            {showDot && <span className={\`w-2 h-2 rounded-full mr-1.5 \${config.color}\`} />}
            {label || config.label}
        </span>
    );
}

// Animated status indicator
export function PulsingStatus({ status, size = 8 }: { status: 'online' | 'offline'; size?: number }) {
    return (
        <span className="relative flex">
            <span className={\`w-\${size/4} h-\${size/4} rounded-full \${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}\`} style={{ width: size, height: size }} />
            {status === 'online' && (
                <span className={\`absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75\`} style={{ width: size, height: size }} />
            )}
        </span>
    );
}
`;
    }

    generateTag(): string {
        return `import { useState, KeyboardEvent } from 'react';

interface TagProps {
    label: string;
    color?: string;
    removable?: boolean;
    onRemove?: () => void;
    onClick?: () => void;
    className?: string;
}

export function Tag({ label, color, removable, onRemove, onClick, className = '' }: TagProps) {
    const bgColor = color || 'bg-gray-100 dark:bg-gray-700';
    return (
        <span className={\`inline-flex items-center px-2 py-1 text-sm rounded \${bgColor} \${onClick ? 'cursor-pointer hover:opacity-80' : ''} \${className}\`} onClick={onClick}>
            {label}
            {removable && (
                <button onClick={(e) => { e.stopPropagation(); onRemove?.(); }} className="ml-1 hover:opacity-70">✕</button>
            )}
        </span>
    );
}

// Tag input
interface TagInputProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    className?: string;
}

export function TagInput({ tags, onTagsChange, placeholder = 'Add tag...', maxTags = 10, className = '' }: TagInputProps) {
    const [input, setInput] = useState('');

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
            onTagsChange([...tags, trimmed]);
            setInput('');
        }
    };

    const removeTag = (index: number) => {
        onTagsChange(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className={\`flex flex-wrap gap-2 p-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 \${className}\`}>
            {tags.map((tag, i) => <Tag key={i} label={tag} removable onRemove={() => removeTag(i)} />)}
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={tags.length < maxTags ? placeholder : ''}
                disabled={tags.length >= maxTags} className="flex-1 min-w-20 bg-transparent outline-none text-sm" />
        </div>
    );
}
`;
    }

    generateCounter(): string {
        return `interface CounterBadgeProps {
    count: number;
    max?: number;
    variant?: 'default' | 'primary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function CounterBadge({ count, max = 99, variant = 'danger', size = 'sm', className = '' }: CounterBadgeProps) {
    const display = count > max ? \`\${max}+\` : count.toString();
    
    const variants = {
        default: 'bg-gray-500 text-white',
        primary: 'bg-blue-500 text-white',
        danger: 'bg-red-500 text-white',
    };

    const sizes = {
        sm: 'min-w-5 h-5 text-xs',
        md: 'min-w-6 h-6 text-sm',
        lg: 'min-w-8 h-8 text-base',
    };

    if (count <= 0) return null;

    return (
        <span className={\`inline-flex items-center justify-center px-1.5 font-bold rounded-full \${variants[variant]} \${sizes[size]} \${className}\`}>
            {display}
        </span>
    );
}

// Notification badge (positioned)
export function NotificationBadge({ count, children, className = '' }: { count: number; children: React.ReactNode; className?: string }) {
    return (
        <div className={\`relative inline-block \${className}\`}>
            {children}
            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </div>
    );
}
`;
    }
}

export const badgeGenerator = new BadgeGenerator();
