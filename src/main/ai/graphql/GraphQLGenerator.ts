/**
 * GraphQL Generator
 * 
 * Generate GraphQL schemas, resolvers, and client code.
 */

import { EventEmitter } from 'events';

interface GraphQLType {
    name: string;
    fields: { name: string; type: string; nullable?: boolean }[];
}

export class GraphQLGenerator extends EventEmitter {
    private static instance: GraphQLGenerator;

    private constructor() { super(); }

    static getInstance(): GraphQLGenerator {
        if (!GraphQLGenerator.instance) {
            GraphQLGenerator.instance = new GraphQLGenerator();
        }
        return GraphQLGenerator.instance;
    }

    generateSchema(types: GraphQLType[]): string {
        let schema = '';
        for (const type of types) {
            const fields = type.fields.map(f => `  ${f.name}: ${f.type}${f.nullable ? '' : '!'}`).join('\n');
            schema += `type ${type.name} {\n${fields}\n}\n\n`;
        }

        // Add Query type
        schema += `type Query {\n${types.map(t => `  ${t.name.toLowerCase()}s: [${t.name}!]!\n  ${t.name.toLowerCase()}(id: ID!): ${t.name}`).join('\n')}\n}\n\n`;

        // Add Mutation type
        schema += `type Mutation {\n${types.map(t => `  create${t.name}(input: Create${t.name}Input!): ${t.name}!\n  update${t.name}(id: ID!, input: Update${t.name}Input!): ${t.name}\n  delete${t.name}(id: ID!): Boolean!`).join('\n')}\n}`;

        return schema;
    }

    generateResolvers(types: GraphQLType[]): string {
        const resolvers = types.map(t => {
            const name = t.name.toLowerCase();
            return `  ${name}s: async () => db.${name}.findMany(),
  ${name}: async (_: any, { id }: { id: string }) => db.${name}.findUnique({ where: { id } }),`;
        }).join('\n');

        const mutations = types.map(t => {
            const name = t.name.toLowerCase();
            return `  create${t.name}: async (_: any, { input }: any) => db.${name}.create({ data: input }),
  update${t.name}: async (_: any, { id, input }: any) => db.${name}.update({ where: { id }, data: input }),
  delete${t.name}: async (_: any, { id }: { id: string }) => { await db.${name}.delete({ where: { id } }); return true; },`;
        }).join('\n');

        return `const resolvers = {\n  Query: {\n${resolvers}\n  },\n  Mutation: {\n${mutations}\n  },\n};\n\nexport default resolvers;`;
    }

    generateApolloClient(): string {
        return `import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql' }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});

export default client;`;
    }

    generateQueryHook(typeName: string, fields: string[]): string {
        const fieldList = fields.join('\n      ');
        return `import { gql, useQuery, useMutation } from '@apollo/client';

const GET_${typeName.toUpperCase()}S = gql\`
  query Get${typeName}s {
    ${typeName.toLowerCase()}s {
      id
      ${fieldList}
    }
  }
\`;

const CREATE_${typeName.toUpperCase()} = gql\`
  mutation Create${typeName}($input: Create${typeName}Input!) {
    create${typeName}(input: $input) {
      id
      ${fieldList}
    }
  }
\`;

export const use${typeName}s = () => useQuery(GET_${typeName.toUpperCase()}S);
export const useCreate${typeName} = () => useMutation(CREATE_${typeName.toUpperCase()});`;
    }
}

export const graphqlGenerator = GraphQLGenerator.getInstance();
