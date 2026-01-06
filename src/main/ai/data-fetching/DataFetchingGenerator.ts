// Data Fetching Generator - Generate data fetching utilities
import Anthropic from '@anthropic-ai/sdk';

class DataFetchingGenerator {
    private anthropic: Anthropic | null = null;

    generateReactQueryHooks(): string {
        return `import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';

// Generic fetch hook
export function useFetch<T>(key: string | string[], url: string, options?: UseQueryOptions<T>) {
    return useQuery<T>({
        queryKey: Array.isArray(key) ? key : [key],
        queryFn: async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
        ...options,
    });
}

// Generic mutation hook
export function useMutate<TData, TVariables>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') {
    const queryClient = useQueryClient();
    
    return useMutation<TData, Error, TVariables>({
        mutationFn: async (variables) => {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables),
            });
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}

// Infinite scroll hook
export function useInfinite<T>(key: string, baseUrl: string, pageSize = 20) {
    return useInfiniteQuery({
        queryKey: [key],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await fetch(\`\${baseUrl}?offset=\${pageParam}&limit=\${pageSize}\`);
            return res.json();
        },
        getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length * pageSize : undefined,
    });
}
`;
    }

    generateSWRHooks(): string {
        return `import useSWR, { SWRConfiguration } from 'swr';
import useSWRMutation from 'swr/mutation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Generic fetch hook
export function useFetch<T>(url: string, options?: SWRConfiguration) {
    const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, options);
    return { data, error, isLoading, refresh: mutate };
}

// Mutation hook
export function useMutate<T, A = unknown>(url: string, method: 'POST' | 'PUT' | 'DELETE' = 'POST') {
    return useSWRMutation<T, Error, string, A>(
        url,
        async (url, { arg }) => {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(arg),
            });
            if (!res.ok) throw new Error('Request failed');
            return res.json();
        }
    );
}

// Conditional fetch
export function useConditionalFetch<T>(url: string | null, options?: SWRConfiguration) {
    return useSWR<T>(url, url ? fetcher : null, options);
}
`;
    }

    generateAxiosClient(): string {
        return `import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}

class ApiClient {
    private client: AxiosInstance;

    constructor(config: ApiClientConfig) {
        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 10000,
            headers: { 'Content-Type': 'application/json', ...config.headers },
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) config.headers.Authorization = \`Bearer \${token}\`;
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export const api = new ApiClient({ baseURL: process.env.API_URL || '/api' });
export default ApiClient;
`;
    }

    generateFetchWrapper(): string {
        return `type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<T = unknown> {
    method?: HttpMethod;
    body?: T;
    headers?: Record<string, string>;
    timeout?: number;
}

class FetchClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = { 'Content-Type': 'application/json' };
    }

    private async request<R, B = unknown>(endpoint: string, options: RequestOptions<B> = {}): Promise<R> {
        const { method = 'GET', body, headers = {}, timeout = 10000 } = options;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
                method,
                headers: { ...this.defaultHeaders, ...headers },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }

            return response.json();
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    get<R>(endpoint: string, headers?: Record<string, string>): Promise<R> {
        return this.request<R>(endpoint, { method: 'GET', headers });
    }

    post<R, B>(endpoint: string, body: B, headers?: Record<string, string>): Promise<R> {
        return this.request<R, B>(endpoint, { method: 'POST', body, headers });
    }

    put<R, B>(endpoint: string, body: B, headers?: Record<string, string>): Promise<R> {
        return this.request<R, B>(endpoint, { method: 'PUT', body, headers });
    }

    delete<R>(endpoint: string, headers?: Record<string, string>): Promise<R> {
        return this.request<R>(endpoint, { method: 'DELETE', headers });
    }

    setAuthToken(token: string) {
        this.defaultHeaders['Authorization'] = \`Bearer \${token}\`;
    }
}

export const fetchClient = new FetchClient(process.env.API_URL || '/api');
`;
    }
}

export const dataFetchingGenerator = new DataFetchingGenerator();
