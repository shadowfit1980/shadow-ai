/**
 * Cosmic Meeting Rooms
 */
import { EventEmitter } from 'events';
export class CosmicMeetingRooms extends EventEmitter {
    private static instance: CosmicMeetingRooms;
    private constructor() { super(); }
    static getInstance(): CosmicMeetingRooms { if (!CosmicMeetingRooms.instance) { CosmicMeetingRooms.instance = new CosmicMeetingRooms(); } return CosmicMeetingRooms.instance; }
    canAttendMeetings(intervals: number[][]): boolean { intervals.sort((a, b) => a[0] - b[0]); for (let i = 1; i < intervals.length; i++) if (intervals[i][0] < intervals[i - 1][1]) return false; return true; }
    minMeetingRooms(intervals: number[][]): number { const starts = intervals.map(i => i[0]).sort((a, b) => a - b); const ends = intervals.map(i => i[1]).sort((a, b) => a - b); let rooms = 0, endPtr = 0; for (let i = 0; i < starts.length; i++) { if (starts[i] < ends[endPtr]) rooms++; else endPtr++; } return rooms; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const cosmicMeetingRooms = CosmicMeetingRooms.getInstance();
