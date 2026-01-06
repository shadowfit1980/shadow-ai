/**
 * EnvironmentDetector - Detects installed tools and environment info
 * 
 * Automatically detects what's installed in the development environment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as si from 'systeminformation';
import {
    EnvironmentInfo,
    OSInfo,
    RuntimeInfo,
    PackageManagerInfo,
    DockerInfo,
    DatabaseInfo,
    ToolInfo
} from './types';

const execAsync = promisify(exec);

export class EnvironmentDetector {
    /**
     * Detect complete environment information
     */
    async detect(): Promise<EnvironmentInfo> {
        console.log('\n🔍 Detecting environment...\n');

        const [
            osInfo,
            nodeInfo,
            npmInfo,
            yarnInfo,
            pnpmInfo,
            pythonInfo,
            pipInfo,
            javaInfo,
            goInfo,
            rustInfo,
            dockerInfo,
            databases,
            otherTools
        ] = await Promise.all([
            this.detectOS(),
            this.detectNode(),
            this.detectNpm(),
            this.detectYarn(),
            this.detectPnpm(),
            this.detectPython(),
            this.detectPip(),
            this.detectJava(),
            this.detectGo(),
            this.detectRust(),
            this.detectDocker(),
            this.detectDatabases(),
            this.detectOtherTools()
        ]);

        return {
            os: osInfo,
            node: nodeInfo,
            npm: npmInfo,
            yarn: yarnInfo,
            pnpm: pnpmInfo,
            python: pythonInfo,
            pip: pipInfo,
            java: javaInfo,
            go: goInfo,
            rust: rustInfo,
            docker: dockerInfo,
            databases,
            other: otherTools
        };
    }

    /**
     * Detect operating system information
     */
    async detectOS(): Promise<OSInfo> {
        const osInfo = await si.osInfo();

        return {
            platform: os.platform() as 'darwin' | 'linux' | 'win32',
            distro: osInfo.distro,
            release: osInfo.release,
            arch: os.arch() as 'x64' | 'arm64' | 'arm' | 'x32',
            hostname: os.hostname()
        };
    }

    /**
     * Detect Node.js
     */
    async detectNode(): Promise<RuntimeInfo | undefined> {
        try {
            const { stdout } = await execAsync('node --version');
            const version = stdout.trim().replace('v', '');
            const { stdout: pathOutput } = await execAsync('which node');

            return {
                name: 'Node.js',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect npm
     */
    async detectNpm(): Promise<PackageManagerInfo | undefined> {
        try {
            const { stdout } = await execAsync('npm --version');
            const version = stdout.trim();
            const { stdout: pathOutput } = await execAsync('which npm');
            const { stdout: registryOutput } = await execAsync('npm config get registry');

            return {
                name: 'npm',
                version,
                path: pathOutput.trim(),
                registry: registryOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect yarn
     */
    async detectYarn(): Promise<PackageManagerInfo | undefined> {
        try {
            const { stdout } = await execAsync('yarn --version');
            const version = stdout.trim();
            const { stdout: pathOutput } = await execAsync('which yarn');

            return {
                name: 'yarn',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect pnpm
     */
    async detectPnpm(): Promise<PackageManagerInfo | undefined> {
        try {
            const { stdout } = await execAsync('pnpm --version');
            const version = stdout.trim();
            const { stdout: pathOutput } = await execAsync('which pnpm');

            return {
                name: 'pnpm',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect Python
     */
    async detectPython(): Promise<RuntimeInfo | undefined> {
        try {
            // Try python3 first
            const { stdout } = await execAsync('python3 --version');
            const version = stdout.trim().replace('Python ', '');
            const { stdout: pathOutput } = await execAsync('which python3');

            return {
                name: 'Python',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            try {
                // Fallback to python
                const { stdout } = await execAsync('python --version');
                const version = stdout.trim().replace('Python ', '');
                const { stdout: pathOutput } = await execAsync('which python');

                return {
                    name: 'Python',
                    version,
                    path: pathOutput.trim(),
                    installed: true
                };
            } catch {
                return undefined;
            }
        }
    }

    /**
     * Detect pip
     */
    async detectPip(): Promise<PackageManagerInfo | undefined> {
        try {
            const { stdout } = await execAsync('pip3 --version');
            const match = stdout.match(/pip ([\d.]+)/);
            const version = match ? match[1] : 'unknown';
            const { stdout: pathOutput } = await execAsync('which pip3');

            return {
                name: 'pip',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect Java
     */
    async detectJava(): Promise<RuntimeInfo | undefined> {
        try {
            const { stdout } = await execAsync('java -version 2>&1');
            const match = stdout.match(/version "(.+?)"/);
            const version = match ? match[1] : 'unknown';
            const { stdout: pathOutput } = await execAsync('which java');

            return {
                name: 'Java',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect Go
     */
    async detectGo(): Promise<RuntimeInfo | undefined> {
        try {
            const { stdout } = await execAsync('go version');
            const match = stdout.match(/go([\d.]+)/);
            const version = match ? match[1] : 'unknown';
            const { stdout: pathOutput } = await execAsync('which go');

            return {
                name: 'Go',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect Rust
     */
    async detectRust(): Promise<RuntimeInfo | undefined> {
        try {
            const { stdout } = await execAsync('rustc --version');
            const match = stdout.match(/rustc ([\d.]+)/);
            const version = match ? match[1] : 'unknown';
            const { stdout: pathOutput } = await execAsync('which rustc');

            return {
                name: 'Rust',
                version,
                path: pathOutput.trim(),
                installed: true
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Detect Docker
     */
    async detectDocker(): Promise<DockerInfo> {
        try {
            const { stdout } = await execAsync('docker --version');
            const match = stdout.match(/Docker version ([\d.]+)/);
            const version = match ? match[1] : 'unknown';

            // Check if daemon is running
            let running = false;
            try {
                await execAsync('docker ps');
                running = true;
            } catch {
                running = false;
            }

            // Get containers (if running)
            let containers: any[] = [];
            if (running) {
                try {
                    const { stdout: psOutput } = await execAsync('docker ps --format "{{json .}}"');
                    containers = psOutput
                        .trim()
                        .split('\n')
                        .filter(line => line)
                        .map(line => {
                            try {
                                const data = JSON.parse(line);
                                return {
                                    id: data.ID,
                                    name: data.Names,
                                    image: data.Image,
                                    status: data.State === 'running' ? 'running' : 'stopped',
                                    ports: data.Ports ? data.Ports.split(', ') : []
                                };
                            } catch {
                                return null;
                            }
                        })
                        .filter(c => c !== null);
                } catch {
                    containers = [];
                }
            }

            return {
                installed: true,
                version,
                running,
                containers,
                images: [],
                networks: [],
                volumes: []
            };
        } catch {
            return {
                installed: false,
                running: false,
                containers: [],
                images: [],
                networks: [],
                volumes: []
            };
        }
    }

    /**
     * Detect databases
     */
    async detectDatabases(): Promise<DatabaseInfo[]> {
        const databases: DatabaseInfo[] = [];

        // PostgreSQL
        try {
            const { stdout } = await execAsync('psql --version');
            const match = stdout.match(/([\d.]+)/);
            databases.push({
                type: 'postgresql',
                version: match ? match[1] : undefined,
                running: await this.isProcessRunning('postgres'),
                port: 5432
            });
        } catch {
            // Not installed
        }

        // MySQL
        try {
            const { stdout } = await execAsync('mysql --version');
            const match = stdout.match(/([\d.]+)/);
            databases.push({
                type: 'mysql',
                version: match ? match[1] : undefined,
                running: await this.isProcessRunning('mysqld'),
                port: 3306
            });
        } catch {
            // Not installed
        }

        // MongoDB
        try {
            const { stdout } = await execAsync('mongod --version');
            const match = stdout.match(/v([\d.]+)/);
            databases.push({
                type: 'mongodb',
                version: match ? match[1] : undefined,
                running: await this.isProcessRunning('mongod'),
                port: 27017
            });
        } catch {
            // Not installed
        }

        // Redis
        try {
            const { stdout } = await execAsync('redis-server --version');
            const match = stdout.match(/v=([\d.]+)/);
            databases.push({
                type: 'redis',
                version: match ? match[1] : undefined,
                running: await this.isProcessRunning('redis-server'),
                port: 6379
            });
        } catch {
            // Not installed
        }

        return databases;
    }

    /**
     * Detect other common tools
     */
    async detectOtherTools(): Promise<ToolInfo[]> {
        const tools: ToolInfo[] = [];

        const detectTool = async (name: string, command: string) => {
            try {
                const { stdout } = await execAsync(command);
                const match = stdout.match(/([\d.]+)/);
                const { stdout: pathOutput } = await execAsync(`which ${name}`);

                tools.push({
                    name,
                    version: match ? match[1] : undefined,
                    installed: true,
                    path: pathOutput.trim()
                });
            } catch {
                // Not installed
            }
        };

        await Promise.all([
            detectTool('git', 'git --version'),
            detectTool('brew', 'brew --version'),
            detectTool('curl', 'curl --version'),
            detectTool('wget', 'wget --version')
        ]);

        return tools;
    }

    /**
     * Check if a process is running
     */
    private async isProcessRunning(processName: string): Promise<boolean> {
        try {
            const { stdout } = await execAsync(`pgrep -f ${processName}`);
            return stdout.trim().length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Print environment summary
     */
    printSummary(env: EnvironmentInfo): void {
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║   Environment Detection Summary                    ║');
        console.log('╚════════════════════════════════════════════════════╝\n');

        console.log(`🖥️  OS: ${env.os.distro || env.os.platform} ${env.os.release} (${env.os.arch})`);

        if (env.node) {
            console.log(`📦 Node.js: v${env.node.version}`);
        }

        if (env.npm) {
            console.log(`📦 npm: v${env.npm.version}`);
        }

        if (env.yarn) {
            console.log(`📦 yarn: v${env.yarn.version}`);
        }

        if (env.python) {
            console.log(`🐍 Python: v${env.python.version}`);
        }

        if (env.docker) {
            console.log(`🐳 Docker: v${env.docker.version} (${env.docker.running ? '✅ running' : '❌ not running'})`);
            if (env.docker.containers.length > 0) {
                console.log(`   Containers: ${env.docker.containers.length}`);
            }
        }

        if (env.databases.length > 0) {
            console.log(`\n💾 Databases:`);
            env.databases.forEach(db => {
                console.log(`   - ${db.type} v${db.version || '?'} (${db.running ? '✅ running' : '❌ stopped'})`);
            });
        }

        if (env.other.length > 0) {
            console.log(`\n🔧 Other Tools:`);
            env.other.forEach(tool => {
                console.log(`   - ${tool.name} v${tool.version || '?'}`);
            });
        }

        console.log('');
    }
}
