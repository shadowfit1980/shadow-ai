// Data Validation Generator - Generate validation schemas
import Anthropic from '@anthropic-ai/sdk';

interface FieldSchema {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
}

class DataValidationGenerator {
    private anthropic: Anthropic | null = null;

    generateZodSchema(name: string, fields: FieldSchema[]): string {
        const fieldDefs = fields.map(f => {
            let def = `  ${f.name}: z.${this.zodType(f.type)}()`;
            if (f.min !== undefined) def += `.min(${f.min})`;
            if (f.max !== undefined) def += `.max(${f.max})`;
            if (f.pattern) def += `.regex(/${f.pattern}/)`;
            if (f.enum) def += `.enum([${f.enum.map(e => `'${e}'`).join(', ')}])`;
            if (!f.required) def += '.optional()';
            return def + ',';
        }).join('\n');

        return `import { z } from 'zod';

export const ${name}Schema = z.object({
${fieldDefs}
});

export type ${name} = z.infer<typeof ${name}Schema>;

export function validate${name}(data: unknown): ${name} {
    return ${name}Schema.parse(data);
}

export function safeParse${name}(data: unknown) {
    return ${name}Schema.safeParse(data);
}
`;
    }

    generateYupSchema(name: string, fields: FieldSchema[]): string {
        const fieldDefs = fields.map(f => {
            let def = `  ${f.name}: yup.${this.yupType(f.type)}()`;
            if (f.required) def += '.required()';
            if (f.min !== undefined) def += `.min(${f.min})`;
            if (f.max !== undefined) def += `.max(${f.max})`;
            if (f.pattern) def += `.matches(/${f.pattern}/)`;
            if (f.enum) def += `.oneOf([${f.enum.map(e => `'${e}'`).join(', ')}])`;
            return def + ',';
        }).join('\n');

        return `import * as yup from 'yup';

export const ${name}Schema = yup.object({
${fieldDefs}
});

export type ${name} = yup.InferType<typeof ${name}Schema>;
`;
    }

    generateJoiSchema(name: string, fields: FieldSchema[]): string {
        const fieldDefs = fields.map(f => {
            let def = `  ${f.name}: Joi.${this.joiType(f.type)}()`;
            if (f.required) def += '.required()';
            if (f.min !== undefined) def += `.min(${f.min})`;
            if (f.max !== undefined) def += `.max(${f.max})`;
            if (f.pattern) def += `.pattern(/${f.pattern}/)`;
            if (f.enum) def += `.valid(${f.enum.map(e => `'${e}'`).join(', ')})`;
            return def + ',';
        }).join('\n');

        return `import Joi from 'joi';

export const ${name}Schema = Joi.object({
${fieldDefs}
});

export function validate${name}(data: unknown) {
    return ${name}Schema.validate(data);
}
`;
    }

    generateClassValidator(name: string, fields: FieldSchema[]): string {
        const fieldDefs = fields.map(f => {
            const decorators: string[] = [];
            if (f.required) decorators.push('@IsNotEmpty()');
            if (f.type === 'string') decorators.push('@IsString()');
            if (f.type === 'number') decorators.push('@IsNumber()');
            if (f.type === 'boolean') decorators.push('@IsBoolean()');
            if (f.type === 'email') decorators.push('@IsEmail()');
            if (f.type === 'url') decorators.push('@IsUrl()');
            if (f.min !== undefined) decorators.push(`@Min(${f.min})`);
            if (f.max !== undefined) decorators.push(`@Max(${f.max})`);
            if (f.pattern) decorators.push(`@Matches(/${f.pattern}/)`);
            if (f.enum) decorators.push(`@IsIn([${f.enum.map(e => `'${e}'`).join(', ')}])`);

            return `  ${decorators.join('\\n  ')}\\n  ${f.name}${f.required ? '' : '?'}: ${this.tsType(f.type)};`;
        }).join('\n\n');

        return `import { IsString, IsNumber, IsBoolean, IsEmail, IsUrl, IsNotEmpty, Min, Max, Matches, IsIn } from 'class-validator';

export class ${name}Dto {
${fieldDefs}
}
`;
    }

    private zodType(type: string): string {
        const map: Record<string, string> = { string: 'string', number: 'number', boolean: 'boolean', array: 'array', object: 'object', email: 'string().email', url: 'string().url', date: 'date' };
        return map[type] || 'string';
    }

    private yupType(type: string): string {
        const map: Record<string, string> = { string: 'string', number: 'number', boolean: 'boolean', array: 'array', object: 'object', email: 'string().email', url: 'string().url', date: 'date' };
        return map[type] || 'string';
    }

    private joiType(type: string): string {
        const map: Record<string, string> = { string: 'string', number: 'number', boolean: 'boolean', array: 'array', object: 'object', email: 'string().email', url: 'string().uri', date: 'date' };
        return map[type] || 'string';
    }

    private tsType(type: string): string {
        const map: Record<string, string> = { string: 'string', number: 'number', boolean: 'boolean', array: 'any[]', object: 'object', email: 'string', url: 'string', date: 'Date' };
        return map[type] || 'string';
    }
}

export const dataValidationGenerator = new DataValidationGenerator();
