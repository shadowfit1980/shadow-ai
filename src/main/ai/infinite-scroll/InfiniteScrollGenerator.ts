// Infinite Scroll Generator - Virtualization and infinite scrolling
import Anthropic from '@anthropic-ai/sdk';

class InfiniteScrollGenerator {
    private anthropic: Anthropic | null = null;

    generateInfiniteScroll(): string {
        return `import { useCallback, useRef, useEffect, ReactNode } from 'react';
import useSWRInfinite from 'swr/infinite';

interface InfiniteScrollProps<T> {
    getKey: (pageIndex: number, previousPageData: T[] | null) => string | null;
    fetcher: (key: string) => Promise<T[]>;
    renderItem: (item: T, index: number) => ReactNode;
    pageSize?: number;
    threshold?: number;
    loader?: ReactNode;
    endMessage?: ReactNode;
    className?: string;
}

export function InfiniteScroll<T>({
    getKey, fetcher, renderItem, pageSize = 20, threshold = 200, loader, endMessage, className = ''
}: InfiniteScrollProps<T>) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, { revalidateFirstPage: false });

    const items = data ? data.flat() : [];
    const isEmpty = data?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < pageSize);
    const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
                    setSize(size + 1);
                }
            },
            { rootMargin: \`\${threshold}px\` }
        );

        if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
        return () => observerRef.current?.disconnect();
    }, [isReachingEnd, isLoadingMore, setSize, size, threshold]);

    return (
        <div className={className}>
            {items.map((item, i) => renderItem(item, i))}
            <div ref={loadMoreRef} />
            {isLoadingMore && (loader || <div className="py-4 text-center text-gray-500">Loading...</div>)}
            {isReachingEnd && !isEmpty && (endMessage || <div className="py-4 text-center text-gray-400">No more items</div>)}
        </div>
    );
}

// Hook for infinite scroll logic
export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback((node: HTMLElement | null) => {
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) callback();
        });
        if (node) observer.current.observe(node);
    }, [callback, hasMore]);

    return lastElementRef;
}
`;
    }

    generateVirtualList(): string {
        return `import { useRef, useState, useCallback, useMemo, ReactNode, CSSProperties } from 'react';

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number;
    renderItem: (item: T, index: number) => ReactNode;
    height: number;
    overscan?: number;
    className?: string;
}

export function VirtualList<T>({ items, itemHeight, renderItem, height, overscan = 3, className = '' }: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback(() => {
        if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
    }, []);

    const { startIndex, endIndex, offsetY } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(height / itemHeight);
        const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
        return { startIndex: start, endIndex: end, offsetY: start * itemHeight };
    }, [scrollTop, itemHeight, height, overscan, items.length]);

    const visibleItems = useMemo(() => items.slice(startIndex, endIndex + 1), [items, startIndex, endIndex]);
    const totalHeight = items.length * itemHeight;

    return (
        <div ref={containerRef} className={\`overflow-auto \${className}\`} style={{ height }} onScroll={handleScroll}>
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
                    {visibleItems.map((item, i) => (
                        <div key={startIndex + i} style={{ height: itemHeight }}>{renderItem(item, startIndex + i)}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Variable height virtual list
export function VariableVirtualList<T>({
    items, estimatedItemHeight, renderItem, height, getItemHeight, className = ''
}: {
    items: T[];
    estimatedItemHeight: number;
    renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
    height: number;
    getItemHeight: (index: number) => number;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    // Simple implementation - for production use react-window or react-virtualized
    const handleScroll = () => { if (containerRef.current) setScrollTop(containerRef.current.scrollTop); };

    return (
        <div ref={containerRef} className={\`overflow-auto \${className}\`} style={{ height }} onScroll={handleScroll}>
            {items.map((item, i) => renderItem(item, i, { height: getItemHeight(i) }))}
        </div>
    );
}
`;
    }

    generateWindowScroll(): string {
        return `import { useEffect, useState, useCallback, useRef } from 'react';

// Window-based infinite scroll hook
export function useWindowInfiniteScroll(callback: () => void, options: { threshold?: number; enabled?: boolean } = {}) {
    const { threshold = 200, enabled = true } = options;
    const loadingRef = useRef(false);

    const handleScroll = useCallback(() => {
        if (!enabled || loadingRef.current) return;
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;

        if (scrollHeight - scrollTop - clientHeight < threshold) {
            loadingRef.current = true;
            callback();
            setTimeout(() => { loadingRef.current = false; }, 100);
        }
    }, [callback, threshold, enabled]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);
}

// Scroll position hook
export function useScrollPosition() {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => setPosition({ x: window.scrollX, y: window.scrollY });
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return position;
}

// Scroll direction hook
export function useScrollDirection() {
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);
    const prevScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setDirection(currentScrollY > prevScrollY.current ? 'down' : 'up');
            prevScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return direction;
}

// Scroll to element
export function useScrollTo() {
    const scrollToElement = useCallback((element: HTMLElement | null, options?: ScrollIntoViewOptions) => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'start', ...options });
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const scrollToBottom = useCallback(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, []);

    return { scrollToElement, scrollToTop, scrollToBottom };
}
`;
    }

    generatePullToRefresh(): string {
        return `import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    threshold?: number;
    maxPull?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80, maxPull = 120 }: PullToRefreshProps) {
    const [refreshing, setRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);

    const handleDrag = (event: any, info: PanInfo) => {
        if (containerRef.current?.scrollTop === 0 && info.delta.y > 0) {
            y.set(Math.min(info.offset.y, maxPull));
        }
    };

    const handleDragEnd = useCallback(async () => {
        if (y.get() >= threshold && !refreshing) {
            setRefreshing(true);
            try { await onRefresh(); }
            finally { setRefreshing(false); }
        }
        y.set(0);
    }, [onRefresh, refreshing, threshold, y]);

    return (
        <div className="relative overflow-hidden">
            <motion.div className="absolute left-1/2 -translate-x-1/2 -top-12 w-8 h-8 flex items-center justify-center"
                style={{ y, opacity }}>
                <motion.div className="text-2xl" style={{ rotate }}>{refreshing ? '⏳' : '↓'}</motion.div>
            </motion.div>
            <motion.div ref={containerRef} className="overflow-auto"
                drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0}
                onDrag={handleDrag} onDragEnd={handleDragEnd} style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
}
`;
    }
}

export const infiniteScrollGenerator = new InfiniteScrollGenerator();
