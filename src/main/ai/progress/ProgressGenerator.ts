// Progress Generator - Progress bars, steps, and loading
import Anthropic from '@anthropic-ai/sdk';

class ProgressGenerator {
    private anthropic: Anthropic | null = null;

    generateProgressBar(): string {
        return `import { motion } from 'framer-motion';

interface ProgressBarProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'gradient';
    showLabel?: boolean;
    animated?: boolean;
    className?: string;
}

export function ProgressBar({ value, max = 100, size = 'md', variant = 'default', showLabel, animated = true, className = '' }: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-4' };
    const variants = {
        default: 'bg-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
    };

    return (
        <div className={\`w-full \${className}\`}>
            {showLabel && (
                <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={\`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden \${sizes[size]}\`}>
                <motion.div className={\`h-full rounded-full \${variants[variant]}\`}
                    initial={{ width: 0 }} animate={{ width: \`\${percentage}%\` }}
                    transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }} />
            </div>
        </div>
    );
}

// Circular progress
export function CircularProgress({ value, size = 80, strokeWidth = 8, className = '' }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className={\`relative inline-flex items-center justify-center \${className}\`} style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200 dark:text-gray-700" />
                <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
                    strokeLinecap="round" className="text-blue-500" transition={{ duration: 0.5 }} />
            </svg>
            <span className="absolute text-sm font-semibold">{Math.round(value)}%</span>
        </div>
    );
}
`;
    }

    generateStepper(): string {
        return `import { ReactNode } from 'react';

interface Step {
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
    variant?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function Stepper({ steps, currentStep, variant = 'horizontal', size = 'md', className = '' }: StepperProps) {
    const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

    if (variant === 'vertical') {
        return (
            <div className={\`flex flex-col \${className}\`}>
                {steps.map((step, i) => (
                    <div key={step.id} className="flex">
                        <div className="flex flex-col items-center mr-4">
                            <div className={\`flex items-center justify-center rounded-full font-semibold \${sizes[size]} \${
                                i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }\`}>{step.icon || (i < currentStep ? '✓' : i + 1)}</div>
                            {i < steps.length - 1 && <div className={\`w-0.5 h-12 \${i < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}\`} />}
                        </div>
                        <div className="pt-1 pb-8">
                            <p className={\`font-medium \${i <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500'}\`}>{step.label}</p>
                            {step.description && <p className="text-sm text-gray-500">{step.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={\`flex items-center \${className}\`}>
            {steps.map((step, i) => (
                <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div className={\`flex items-center justify-center rounded-full font-semibold \${sizes[size]} \${
                            i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                        }\`}>{step.icon || (i < currentStep ? '✓' : i + 1)}</div>
                        <p className={\`mt-2 text-xs font-medium text-center \${i <= currentStep ? 'text-gray-900 dark:text-white' : 'text-gray-500'}\`}>{step.label}</p>
                    </div>
                    {i < steps.length - 1 && <div className={\`w-12 h-0.5 mx-2 \${i < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}\`} />}
                </div>
            ))}
        </div>
    );
}
`;
    }

    generateLoadingBar(): string {
        return `import { motion } from 'framer-motion';

// Indeterminate loading bar
export function LoadingBar({ className = '' }: { className?: string }) {
    return (
        <div className={\`h-1 w-full bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-full \${className}\`}>
            <motion.div className="h-full w-1/3 bg-blue-500 rounded-full"
                animate={{ x: ['-100%', '400%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
    );
}

// Top loading bar (like YouTube/GitHub)
export function TopLoadingBar({ isLoading, progress }: { isLoading: boolean; progress?: number }) {
    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1">
            {progress !== undefined ? (
                <motion.div className="h-full bg-blue-500"
                    animate={{ width: \`\${progress}%\` }} transition={{ duration: 0.2 }} />
            ) : (
                <motion.div className="h-full w-1/4 bg-blue-500"
                    animate={{ x: ['-100%', '500%'] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            )}
        </div>
    );
}

// NProgress-style hook
export function useNProgress() {
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const start = () => { setIsLoading(true); setProgress(30); };
    const inc = () => setProgress(p => Math.min(p + 10, 90));
    const done = () => { setProgress(100); setTimeout(() => { setIsLoading(false); setProgress(0); }, 200); };

    return { progress, isLoading, start, inc, done };
}

import { useState } from 'react';
`;
    }

    generateMultiProgress(): string {
        return `import { motion } from 'framer-motion';

interface SegmentedProgressProps {
    segments: Array<{ value: number; color: string; label?: string }>;
    total?: number;
    height?: number;
    showLabels?: boolean;
    className?: string;
}

export function SegmentedProgress({ segments, total, height = 8, showLabels, className = '' }: SegmentedProgressProps) {
    const sum = total || segments.reduce((acc, s) => acc + s.value, 0);

    return (
        <div className={className}>
            <div className="flex rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700" style={{ height }}>
                {segments.map((seg, i) => (
                    <motion.div key={i} className={seg.color} style={{ width: \`\${(seg.value / sum) * 100}%\` }}
                        initial={{ width: 0 }} animate={{ width: \`\${(seg.value / sum) * 100}%\` }} transition={{ duration: 0.5, delay: i * 0.1 }} />
                ))}
            </div>
            {showLabels && (
                <div className="flex mt-2 gap-4">
                    {segments.map((seg, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-sm">
                            <span className={\`w-3 h-3 rounded \${seg.color}\`} />
                            <span className="text-gray-600 dark:text-gray-400">{seg.label}: {seg.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Buffer progress (like video loading)
export function BufferProgress({ value, buffer, className = '' }: { value: number; buffer: number; className?: string }) {
    return (
        <div className={\`h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden \${className}\`}>
            <div className="relative h-full">
                <div className="absolute h-full bg-gray-400/50 rounded-full" style={{ width: \`\${buffer}%\` }} />
                <motion.div className="absolute h-full bg-blue-500 rounded-full" animate={{ width: \`\${value}%\` }} />
            </div>
        </div>
    );
}
`;
    }
}

export const progressGenerator = new ProgressGenerator();
