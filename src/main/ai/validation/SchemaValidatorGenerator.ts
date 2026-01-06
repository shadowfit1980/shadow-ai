/**
 * Schema Validator Generator
 * 
 * Generate validation schemas for Zod, Yup, Joi,
 * and JSON Schema from TypeScript types or examples.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ValidatorLibrary = 'zod' | 'yup' | 'joi' | 'json-schema' | 'class-validator';

export interface FieldDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'uuid' | 'enum' | 'array' | 'object';
    required?: boolean;
    nullable?: boolean;
    default?: any;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
    items?: FieldDefinition; // for arrays
    properties?: FieldDefinition[]; // for objects
    description?: string;
}

export interface SchemaDefinition {
    name: string;
    description?: string;
    fields: FieldDefinition[];
}

// ============================================================================
// SCHEMA VALIDATOR GENERATOR
// ============================================================================

export class SchemaValidatorGenerator extends EventEmitter {
    private static instance: SchemaValidatorGenerator;

    private constructor() {
        super();
    }

    static getInstance(): SchemaValidatorGenerator {
        if (!SchemaValidatorGenerator.instance) {
            SchemaValidatorGenerator.instance = new SchemaValidatorGenerator();
        }
        return SchemaValidatorGenerator.instance;
    }

    // ========================================================================
    // ZOD GENERATOR
    // ========================================================================

    generateZod(schema: SchemaDefinition): string {
        const imports = "import { z } from 'zod';";

        const schemaCode = `export const ${schema.name}Schema = z.object({
${schema.fields.map(f => `    ${f.name}: ${this.fieldToZod(f)},`).join('\n')}
});

export type ${schema.name} = z.infer<typeof ${schema.name}Schema>;

// Partial schema for updates
export const ${schema.name}UpdateSchema = ${schema.name}Schema.partial();

// Array schema
export const ${schema.name}ArraySchema = z.array(${schema.name}Schema);

// Validation helper
export function validate${schema.name}(data: unknown): ${schema.name} {
    return ${schema.name}Schema.parse(data);
}

export function safeParse${schema.name}(data: unknown) {
    return ${schema.name}Schema.safeParse(data);
}`;

        return `${imports}\n\n${schemaCode}`;
    }

    private fieldToZod(field: FieldDefinition): string {
        let zodType = this.getZodType(field);

        // Add constraints
        if (field.minLength !== undefined) zodType += `.min(${field.minLength})`;
        if (field.maxLength !== undefined) zodType += `.max(${field.maxLength})`;
        if (field.min !== undefined) zodType += `.min(${field.min})`;
        if (field.max !== undefined) zodType += `.max(${field.max})`;
        if (field.pattern) zodType += `.regex(/${field.pattern}/)`;
        if (field.nullable) zodType += '.nullable()';
        if (!field.required) zodType += '.optional()';
        if (field.default !== undefined) zodType += `.default(${JSON.stringify(field.default)})`;
        if (field.description) zodType += `.describe('${field.description}')`;

        return zodType;
    }

    private getZodType(field: FieldDefinition): string {
        switch (field.type) {
            case 'string': return 'z.string()';
            case 'number': return 'z.number()';
            case 'boolean': return 'z.boolean()';
            case 'date': return 'z.date()';
            case 'email': return 'z.string().email()';
            case 'url': return 'z.string().url()';
            case 'uuid': return 'z.string().uuid()';
            case 'enum': return `z.enum([${field.enum?.map(e => `'${e}'`).join(', ')}])`;
            case 'array':
                if (field.items) {
                    return `z.array(${this.fieldToZod(field.items)})`;
                }
                return 'z.array(z.unknown())';
            case 'object':
                if (field.properties) {
                    return `z.object({ ${field.properties.map(p => `${p.name}: ${this.fieldToZod(p)}`).join(', ')} })`;
                }
                return 'z.object({})';
            default: return 'z.unknown()';
        }
    }

    // ========================================================================
    // YUP GENERATOR
    // ========================================================================

    generateYup(schema: SchemaDefinition): string {
        const imports = "import * as yup from 'yup';";

        const schemaCode = `export const ${schema.name}Schema = yup.object({
${schema.fields.map(f => `    ${f.name}: ${this.fieldToYup(f)},`).join('\n')}
});

export type ${schema.name} = yup.InferType<typeof ${schema.name}Schema>;

// Validation helper
export async function validate${schema.name}(data: unknown): Promise<${schema.name}> {
    return ${schema.name}Schema.validate(data);
}`;

        return `${imports}\n\n${schemaCode}`;
    }

    private fieldToYup(field: FieldDefinition): string {
        let yupType = this.getYupType(field);

        // Add constraints
        if (field.minLength !== undefined) yupType += `.min(${field.minLength})`;
        if (field.maxLength !== undefined) yupType += `.max(${field.maxLength})`;
        if (field.min !== undefined) yupType += `.min(${field.min})`;
        if (field.max !== undefined) yupType += `.max(${field.max})`;
        if (field.pattern) yupType += `.matches(/${field.pattern}/)`;
        if (field.nullable) yupType += '.nullable()';
        if (field.required) yupType += ".required()";
        if (field.default !== undefined) yupType += `.default(${JSON.stringify(field.default)})`;

        return yupType;
    }

    private getYupType(field: FieldDefinition): string {
        switch (field.type) {
            case 'string': return 'yup.string()';
            case 'number': return 'yup.number()';
            case 'boolean': return 'yup.boolean()';
            case 'date': return 'yup.date()';
            case 'email': return 'yup.string().email()';
            case 'url': return 'yup.string().url()';
            case 'uuid': return 'yup.string().uuid()';
            case 'enum': return `yup.string().oneOf([${field.enum?.map(e => `'${e}'`).join(', ')}])`;
            case 'array': return 'yup.array()';
            case 'object': return 'yup.object()';
            default: return 'yup.mixed()';
        }
    }

    // ========================================================================
    // JOI GENERATOR
    // ========================================================================

    generateJoi(schema: SchemaDefinition): string {
        const imports = "import Joi from 'joi';";

        const schemaCode = `export const ${schema.name}Schema = Joi.object({
${schema.fields.map(f => `    ${f.name}: ${this.fieldToJoi(f)},`).join('\n')}
});

export function validate${schema.name}(data: unknown) {
    return ${schema.name}Schema.validate(data);
}`;

        return `${imports}\n\n${schemaCode}`;
    }

    private fieldToJoi(field: FieldDefinition): string {
        let joiType = this.getJoiType(field);

        // Add constraints
        if (field.minLength !== undefined) joiType += `.min(${field.minLength})`;
        if (field.maxLength !== undefined) joiType += `.max(${field.maxLength})`;
        if (field.min !== undefined) joiType += `.min(${field.min})`;
        if (field.max !== undefined) joiType += `.max(${field.max})`;
        if (field.pattern) joiType += `.pattern(/${field.pattern}/)`;
        if (field.required) joiType += '.required()';
        if (field.nullable) joiType += '.allow(null)';
        if (field.default !== undefined) joiType += `.default(${JSON.stringify(field.default)})`;

        return joiType;
    }

    private getJoiType(field: FieldDefinition): string {
        switch (field.type) {
            case 'string': return 'Joi.string()';
            case 'number': return 'Joi.number()';
            case 'boolean': return 'Joi.boolean()';
            case 'date': return 'Joi.date()';
            case 'email': return 'Joi.string().email()';
            case 'url': return 'Joi.string().uri()';
            case 'uuid': return 'Joi.string().guid()';
            case 'enum': return `Joi.string().valid(${field.enum?.map(e => `'${e}'`).join(', ')})`;
            case 'array': return 'Joi.array()';
            case 'object': return 'Joi.object()';
            default: return 'Joi.any()';
        }
    }

    // ========================================================================
    // JSON SCHEMA GENERATOR
    // ========================================================================

    generateJSONSchema(schema: SchemaDefinition): object {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        for (const field of schema.fields) {
            properties[field.name] = this.fieldToJSONSchema(field);
            if (field.required) {
                required.push(field.name);
            }
        }

        return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: schema.name,
            description: schema.description,
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            additionalProperties: false,
        };
    }

    private fieldToJSONSchema(field: FieldDefinition): object {
        const schema: any = {};

        switch (field.type) {
            case 'string':
            case 'email':
            case 'url':
            case 'uuid':
                schema.type = 'string';
                if (field.type === 'email') schema.format = 'email';
                if (field.type === 'url') schema.format = 'uri';
                if (field.type === 'uuid') schema.format = 'uuid';
                break;
            case 'number':
                schema.type = 'number';
                break;
            case 'boolean':
                schema.type = 'boolean';
                break;
            case 'date':
                schema.type = 'string';
                schema.format = 'date-time';
                break;
            case 'enum':
                schema.type = 'string';
                schema.enum = field.enum;
                break;
            case 'array':
                schema.type = 'array';
                if (field.items) {
                    schema.items = this.fieldToJSONSchema(field.items);
                }
                break;
            case 'object':
                schema.type = 'object';
                if (field.properties) {
                    schema.properties = {};
                    for (const prop of field.properties) {
                        schema.properties[prop.name] = this.fieldToJSONSchema(prop);
                    }
                }
                break;
        }

        if (field.minLength !== undefined) schema.minLength = field.minLength;
        if (field.maxLength !== undefined) schema.maxLength = field.maxLength;
        if (field.min !== undefined) schema.minimum = field.min;
        if (field.max !== undefined) schema.maximum = field.max;
        if (field.pattern) schema.pattern = field.pattern;
        if (field.default !== undefined) schema.default = field.default;
        if (field.description) schema.description = field.description;
        if (field.nullable) schema.nullable = true;

        return schema;
    }

    // ========================================================================
    // CLASS-VALIDATOR GENERATOR
    // ========================================================================

    generateClassValidator(schema: SchemaDefinition): string {
        const decorators = new Set<string>();

        const classCode = schema.fields.map(f => {
            const decs = this.getClassValidatorDecorators(f);
            decs.forEach(d => decorators.add(d.split('(')[0]));
            return `    ${decs.join('\n    ')}\n    ${f.name}${f.required ? '' : '?'}: ${this.getTSType(f)};`;
        }).join('\n\n');

        const imports = `import { ${Array.from(decorators).join(', ')} } from 'class-validator';`;

        return `${imports}

export class ${schema.name} {
${classCode}
}

// Validation helper
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export async function validate${schema.name}(data: any): Promise<{ isValid: boolean; errors: ValidationError[] }> {
    const instance = plainToClass(${schema.name}, data);
    const errors = await validate(instance);
    return { isValid: errors.length === 0, errors };
}`;
    }

    private getClassValidatorDecorators(field: FieldDefinition): string[] {
        const decorators: string[] = [];

        if (!field.required) decorators.push('@IsOptional()');
        if (field.nullable) decorators.push('@IsOptional()');

        switch (field.type) {
            case 'string':
                decorators.push('@IsString()');
                break;
            case 'number':
                decorators.push('@IsNumber()');
                break;
            case 'boolean':
                decorators.push('@IsBoolean()');
                break;
            case 'date':
                decorators.push('@IsDate()');
                break;
            case 'email':
                decorators.push('@IsEmail()');
                break;
            case 'url':
                decorators.push('@IsUrl()');
                break;
            case 'uuid':
                decorators.push('@IsUUID()');
                break;
            case 'enum':
                decorators.push(`@IsIn([${field.enum?.map(e => `'${e}'`).join(', ')}])`);
                break;
            case 'array':
                decorators.push('@IsArray()');
                break;
            case 'object':
                decorators.push('@IsObject()');
                break;
        }

        if (field.minLength !== undefined) decorators.push(`@MinLength(${field.minLength})`);
        if (field.maxLength !== undefined) decorators.push(`@MaxLength(${field.maxLength})`);
        if (field.min !== undefined) decorators.push(`@Min(${field.min})`);
        if (field.max !== undefined) decorators.push(`@Max(${field.max})`);
        if (field.pattern) decorators.push(`@Matches(/${field.pattern}/)`);

        return decorators;
    }

    private getTSType(field: FieldDefinition): string {
        switch (field.type) {
            case 'string':
            case 'email':
            case 'url':
            case 'uuid':
                return 'string';
            case 'number':
                return 'number';
            case 'boolean':
                return 'boolean';
            case 'date':
                return 'Date';
            case 'enum':
                return field.enum?.map(e => `'${e}'`).join(' | ') || 'string';
            case 'array':
                return 'any[]';
            case 'object':
                return 'object';
            default:
                return 'unknown';
        }
    }

    // ========================================================================
    // INFER FROM EXAMPLE
    // ========================================================================

    inferSchemaFromJSON(name: string, example: any): SchemaDefinition {
        const fields: FieldDefinition[] = [];

        for (const [key, value] of Object.entries(example)) {
            fields.push(this.inferField(key, value));
        }

        return { name, fields };
    }

    private inferField(name: string, value: any): FieldDefinition {
        const field: FieldDefinition = { name, type: 'string', required: true };

        if (value === null) {
            field.nullable = true;
            return field;
        }

        switch (typeof value) {
            case 'string':
                if (value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    field.type = 'email';
                } else if (value.match(/^https?:\/\//)) {
                    field.type = 'url';
                } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    field.type = 'uuid';
                } else if (!isNaN(Date.parse(value))) {
                    field.type = 'date';
                } else {
                    field.type = 'string';
                }
                break;
            case 'number':
                field.type = 'number';
                break;
            case 'boolean':
                field.type = 'boolean';
                break;
            case 'object':
                if (Array.isArray(value)) {
                    field.type = 'array';
                    if (value.length > 0) {
                        field.items = this.inferField('item', value[0]);
                    }
                } else {
                    field.type = 'object';
                    field.properties = Object.entries(value).map(([k, v]) => this.inferField(k, v));
                }
                break;
        }

        return field;
    }

    // ========================================================================
    // GENERATE ALL
    // ========================================================================

    generateAll(schema: SchemaDefinition): Record<ValidatorLibrary, string | object> {
        return {
            'zod': this.generateZod(schema),
            'yup': this.generateYup(schema),
            'joi': this.generateJoi(schema),
            'json-schema': this.generateJSONSchema(schema),
            'class-validator': this.generateClassValidator(schema),
        };
    }
}

export const schemaValidatorGenerator = SchemaValidatorGenerator.getInstance();
