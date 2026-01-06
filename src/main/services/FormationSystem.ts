/**
 * 🎖️ Formation System
 * 
 * Group AI formations:
 * - Military formations
 * - Flocking behavior
 * - Squad movement
 */

import { EventEmitter } from 'events';

export type FormationType = 'line' | 'column' | 'wedge' | 'circle' | 'square' | 'scattered';

export interface FormationSlot {
    offsetX: number;
    offsetY: number;
    index: number;
}

export interface Formation {
    type: FormationType;
    slots: FormationSlot[];
    spacing: number;
}

export class FormationSystem extends EventEmitter {
    private static instance: FormationSystem;

    private constructor() { super(); }

    static getInstance(): FormationSystem {
        if (!FormationSystem.instance) {
            FormationSystem.instance = new FormationSystem();
        }
        return FormationSystem.instance;
    }

    getFormation(type: FormationType, count: number, spacing: number = 50): Formation {
        const slots: FormationSlot[] = [];

        switch (type) {
            case 'line':
                for (let i = 0; i < count; i++) {
                    slots.push({ offsetX: (i - (count - 1) / 2) * spacing, offsetY: 0, index: i });
                }
                break;

            case 'column':
                for (let i = 0; i < count; i++) {
                    slots.push({ offsetX: 0, offsetY: i * spacing, index: i });
                }
                break;

            case 'wedge':
                slots.push({ offsetX: 0, offsetY: 0, index: 0 }); // Leader
                for (let i = 1; i < count; i++) {
                    const row = Math.ceil(i / 2);
                    const side = i % 2 === 1 ? 1 : -1;
                    slots.push({ offsetX: side * row * spacing, offsetY: row * spacing, index: i });
                }
                break;

            case 'circle':
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const radius = spacing * Math.max(1, count / 4);
                    slots.push({
                        offsetX: Math.cos(angle) * radius,
                        offsetY: Math.sin(angle) * radius,
                        index: i
                    });
                }
                break;

            case 'square':
                const side = Math.ceil(Math.sqrt(count));
                for (let i = 0; i < count; i++) {
                    const row = Math.floor(i / side);
                    const col = i % side;
                    slots.push({
                        offsetX: (col - (side - 1) / 2) * spacing,
                        offsetY: (row - (side - 1) / 2) * spacing,
                        index: i
                    });
                }
                break;

            case 'scattered':
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * spacing * 2;
                    slots.push({
                        offsetX: Math.cos(angle) * dist,
                        offsetY: Math.sin(angle) * dist,
                        index: i
                    });
                }
                break;
        }

        return { type, slots, spacing };
    }

    generateFormationCode(): string {
        return `
class FormationManager {
    constructor() {
        this.formations = new Map();
    }

    createFormation(leaderX, leaderY, type, count, spacing = 50) {
        const slots = [];

        switch (type) {
            case 'line':
                for (let i = 0; i < count; i++) {
                    slots.push({ 
                        x: leaderX + (i - (count - 1) / 2) * spacing, 
                        y: leaderY 
                    });
                }
                break;

            case 'wedge':
                slots.push({ x: leaderX, y: leaderY });
                for (let i = 1; i < count; i++) {
                    const row = Math.ceil(i / 2);
                    const side = i % 2 === 1 ? 1 : -1;
                    slots.push({ 
                        x: leaderX + side * row * spacing, 
                        y: leaderY + row * spacing 
                    });
                }
                break;

            case 'circle':
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    const radius = spacing * Math.max(1, count / 4);
                    slots.push({
                        x: leaderX + Math.cos(angle) * radius,
                        y: leaderY + Math.sin(angle) * radius
                    });
                }
                break;
        }

        return { slots, leaderX, leaderY, type };
    }

    updateFormation(formation, newLeaderX, newLeaderY, leaderAngle = 0) {
        const cos = Math.cos(leaderAngle);
        const sin = Math.sin(leaderAngle);

        return formation.slots.map((slot, i) => {
            const relX = slot.x - formation.leaderX;
            const relY = slot.y - formation.leaderY;
            
            // Rotate relative position by leader angle
            const rotX = relX * cos - relY * sin;
            const rotY = relX * sin + relY * cos;

            return {
                x: newLeaderX + rotX,
                y: newLeaderY + rotY,
                index: i
            };
        });
    }

    assignUnitsToFormation(units, formation) {
        const assignments = [];
        
        formation.slots.forEach((slot, i) => {
            if (units[i]) {
                assignments.push({
                    unit: units[i],
                    targetX: slot.x,
                    targetY: slot.y
                });
            }
        });

        return assignments;
    }
}`;
    }

    getFormationTypes(): FormationType[] {
        return ['line', 'column', 'wedge', 'circle', 'square', 'scattered'];
    }
}

export const formationSystem = FormationSystem.getInstance();
