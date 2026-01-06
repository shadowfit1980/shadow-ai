/**
 * ⚛️ React Generator
 * 
 * Generate React patterns:
 * - Components, hooks, context
 * - Common patterns
 */

import { EventEmitter } from 'events';

export class ReactGenerator extends EventEmitter {
    private static instance: ReactGenerator;

    private constructor() { super(); }

    static getInstance(): ReactGenerator {
        if (!ReactGenerator.instance) {
            ReactGenerator.instance = new ReactGenerator();
        }
        return ReactGenerator.instance;
    }

    generateComponent(name: string, props: string[] = []): string {
        const propsInterface = props.length > 0
            ? `interface ${name}Props {\n${props.map(p => `    ${p}: string;`).join('\n')}\n}`
            : '';

        return `// ${name} Component
import React from 'react';

${propsInterface}

export const ${name}: React.FC${props.length ? `<${name}Props>` : ''} = (${props.length ? 'props' : ''}) => {
    return (
        <div className="${name.toLowerCase()}">
            {/* Component content */}
        </div>
    );
};

export default ${name};
`;
    }

    generateHook(name: string): string {
        return `// ${name} Hook
import { useState, useEffect, useCallback, useMemo } from 'react';

export function ${name}(initialValue?: any) {
    const [state, setState] = useState(initialValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async (fn: () => Promise<any>) => {
        try {
            setLoading(true);
            setError(null);
            const result = await fn();
            setState(result);
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setState(initialValue);
        setError(null);
    }, [initialValue]);

    return { state, setState, loading, error, execute, reset };
}
`;
    }

    generateContext(name: string): string {
        return `// ${name} Context
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface ${name}State {
    data: any;
    loading: boolean;
    error: Error | null;
}

type ${name}Action = 
    | { type: 'SET_LOADING' }
    | { type: 'SET_DATA'; payload: any }
    | { type: 'SET_ERROR'; payload: Error };

interface ${name}ContextType extends ${name}State {
    dispatch: React.Dispatch<${name}Action>;
    setData: (data: any) => void;
}

// Initial state
const initialState: ${name}State = {
    data: null,
    loading: false,
    error: null
};

// Reducer
function ${name.toLowerCase()}Reducer(state: ${name}State, action: ${name}Action): ${name}State {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null };
        case 'SET_DATA':
            return { ...state, data: action.payload, loading: false };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        default:
            return state;
    }
}

// Context
const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

// Provider
export function ${name}Provider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(${name.toLowerCase()}Reducer, initialState);

    const setData = (data: any) => {
        dispatch({ type: 'SET_DATA', payload: data });
    };

    return (
        <${name}Context.Provider value={{ ...state, dispatch, setData }}>
            {children}
        </${name}Context.Provider>
    );
}

// Hook
export function use${name}() {
    const context = useContext(${name}Context);
    if (!context) {
        throw new Error('use${name} must be used within ${name}Provider');
    }
    return context;
}
`;
    }

    generateDataFetchingHook(resourceName: string): string {
        const lower = resourceName.toLowerCase();
        const plural = lower + 's';

        return `// use${resourceName} Hook
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

const API_URL = '/api/${plural}';

export function use${resourceName}s() {
    const { data, error, isLoading, mutate } = useSWR(API_URL);
    
    return {
        ${plural}: data || [],
        isLoading,
        error,
        refresh: mutate
    };
}

export function use${resourceName}(id: string) {
    const { data, error, isLoading, mutate } = useSWR(id ? \`\${API_URL}/\${id}\` : null);
    
    return {
        ${lower}: data,
        isLoading,
        error,
        refresh: mutate
    };
}

export function use${resourceName}Mutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create');
            return await res.json();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const update = useCallback(async (id: string, data: any) => {
        setLoading(true);
        try {
            const res = await fetch(\`\${API_URL}/\${id}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update');
            return await res.json();
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const remove = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(\`\${API_URL}/\${id}\`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { create, update, remove, loading, error };
}
`;
    }

    generateCommonPatterns(): string {
        return `// Common React Patterns
// Generated by Shadow AI

// 1. Compound Component Pattern
export function Tabs({ children, defaultTab }) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            {children}
        </TabsContext.Provider>
    );
}
Tabs.List = TabsList;
Tabs.Panel = TabPanel;

// 2. Render Props Pattern
export function Toggle({ children, initialOn = false }) {
    const [on, setOn] = useState(initialOn);
    const toggle = () => setOn(prev => !prev);
    return children({ on, toggle, setOn });
}

// 3. Higher-Order Component
export function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        const { user, loading } = useAuth();
        if (loading) return <Spinner />;
        if (!user) return <Redirect to="/login" />;
        return <Component {...props} user={user} />;
    };
}

// 4. Custom Hook with AbortController
export function useFetch(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        
        fetch(url, { signal: controller.signal })
            .then(res => res.json())
            .then(setData)
            .catch(err => {
                if (err.name !== 'AbortError') setError(err);
            })
            .finally(() => setLoading(false));
        
        return () => controller.abort();
    }, [url]);

    return { data, loading, error };
}

// 5. Optimistic Updates
export function useOptimisticUpdate(mutationFn) {
    const [optimisticData, setOptimisticData] = useState(null);
    const [isPending, setIsPending] = useState(false);

    const mutate = async (newData, options = {}) => {
        const previousData = optimisticData;
        
        if (options.optimistic) {
            setOptimisticData(newData);
        }
        
        setIsPending(true);
        try {
            const result = await mutationFn(newData);
            setOptimisticData(result);
            return result;
        } catch (error) {
            if (options.rollbackOnError) {
                setOptimisticData(previousData);
            }
            throw error;
        } finally {
            setIsPending(false);
        }
    };

    return { data: optimisticData, mutate, isPending };
}
`;
    }
}

export const reactGenerator = ReactGenerator.getInstance();
