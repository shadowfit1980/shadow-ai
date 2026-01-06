/**
 * Shadow Environment Manager - Type Definitions
 * 
 * Types for environment detection, management, and troubleshooting
 */

// ==================== Environment Info ====================

export interface EnvironmentInfo {
    os: OSInfo;
    node?: RuntimeInfo;
    npm?: PackageManagerInfo;
    yarn?: PackageManagerInfo;
    pnpm?: PackageManagerInfo;
    python?: RuntimeInfo;
    pip?: PackageManagerInfo;
    java?: RuntimeInfo;
    go?: RuntimeInfo;
    rust?: RuntimeInfo;
    docker?: DockerInfo;
    databases: DatabaseInfo[];
    other: ToolInfo[];
}

export interface OSInfo {
    platform: 'darwin' | 'linux' | 'win32';
    distro?: string; // Linux distro
    release: string;
    arch: 'x64' | 'arm64' | 'arm' | 'x32';
    hostname: string;
}

export interface RuntimeInfo {
    name: string;
    version: string;
    path: string;
    installed: boolean;
}

export interface PackageManagerInfo {
    name: string;
    version: string;
    path: string;
    registry?: string;
    installed: boolean;
}

export interface DockerInfo {
    installed: boolean;
    version?: string;
    running: boolean;
    containers: ContainerInfo[];
    images: string[];
    networks: string[];
    volumes: string[];
}

export interface ContainerInfo {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'paused';
    ports: string[];
}

export interface DatabaseInfo {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
    version?: string;
    running: boolean;
    port?: number;
    dataDir?: string;
}

export interface ToolInfo {
    name: string;
    version?: string;
    installed: boolean;
    path?: string;
}

// ==================== Requirements ====================

export interface ProjectRequirements {
    runtime?: RuntimeRequirement;
    packages: PackageRequirement[];
    databases?: DatabaseRequirement[];
    docker?: DockerRequirement;
    env: EnvRequirement[];
    tools: ToolRequirement[];
}

export interface RuntimeRequirement {
    name: 'node' | 'python' | 'java' | 'go' | 'rust';
    version?: string; // Semver range
    minVersion?: string;
}

export interface PackageRequirement {
    name: string;
    version?: string;
    dev?: boolean;
    manager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo';
}

export interface DatabaseRequirement {
    type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
    version?: string;
    port?: number;
}

export interface DockerRequirement {
    services: ServiceConfig[];
    network?: string;
    volumes?: VolumeConfig[];
}

export interface ServiceConfig {
    name: string;
    image: string;
    ports?: string[];
    env?: Record<string, string>;
    volumes?: string[];
    restart?: 'always' | 'unless-stopped' | 'on-failure' | 'no';
}

export interface VolumeConfig {
    name: string;
    driver?: string;
}

export interface EnvRequirement {
    name: string;
    required: boolean;
    default?: string;
    description?: string;
}

export interface ToolRequirement {
    name: string;
    version?: string;
    optional?: boolean;
}

// ==================== Installation ====================

export interface InstallOptions {
    force?: boolean;
    global?: boolean;
    saveDev?: boolean;
    skipVerify?: boolean;
    quiet?: boolean;
}

export interface InstallResult {
    success: boolean;
    package: string;
    version?: string;
    duration: number;
    output?: string;
    error?: string;
}

export interface UninstallResult {
    success: boolean;
    package: string;
    duration: number;
    error?: string;
}

export interface UpgradeResult {
    success: boolean;
    package: string;
    oldVersion: string;
    newVersion: string;
    duration: number;
    error?: string;
}

// ==================== Health & Monitoring ====================

export interface HealthReport {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    issues: Issue[];
    timestamp: Date;
}

export interface HealthCheck {
    id: string;
    name: string;
    category: 'runtime' | 'service' | 'network' | 'disk' | 'permissions';
    status: 'pass' | 'warn' | 'fail';
    message: string;
    autoFixable: boolean;
    fix?: () => Promise<void>;
}

export interface Issue {
    id: string;
    type: IssueType;
    severity: 'critical' | 'major' | 'minor';
    title: string;
    description: string;
    suggestedFix: string;
    autoFixable: boolean;
    affectedComponents: string[];
}

export type IssueType =
    | 'missing_dependency'
    | 'version_mismatch'
    | 'port_conflict'
    | 'permission_denied'
    | 'service_down'
    | 'disk_space'
    | 'network_error'
    | 'configuration_error'
    | 'docker_not_running'
    | 'environment_variable_missing';

// ==================== Diagnosis & Troubleshooting ====================

export interface Diagnosis {
    summary: string;
    issues: Issue[];
    recommendations: Recommendation[];
    systemInfo: EnvironmentInfo;
    timestamp: Date;
}

export interface Recommendation {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    automated: boolean;
}

export interface FixResult {
    success: boolean;
    issue: Issue;
    action: string;
    output?: string;
    error?: string;
    duration: number;
}

// ==================== Docker Specific ====================

export interface DockerConfig {
    services: ServiceConfig[];
    network?: string;
    volumes?: VolumeConfig[];
    composeFile?: string;
}

export interface DockerComposeConfig {
    version: string;
    services: Record<string, any>;
    networks?: Record<string, any>;
    volumes?: Record<string, any>;
}

export interface ContainerCreateOptions {
    name: string;
    image: string;
    env?: Record<string, string>;
    ports?: Record<string, string>;
    volumes?: string[];
    network?: string;
    restart?: string;
    cmd?: string[];
}

// ==================== Setup & Validation ====================

export interface SetupOptions {
    install?: boolean;
    docker?: boolean;
    env?: boolean;
    verify?: boolean;
    force?: boolean;
}

export interface SetupResult {
    success: boolean;
    duration: number;
    installed: string[];
    configured: string[];
    errors: string[];
    warnings: string[];
}

export interface ValidationResult {
    valid: boolean;
    missing: string[];
    outdated: string[];
    conflicts: string[];
    errors: ValidationError[];
}

export interface ValidationError {
    type: 'missing' | 'version' | 'conflict' | 'configuration';
    component: string;
    message: string;
    fix?: string;
}

// ==================== Progress & Events ====================

export interface InstallProgress {
    package: string;
    stage: 'downloading' | 'installing' | 'verifying' | 'complete';
    percentage: number;
    message: string;
}

export interface SetupProgress {
    stage: 'analyzing' | 'installing' | 'configuring' | 'verifying' | 'complete';
    current: number;
    total: number;
    percentage: number;
    message: string;
    currentTask?: string;
}

export type EnvironmentEvent =
    | { type: 'install_start'; package: string }
    | { type: 'install_complete'; package: string; version: string }
    | { type: 'install_failed'; package: string; error: string }
    | { type: 'service_started'; service: string }
    | { type: 'service_stopped'; service: string }
    | { type: 'health_check'; status: 'healthy' | 'unhealthy' }
    | { type: 'issue_detected'; issue: Issue }
    | { type: 'issue_fixed'; issue: Issue };
