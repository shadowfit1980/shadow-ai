/**
 * Mystic Delta Encoding
 */
import { EventEmitter } from 'events';
export class MysticDeltaEncoding extends EventEmitter {
    private static instance: MysticDeltaEncoding;
    private constructor() { super(); }
    static getInstance(): MysticDeltaEncoding { if (!MysticDeltaEncoding.instance) { MysticDeltaEncoding.instance = new MysticDeltaEncoding(); } return MysticDeltaEncoding.instance; }
    encode(data: number[]): number[] { if (data.length === 0) return []; const result = [data[0]]; for (let i = 1; i < data.length; i++) result.push(data[i] - data[i - 1]); return result; }
    decode(deltas: number[]): number[] { if (deltas.length === 0) return []; const result = [deltas[0]]; for (let i = 1; i < deltas.length; i++) result.push(result[i - 1] + deltas[i]); return result; }
    encodeDouble(data: number[]): number[] { return this.encode(this.encode(data)); }
    decodeDouble(data: number[]): number[] { return this.decode(this.decode(data)); }
    xorEncode(data: number[]): number[] { if (data.length === 0) return []; const result = [data[0]]; for (let i = 1; i < data.length; i++) result.push(data[i] ^ data[i - 1]); return result; }
    xorDecode(encoded: number[]): number[] { if (encoded.length === 0) return []; const result = [encoded[0]]; for (let i = 1; i < encoded.length; i++) result.push(result[i - 1] ^ encoded[i]); return result; }
}
export const mysticDeltaEncoding = MysticDeltaEncoding.getInstance();
