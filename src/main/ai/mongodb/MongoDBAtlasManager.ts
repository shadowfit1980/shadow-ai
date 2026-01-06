/**
 * MongoDB Atlas Manager
 * 
 * Manage MongoDB Atlas clusters, databases,
 * collections, and generate Mongoose schemas.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface MongoSchema {
    name: string;
    fields: MongoField[];
    indexes?: MongoIndex[];
    options?: {
        timestamps?: boolean;
        collection?: string;
        strict?: boolean;
    };
}

export interface MongoField {
    name: string;
    type: MongoFieldType;
    required?: boolean;
    unique?: boolean;
    default?: any;
    ref?: string;
    enum?: string[];
    validate?: string;
    index?: boolean;
    sparse?: boolean;
    select?: boolean;
    immutable?: boolean;
    min?: number;
    max?: number;
    minlength?: number;
    maxlength?: number;
}

export type MongoFieldType =
    | 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId'
    | 'Buffer' | 'Mixed' | 'Array' | 'Decimal128' | 'Map'
    | { type: 'Array'; of: MongoFieldType }
    | { type: 'Object'; properties: MongoField[] };

export interface MongoIndex {
    fields: Record<string, 1 | -1 | 'text' | '2dsphere'>;
    options?: {
        unique?: boolean;
        sparse?: boolean;
        background?: boolean;
        expireAfterSeconds?: number;
        name?: string;
    };
}

export interface AggregationPipeline {
    stages: AggregationStage[];
}

export type AggregationStage =
    | { $match: Record<string, any> }
    | { $group: { _id: any;[key: string]: any } }
    | { $project: Record<string, any> }
    | { $sort: Record<string, 1 | -1> }
    | { $limit: number }
    | { $skip: number }
    | { $lookup: { from: string; localField: string; foreignField: string; as: string } }
    | { $unwind: string | { path: string; preserveNullAndEmptyArrays?: boolean } }
    | { $addFields: Record<string, any> }
    | { $count: string };

// ============================================================================
// MONGODB ATLAS MANAGER
// ============================================================================

export class MongoDBAtlasManager extends EventEmitter {
    private static instance: MongoDBAtlasManager;
    private schemas: Map<string, MongoSchema> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): MongoDBAtlasManager {
        if (!MongoDBAtlasManager.instance) {
            MongoDBAtlasManager.instance = new MongoDBAtlasManager();
        }
        return MongoDBAtlasManager.instance;
    }

    // ========================================================================
    // MONGOOSE SCHEMA GENERATION
    // ========================================================================

    generateMongooseSchema(schema: MongoSchema): string {
        const fields = schema.fields.map(f => this.generateField(f)).join(',\n');
        const indexes = schema.indexes?.map(i => this.generateIndex(i)).join('\n') || '';

        return `import mongoose, { Schema, Document, Model } from 'mongoose';

export interface I${schema.name} extends Document {
${schema.fields.map(f => `  ${f.name}${f.required ? '' : '?'}: ${this.fieldToTSType(f)};`).join('\n')}
${schema.options?.timestamps ? '  createdAt: Date;\n  updatedAt: Date;' : ''}
}

const ${schema.name}Schema = new Schema<I${schema.name}>(
  {
${fields}
  },
  {
    timestamps: ${schema.options?.timestamps ?? true},
    ${schema.options?.collection ? `collection: '${schema.options.collection}',` : ''}
    ${schema.options?.strict !== undefined ? `strict: ${schema.options.strict},` : ''}
  }
);

${indexes}

// Methods
${schema.name}Schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Statics
${schema.name}Schema.statics.findByIdSafe = async function(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return this.findById(id);
};

export const ${schema.name} = mongoose.model<I${schema.name}>('${schema.name}', ${schema.name}Schema);
`;
    }

    private generateField(field: MongoField, indent = 4): string {
        const spaces = ' '.repeat(indent);
        let def = `${spaces}${field.name}: `;

        if (typeof field.type === 'object' && 'of' in field.type) {
            // Array type
            def += `[${this.typeToMongoose(field.type.of)}]`;
        } else if (typeof field.type === 'object' && 'properties' in field.type) {
            // Nested object
            const nested = field.type.properties.map(p => this.generateField(p, indent + 2)).join(',\n');
            def += `{\n${nested}\n${spaces}}`;
        } else {
            // Simple type with options
            const options: string[] = [];
            options.push(`type: ${this.typeToMongoose(field.type)}`);

            if (field.required) options.push('required: true');
            if (field.unique) options.push('unique: true');
            if (field.index) options.push('index: true');
            if (field.sparse) options.push('sparse: true');
            if (field.select === false) options.push('select: false');
            if (field.immutable) options.push('immutable: true');
            if (field.default !== undefined) {
                options.push(`default: ${typeof field.default === 'string' ? `'${field.default}'` : field.default}`);
            }
            if (field.ref) options.push(`ref: '${field.ref}'`);
            if (field.enum) options.push(`enum: [${field.enum.map(e => `'${e}'`).join(', ')}]`);
            if (field.min !== undefined) options.push(`min: ${field.min}`);
            if (field.max !== undefined) options.push(`max: ${field.max}`);
            if (field.minlength !== undefined) options.push(`minlength: ${field.minlength}`);
            if (field.maxlength !== undefined) options.push(`maxlength: ${field.maxlength}`);
            if (field.validate) options.push(`validate: ${field.validate}`);

            if (options.length === 1) {
                def += this.typeToMongoose(field.type as string);
            } else {
                def += `{ ${options.join(', ')} }`;
            }
        }

        return def;
    }

    private typeToMongoose(type: MongoFieldType | string): string {
        if (typeof type === 'string') {
            const types: Record<string, string> = {
                'String': 'String',
                'Number': 'Number',
                'Boolean': 'Boolean',
                'Date': 'Date',
                'ObjectId': 'Schema.Types.ObjectId',
                'Buffer': 'Buffer',
                'Mixed': 'Schema.Types.Mixed',
                'Decimal128': 'Schema.Types.Decimal128',
                'Map': 'Map',
            };
            return types[type] || 'String';
        }
        return 'Schema.Types.Mixed';
    }

    private fieldToTSType(field: MongoField): string {
        if (typeof field.type === 'object' && 'of' in field.type) {
            return `${this.mongoToTSType(field.type.of)}[]`;
        }
        if (typeof field.type === 'object' && 'properties' in field.type) {
            const props = field.type.properties
                .map(p => `${p.name}${p.required ? '' : '?'}: ${this.fieldToTSType(p)}`)
                .join('; ');
            return `{ ${props} }`;
        }
        return this.mongoToTSType(field.type as string);
    }

    private mongoToTSType(type: MongoFieldType | string): string {
        if (typeof type !== 'string') {
            return 'any';
        }
        const types: Record<string, string> = {
            'String': 'string',
            'Number': 'number',
            'Boolean': 'boolean',
            'Date': 'Date',
            'ObjectId': 'mongoose.Types.ObjectId',
            'Buffer': 'Buffer',
            'Mixed': 'any',
            'Decimal128': 'mongoose.Types.Decimal128',
            'Map': 'Map<string, any>',
        };
        return types[type] || 'any';
    }

    private generateIndex(index: MongoIndex): string {
        const fields = JSON.stringify(index.fields);
        const options = index.options ? `, ${JSON.stringify(index.options)}` : '';
        return `${this.schemas.size > 0 ? '' : '// '}Schema.index(${fields}${options});`;
    }

    // ========================================================================
    // AGGREGATION PIPELINE BUILDER
    // ========================================================================

    buildPipeline(): PipelineBuilder {
        return new PipelineBuilder();
    }

    generatePipelineCode(pipeline: AggregationPipeline, collectionName: string): string {
        return `const result = await ${collectionName}.aggregate(${JSON.stringify(pipeline.stages, null, 2)});`;
    }

    // ========================================================================
    // CONNECTION CODE GENERATION
    // ========================================================================

    generateConnectionCode(config: {
        useEnv?: boolean;
        dbName?: string;
        options?: Record<string, any>;
    } = {}): string {
        return `import mongoose from 'mongoose';

const MONGODB_URI = ${config.useEnv ? 'process.env.MONGODB_URI!' : "'mongodb://localhost:27017/myapp'"};

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      ${config.dbName ? `dbName: '${config.dbName}',` : ''}
      ${Object.entries(config.options || {}).map(([k, v]) => `${k}: ${JSON.stringify(v)},`).join('\n      ')}
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
`;
    }

    // ========================================================================
    // CRUD SERVICE GENERATION
    // ========================================================================

    generateCRUDService(schema: MongoSchema): string {
        const name = schema.name;
        const lower = name.charAt(0).toLowerCase() + name.slice(1);

        return `import { ${name}, I${name} } from '../models/${name}';
import mongoose from 'mongoose';

export class ${name}Service {
  async create(data: Partial<I${name}>): Promise<I${name}> {
    const ${lower} = new ${name}(data);
    return ${lower}.save();
  }

  async findById(id: string): Promise<I${name} | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return ${name}.findById(id);
  }

  async findOne(filter: mongoose.FilterQuery<I${name}>): Promise<I${name} | null> {
    return ${name}.findOne(filter);
  }

  async find(
    filter: mongoose.FilterQuery<I${name}> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      select?: string;
      populate?: string | string[];
    } = {}
  ): Promise<I${name}[]> {
    let query = ${name}.find(filter);
    
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.sort) query = query.sort(options.sort);
    if (options.select) query = query.select(options.select);
    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach(path => query = query.populate(path));
      } else {
        query = query.populate(options.populate);
      }
    }
    
    return query.exec();
  }

  async count(filter: mongoose.FilterQuery<I${name}> = {}): Promise<number> {
    return ${name}.countDocuments(filter);
  }

  async update(
    id: string,
    data: Partial<I${name}>
  ): Promise<I${name} | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return ${name}.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }
    const result = await ${name}.findByIdAndDelete(id);
    return !!result;
  }

  async deleteMany(filter: mongoose.FilterQuery<I${name}>): Promise<number> {
    const result = await ${name}.deleteMany(filter);
    return result.deletedCount || 0;
  }

  async exists(filter: mongoose.FilterQuery<I${name}>): Promise<boolean> {
    const result = await ${name}.exists(filter);
    return !!result;
  }

  async aggregate<T = any>(pipeline: mongoose.PipelineStage[]): Promise<T[]> {
    return ${name}.aggregate(pipeline);
  }
}

export const ${lower}Service = new ${name}Service();
`;
    }
}

// ============================================================================
// PIPELINE BUILDER
// ============================================================================

class PipelineBuilder {
    private stages: AggregationStage[] = [];

    match(filter: Record<string, any>): this {
        this.stages.push({ $match: filter });
        return this;
    }

    group(id: any, accumulators: Record<string, any> = {}): this {
        this.stages.push({ $group: { _id: id, ...accumulators } });
        return this;
    }

    project(fields: Record<string, any>): this {
        this.stages.push({ $project: fields });
        return this;
    }

    sort(fields: Record<string, 1 | -1>): this {
        this.stages.push({ $sort: fields });
        return this;
    }

    limit(n: number): this {
        this.stages.push({ $limit: n });
        return this;
    }

    skip(n: number): this {
        this.stages.push({ $skip: n });
        return this;
    }

    lookup(from: string, localField: string, foreignField: string, as: string): this {
        this.stages.push({ $lookup: { from, localField, foreignField, as } });
        return this;
    }

    unwind(path: string, preserveNullAndEmptyArrays = false): this {
        this.stages.push({
            $unwind: preserveNullAndEmptyArrays ? { path, preserveNullAndEmptyArrays } : path
        });
        return this;
    }

    addFields(fields: Record<string, any>): this {
        this.stages.push({ $addFields: fields });
        return this;
    }

    count(field: string): this {
        this.stages.push({ $count: field });
        return this;
    }

    build(): AggregationPipeline {
        return { stages: this.stages };
    }
}

export const mongoDBAtlasManager = MongoDBAtlasManager.getInstance();
