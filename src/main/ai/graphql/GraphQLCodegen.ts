/**
 * GraphQL Codegen
 * 
 * Generate GraphQL schemas, resolvers, and clients
 * for various frameworks.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type GraphQLScalarType = 'String' | 'Int' | 'Float' | 'Boolean' | 'ID' | 'DateTime' | 'JSON';

export interface GraphQLField {
    name: string;
    type: string;
    nullable?: boolean;
    list?: boolean;
    description?: string;
    args?: GraphQLArg[];
    directives?: string[];
}

export interface GraphQLArg {
    name: string;
    type: string;
    nullable?: boolean;
    defaultValue?: any;
}

export interface GraphQLType {
    name: string;
    kind: 'type' | 'input' | 'enum' | 'interface' | 'union';
    fields: GraphQLField[];
    description?: string;
    implements?: string[];
    values?: string[]; // For enums
}

export interface GraphQLSchema {
    types: GraphQLType[];
    queries: GraphQLField[];
    mutations: GraphQLField[];
    subscriptions?: GraphQLField[];
}

export type GraphQLFramework = 'apollo' | 'nexus' | 'typegraphql' | 'pothos' | 'graphql-yoga';

// ============================================================================
// GRAPHQL CODEGEN
// ============================================================================

export class GraphQLCodegen extends EventEmitter {
    private static instance: GraphQLCodegen;

    private constructor() {
        super();
    }

    static getInstance(): GraphQLCodegen {
        if (!GraphQLCodegen.instance) {
            GraphQLCodegen.instance = new GraphQLCodegen();
        }
        return GraphQLCodegen.instance;
    }

    // ========================================================================
    // SCHEMA GENERATION
    // ========================================================================

    generateSDL(schema: GraphQLSchema): string {
        let sdl = '';

        // Add scalars
        sdl += `scalar DateTime\nscalar JSON\n\n`;

        // Add types
        for (const type of schema.types) {
            sdl += this.generateTypeSDL(type) + '\n\n';
        }

        // Add Query type
        if (schema.queries.length > 0) {
            sdl += `type Query {\n`;
            for (const query of schema.queries) {
                sdl += `  ${this.generateFieldSDL(query)}\n`;
            }
            sdl += `}\n\n`;
        }

        // Add Mutation type
        if (schema.mutations.length > 0) {
            sdl += `type Mutation {\n`;
            for (const mutation of schema.mutations) {
                sdl += `  ${this.generateFieldSDL(mutation)}\n`;
            }
            sdl += `}\n\n`;
        }

        // Add Subscription type
        if (schema.subscriptions && schema.subscriptions.length > 0) {
            sdl += `type Subscription {\n`;
            for (const sub of schema.subscriptions) {
                sdl += `  ${this.generateFieldSDL(sub)}\n`;
            }
            sdl += `}\n`;
        }

        return sdl;
    }

    private generateTypeSDL(type: GraphQLType): string {
        if (type.description) {
            let sdl = `"""${type.description}"""\n`;
        }

        let sdl = '';

        switch (type.kind) {
            case 'enum':
                sdl += `enum ${type.name} {\n`;
                for (const value of type.values || []) {
                    sdl += `  ${value}\n`;
                }
                sdl += `}`;
                break;

            case 'interface':
                sdl += `interface ${type.name} {\n`;
                for (const field of type.fields) {
                    sdl += `  ${this.generateFieldSDL(field)}\n`;
                }
                sdl += `}`;
                break;

            case 'input':
                sdl += `input ${type.name} {\n`;
                for (const field of type.fields) {
                    sdl += `  ${field.name}: ${this.formatType(field)}\n`;
                }
                sdl += `}`;
                break;

            default:
                const impl = type.implements?.length ? ` implements ${type.implements.join(' & ')}` : '';
                sdl += `type ${type.name}${impl} {\n`;
                for (const field of type.fields) {
                    sdl += `  ${this.generateFieldSDL(field)}\n`;
                }
                sdl += `}`;
        }

        return sdl;
    }

    private generateFieldSDL(field: GraphQLField): string {
        let sdl = '';

        if (field.description) {
            sdl += `"""${field.description}""" `;
        }

        sdl += field.name;

        if (field.args && field.args.length > 0) {
            sdl += '(';
            sdl += field.args.map(arg => {
                let argStr = `${arg.name}: ${arg.nullable ? arg.type : arg.type + '!'}`;
                if (arg.defaultValue !== undefined) {
                    argStr += ` = ${JSON.stringify(arg.defaultValue)}`;
                }
                return argStr;
            }).join(', ');
            sdl += ')';
        }

        sdl += `: ${this.formatType(field)}`;

        if (field.directives) {
            sdl += ' ' + field.directives.join(' ');
        }

        return sdl;
    }

    private formatType(field: GraphQLField): string {
        let type = field.type;
        if (field.list) type = `[${type}!]`;
        if (!field.nullable) type += '!';
        return type;
    }

    // ========================================================================
    // APOLLO SERVER
    // ========================================================================

    generateApolloResolvers(schema: GraphQLSchema): string {
        return `import { Resolvers } from './generated/graphql';

export const resolvers: Resolvers = {
  Query: {
${schema.queries.map(q => `    ${q.name}: async (_, args, context) => {
      // TODO: Implement ${q.name}
      throw new Error('Not implemented');
    },`).join('\n')}
  },
  
  Mutation: {
${schema.mutations.map(m => `    ${m.name}: async (_, args, context) => {
      // TODO: Implement ${m.name}
      throw new Error('Not implemented');
    },`).join('\n')}
  },
  
${schema.types.filter(t => t.kind === 'type').map(type => `  ${type.name}: {
${type.fields.filter(f => !this.isScalar(f.type)).map(f => `    ${f.name}: async (parent, _, context) => {
      // TODO: Resolve ${f.name}
      return parent.${f.name};
    },`).join('\n')}
  },`).join('\n\n')}
};
`;
    }

    generateApolloServer(schema: GraphQLSchema): string {
        return `import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { resolvers } from './resolvers';

const typeDefs = \`
${this.generateSDL(schema)}
\`;

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.headers.authorization,
      }),
    }),
  );

  app.listen(4000, () => {
    console.log('Server running at http://localhost:4000/graphql');
  });
}

startServer();
`;
    }

    // ========================================================================
    // POTHOS (SCHEMA BUILDER)
    // ========================================================================

    generatePothos(schema: GraphQLSchema): string {
        return `import SchemaBuilder from '@pothos/core';

const builder = new SchemaBuilder({});

${schema.types.map(type => {
            if (type.kind === 'enum') {
                return `export const ${type.name} = builder.enumType('${type.name}', {
  values: ${JSON.stringify(type.values)} as const,
});`;
            }
            return `builder.objectType('${type.name}', {
  description: '${type.description || ''}',
  fields: (t) => ({
${type.fields.map(f => `    ${f.name}: t.${this.getPothosFieldType(f)}({ ${f.nullable ? '' : 'nullable: false,'} }),`).join('\n')}
  }),
});`;
        }).join('\n\n')}

builder.queryType({
  fields: (t) => ({
${schema.queries.map(q => `    ${q.name}: t.field({
      type: ${this.getPothosType(q)},
      ${q.args?.length ? `args: {\n${q.args.map(a => `        ${a.name}: t.arg.${this.getPothosArgType(a.type)}({ required: ${!a.nullable} }),`).join('\n')}\n      },` : ''}
      resolve: async (root, args, ctx) => {
        // TODO: Implement
      },
    }),`).join('\n')}
  }),
});

builder.mutationType({
  fields: (t) => ({
${schema.mutations.map(m => `    ${m.name}: t.field({
      type: ${this.getPothosType(m)},
      ${m.args?.length ? `args: {\n${m.args.map(a => `        ${a.name}: t.arg.${this.getPothosArgType(a.type)}({ required: ${!a.nullable} }),`).join('\n')}\n      },` : ''}
      resolve: async (root, args, ctx) => {
        // TODO: Implement
      },
    }),`).join('\n')}
  }),
});

export const schema = builder.toSchema();
`;
    }

    private getPothosFieldType(field: GraphQLField): string {
        const type = field.type.toLowerCase();
        if (field.list) return 'stringList';
        if (this.isScalar(field.type)) return type;
        return 'field';
    }

    private getPothosType(field: GraphQLField): string {
        if (field.list) return `['${field.type}']`;
        return `'${field.type}'`;
    }

    private getPothosArgType(type: string): string {
        const lower = type.toLowerCase();
        if (['string', 'int', 'float', 'boolean', 'id'].includes(lower)) {
            return lower;
        }
        return 'string';
    }

    // ========================================================================
    // CLIENT GENERATION
    // ========================================================================

    generateReactHooks(schema: GraphQLSchema): string {
        return `import { gql, useQuery, useMutation, useSubscription } from '@apollo/client';

// Queries
${schema.queries.map(q => `
export const ${this.toConstName(q.name)}_QUERY = gql\`
  query ${this.toPascalCase(q.name)}${q.args?.length ? `(${q.args.map(a => `$${a.name}: ${a.type}${a.nullable ? '' : '!'}`).join(', ')})` : ''} {
    ${q.name}${q.args?.length ? `(${q.args.map(a => `${a.name}: $${a.name}`).join(', ')})` : ''} {
      id
      # Add more fields
    }
  }
\`;

export function use${this.toPascalCase(q.name)}(${q.args?.map(a => `${a.name}${a.nullable ? '?' : ''}: ${this.toTSType(a.type)}`).join(', ') || ''}) {
  return useQuery(${this.toConstName(q.name)}_QUERY, {
    variables: { ${q.args?.map(a => a.name).join(', ') || ''} },
  });
}
`).join('')}

// Mutations
${schema.mutations.map(m => `
export const ${this.toConstName(m.name)}_MUTATION = gql\`
  mutation ${this.toPascalCase(m.name)}${m.args?.length ? `(${m.args.map(a => `$${a.name}: ${a.type}${a.nullable ? '' : '!'}`).join(', ')})` : ''} {
    ${m.name}${m.args?.length ? `(${m.args.map(a => `${a.name}: $${a.name}`).join(', ')})` : ''} {
      id
      # Add more fields
    }
  }
\`;

export function use${this.toPascalCase(m.name)}() {
  return useMutation(${this.toConstName(m.name)}_MUTATION);
}
`).join('')}
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private isScalar(type: string): boolean {
        return ['String', 'Int', 'Float', 'Boolean', 'ID', 'DateTime', 'JSON'].includes(type);
    }

    private toPascalCase(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private toConstName(str: string): string {
        return str.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
    }

    private toTSType(gqlType: string): string {
        const map: Record<string, string> = {
            'String': 'string',
            'Int': 'number',
            'Float': 'number',
            'Boolean': 'boolean',
            'ID': 'string',
        };
        return map[gqlType] || 'unknown';
    }

    // ========================================================================
    // FROM PRISMA/DB
    // ========================================================================

    fromPrismaSchema(prismaSchema: string): GraphQLSchema {
        const types: GraphQLType[] = [];
        const queries: GraphQLField[] = [];
        const mutations: GraphQLField[] = [];

        // Parse Prisma models
        const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
        let match;

        while ((match = modelRegex.exec(prismaSchema)) !== null) {
            const modelName = match[1];
            const fieldsBlock = match[2];

            const fields: GraphQLField[] = [];
            const fieldRegex = /(\w+)\s+(\w+)(\?)?/g;
            let fieldMatch;

            while ((fieldMatch = fieldRegex.exec(fieldsBlock)) !== null) {
                const [, name, type, optional] = fieldMatch;
                if (name.startsWith('@') || name === 'model') continue;

                fields.push({
                    name,
                    type: this.prismaToGraphQL(type),
                    nullable: !!optional,
                });
            }

            types.push({
                name: modelName,
                kind: 'type',
                fields,
            });

            // Add CRUD queries
            const lower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            queries.push({ name: lower, type: modelName, nullable: true, args: [{ name: 'id', type: 'ID', nullable: false }] });
            queries.push({ name: `${lower}s`, type: modelName, list: true, args: [] });

            // Add CRUD mutations
            mutations.push({
                name: `create${modelName}`,
                type: modelName,
                args: fields.filter(f => f.name !== 'id').map(f => ({ name: f.name, type: f.type, nullable: f.nullable })),
            });
            mutations.push({
                name: `update${modelName}`,
                type: modelName,
                args: [{ name: 'id', type: 'ID', nullable: false }, ...fields.filter(f => f.name !== 'id').map(f => ({ name: f.name, type: f.type, nullable: true }))],
            });
            mutations.push({
                name: `delete${modelName}`,
                type: modelName,
                args: [{ name: 'id', type: 'ID', nullable: false }],
            });
        }

        return { types, queries, mutations };
    }

    private prismaToGraphQL(type: string): string {
        const map: Record<string, string> = {
            'String': 'String',
            'Int': 'Int',
            'Float': 'Float',
            'Boolean': 'Boolean',
            'DateTime': 'DateTime',
            'Json': 'JSON',
        };
        return map[type] || type;
    }
}

export const graphqlCodegen = GraphQLCodegen.getInstance();
