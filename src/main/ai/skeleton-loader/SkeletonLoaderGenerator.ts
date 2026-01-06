// Skeleton Loader Generator - Loading states and skeleton components
import Anthropic from '@anthropic-ai/sdk';

class SkeletonLoaderGenerator {
    private anthropic: Anthropic | null = null;

    generateSkeleton(): string {
        return `import { motion } from 'framer-motion';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
    animate?: boolean;
}

export function Skeleton({ width = '100%', height = '1rem', className = '', rounded = 'md', animate = true }: SkeletonProps) {
    const roundedClass = rounded === true ? 'rounded' : rounded === false ? '' : \`rounded-\${rounded}\`;
    const style = { width: typeof width === 'number' ? \`\${width}px\` : width, height: typeof height === 'number' ? \`\${height}px\` : height };

    return (
        <div className={\`bg-gray-200 dark:bg-gray-700 \${roundedClass} \${className} \${animate ? 'animate-pulse' : ''}\`} style={style} />
    );
}

// Text skeleton
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={\`space-y-2 \${className}\`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} height="0.875rem" />
            ))}
        </div>
    );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
    return <Skeleton width={size} height={size} rounded="full" />;
}

// Card skeleton
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={\`p-4 border rounded-lg space-y-3 \${className}\`}>
            <Skeleton height="150px" rounded="md" />
            <Skeleton width="60%" height="1.25rem" />
            <SkeletonText lines={2} />
            <div className="flex gap-2">
                <Skeleton width="80px" height="32px" rounded="full" />
                <Skeleton width="80px" height="32px" rounded="full" />
            </div>
        </div>
    );
}

// Table skeleton
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="w-full space-y-2">
            <div className="flex gap-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
                {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} width="100%" height="1rem" />)}
            </div>
            {Array.from({ length: rows }).map((_, row) => (
                <div key={row} className="flex gap-4 p-3 border-b">
                    {Array.from({ length: cols }).map((_, col) => <Skeleton key={col} width="100%" height="1rem" />)}
                </div>
            ))}
        </div>
    );
}
`;
    }

    generateShimmer(): string {
        return `import { ReactNode } from 'react';

interface ShimmerProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    children?: ReactNode;
}

export function Shimmer({ width = '100%', height = '100%', className = '', children }: ShimmerProps) {
    const style = {
        width: typeof width === 'number' ? \`\${width}px\` : width,
        height: typeof height === 'number' ? \`\${height}px\` : height,
    };

    return (
        <div className={\`relative overflow-hidden bg-gray-200 dark:bg-gray-700 \${className}\`} style={style}>
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {children}
        </div>
    );
}

// CSS for shimmer animation (add to globals.css):
// @keyframes shimmer { 100% { transform: translateX(100%); } }
// .animate-shimmer { animation: shimmer 1.5s infinite; }

// Shimmer overlay for existing content
export function ShimmerOverlay({ loading, children }: { loading: boolean; children: ReactNode }) {
    return (
        <div className="relative">
            {children}
            {loading && (
                <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
            )}
        </div>
    );
}
`;
    }

    generateContentLoader(): string {
        return `// SVG-based content loader (react-content-loader style)

interface ContentLoaderProps {
    width?: number;
    height?: number;
    speed?: number;
    backgroundColor?: string;
    foregroundColor?: string;
    children?: React.ReactNode;
}

export function ContentLoader({
    width = 400, height = 130, speed = 2, backgroundColor = '#f3f3f3', foregroundColor = '#ecebeb', children
}: ContentLoaderProps) {
    const idClip = \`clip-\${Math.random().toString(36).slice(2)}\`;
    const idGradient = \`gradient-\${Math.random().toString(36).slice(2)}\`;

    return (
        <svg viewBox={\`0 0 \${width} \${height}\`} width={width} height={height} preserveAspectRatio="none">
            <rect x="0" y="0" width={width} height={height} clipPath={\`url(#\${idClip})\`} fill={\`url(#\${idGradient})\`} />
            <defs>
                <clipPath id={idClip}>{children}</clipPath>
                <linearGradient id={idGradient}>
                    <stop offset="0%" stopColor={backgroundColor}>
                        <animate attributeName="offset" values="-2; 1" dur={\`\${speed}s\`} repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor={foregroundColor}>
                        <animate attributeName="offset" values="-1.5; 1.5" dur={\`\${speed}s\`} repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor={backgroundColor}>
                        <animate attributeName="offset" values="-1; 2" dur={\`\${speed}s\`} repeatCount="indefinite" />
                    </stop>
                </linearGradient>
            </defs>
        </svg>
    );
}

// Preset loaders
export function FacebookLoader() {
    return (
        <ContentLoader width={476} height={124}>
            <circle cx="42" cy="42" r="42" />
            <rect x="100" y="12" rx="4" ry="4" width="120" height="16" />
            <rect x="100" y="36" rx="4" ry="4" width="80" height="12" />
            <rect x="0" y="100" rx="4" ry="4" width="476" height="20" />
        </ContentLoader>
    );
}

export function InstagramLoader() {
    return (
        <ContentLoader width={400} height={480}>
            <circle cx="30" cy="30" r="30" />
            <rect x="70" y="10" rx="4" ry="4" width="100" height="16" />
            <rect x="70" y="34" rx="3" ry="3" width="60" height="12" />
            <rect x="0" y="70" rx="0" ry="0" width="400" height="400" />
        </ContentLoader>
    );
}
`;
    }

    generateLoadingStates(): string {
        return `import { motion } from 'framer-motion';
import { ReactNode, Suspense } from 'react';

// Spinner
export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
    return (
        <svg className={\`animate-spin \${className}\`} width={size} height={size} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

// Dots loader
export function DotsLoader({ size = 8, className = '' }: { size?: number; className?: string }) {
    return (
        <div className={\`flex gap-1 \${className}\`}>
            {[0, 1, 2].map((i) => (
                <motion.div key={i} className="bg-current rounded-full"
                    style={{ width: size, height: size }}
                    animate={{ y: [-2, 2, -2] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
            ))}
        </div>
    );
}

// Bars loader
export function BarsLoader({ size = 4, height = 20, className = '' }: { size?: number; height?: number; className?: string }) {
    return (
        <div className={\`flex gap-1 items-end \${className}\`} style={{ height }}>
            {[0, 1, 2, 3].map((i) => (
                <motion.div key={i} className="bg-current rounded-sm"
                    style={{ width: size }}
                    animate={{ height: [height * 0.3, height, height * 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} />
            ))}
        </div>
    );
}

// Loading wrapper
export function Loading({ loading, children, fallback }: { loading: boolean; children: ReactNode; fallback?: ReactNode }) {
    if (loading) return <>{fallback || <div className="flex justify-center py-8"><Spinner size={32} /></div>}</>;
    return <>{children}</>;
}

// Suspense wrapper with fallback
export function SuspenseLoader({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
    return <Suspense fallback={fallback || <div className="flex justify-center py-8"><Spinner size={32} /></div>}>{children}</Suspense>;
}
`;
    }
}

export const skeletonLoaderGenerator = new SkeletonLoaderGenerator();
