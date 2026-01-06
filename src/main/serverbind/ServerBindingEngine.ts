/**
 * Server Binding - Network interface binding
 */
import { EventEmitter } from 'events';

export interface ServerBinding { id: string; host: string; port: number; protocol: 'http' | 'https'; cors: boolean; origins: string[]; active: boolean; }

export class ServerBindingEngine extends EventEmitter {
    private static instance: ServerBindingEngine;
    private bindings: Map<string, ServerBinding> = new Map();
    private constructor() { super(); }
    static getInstance(): ServerBindingEngine { if (!ServerBindingEngine.instance) ServerBindingEngine.instance = new ServerBindingEngine(); return ServerBindingEngine.instance; }

    bind(host: string, port: number, protocol: ServerBinding['protocol'] = 'http', cors = true): ServerBinding {
        const binding: ServerBinding = { id: `bind_${Date.now()}`, host, port, protocol, cors, origins: cors ? ['*'] : [], active: false };
        this.bindings.set(binding.id, binding); return binding;
    }

    async activate(bindingId: string): Promise<boolean> { const b = this.bindings.get(bindingId); if (!b) return false; b.active = true; this.emit('activated', b); return true; }
    async deactivate(bindingId: string): Promise<boolean> { const b = this.bindings.get(bindingId); if (!b) return false; b.active = false; return true; }
    setOrigins(bindingId: string, origins: string[]): boolean { const b = this.bindings.get(bindingId); if (!b) return false; b.origins = origins; return true; }
    getActive(): ServerBinding[] { return Array.from(this.bindings.values()).filter(b => b.active); }
    getAll(): ServerBinding[] { return Array.from(this.bindings.values()); }
}
export function getServerBindingEngine(): ServerBindingEngine { return ServerBindingEngine.getInstance(); }
