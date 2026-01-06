/**
 * 🔍 Game State Inspector
 * 
 * Debug game state:
 * - Live state viewing
 * - Property editing
 * - State snapshots
 */

import { EventEmitter } from 'events';

export class GameStateInspector extends EventEmitter {
    private static instance: GameStateInspector;

    private constructor() { super(); }

    static getInstance(): GameStateInspector {
        if (!GameStateInspector.instance) {
            GameStateInspector.instance = new GameStateInspector();
        }
        return GameStateInspector.instance;
    }

    generateInspectorCode(): string {
        return `
class GameStateInspector {
    constructor() {
        this.targets = new Map();
        this.snapshots = [];
        this.maxSnapshots = 50;
        this.autoRefresh = true;
        this.refreshInterval = 100;
        this.visible = false;
        this.panel = null;
        
        this.watchers = [];
        this.breakpoints = [];
    }

    register(name, target) {
        this.targets.set(name, {
            name,
            target,
            expanded: false,
            watched: []
        });
    }

    unregister(name) {
        this.targets.delete(name);
    }

    getState(name) {
        const entry = this.targets.get(name);
        if (!entry) return null;
        return this.serializeObject(entry.target);
    }

    getAllStates() {
        const states = {};
        for (const [name, entry] of this.targets) {
            states[name] = this.serializeObject(entry.target);
        }
        return states;
    }

    serializeObject(obj, depth = 0) {
        if (depth > 5) return '[Max Depth]';
        if (obj === null) return null;
        if (obj === undefined) return undefined;
        
        const type = typeof obj;
        
        if (type === 'function') return '[Function]';
        if (type !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.serializeObject(item, depth + 1));
        }
        
        const result = {};
        for (const key of Object.keys(obj)) {
            try {
                result[key] = this.serializeObject(obj[key], depth + 1);
            } catch (e) {
                result[key] = '[Error]';
            }
        }
        return result;
    }

    setProperty(targetName, path, value) {
        const entry = this.targets.get(targetName);
        if (!entry) return false;
        
        const parts = path.split('.');
        let current = entry.target;
        
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
            if (!current) return false;
        }
        
        current[parts[parts.length - 1]] = value;
        this.onPropertyChanged?.(targetName, path, value);
        return true;
    }

    takeSnapshot(name = null) {
        const snapshot = {
            id: Date.now(),
            name: name || 'Snapshot ' + (this.snapshots.length + 1),
            timestamp: new Date().toISOString(),
            state: this.getAllStates()
        };
        
        this.snapshots.push(snapshot);
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
        
        return snapshot;
    }

    getSnapshot(id) {
        return this.snapshots.find(s => s.id === id);
    }

    compareSnapshots(id1, id2) {
        const s1 = this.getSnapshot(id1);
        const s2 = this.getSnapshot(id2);
        if (!s1 || !s2) return null;
        
        return this.diffObjects(s1.state, s2.state);
    }

    diffObjects(obj1, obj2, path = '') {
        const diffs = [];
        
        const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
        
        for (const key of allKeys) {
            const fullPath = path ? path + '.' + key : key;
            const val1 = obj1?.[key];
            const val2 = obj2?.[key];
            
            if (typeof val1 === 'object' && typeof val2 === 'object') {
                diffs.push(...this.diffObjects(val1, val2, fullPath));
            } else if (val1 !== val2) {
                diffs.push({ path: fullPath, old: val1, new: val2 });
            }
        }
        
        return diffs;
    }

    addWatch(targetName, path) {
        this.watchers.push({ target: targetName, path, lastValue: undefined });
    }

    updateWatchers() {
        for (const watcher of this.watchers) {
            const state = this.getState(watcher.target);
            const value = this.getValueByPath(state, watcher.path);
            
            if (value !== watcher.lastValue) {
                this.onWatchChanged?.(watcher.target, watcher.path, watcher.lastValue, value);
                watcher.lastValue = value;
            }
        }
    }

    getValueByPath(obj, path) {
        return path.split('.').reduce((o, k) => o?.[k], obj);
    }

    addBreakpoint(targetName, path, condition = null) {
        this.breakpoints.push({ target: targetName, path, condition });
    }

    checkBreakpoints() {
        for (const bp of this.breakpoints) {
            const state = this.getState(bp.target);
            const value = this.getValueByPath(state, bp.path);
            
            let shouldBreak = false;
            if (bp.condition) {
                try {
                    shouldBreak = eval(bp.condition.replace('value', JSON.stringify(value)));
                } catch (e) {}
            }
            
            if (shouldBreak) {
                this.onBreakpoint?.(bp, value);
            }
        }
    }

    show() {
        if (this.panel) return;
        
        this.panel = document.createElement('div');
        this.panel.id = 'game-inspector';
        this.panel.style.cssText = \`
            position: fixed;
            right: 10px;
            top: 10px;
            width: 350px;
            max-height: 80vh;
            background: rgba(0,0,0,0.9);
            border: 1px solid #444;
            border-radius: 8px;
            color: #fff;
            font-family: monospace;
            font-size: 12px;
            overflow: auto;
            z-index: 10000;
            padding: 10px;
        \`;
        
        document.body.appendChild(this.panel);
        this.visible = true;
        this.startRefresh();
    }

    hide() {
        if (this.panel) {
            this.panel.remove();
            this.panel = null;
        }
        this.visible = false;
        this.stopRefresh();
    }

    toggle() {
        if (this.visible) this.hide();
        else this.show();
    }

    startRefresh() {
        if (this.refreshTimer) return;
        
        this.refreshTimer = setInterval(() => {
            if (this.visible && this.autoRefresh) {
                this.render();
                this.updateWatchers();
            }
        }, this.refreshInterval);
    }

    stopRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    render() {
        if (!this.panel) return;
        
        let html = '<div style="margin-bottom:10px;font-weight:bold;">🔍 State Inspector</div>';
        
        for (const [name, entry] of this.targets) {
            const state = this.serializeObject(entry.target);
            html += this.renderObject(name, state, 0);
        }
        
        html += '<div style="margin-top:10px;border-top:1px solid #444;padding-top:10px;">';
        html += '<button onclick="inspector.takeSnapshot()">📷 Snapshot</button>';
        html += ' <span>Snapshots: ' + this.snapshots.length + '</span>';
        html += '</div>';
        
        this.panel.innerHTML = html;
    }

    renderObject(key, value, depth) {
        const indent = depth * 15;
        const type = typeof value;
        
        if (value === null) {
            return \`<div style="margin-left:\${indent}px"><span style="color:#888">\${key}:</span> <span style="color:#888">null</span></div>\`;
        }
        
        if (type !== 'object') {
            const color = type === 'number' ? '#6bf' : type === 'string' ? '#f96' : type === 'boolean' ? '#bf6' : '#fff';
            return \`<div style="margin-left:\${indent}px"><span style="color:#888">\${key}:</span> <span style="color:\${color}">\${JSON.stringify(value)}</span></div>\`;
        }
        
        let html = \`<div style="margin-left:\${indent}px;color:#ff0;cursor:pointer">\${key}: {\</div>\`;
        for (const [k, v] of Object.entries(value)) {
            html += this.renderObject(k, v, depth + 1);
        }
        html += \`<div style="margin-left:\${indent}px">}</div>\`;
        
        return html;
    }

    // Callbacks
    onPropertyChanged = null;
    onWatchChanged = null;
    onBreakpoint = null;
}`;
    }
}

export const gameStateInspector = GameStateInspector.getInstance();
