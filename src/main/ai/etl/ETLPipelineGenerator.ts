/**
 * ETL Pipeline Generator
 * 
 * Generate ETL (Extract, Transform, Load) pipelines,
 * data transformation workflows, and batch processing systems.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ETLStage {
    name: string;
    type: 'extract' | 'transform' | 'load' | 'validate';
    config: Record<string, any>;
}

export interface DataSource {
    type: 'database' | 'api' | 'file' | 'stream';
    connection: string;
    query?: string;
}

export interface DataDestination {
    type: 'database' | 'file' | 'api';
    connection: string;
}

// ============================================================================
// ETL PIPELINE GENERATOR
// ============================================================================

export class ETLPipelineGenerator extends EventEmitter {
    private static instance: ETLPipelineGenerator;

    private constructor() {
        super();
    }

    static getInstance(): ETLPipelineGenerator {
        if (!ETLPipelineGenerator.instance) {
            ETLPipelineGenerator.instance = new ETLPipelineGenerator();
        }
        return ETLPipelineGenerator.instance;
    }

    // ========================================================================
    // ETL PIPELINE
    // ========================================================================

    generateETLPipeline(stages: ETLStage[]): string {
        return `/**
 * ETL Pipeline
 * 
 * Extract -> Transform -> Load
 */

import { EventEmitter } from 'events';

export interface PipelineConfig {
    batchSize?: number;
    parallelism?: number;
    errorHandling?: 'skip' | 'stop' | 'retry';
    retries?: number;
}

export class ETLPipeline extends EventEmitter {
    private config: PipelineConfig;
    private errors: Array<{ stage: string; error: Error; data?: any }> = [];
    
    constructor(config: PipelineConfig = {}) {
        super();
        this.config = {
            batchSize: 1000,
            parallelism: 5,
            errorHandling: 'skip',
            retries: 3,
            ...config,
        };
    }
    
    async run<T = any, R = any>(data: T[]): Promise<R[]> {
        console.log(\`Starting ETL pipeline with \${data.length} records\`);
        
        let result = data as any[];
        
        // Execute stages in sequence
${stages.map((stage, i) => `
        // Stage ${i + 1}: ${stage.name} (${stage.type})
        result = await this.${stage.type}Stage${i + 1}(result);
        this.emit('stage-complete', { stage: '${stage.name}', count: result.length });`).join('\n')}
        
        if (this.errors.length > 0) {
            console.warn(\`Pipeline completed with \${this.errors.length} errors\`);
            this.emit('errors', this.errors);
        }
        
        return result;
    }
    
${stages.map((stage, i) => this.generateStageMethod(stage, i + 1)).join('\n\n')}
    
    private async processBatch<T, R>(
        batch: T[],
        processor: (item: T) => Promise<R>
    ): Promise<R[]> {
        const results: R[] = [];
        
        for (const chunk of this.chunk(batch, this.config.parallelism!)) {
            const promises = chunk.map(async item => {
                try {
                    return await this.retry(async () => processor(item));
                } catch (error) {
                    if (this.config.errorHandling === 'stop') {
                        throw error;
                    }
                    this.errors.push({ stage: 'processing', error: error as Error, data: item });
                    return null;
                }
            });
            
            const batchResults = await Promise.all(promises);
            results.push(...batchResults.filter(r => r !== null) as R[]);
        }
        
        return results;
    }
    
    private async retry<T>(fn: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null;
        
        for (let i = 0; i < this.config.retries!; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                if (i < this.config.retries! - 1) {
                    await this.delay(Math.pow(2, i) * 1000);
                }
            }
        }
        
        throw lastError;
    }
    
    private chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getErrors() {
        return this.errors;
    }
}

// Usage example
export async function runPipeline() {
    const pipeline = new ETLPipeline({
        batchSize: 1000,
        parallelism: 10,
        errorHandling: 'skip',
    });
    
    pipeline.on('stage-complete', ({ stage, count }) => {
        console.log(\`Stage '\${stage}' completed with \${count} records\`);
    });
    
    const data = [/* your data */];
    const result = await pipeline.run(data);
    
    console.log(\`Processed \${result.length} records\`);
    console.log(\`Errors: \${pipeline.getErrors().length}\`);
    
    return result;
}
`;
    }

    private generateStageMethod(stage: ETLStage, index: number): string {
        const methodName = `${stage.type}Stage${index}`;

        switch (stage.type) {
            case 'extract':
                return `    private async ${methodName}(data: any[]): Promise<any[]> {
        console.log('Stage ${index}: Extracting data');
        // TODO: Implement extraction logic
        // Example: Fetch from database, API, or file
        return data;
    }`;

            case 'transform':
                return `    private async ${methodName}(data: any[]): Promise<any[]> {
        console.log('Stage ${index}: Transforming data');
        
        return this.processBatch(data, async (item) => {
            // TODO: Implement transformation logic
            // Example: Clean, normalize, enrich data
            return {
                ...item,
                // Add transformations
            };
        });
    }`;

            case 'validate':
                return `    private async ${methodName}(data: any[]): Promise<any[]> {
        console.log('Stage ${index}: Validating data');
        
        return data.filter(item => {
            // TODO: Implement validation logic
            // Example: Check required fields, data types, ranges
            return true; // Keep valid items
        });
    }`;

            case 'load':
                return `    private async ${methodName}(data: any[]): Promise<any[]> {
        console.log('Stage ${index}: Loading data');
        
        const batches = this.chunk(data, this.config.batchSize!);
        const loaded: any[] = [];
        
        for (const batch of batches) {
            // TODO: Implement load logic
            // Example: Insert into database, write to file, send to API
            loaded.push(...batch);
        }
        
        return loaded;
    }`;

            default:
                return `    private async ${methodName}(data: any[]): Promise<any[]> {
        return data;
    }`;
        }
    }

    // ========================================================================
    // DATA TRANSFORMATIONS
    // ========================================================================

    generateDataTransformations(): string {
        return `/**
 * Common Data Transformations
 */

export const Transformations = {
    // Clean text fields
    cleanText(value: string): string {
        return value
            .trim()
            .replace(/\\s+/g, ' ')
            .replace(/[^\\w\\s.-]/gi, '');
    },
    
    // Normalize phone numbers
    normalizePhone(phone: string): string {
        return phone.replace(/\\D/g, '');
    },
    
    // Parse dates
    parseDate(dateStr: string): Date | null {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    },
    
    // Convert to snake_case
    toSnakeCase(str: string): string {
        return str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    },
    
    // Convert to camelCase
    toCamelCase(str: string): string {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    },
    
    // Remove duplicates
    removeDuplicates<T>(arr: T[], key?: keyof T): T[] {
        if (!key) {
            return [...new Set(arr)];
        }
        
        const seen = new Set();
        return arr.filter(item => {
            const val = item[key];
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
        });
    },
    
    // Group by key
    groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
        return arr.reduce((groups, item) => {
            const groupKey = String(item[key]);
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(item);
            return groups;
        }, {} as Record<string, T[]>);
    },
    
    // Parse JSON safely
    parseJSON(jsonStr: string): any {
        try {
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    },
    
    // Flatten nested objects
    flatten(obj: any, prefix = ''): Record<string, any> {
        const result: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? \`\${prefix}.\${key}\` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(result, this.flatten(value, newKey));
            } else {
                result[newKey] = value;
            }
        }
        
        return result;
    },
};
`;
    }

    // ========================================================================
    // BATCH PROCESSOR
    // ========================================================================

    generateBatchProcessor(): string {
        return `/**
 * Batch Processor for Large Datasets
 */

export class BatchProcessor<T = any, R = any> {
    private batchSize: number;
    private concurrency: number;
    
    constructor(options: { batchSize?: number; concurrency?: number } = {}) {
        this.batchSize = options.batchSize || 1000;
        this.concurrency = options.concurrency || 5;
    }
    
    async process(
        data: T[],
        processor: (batch: T[]) => Promise<R[]>
    ): Promise<R[]> {
        const batches = this.createBatches(data);
        const results: R[] = [];
        
        // Process batches with concurrency control
        for (let i = 0; i < batches.length; i += this.concurrency) {
            const batchGroup = batches.slice(i, i + this.concurrency);
            const batchResults = await Promise.all(
                batchGroup.map(batch => processor(batch))
            );
            
            results.push(...batchResults.flat());
            
            // Progress reporting
            const processed = Math.min(i + this.concurrency, batches.length);
            console.log(\`Processed \${processed}/\${batches.length} batches\`);
        }
        
        return results;
    }
    
    async processStream(
        data: T[],
        processor: (item: T) => Promise<R>
    ): Promise<R[]> {
        const results: R[] = [];
        const batches = this.createBatches(data);
        
        for (const batch of batches) {
            const batchPromises = batch.map(item => processor(item));
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(\`Error processing item \${index}:\`, result.reason);
                }
            });
        }
        
        return results;
    }
    
    private createBatches(data: T[]): T[][] {
        const batches: T[][] = [];
        
        for (let i = 0; i < data.length; i += this.batchSize) {
            batches.push(data.slice(i, i + this.batchSize));
        }
        
        return batches;
    }
}

// Usage
export async function processLargeDataset<T, R>(
    data: T[],
    transform: (item: T) => Promise<R>
): Promise<R[]> {
    const processor = new BatchProcessor({ batchSize: 1000, concurrency: 10 });
    return processor.processStream(data, transform);
}
`;
    }
}

export const etlPipelineGenerator = ETLPipelineGenerator.getInstance();
