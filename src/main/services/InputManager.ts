/**
 * 🎮 Input Manager
 * 
 * Game input handling system:
 * - Keyboard/Mouse/Gamepad
 * - Key bindings
 * - Input buffering
 * - Combo detection
 * - Remapping
 */

import { EventEmitter } from 'events';

export type InputAction = string;
export type InputDevice = 'keyboard' | 'mouse' | 'gamepad';

export interface KeyBinding {
    action: InputAction;
    keys: string[];
    device: InputDevice;
    modifiers?: string[];
}

export interface InputState {
    pressed: Set<string>;
    justPressed: Set<string>;
    justReleased: Set<string>;
    mouse: { x: number; y: number; buttons: number };
    gamepad?: GamepadState;
}

export interface GamepadState {
    leftStick: { x: number; y: number };
    rightStick: { x: number; y: number };
    leftTrigger: number;
    rightTrigger: number;
    buttons: boolean[];
}

export interface ComboInput {
    id: string;
    name: string;
    sequence: string[];
    window: number; // ms between inputs
    action: string;
}

export class InputManager extends EventEmitter {
    private static instance: InputManager;
    private bindings: Map<InputAction, KeyBinding> = new Map();
    private combos: ComboInput[] = [];

    private constructor() {
        super();
        this.initializeDefaultBindings();
        this.initializeDefaultCombos();
    }

    static getInstance(): InputManager {
        if (!InputManager.instance) {
            InputManager.instance = new InputManager();
        }
        return InputManager.instance;
    }

    private initializeDefaultBindings(): void {
        // Movement
        this.bind({ action: 'move_up', keys: ['KeyW', 'ArrowUp'], device: 'keyboard' });
        this.bind({ action: 'move_down', keys: ['KeyS', 'ArrowDown'], device: 'keyboard' });
        this.bind({ action: 'move_left', keys: ['KeyA', 'ArrowLeft'], device: 'keyboard' });
        this.bind({ action: 'move_right', keys: ['KeyD', 'ArrowRight'], device: 'keyboard' });

        // Actions
        this.bind({ action: 'jump', keys: ['Space'], device: 'keyboard' });
        this.bind({ action: 'attack', keys: ['MouseLeft', 'KeyJ'], device: 'keyboard' });
        this.bind({ action: 'block', keys: ['MouseRight', 'KeyK'], device: 'keyboard' });
        this.bind({ action: 'dodge', keys: ['ShiftLeft', 'KeyL'], device: 'keyboard' });
        this.bind({ action: 'interact', keys: ['KeyE', 'KeyF'], device: 'keyboard' });

        // UI
        this.bind({ action: 'pause', keys: ['Escape'], device: 'keyboard' });
        this.bind({ action: 'inventory', keys: ['KeyI', 'Tab'], device: 'keyboard' });
        this.bind({ action: 'map', keys: ['KeyM'], device: 'keyboard' });

        // Combat
        this.bind({ action: 'skill_1', keys: ['Digit1'], device: 'keyboard' });
        this.bind({ action: 'skill_2', keys: ['Digit2'], device: 'keyboard' });
        this.bind({ action: 'skill_3', keys: ['Digit3'], device: 'keyboard' });
        this.bind({ action: 'skill_4', keys: ['Digit4'], device: 'keyboard' });
        this.bind({ action: 'ultimate', keys: ['KeyQ'], device: 'keyboard' });
    }

    private initializeDefaultCombos(): void {
        // Fighting game style combos
        this.combos.push({
            id: 'hadouken',
            name: 'Hadouken',
            sequence: ['move_down', 'move_right', 'attack'],
            window: 300,
            action: 'special_fireball'
        });

        this.combos.push({
            id: 'shoryuken',
            name: 'Shoryuken',
            sequence: ['move_right', 'move_down', 'move_right', 'attack'],
            window: 250,
            action: 'special_uppercut'
        });

        this.combos.push({
            id: 'dodge_attack',
            name: 'Counter Attack',
            sequence: ['dodge', 'attack'],
            window: 500,
            action: 'counter_attack'
        });
    }

    // ========================================================================
    // BINDING MANAGEMENT
    // ========================================================================

    bind(binding: KeyBinding): void {
        this.bindings.set(binding.action, binding);
    }

    unbind(action: InputAction): void {
        this.bindings.delete(action);
    }

    rebind(action: InputAction, newKeys: string[]): boolean {
        const binding = this.bindings.get(action);
        if (!binding) return false;

        binding.keys = newKeys;
        this.emit('rebind', { action, keys: newKeys });
        return true;
    }

    getBinding(action: InputAction): KeyBinding | undefined {
        return this.bindings.get(action);
    }

    getAllBindings(): KeyBinding[] {
        return Array.from(this.bindings.values());
    }

    // ========================================================================
    // COMBO MANAGEMENT
    // ========================================================================

    registerCombo(combo: ComboInput): void {
        this.combos.push(combo);
    }

    getCombos(): ComboInput[] {
        return [...this.combos];
    }

    // ========================================================================
    // CODE GENERATION
    // ========================================================================

    generateInputCode(): string {
        return `
// Input Manager
class InputManager {
    constructor() {
        this.pressed = new Set();
        this.justPressed = new Set();
        this.justReleased = new Set();
        this.mouse = { x: 0, y: 0, buttons: 0 };
        this.bindings = new Map();
        this.inputBuffer = [];
        this.bufferWindow = 300; // ms
        
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', e => {
            if (!this.pressed.has(e.code)) {
                this.justPressed.add(e.code);
                this.pressed.add(e.code);
                this.addToBuffer(e.code);
            }
        });

        window.addEventListener('keyup', e => {
            this.pressed.delete(e.code);
            this.justReleased.add(e.code);
        });

        window.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', e => {
            const btn = \`Mouse\${e.button === 0 ? 'Left' : e.button === 2 ? 'Right' : 'Middle'}\`;
            this.justPressed.add(btn);
            this.pressed.add(btn);
            this.mouse.buttons = e.buttons;
        });

        window.addEventListener('mouseup', e => {
            const btn = \`Mouse\${e.button === 0 ? 'Left' : e.button === 2 ? 'Right' : 'Middle'}\`;
            this.pressed.delete(btn);
            this.justReleased.add(btn);
            this.mouse.buttons = e.buttons;
        });
    }

    bind(action, keys) {
        this.bindings.set(action, keys);
    }

    isPressed(action) {
        const keys = this.bindings.get(action) || [action];
        return keys.some(key => this.pressed.has(key));
    }

    isJustPressed(action) {
        const keys = this.bindings.get(action) || [action];
        return keys.some(key => this.justPressed.has(key));
    }

    isJustReleased(action) {
        const keys = this.bindings.get(action) || [action];
        return keys.some(key => this.justReleased.has(key));
    }

    getAxis(negative, positive) {
        let value = 0;
        if (this.isPressed(negative)) value -= 1;
        if (this.isPressed(positive)) value += 1;
        return value;
    }

    // Input buffering for combos
    addToBuffer(input) {
        this.inputBuffer.push({ input, time: Date.now() });
        this.checkCombos();
    }

    checkCombos() {
        const now = Date.now();
        // Remove old inputs
        this.inputBuffer = this.inputBuffer.filter(i => now - i.time < this.bufferWindow);

        // Check registered combos
        this.combos?.forEach(combo => {
            if (this.matchesCombo(combo)) {
                game.emit('comboExecuted', combo);
                this.inputBuffer = [];
            }
        });
    }

    matchesCombo(combo) {
        if (this.inputBuffer.length < combo.sequence.length) return false;
        
        const recent = this.inputBuffer.slice(-combo.sequence.length);
        return combo.sequence.every((action, i) => {
            const keys = this.bindings.get(action) || [action];
            return keys.includes(recent[i].input);
        });
    }

    update() {
        // Clear frame-specific states
        this.justPressed.clear();
        this.justReleased.clear();
    }

    // Gamepad support
    updateGamepad() {
        const gamepads = navigator.getGamepads();
        if (!gamepads[0]) return;

        const gp = gamepads[0];
        this.gamepad = {
            leftStick: { x: gp.axes[0], y: gp.axes[1] },
            rightStick: { x: gp.axes[2], y: gp.axes[3] },
            leftTrigger: gp.buttons[6]?.value || 0,
            rightTrigger: gp.buttons[7]?.value || 0,
            buttons: gp.buttons.map(b => b.pressed)
        };
    }
}

// Usage
const input = new InputManager();
input.bind('move_up', ['KeyW', 'ArrowUp']);
input.bind('attack', ['MouseLeft', 'KeyJ']);

function gameLoop() {
    if (input.isPressed('move_up')) player.y -= speed;
    if (input.isJustPressed('attack')) player.attack();
    
    input.update();
    requestAnimationFrame(gameLoop);
}`;
    }
}

export const inputManager = InputManager.getInstance();
