/**
 * UESE Operating System Emulator
 * 
 * Simulates kernel behavior for Linux, macOS, Windows, and Android.
 * Provides process, memory, filesystem, and syscall emulation.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type OSType = 'linux' | 'macos' | 'windows' | 'android' | 'ios';
export type ProcessState = 'created' | 'running' | 'sleeping' | 'waiting' | 'zombie' | 'terminated';

export interface OSProfile {
    type: OSType;
    version: string;
    kernel: string;
    arch: 'x64' | 'arm64' | 'arm' | 'x86';
    features: string[];
}

export interface EmulatedProcess {
    pid: number;
    name: string;
    state: ProcessState;
    parentPid: number;
    uid: number;
    gid: number;
    memory: MemoryInfo;
    fds: Map<number, FileDescriptor>;
    env: Map<string, string>;
    cwd: string;
    startTime: number;
    cpuTime: number;
}

export interface MemoryInfo {
    heap: number;
    stack: number;
    shared: number;
    virtual: number;
    resident: number;
    limit: number;
}

export interface FileDescriptor {
    fd: number;
    path: string;
    mode: 'r' | 'w' | 'rw';
    offset: number;
    flags: number;
}

export interface VirtualFile {
    path: string;
    content: Buffer | string;
    mode: number;
    uid: number;
    gid: number;
    size: number;
    atime: number;
    mtime: number;
    ctime: number;
    isDirectory: boolean;
}

export interface SyscallResult {
    success: boolean;
    returnValue: number;
    errno?: number;
    error?: string;
}

// ============================================================================
// OS PROFILES
// ============================================================================

const OS_PROFILES: Record<string, OSProfile> = {
    'ubuntu-22.04': {
        type: 'linux',
        version: '22.04',
        kernel: '5.15.0-generic',
        arch: 'x64',
        features: ['systemd', 'apt', 'snap', 'apparmor']
    },
    'macos-14': {
        type: 'macos',
        version: '14.0',
        kernel: 'Darwin 23.0.0',
        arch: 'arm64',
        features: ['gatekeeper', 'sandbox', 'sip']
    },
    'windows-11': {
        type: 'windows',
        version: '11',
        kernel: 'NT 10.0',
        arch: 'x64',
        features: ['wsl2', 'hyper-v', 'defender']
    },
    'android-14': {
        type: 'android',
        version: '14',
        kernel: 'Linux 5.15',
        arch: 'arm64',
        features: ['selinux', 'art', 'bionic']
    }
};

// ============================================================================
// OS EMULATOR
// ============================================================================

export class OSEmulator extends EventEmitter {
    private static instance: OSEmulator;
    private currentProfile: OSProfile;
    private processes: Map<number, EmulatedProcess> = new Map();
    private filesystem: Map<string, VirtualFile> = new Map();
    private nextPid: number = 1;
    private nextFd: number = 3; // 0, 1, 2 reserved for stdin, stdout, stderr

    private constructor() {
        super();
        this.currentProfile = OS_PROFILES['ubuntu-22.04'];
        this.initializeFilesystem();
        console.log('🖥️ OS Emulator initialized');
    }

    static getInstance(): OSEmulator {
        if (!OSEmulator.instance) {
            OSEmulator.instance = new OSEmulator();
        }
        return OSEmulator.instance;
    }

    // ========================================================================
    // OS PROFILE MANAGEMENT
    // ========================================================================

    setProfile(profileName: string): boolean {
        if (OS_PROFILES[profileName]) {
            this.currentProfile = OS_PROFILES[profileName];
            this.emit('profile-changed', this.currentProfile);
            return true;
        }
        return false;
    }

    getProfile(): OSProfile {
        return { ...this.currentProfile };
    }

    getAvailableProfiles(): string[] {
        return Object.keys(OS_PROFILES);
    }

    // ========================================================================
    // PROCESS MANAGEMENT
    // ========================================================================

    createProcess(name: string, parentPid: number = 0): EmulatedProcess {
        const pid = this.nextPid++;
        const process: EmulatedProcess = {
            pid,
            name,
            state: 'created',
            parentPid,
            uid: 1000,
            gid: 1000,
            memory: {
                heap: 0,
                stack: 8 * 1024 * 1024, // 8MB stack
                shared: 0,
                virtual: 0,
                resident: 0,
                limit: 256 * 1024 * 1024 // 256MB
            },
            fds: new Map([
                [0, { fd: 0, path: '/dev/stdin', mode: 'r', offset: 0, flags: 0 }],
                [1, { fd: 1, path: '/dev/stdout', mode: 'w', offset: 0, flags: 0 }],
                [2, { fd: 2, path: '/dev/stderr', mode: 'w', offset: 0, flags: 0 }]
            ]),
            env: new Map([
                ['PATH', '/usr/local/bin:/usr/bin:/bin'],
                ['HOME', '/home/user'],
                ['USER', 'user'],
                ['SHELL', '/bin/bash']
            ]),
            cwd: '/home/user',
            startTime: Date.now(),
            cpuTime: 0
        };

        this.processes.set(pid, process);
        this.emit('process-created', process);
        return process;
    }

    runProcess(pid: number): boolean {
        const process = this.processes.get(pid);
        if (process && process.state === 'created') {
            process.state = 'running';
            this.emit('process-started', process);
            return true;
        }
        return false;
    }

    terminateProcess(pid: number, exitCode: number = 0): boolean {
        const process = this.processes.get(pid);
        if (process) {
            process.state = 'terminated';
            this.emit('process-terminated', { process, exitCode });
            return true;
        }
        return false;
    }

    getProcess(pid: number): EmulatedProcess | undefined {
        return this.processes.get(pid);
    }

    listProcesses(): EmulatedProcess[] {
        return Array.from(this.processes.values());
    }

    // ========================================================================
    // SYSCALL EMULATION
    // ========================================================================

    syscall(name: string, pid: number, ...args: any[]): SyscallResult {
        const process = this.processes.get(pid);
        if (!process) {
            return { success: false, returnValue: -1, errno: 3, error: 'ESRCH: No such process' };
        }

        switch (name) {
            case 'open':
                return this.sysOpen(process, args[0], args[1]);
            case 'close':
                return this.sysClose(process, args[0]);
            case 'read':
                return this.sysRead(process, args[0], args[1]);
            case 'write':
                return this.sysWrite(process, args[0], args[1]);
            case 'stat':
                return this.sysStat(args[0]);
            case 'mkdir':
                return this.sysMkdir(args[0], args[1]);
            case 'getpid':
                return { success: true, returnValue: pid };
            case 'getppid':
                return { success: true, returnValue: process.parentPid };
            case 'fork':
                return this.sysFork(process);
            default:
                return { success: false, returnValue: -1, errno: 38, error: 'ENOSYS: Function not implemented' };
        }
    }

    private sysOpen(process: EmulatedProcess, path: string, mode: string): SyscallResult {
        const file = this.filesystem.get(path);
        if (!file && mode !== 'w' && mode !== 'rw') {
            return { success: false, returnValue: -1, errno: 2, error: 'ENOENT: No such file' };
        }

        const fd = this.nextFd++;
        process.fds.set(fd, {
            fd,
            path,
            mode: mode as 'r' | 'w' | 'rw',
            offset: 0,
            flags: 0
        });

        return { success: true, returnValue: fd };
    }

    private sysClose(process: EmulatedProcess, fd: number): SyscallResult {
        if (process.fds.has(fd)) {
            process.fds.delete(fd);
            return { success: true, returnValue: 0 };
        }
        return { success: false, returnValue: -1, errno: 9, error: 'EBADF: Bad file descriptor' };
    }

    private sysRead(process: EmulatedProcess, fd: number, size: number): SyscallResult {
        const descriptor = process.fds.get(fd);
        if (!descriptor) {
            return { success: false, returnValue: -1, errno: 9, error: 'EBADF' };
        }

        const file = this.filesystem.get(descriptor.path);
        if (!file) {
            return { success: false, returnValue: -1, errno: 2, error: 'ENOENT' };
        }

        // Simulate read
        return { success: true, returnValue: Math.min(size, file.size - descriptor.offset) };
    }

    private sysWrite(process: EmulatedProcess, fd: number, data: string): SyscallResult {
        const descriptor = process.fds.get(fd);
        if (!descriptor) {
            return { success: false, returnValue: -1, errno: 9, error: 'EBADF' };
        }

        // Handle stdout/stderr
        if (fd === 1 || fd === 2) {
            this.emit('process-output', { pid: process.pid, fd, data });
            return { success: true, returnValue: data.length };
        }

        return { success: true, returnValue: data.length };
    }

    private sysStat(path: string): SyscallResult {
        const file = this.filesystem.get(path);
        if (!file) {
            return { success: false, returnValue: -1, errno: 2, error: 'ENOENT' };
        }
        return { success: true, returnValue: 0 };
    }

    private sysMkdir(path: string, mode: number): SyscallResult {
        if (this.filesystem.has(path)) {
            return { success: false, returnValue: -1, errno: 17, error: 'EEXIST' };
        }

        this.filesystem.set(path, {
            path,
            content: '',
            mode: mode || 0o755,
            uid: 1000,
            gid: 1000,
            size: 0,
            atime: Date.now(),
            mtime: Date.now(),
            ctime: Date.now(),
            isDirectory: true
        });

        return { success: true, returnValue: 0 };
    }

    private sysFork(parent: EmulatedProcess): SyscallResult {
        const child = this.createProcess(parent.name, parent.pid);
        child.env = new Map(parent.env);
        child.cwd = parent.cwd;
        return { success: true, returnValue: child.pid };
    }

    // ========================================================================
    // FILESYSTEM
    // ========================================================================

    private initializeFilesystem(): void {
        const defaultDirs = [
            '/', '/bin', '/usr', '/usr/bin', '/usr/local', '/usr/local/bin',
            '/home', '/home/user', '/tmp', '/var', '/var/log', '/etc', '/dev'
        ];

        defaultDirs.forEach(dir => {
            this.filesystem.set(dir, {
                path: dir,
                content: '',
                mode: 0o755,
                uid: 0,
                gid: 0,
                size: 0,
                atime: Date.now(),
                mtime: Date.now(),
                ctime: Date.now(),
                isDirectory: true
            });
        });

        // Add device files
        ['/dev/null', '/dev/zero', '/dev/stdin', '/dev/stdout', '/dev/stderr'].forEach(dev => {
            this.filesystem.set(dev, {
                path: dev,
                content: '',
                mode: 0o666,
                uid: 0,
                gid: 0,
                size: 0,
                atime: Date.now(),
                mtime: Date.now(),
                ctime: Date.now(),
                isDirectory: false
            });
        });
    }

    createFile(path: string, content: string | Buffer, mode: number = 0o644): boolean {
        this.filesystem.set(path, {
            path,
            content,
            mode,
            uid: 1000,
            gid: 1000,
            size: typeof content === 'string' ? content.length : content.length,
            atime: Date.now(),
            mtime: Date.now(),
            ctime: Date.now(),
            isDirectory: false
        });
        return true;
    }

    readFile(path: string): string | Buffer | null {
        const file = this.filesystem.get(path);
        return file ? file.content : null;
    }

    deleteFile(path: string): boolean {
        return this.filesystem.delete(path);
    }

    listDirectory(path: string): string[] {
        const results: string[] = [];
        for (const [filePath] of this.filesystem) {
            if (filePath.startsWith(path) && filePath !== path) {
                const relative = filePath.slice(path.length).replace(/^\//, '');
                const name = relative.split('/')[0];
                if (name && !results.includes(name)) {
                    results.push(name);
                }
            }
        }
        return results;
    }
}

export const osEmulator = OSEmulator.getInstance();
