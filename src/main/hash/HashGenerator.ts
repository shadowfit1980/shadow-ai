/**
 * Hash Generator - Cryptographic hashing
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export class HashGenerator extends EventEmitter {
    private static instance: HashGenerator;
    private constructor() { super(); }
    static getInstance(): HashGenerator { if (!HashGenerator.instance) HashGenerator.instance = new HashGenerator(); return HashGenerator.instance; }

    md5(text: string): string { return crypto.createHash('md5').update(text).digest('hex'); }
    sha1(text: string): string { return crypto.createHash('sha1').update(text).digest('hex'); }
    sha256(text: string): string { return crypto.createHash('sha256').update(text).digest('hex'); }
    sha512(text: string): string { return crypto.createHash('sha512').update(text).digest('hex'); }
    hmac(text: string, key: string, algo = 'sha256'): string { return crypto.createHmac(algo, key).update(text).digest('hex'); }
    bcryptCompare(plain: string, hash: string): boolean { return this.sha256(plain) === hash; }
}

export function getHashGenerator(): HashGenerator { return HashGenerator.getInstance(); }
