/**
 * Performance Optimization Generator
 * 
 * Generate code splitting, lazy loading, memoization,
 * virtualization, and performance monitoring utilities.
 */

import { EventEmitter } from 'events';

// ============================================================================
// PERFORMANCE OPTIMIZATION GENERATOR
// ============================================================================

export class PerformanceGenerator extends EventEmitter {
    private static instance: PerformanceGenerator;

    private constructor() {
        super();
    }

    static getInstance(): PerformanceGenerator {
        if (!PerformanceGenerator.instance) {
            PerformanceGenerator.instance = new PerformanceGenerator();
        }
        return PerformanceGenerator.instance;
    }

    // ========================================================================
    // CODE SPLITTING & LAZY LOADING
    // ========================================================================

    generateCodeSplitting(): string {
        return `import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// ============================================================================
// LAZY LOADED COMPONENTS
// ============================================================================

const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading component
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}

// ============================================================================
// ROUTES WITH CODE SPLITTING
// ============================================================================

export function AppRoutes() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/profile" element={<Profile />} />
            </Routes>
        </Suspense>
    );
}

// ============================================================================
// DYNAMIC IMPORTS
// ============================================================================

export async function loadModule(moduleName: string) {
    try {
        const module = await import(\`./modules/\${moduleName}\`);
        return module.default;
    } catch (error) {
        console.error(\`Failed to load module: \${moduleName}\`, error);
        throw error;
    }
}

// ============================================================================
// PREFETCHING
// ============================================================================

export function prefetchRoute(path: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
}

// Prefetch on hover
export function usePrefetchOnHover(path: string) {
    const handleMouseEnter = () => {
        prefetchRoute(path);
    };

    return { onMouseEnter: handleMouseEnter };
}
`;
    }

    // ========================================================================
    // MEMOIZATION & OPTIMIZATION
    // ========================================================================

    generateMemoization(): string {
        return `import { memo, useMemo, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// MEMOIZED COMPONENT
// ============================================================================

interface ItemProps {
    id: number;
    title: string;
    description: string;
    onSelect: (id: number) => void;
}

export const MemoizedItem = memo<ItemProps>(
    ({ id, title, description, onSelect }) => {
        console.log(\`Rendering item: \${id}\`);

        return (
            <div onClick={() => onSelect(id)} className="p-4 border rounded cursor-pointer hover:bg-gray-50">
                <h3 className="font-bold">{title}</h3>
                <p className="text-gray-600">{description}</p>
            </div>
        );
    },
    (prevProps, nextProps) => {
        // Custom equality check
        return prevProps.id === nextProps.id &&
               prevProps.title === nextProps.title &&
               prevProps.description === nextProps.description;
    }
);

// ============================================================================
// EXPENSIVE COMPUTATION
// ============================================================================

function expensiveCalculation(data: number[]): number {
    console.log('Running expensive calculation...');
    return data.reduce((acc, val) => acc + val * Math.sqrt(val), 0);
}

export function OptimizedComponent({ data }: { data: number[] }) {
    // Memoize expensive computation
    const result = useMemo(() => expensiveCalculation(data), [data]);

    // Memoize callback
    const handleClick = useCallback(() => {
        console.log('Result:', result);
    }, [result]);

    return (
        <div>
            <p>Result: {result}</p>
            <button onClick={handleClick}>Log Result</button>
        </div>
    );
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useThrottle<T>(value: T, interval: number): T {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(Date.now());

    useEffect(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= interval) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, interval - (Date.now() - lastRan.current));

        return () => clearTimeout(handler);
    }, [value, interval]);

    return throttledValue;
}

// Usage
function SearchComponent() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        if (debouncedSearchTerm) {
            // Perform search
            console.log('Searching for:', debouncedSearchTerm);
        }
    }, [debouncedSearchTerm]);

    return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
`;
    }

    // ========================================================================
    // VIRTUALIZATION
    // ========================================================================

    generateVirtualization(): string {
        return `import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// ============================================================================
// VIRTUAL LIST
// ============================================================================

export function VirtualList({ items }: { items: any[] }) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50,
        overscan: 5,
    });

    return (
        <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
            <div
                style={{
                    height: \`\${virtualizer.getTotalSize()}px\`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map(virtualItem => (
                    <div
                        key={virtualItem.index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: \`\${virtualItem.size}px\`,
                            transform: \`translateY(\${virtualItem.start}px)\`,
                        }}
                    >
                        <div className="p-4 border-b">
                            {items[virtualItem.index].name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// INFINITE SCROLL
// ============================================================================

export function InfiniteScrollList() {
    const [items, setItems] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const loadMore = async () => {
        const newItems = await fetchItems(page);
        
        if (newItems.length === 0) {
            setHasMore(false);
            return;
        }

        setItems(prev => [...prev, ...newItems]);
        setPage(prev => prev + 1);
    };

    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, page]);

    return (
        <div>
            {items.map((item, i) => (
                <div key={i} className="p-4 border-b">
                    {item.name}
                </div>
            ))}
            {hasMore && <div ref={observerTarget} className="p-4 text-center">Loading...</div>}
        </div>
    );
}
`;
    }

    // ========================================================================
    // PERFORMANCE MONITORING
    // ========================================================================

    generatePerformanceMonitoring(): string {
        return `// ============================================================================
// WEB VITALS MONITORING
// ============================================================================

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
}

// ============================================================================
// CUSTOM PERFORMANCE MARKS
// ============================================================================

export class PerformanceTracker {
    static mark(name: string): void {
        performance.mark(name);
    }

    static measure(name: string, startMark: string, endMark?: string): void {
        if (endMark) {
            performance.measure(name, startMark, endMark);
        } else {
            performance.measure(name, startMark);
        }
    }

    static getEntries(name?: string): PerformanceEntry[] {
        if (name) {
            return performance.getEntriesByName(name);
        }
        return performance.getEntries();
    }

    static clear(): void {
        performance.clearMarks();
        performance.clearMeasures();
    }
}

// Usage
PerformanceTracker.mark('data-fetch-start');
await fetchData();
PerformanceTracker.mark('data-fetch-end');
PerformanceTracker.measure('data-fetch', 'data-fetch-start', 'data-fetch-end');

// ============================================================================
// REACT PROFILER
// ============================================================================

import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
) => {
    console.log({
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
    });
};

export function ProfiledComponent({ children }: { children: React.ReactNode }) {
    return (
        <Profiler id="MyComponent" onRender={onRenderCallback}>
            {children}
        </Profiler>
    );
}
`;
    }
}

export const performanceGenerator = PerformanceGenerator.getInstance();
