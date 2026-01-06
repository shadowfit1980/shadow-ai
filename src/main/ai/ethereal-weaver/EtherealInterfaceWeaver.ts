/**
 * Ethereal Interface Weaver
 * 
 * Weaves ethereal interfaces between components, creating
 * ghostly connections that enable seamless communication.
 */

import { EventEmitter } from 'events';

export interface EtherealInterface {
    id: string;
    name: string;
    methods: EtherealMethod[];
    visibility: 'visible' | 'hidden' | 'ghostly';
    strength: number;
}

export interface EtherealMethod {
    name: string;
    signature: string;
    etherealPath: string;
}

export interface InterfaceWeb {
    interfaces: EtherealInterface[];
    connections: InterfaceConnection[];
    coherence: number;
}

export interface InterfaceConnection {
    from: string;
    to: string;
    channel: string;
}

export class EtherealInterfaceWeaver extends EventEmitter {
    private static instance: EtherealInterfaceWeaver;
    private interfaces: Map<string, EtherealInterface> = new Map();
    private connections: InterfaceConnection[] = [];

    private constructor() {
        super();
    }

    static getInstance(): EtherealInterfaceWeaver {
        if (!EtherealInterfaceWeaver.instance) {
            EtherealInterfaceWeaver.instance = new EtherealInterfaceWeaver();
        }
        return EtherealInterfaceWeaver.instance;
    }

    weave(code: string): EtherealInterface {
        const methods = this.extractMethods(code);

        const iface: EtherealInterface = {
            id: `eth_iface_${Date.now()}`,
            name: this.generateName(code),
            methods,
            visibility: methods.length > 5 ? 'visible' : 'ghostly',
            strength: Math.min(1, methods.length * 0.15),
        };

        this.interfaces.set(iface.id, iface);
        this.emit('interface:woven', iface);
        return iface;
    }

    private extractMethods(code: string): EtherealMethod[] {
        const methods: EtherealMethod[] = [];
        const methodMatches = code.matchAll(/(\w+)\s*\([^)]*\)\s*(?::\s*[\w<>[\]]+)?\s*[{;]/g);

        for (const match of methodMatches) {
            const name = match[1];
            if (!['if', 'for', 'while', 'switch', 'function', 'async'].includes(name)) {
                methods.push({
                    name,
                    signature: match[0].replace(/{$/, '').trim(),
                    etherealPath: `/ethereal/${name}`,
                });
            }
        }

        return methods.slice(0, 10);
    }

    private generateName(code: string): string {
        const classMatch = code.match(/class\s+(\w+)/);
        if (classMatch) return `I${classMatch[1]}`;
        const funcMatch = code.match(/function\s+(\w+)/);
        if (funcMatch) return `I${funcMatch[1]}`;
        return `IEthereal${Date.now()}`;
    }

    connect(fromId: string, toId: string): InterfaceConnection | undefined {
        if (!this.interfaces.has(fromId) || !this.interfaces.has(toId)) {
            return undefined;
        }

        const connection: InterfaceConnection = {
            from: fromId,
            to: toId,
            channel: `channel_${Date.now()}`,
        };

        this.connections.push(connection);
        this.emit('connection:established', connection);
        return connection;
    }

    getWeb(): InterfaceWeb {
        const interfaces = Array.from(this.interfaces.values());
        const coherence = interfaces.reduce((s, i) => s + i.strength, 0) / Math.max(1, interfaces.length);

        return { interfaces, connections: this.connections, coherence };
    }

    getStats(): { total: number; totalConnections: number; avgStrength: number } {
        const interfaces = Array.from(this.interfaces.values());
        return {
            total: interfaces.length,
            totalConnections: this.connections.length,
            avgStrength: interfaces.length > 0
                ? interfaces.reduce((s, i) => s + i.strength, 0) / interfaces.length
                : 0,
        };
    }
}

export const etherealInterfaceWeaver = EtherealInterfaceWeaver.getInstance();
