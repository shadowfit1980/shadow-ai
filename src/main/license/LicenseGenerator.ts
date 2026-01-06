/**
 * License Generator - Generate license files
 */
import { EventEmitter } from 'events';

const LICENSES: Record<string, string> = {
    MIT: `MIT License\n\nCopyright (c) {{YEAR}} {{AUTHOR}}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...`,
    Apache: `Apache License 2.0\n\nCopyright {{YEAR}} {{AUTHOR}}\n\nLicensed under the Apache License, Version 2.0...`,
    GPL: `GNU General Public License v3.0\n\nCopyright (C) {{YEAR}} {{AUTHOR}}\n\nThis program is free software...`,
    BSD: `BSD 3-Clause License\n\nCopyright (c) {{YEAR}}, {{AUTHOR}}\nAll rights reserved.`,
    ISC: `ISC License\n\nCopyright (c) {{YEAR}}, {{AUTHOR}}\n\nPermission to use, copy, modify...`,
};

export class LicenseGenerator extends EventEmitter {
    private static instance: LicenseGenerator;
    private constructor() { super(); }
    static getInstance(): LicenseGenerator { if (!LicenseGenerator.instance) LicenseGenerator.instance = new LicenseGenerator(); return LicenseGenerator.instance; }

    generate(type: string, author: string, year = new Date().getFullYear().toString()): string {
        const template = LICENSES[type] || LICENSES.MIT;
        return template.replace(/\{\{YEAR\}\}/g, year).replace(/\{\{AUTHOR\}\}/g, author);
    }

    getAvailable(): string[] { return Object.keys(LICENSES); }
}

export function getLicenseGenerator(): LicenseGenerator { return LicenseGenerator.getInstance(); }
