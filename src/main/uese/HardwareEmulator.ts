/**
 * UESE Hardware Emulator
 * 
 * Simulates hardware behavior including CPU, GPU, memory, storage,
 * sensors, and power management with device profiles.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceClass = 'mobile' | 'desktop' | 'laptop' | 'tablet' | 'server' | 'iot' | 'embedded';
export type CPUArchitecture = 'x64' | 'arm64' | 'arm32' | 'riscv';

export interface DeviceProfile {
    id: string;
    name: string;
    class: DeviceClass;
    cpu: CPUSpec;
    gpu: GPUSpec;
    memory: MemorySpec;
    storage: StorageSpec;
    display: DisplaySpec;
    sensors: SensorSpec[];
    power: PowerSpec;
    network: NetworkSpec;
}

export interface CPUSpec {
    name: string;
    architecture: CPUArchitecture;
    cores: number;
    threads: number;
    baseClockMHz: number;
    turboClockMHz: number;
    cacheL1KB: number;
    cacheL2KB: number;
    cacheL3MB: number;
}

export interface GPUSpec {
    name: string;
    vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'qualcomm';
    vramMB: number;
    shaderCores: number;
    maxClockMHz: number;
    features: string[];
}

export interface MemorySpec {
    totalMB: number;
    type: 'DDR4' | 'DDR5' | 'LPDDR4' | 'LPDDR5';
    speedMHz: number;
    channels: number;
}

export interface StorageSpec {
    type: 'nvme' | 'ssd' | 'hdd' | 'emmc';
    capacityGB: number;
    readMBps: number;
    writeMBps: number;
    iops: number;
}

export interface DisplaySpec {
    width: number;
    height: number;
    refreshHz: number;
    ppi: number;
    hdr: boolean;
    touchscreen: boolean;
}

export interface SensorSpec {
    type: 'accelerometer' | 'gyroscope' | 'magnetometer' | 'gps' | 'camera' | 'microphone' | 'fingerprint' | 'face_id' | 'proximity' | 'ambient_light' | 'barometer';
    available: boolean;
    precision?: number;
}

export interface PowerSpec {
    batteryCapacityMah: number;
    hasBattery: boolean;
    maxWattage: number;
    currentLevel: number;
    isCharging: boolean;
}

export interface NetworkSpec {
    wifi: boolean;
    wifi6: boolean;
    ethernet: boolean;
    cellular: boolean;
    cellular5G: boolean;
    bluetooth: boolean;
}

export interface HardwareMetrics {
    cpuUsage: number[];      // Per-core usage
    gpuUsage: number;
    memoryUsedMB: number;
    storageUsedGB: number;
    temperature: number;
    powerDrawWatts: number;
    batteryLevel: number;
    thermalThrottling: boolean;
}

// ============================================================================
// DEVICE PROFILES
// ============================================================================

const DEVICE_PROFILES: Record<string, DeviceProfile> = {
    'iphone-15-pro': {
        id: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        class: 'mobile',
        cpu: {
            name: 'Apple A17 Pro',
            architecture: 'arm64',
            cores: 6,
            threads: 6,
            baseClockMHz: 3000,
            turboClockMHz: 3780,
            cacheL1KB: 192,
            cacheL2KB: 4096,
            cacheL3MB: 0
        },
        gpu: {
            name: 'Apple A17 Pro GPU',
            vendor: 'apple',
            vramMB: 0, // Unified memory
            shaderCores: 6,
            maxClockMHz: 1400,
            features: ['ray-tracing', 'metal3']
        },
        memory: { totalMB: 8192, type: 'LPDDR5', speedMHz: 6400, channels: 2 },
        storage: { type: 'nvme', capacityGB: 256, readMBps: 3000, writeMBps: 2000, iops: 500000 },
        display: { width: 1179, height: 2556, refreshHz: 120, ppi: 460, hdr: true, touchscreen: true },
        sensors: [
            { type: 'accelerometer', available: true, precision: 0.001 },
            { type: 'gyroscope', available: true, precision: 0.001 },
            { type: 'gps', available: true },
            { type: 'camera', available: true },
            { type: 'face_id', available: true }
        ],
        power: { batteryCapacityMah: 3274, hasBattery: true, maxWattage: 27, currentLevel: 100, isCharging: false },
        network: { wifi: true, wifi6: true, ethernet: false, cellular: true, cellular5G: true, bluetooth: true }
    },
    'pixel-8-pro': {
        id: 'pixel-8-pro',
        name: 'Google Pixel 8 Pro',
        class: 'mobile',
        cpu: {
            name: 'Google Tensor G3',
            architecture: 'arm64',
            cores: 9,
            threads: 9,
            baseClockMHz: 2000,
            turboClockMHz: 3000,
            cacheL1KB: 128,
            cacheL2KB: 2048,
            cacheL3MB: 8
        },
        gpu: {
            name: 'Mali-G715',
            vendor: 'arm' as any,
            vramMB: 0,
            shaderCores: 10,
            maxClockMHz: 890,
            features: ['vulkan']
        },
        memory: { totalMB: 12288, type: 'LPDDR5', speedMHz: 4266, channels: 2 },
        storage: { type: 'nvme', capacityGB: 128, readMBps: 2000, writeMBps: 1500, iops: 400000 },
        display: { width: 1344, height: 2992, refreshHz: 120, ppi: 489, hdr: true, touchscreen: true },
        sensors: [
            { type: 'accelerometer', available: true },
            { type: 'gyroscope', available: true },
            { type: 'gps', available: true },
            { type: 'camera', available: true },
            { type: 'fingerprint', available: true }
        ],
        power: { batteryCapacityMah: 5050, hasBattery: true, maxWattage: 30, currentLevel: 100, isCharging: false },
        network: { wifi: true, wifi6: true, ethernet: false, cellular: true, cellular5G: true, bluetooth: true }
    },
    'macbook-pro-m3': {
        id: 'macbook-pro-m3',
        name: 'MacBook Pro 14" M3 Pro',
        class: 'laptop',
        cpu: {
            name: 'Apple M3 Pro',
            architecture: 'arm64',
            cores: 12,
            threads: 12,
            baseClockMHz: 3000,
            turboClockMHz: 4050,
            cacheL1KB: 192,
            cacheL2KB: 4096,
            cacheL3MB: 24
        },
        gpu: {
            name: 'Apple M3 Pro GPU',
            vendor: 'apple',
            vramMB: 0,
            shaderCores: 18,
            maxClockMHz: 1400,
            features: ['ray-tracing', 'metal3', 'mesh-shaders']
        },
        memory: { totalMB: 18432, type: 'LPDDR5', speedMHz: 6400, channels: 4 },
        storage: { type: 'nvme', capacityGB: 512, readMBps: 7400, writeMBps: 6600, iops: 1000000 },
        display: { width: 3024, height: 1964, refreshHz: 120, ppi: 254, hdr: true, touchscreen: false },
        sensors: [
            { type: 'camera', available: true },
            { type: 'microphone', available: true },
            { type: 'ambient_light', available: true }
        ],
        power: { batteryCapacityMah: 8693, hasBattery: true, maxWattage: 96, currentLevel: 100, isCharging: false },
        network: { wifi: true, wifi6: true, ethernet: false, cellular: false, cellular5G: false, bluetooth: true }
    },
    'gaming-desktop': {
        id: 'gaming-desktop',
        name: 'Gaming Desktop (RTX 4090)',
        class: 'desktop',
        cpu: {
            name: 'Intel Core i9-14900K',
            architecture: 'x64',
            cores: 24,
            threads: 32,
            baseClockMHz: 3200,
            turboClockMHz: 6000,
            cacheL1KB: 2048,
            cacheL2KB: 32768,
            cacheL3MB: 36
        },
        gpu: {
            name: 'NVIDIA GeForce RTX 4090',
            vendor: 'nvidia',
            vramMB: 24576,
            shaderCores: 16384,
            maxClockMHz: 2520,
            features: ['ray-tracing', 'dlss3', 'nvenc', 'cuda']
        },
        memory: { totalMB: 65536, type: 'DDR5', speedMHz: 5600, channels: 4 },
        storage: { type: 'nvme', capacityGB: 2000, readMBps: 7000, writeMBps: 6500, iops: 1200000 },
        display: { width: 3840, height: 2160, refreshHz: 144, ppi: 163, hdr: true, touchscreen: false },
        sensors: [],
        power: { batteryCapacityMah: 0, hasBattery: false, maxWattage: 850, currentLevel: 100, isCharging: false },
        network: { wifi: true, wifi6: true, ethernet: true, cellular: false, cellular5G: false, bluetooth: true }
    },
    'cloud-server': {
        id: 'cloud-server',
        name: 'Cloud Server (AWS c6i.4xlarge)',
        class: 'server',
        cpu: {
            name: 'Intel Xeon Ice Lake',
            architecture: 'x64',
            cores: 16,
            threads: 32,
            baseClockMHz: 2900,
            turboClockMHz: 3500,
            cacheL1KB: 1280,
            cacheL2KB: 20480,
            cacheL3MB: 48
        },
        gpu: {
            name: 'None',
            vendor: 'intel',
            vramMB: 0,
            shaderCores: 0,
            maxClockMHz: 0,
            features: []
        },
        memory: { totalMB: 32768, type: 'DDR4', speedMHz: 3200, channels: 6 },
        storage: { type: 'nvme', capacityGB: 500, readMBps: 4000, writeMBps: 3000, iops: 200000 },
        display: { width: 0, height: 0, refreshHz: 0, ppi: 0, hdr: false, touchscreen: false },
        sensors: [],
        power: { batteryCapacityMah: 0, hasBattery: false, maxWattage: 200, currentLevel: 100, isCharging: false },
        network: { wifi: false, wifi6: false, ethernet: true, cellular: false, cellular5G: false, bluetooth: false }
    }
};

// ============================================================================
// HARDWARE EMULATOR
// ============================================================================

export class HardwareEmulator extends EventEmitter {
    private static instance: HardwareEmulator;
    private currentProfile: DeviceProfile;
    private metrics: HardwareMetrics;
    private isThrottling: boolean = false;

    private constructor() {
        super();
        this.currentProfile = DEVICE_PROFILES['macbook-pro-m3'];
        this.metrics = this.initializeMetrics();
        console.log('🔧 Hardware Emulator initialized');
    }

    static getInstance(): HardwareEmulator {
        if (!HardwareEmulator.instance) {
            HardwareEmulator.instance = new HardwareEmulator();
        }
        return HardwareEmulator.instance;
    }

    private initializeMetrics(): HardwareMetrics {
        return {
            cpuUsage: new Array(this.currentProfile.cpu.cores).fill(0),
            gpuUsage: 0,
            memoryUsedMB: 0,
            storageUsedGB: 0,
            temperature: 35,
            powerDrawWatts: 5,
            batteryLevel: this.currentProfile.power.currentLevel,
            thermalThrottling: false
        };
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    setProfile(profileId: string): boolean {
        if (DEVICE_PROFILES[profileId]) {
            this.currentProfile = DEVICE_PROFILES[profileId];
            this.metrics = this.initializeMetrics();
            this.emit('profile-changed', this.currentProfile);
            return true;
        }
        return false;
    }

    getProfile(): DeviceProfile {
        return { ...this.currentProfile };
    }

    getAvailableProfiles(): string[] {
        return Object.keys(DEVICE_PROFILES);
    }

    // ========================================================================
    // CPU SIMULATION
    // ========================================================================

    simulateCPULoad(loadPercent: number): void {
        const cores = this.currentProfile.cpu.cores;
        this.metrics.cpuUsage = new Array(cores).fill(loadPercent);

        // Temperature increases with load
        this.metrics.temperature = 35 + (loadPercent * 0.5);

        // Power draw increases with load
        const maxPower = this.currentProfile.power.maxWattage;
        this.metrics.powerDrawWatts = 5 + (loadPercent / 100) * maxPower * 0.7;

        // Check for thermal throttling
        if (this.metrics.temperature > 85) {
            this.isThrottling = true;
            this.metrics.thermalThrottling = true;
            this.emit('thermal-throttling', { temperature: this.metrics.temperature });
        } else {
            this.isThrottling = false;
            this.metrics.thermalThrottling = false;
        }

        this.emit('metrics-updated', this.metrics);
    }

    getEffectiveClockSpeed(): number {
        const base = this.currentProfile.cpu.baseClockMHz;
        const turbo = this.currentProfile.cpu.turboClockMHz;
        const avgLoad = this.metrics.cpuUsage.reduce((a, b) => a + b, 0) / this.metrics.cpuUsage.length;

        if (this.isThrottling) {
            return base * 0.8; // 20% reduction under throttling
        }

        // Dynamic frequency scaling
        return base + (turbo - base) * (avgLoad / 100);
    }

    // ========================================================================
    // MEMORY SIMULATION
    // ========================================================================

    allocateMemory(sizeMB: number): boolean {
        const available = this.currentProfile.memory.totalMB - this.metrics.memoryUsedMB;
        if (sizeMB <= available) {
            this.metrics.memoryUsedMB += sizeMB;
            this.emit('memory-allocated', { size: sizeMB, used: this.metrics.memoryUsedMB });
            return true;
        }
        this.emit('memory-exhausted', { requested: sizeMB, available });
        return false;
    }

    freeMemory(sizeMB: number): void {
        this.metrics.memoryUsedMB = Math.max(0, this.metrics.memoryUsedMB - sizeMB);
        this.emit('memory-freed', { size: sizeMB, used: this.metrics.memoryUsedMB });
    }

    getMemoryInfo(): { total: number; used: number; free: number } {
        return {
            total: this.currentProfile.memory.totalMB,
            used: this.metrics.memoryUsedMB,
            free: this.currentProfile.memory.totalMB - this.metrics.memoryUsedMB
        };
    }

    // ========================================================================
    // SENSOR SIMULATION
    // ========================================================================

    getSensorReading(sensorType: SensorSpec['type']): any {
        const sensor = this.currentProfile.sensors.find(s => s.type === sensorType);
        if (!sensor?.available) return null;

        switch (sensorType) {
            case 'accelerometer':
                return { x: Math.random() * 0.1 - 0.05, y: Math.random() * 0.1 - 0.05, z: 9.81 };
            case 'gyroscope':
                return { x: Math.random() * 0.01, y: Math.random() * 0.01, z: Math.random() * 0.01 };
            case 'gps':
                return { latitude: 37.7749 + Math.random() * 0.001, longitude: -122.4194 + Math.random() * 0.001, accuracy: 5 };
            case 'ambient_light':
                return { lux: 500 + Math.random() * 100 };
            case 'proximity':
                return { near: false, distance: 10 };
            default:
                return { available: true };
        }
    }

    getAvailableSensors(): SensorSpec[] {
        return this.currentProfile.sensors.filter(s => s.available);
    }

    // ========================================================================
    // BATTERY SIMULATION
    // ========================================================================

    drainBattery(percent: number): void {
        if (this.currentProfile.power.hasBattery) {
            this.metrics.batteryLevel = Math.max(0, this.metrics.batteryLevel - percent);
            this.emit('battery-level', this.metrics.batteryLevel);

            if (this.metrics.batteryLevel < 5) {
                this.emit('battery-critical', this.metrics.batteryLevel);
            } else if (this.metrics.batteryLevel < 20) {
                this.emit('battery-low', this.metrics.batteryLevel);
            }
        }
    }

    chargeBattery(percent: number): void {
        if (this.currentProfile.power.hasBattery) {
            this.metrics.batteryLevel = Math.min(100, this.metrics.batteryLevel + percent);
            this.emit('battery-level', this.metrics.batteryLevel);
        }
    }

    setBatteryLevel(percent: number): void {
        this.metrics.batteryLevel = Math.max(0, Math.min(100, percent));
    }

    // ========================================================================
    // METRICS
    // ========================================================================

    getMetrics(): HardwareMetrics {
        return { ...this.metrics };
    }

    simulateStress(): void {
        this.simulateCPULoad(95);
        this.metrics.gpuUsage = 90;
        this.metrics.temperature = 92;
        this.metrics.thermalThrottling = true;
        this.emit('stress-test', this.metrics);
    }

    reset(): void {
        this.metrics = this.initializeMetrics();
        this.isThrottling = false;
        this.emit('reset', this.metrics);
    }
}

export const hardwareEmulator = HardwareEmulator.getInstance();
