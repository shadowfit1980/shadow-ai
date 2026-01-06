/**
 * Ethereal Keys and Rooms
 */
import { EventEmitter } from 'events';
export class EtherealKeysAndRooms extends EventEmitter {
    private static instance: EtherealKeysAndRooms;
    private constructor() { super(); }
    static getInstance(): EtherealKeysAndRooms { if (!EtherealKeysAndRooms.instance) { EtherealKeysAndRooms.instance = new EtherealKeysAndRooms(); } return EtherealKeysAndRooms.instance; }
    canVisitAllRooms(rooms: number[][]): boolean { const visited = new Set([0]); const stack = [0]; while (stack.length) { const room = stack.pop()!; for (const key of rooms[room]) if (!visited.has(key)) { visited.add(key); stack.push(key); } } return visited.size === rooms.length; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const etherealKeysAndRooms = EtherealKeysAndRooms.getInstance();
