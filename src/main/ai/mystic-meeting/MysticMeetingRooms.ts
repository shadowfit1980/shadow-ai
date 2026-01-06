/**
 * Mystic Meeting Rooms
 */
import { EventEmitter } from 'events';
export class MysticMeetingRooms extends EventEmitter {
    private static instance: MysticMeetingRooms;
    private constructor() { super(); }
    static getInstance(): MysticMeetingRooms { if (!MysticMeetingRooms.instance) { MysticMeetingRooms.instance = new MysticMeetingRooms(); } return MysticMeetingRooms.instance; }
    canAttendMeetings(intervals: number[][]): boolean { intervals.sort((a, b) => a[0] - b[0]); for (let i = 1; i < intervals.length; i++) { if (intervals[i][0] < intervals[i - 1][1]) return false; } return true; }
    minMeetingRooms(intervals: number[][]): number { if (intervals.length === 0) return 0; const starts = intervals.map(i => i[0]).sort((a, b) => a - b); const ends = intervals.map(i => i[1]).sort((a, b) => a - b); let rooms = 0, endPtr = 0; for (let i = 0; i < intervals.length; i++) { if (starts[i] < ends[endPtr]) rooms++; else endPtr++; } return rooms; }
    employeeFreeTime(schedule: number[][][]): number[][] { const intervals: number[][] = schedule.flat(); intervals.sort((a, b) => a[0] - b[0]); const result: number[][] = []; let end = intervals[0][1]; for (const [start, e] of intervals) { if (start > end) result.push([end, start]); end = Math.max(end, e); } return result; }
}
export const mysticMeetingRooms = MysticMeetingRooms.getInstance();
