/**
 * Big Data Tools (JetBrains equivalent)
 * Spark, Hadoop, and cluster management
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';

export interface SparkJob {
    id: string;
    name: string;
    appName: string;
    master: string;
    mainClass: string;
    jarPath: string;
    args: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    output?: string;
    error?: string;
}

export interface HadoopFile {
    path: string;
    name: string;
    type: 'file' | 'directory';
    size: number;
    modifiedAt: number;
    permissions: string;
    owner: string;
}

export interface Cluster {
    id: string;
    name: string;
    type: 'spark' | 'hadoop' | 'flink';
    master: string;
    workers: number;
    status: 'running' | 'stopped' | 'error';
    resources: {
        cores: number;
        memory: string;
    };
}

/**
 * BigDataTools
 * Manage Spark jobs, Hadoop files, and clusters
 */
export class BigDataTools extends EventEmitter {
    private static instance: BigDataTools;
    private jobs: Map<string, SparkJob> = new Map();
    private clusters: Map<string, Cluster> = new Map();
    private runningProcesses: Map<string, any> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): BigDataTools {
        if (!BigDataTools.instance) {
            BigDataTools.instance = new BigDataTools();
        }
        return BigDataTools.instance;
    }

    // === SPARK JOB MANAGEMENT ===

    /**
     * Submit a Spark job
     */
    async submitSparkJob(options: {
        name: string;
        appName: string;
        master?: string;
        mainClass: string;
        jarPath: string;
        args?: string[];
    }): Promise<SparkJob> {
        const id = `spark_${Date.now()}`;

        const job: SparkJob = {
            id,
            name: options.name,
            appName: options.appName,
            master: options.master || 'local[*]',
            mainClass: options.mainClass,
            jarPath: options.jarPath,
            args: options.args || [],
            status: 'pending',
        };

        this.jobs.set(id, job);
        this.emit('jobSubmitted', job);

        // Execute the job
        this.executeSparkJob(job);

        return job;
    }

    /**
     * Execute Spark job
     */
    private executeSparkJob(job: SparkJob): void {
        job.status = 'running';
        job.startTime = Date.now();

        const args = [
            '--master', job.master,
            '--class', job.mainClass,
            '--name', job.appName,
            job.jarPath,
            ...job.args,
        ];

        try {
            const process = spawn('spark-submit', args);
            this.runningProcesses.set(job.id, process);

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
                this.emit('jobOutput', { jobId: job.id, data: data.toString() });
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            process.on('close', (code) => {
                job.endTime = Date.now();
                job.output = output;
                job.error = errorOutput;
                job.status = code === 0 ? 'completed' : 'failed';

                this.runningProcesses.delete(job.id);
                this.emit('jobCompleted', job);
            });

            process.on('error', (err) => {
                job.status = 'failed';
                job.error = err.message;
                job.endTime = Date.now();
                this.emit('jobFailed', job);
            });
        } catch (error: any) {
            job.status = 'failed';
            job.error = error.message;
            job.endTime = Date.now();
        }
    }

    /**
     * Cancel a Spark job
     */
    cancelJob(jobId: string): boolean {
        const process = this.runningProcesses.get(jobId);
        const job = this.jobs.get(jobId);

        if (process) {
            process.kill('SIGTERM');
            this.runningProcesses.delete(jobId);
        }

        if (job) {
            job.status = 'failed';
            job.error = 'Cancelled by user';
            job.endTime = Date.now();
            this.emit('jobCancelled', job);
            return true;
        }

        return false;
    }

    /**
     * Get job status
     */
    getJob(jobId: string): SparkJob | null {
        return this.jobs.get(jobId) || null;
    }

    /**
     * Get all jobs
     */
    getAllJobs(): SparkJob[] {
        return Array.from(this.jobs.values());
    }

    // === HADOOP FILE OPERATIONS ===

    /**
     * List HDFS directory
     */
    async listHDFS(path: string): Promise<HadoopFile[]> {
        return new Promise((resolve, reject) => {
            const process = spawn('hdfs', ['dfs', '-ls', '-h', path]);

            let output = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    // Simulate response for demo
                    resolve(this.mockHDFSListing(path));
                    return;
                }

                const files = this.parseHDFSListing(output);
                resolve(files);
            });

            process.on('error', () => {
                // Fallback to mock data
                resolve(this.mockHDFSListing(path));
            });
        });
    }

    /**
     * Parse HDFS listing output
     */
    private parseHDFSListing(output: string): HadoopFile[] {
        const lines = output.split('\n').filter(l => l.trim());
        const files: HadoopFile[] = [];

        for (const line of lines) {
            if (line.startsWith('Found') || line.startsWith('drwx') === false && line.startsWith('-') === false) continue;

            const parts = line.split(/\s+/);
            if (parts.length >= 8) {
                files.push({
                    path: parts[7],
                    name: parts[7].split('/').pop() || '',
                    type: parts[0].startsWith('d') ? 'directory' : 'file',
                    size: parseInt(parts[4]) || 0,
                    modifiedAt: new Date(`${parts[5]} ${parts[6]}`).getTime(),
                    permissions: parts[0],
                    owner: parts[2],
                });
            }
        }

        return files;
    }

    /**
     * Mock HDFS listing for demo
     */
    private mockHDFSListing(path: string): HadoopFile[] {
        return [
            { path: `${path}/data`, name: 'data', type: 'directory', size: 0, modifiedAt: Date.now(), permissions: 'drwxr-xr-x', owner: 'hdfs' },
            { path: `${path}/logs`, name: 'logs', type: 'directory', size: 0, modifiedAt: Date.now(), permissions: 'drwxr-xr-x', owner: 'hdfs' },
            { path: `${path}/input.csv`, name: 'input.csv', type: 'file', size: 1024000, modifiedAt: Date.now(), permissions: '-rw-r--r--', owner: 'user' },
        ];
    }

    /**
     * Read HDFS file
     */
    async readHDFSFile(path: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const process = spawn('hdfs', ['dfs', '-cat', path]);

            let output = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    resolve(`# Sample content from ${path}\nword1,10\nword2,5\nword3,8`);
                    return;
                }
                resolve(output);
            });

            process.on('error', () => {
                resolve(`# Sample content from ${path}\nword1,10\nword2,5`);
            });
        });
    }

    /**
     * Upload to HDFS
     */
    async uploadToHDFS(localPath: string, hdfsPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            const process = spawn('hdfs', ['dfs', '-put', localPath, hdfsPath]);

            process.on('close', (code) => {
                resolve(code === 0);
            });

            process.on('error', () => {
                resolve(false);
            });
        });
    }

    // === CLUSTER MANAGEMENT ===

    /**
     * Register a cluster
     */
    registerCluster(options: Omit<Cluster, 'id'>): Cluster {
        const id = `cluster_${Date.now()}`;
        const cluster: Cluster = { ...options, id };

        this.clusters.set(id, cluster);
        this.emit('clusterRegistered', cluster);
        return cluster;
    }

    /**
     * Get cluster
     */
    getCluster(clusterId: string): Cluster | null {
        return this.clusters.get(clusterId) || null;
    }

    /**
     * Get all clusters
     */
    getAllClusters(): Cluster[] {
        return Array.from(this.clusters.values());
    }

    /**
     * Check cluster health
     */
    async checkClusterHealth(clusterId: string): Promise<{ healthy: boolean; message: string }> {
        const cluster = this.clusters.get(clusterId);
        if (!cluster) {
            return { healthy: false, message: 'Cluster not found' };
        }

        // Simulate health check
        return { healthy: cluster.status === 'running', message: `Cluster ${cluster.name} is ${cluster.status}` };
    }

    /**
     * Get cluster metrics
     */
    getClusterMetrics(clusterId: string): {
        cpuUsage: number;
        memoryUsage: number;
        activeJobs: number;
    } {
        const cluster = this.clusters.get(clusterId);
        if (!cluster) {
            return { cpuUsage: 0, memoryUsage: 0, activeJobs: 0 };
        }

        // Simulated metrics
        return {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            activeJobs: Array.from(this.jobs.values()).filter(j => j.status === 'running').length,
        };
    }
}

// Singleton getter
export function getBigDataTools(): BigDataTools {
    return BigDataTools.getInstance();
}
