// Search Filter Generator - Search, filtering, and pagination components
import Anthropic from '@anthropic-ai/sdk';

class SearchFilterGenerator {
    private anthropic: Anthropic | null = null;

    generateSearchComponent(): string {
        return `import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from 'use-debounce';

interface SearchProps {
    onSearch: (query: string) => void;
    placeholder?: string;
    debounceMs?: number;
    showClear?: boolean;
    suggestions?: string[];
}

export function SearchInput({ onSearch, placeholder = 'Search...', debounceMs = 300, showClear = true, suggestions = [] }: SearchProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, debounceMs);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleClear = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="relative">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showClear && query && (
                    <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
                )}
            </div>
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).map((s, i) => (
                            <li key={i} onClick={() => setQuery(s)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{s}</li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
`;
    }

    generateFilterPanel(): string {
        return `import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption { label: string; value: string; count?: number; }
interface FilterGroup { name: string; key: string; options: FilterOption[]; multiSelect?: boolean; }

interface FilterPanelProps {
    groups: FilterGroup[];
    activeFilters: Record<string, string | string[]>;
    onChange: (filters: Record<string, string | string[]>) => void;
    collapsible?: boolean;
}

export function FilterPanel({ groups, activeFilters, onChange, collapsible = true }: FilterPanelProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.key)));

    const toggleGroup = (key: string) => {
        const next = new Set(expandedGroups);
        next.has(key) ? next.delete(key) : next.add(key);
        setExpandedGroups(next);
    };

    const handleSelect = (groupKey: string, value: string, multiSelect: boolean) => {
        const current = activeFilters[groupKey];
        let next: string | string[];
        if (multiSelect) {
            const arr = Array.isArray(current) ? current : current ? [current] : [];
            next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
        } else {
            next = current === value ? '' : value;
        }
        onChange({ ...activeFilters, [groupKey]: next });
    };

    const clearAll = () => onChange({});
    const activeCount = Object.values(activeFilters).flat().filter(Boolean).length;

    return (
        <div className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Filters</h3>
                {activeCount > 0 && (
                    <button onClick={clearAll} className="text-sm text-blue-500 hover:underline">Clear all ({activeCount})</button>
                )}
            </div>
            {groups.map(group => (
                <div key={group.key} className="mb-4 border-b pb-4 last:border-0">
                    <button onClick={() => collapsible && toggleGroup(group.key)}
                        className="flex justify-between items-center w-full text-left font-medium mb-2">
                        {group.name}
                        {collapsible && <span>{expandedGroups.has(group.key) ? '−' : '+'}</span>}
                    </button>
                    <AnimatePresence>
                        {expandedGroups.has(group.key) && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                {group.options.map(opt => {
                                    const isActive = group.multiSelect
                                        ? (activeFilters[group.key] as string[] || []).includes(opt.value)
                                        : activeFilters[group.key] === opt.value;
                                    return (
                                        <label key={opt.value} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
                                            <input type={group.multiSelect ? 'checkbox' : 'radio'} checked={isActive}
                                                onChange={() => handleSelect(group.key, opt.value, !!group.multiSelect)}
                                                className="accent-blue-500" />
                                            <span>{opt.label}</span>
                                            {opt.count !== undefined && <span className="text-gray-400 text-sm ml-auto">({opt.count})</span>}
                                        </label>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
`;
    }

    generatePagination(): string {
        return `import { useMemo } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    showFirstLast?: boolean;
}

export function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1, showFirstLast = true }: PaginationProps) {
    const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const pages = useMemo(() => {
        const totalNumbers = siblingCount * 2 + 3;
        if (totalPages <= totalNumbers) return range(1, totalPages);

        const leftSibling = Math.max(currentPage - siblingCount, 1);
        const rightSibling = Math.min(currentPage + siblingCount, totalPages);
        const showLeftDots = leftSibling > 2;
        const showRightDots = rightSibling < totalPages - 1;

        if (!showLeftDots && showRightDots) {
            const leftRange = range(1, 3 + 2 * siblingCount);
            return [...leftRange, '...', totalPages];
        }
        if (showLeftDots && !showRightDots) {
            const rightRange = range(totalPages - (2 + 2 * siblingCount), totalPages);
            return [1, '...', ...rightRange];
        }
        return [1, '...', ...range(leftSibling, rightSibling), '...', totalPages];
    }, [currentPage, totalPages, siblingCount]);

    return (
        <nav className="flex items-center gap-1">
            {showFirstLast && (
                <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
                    className="px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50">«</button>
            )}
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className="px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50">‹</button>
            {pages.map((page, i) => (
                typeof page === 'number' ? (
                    <button key={i} onClick={() => onPageChange(page)}
                        className={\`px-3 py-2 rounded \${page === currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}\`}>{page}</button>
                ) : <span key={i} className="px-2">...</span>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50">›</button>
            {showFirstLast && (
                <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50">»</button>
            )}
        </nav>
    );
}

// Hook for pagination logic
export function usePagination<T>(items: T[], itemsPerPage: number) {
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    }, [items, page, itemsPerPage]);
    return { page, setPage, totalPages, paginatedItems, total: items.length };
}
`;
    }

    generateServerSidePagination(): string {
        return `// Server-side pagination utilities

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface PaginatedResult<T> {
    data: T[];
    meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean; };
}

export function parsePaginationParams(req: NextRequest): PaginationParams {
    const url = new URL(req.url);
    return {
        page: Math.max(1, parseInt(url.searchParams.get('page') || '1')),
        limit: Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20'))),
        sortBy: url.searchParams.get('sortBy') || undefined,
        sortOrder: (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
}

export async function paginateQuery<T>(
    model: any,
    params: PaginationParams,
    where: object = {},
    include?: object
): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
        model.findMany({
            where,
            include,
            skip,
            take: limit,
            orderBy: sortBy ? { [sortBy]: sortOrder } : undefined,
        }),
        model.count({ where }),
    ]);

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
        },
    };
}

// Cursor-based pagination
export async function cursorPaginate<T>(
    model: any,
    cursor: string | undefined,
    limit: number,
    where: object = {}
): Promise<{ data: T[]; nextCursor: string | null }> {
    const data = await model.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
    });

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, -1) : data;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { data: items, nextCursor };
}
`;
    }
}

export const searchFilterGenerator = new SearchFilterGenerator();
