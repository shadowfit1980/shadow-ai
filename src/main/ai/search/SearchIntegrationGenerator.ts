/**
 * Search Integration Generator
 * 
 * Generate search integrations for Elasticsearch,
 * Algolia, MeiliSearch, and Typesense.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type SearchProvider = 'elasticsearch' | 'algolia' | 'meilisearch' | 'typesense';

// ============================================================================
// SEARCH INTEGRATION GENERATOR
// ============================================================================

export class SearchIntegrationGenerator extends EventEmitter {
    private static instance: SearchIntegrationGenerator;

    private constructor() {
        super();
    }

    static getInstance(): SearchIntegrationGenerator {
        if (!SearchIntegrationGenerator.instance) {
            SearchIntegrationGenerator.instance = new SearchIntegrationGenerator();
        }
        return SearchIntegrationGenerator.instance;
    }

    // ========================================================================
    // ELASTICSEARCH
    // ========================================================================

    generateElasticsearch(): string {
        return `import { Client } from '@elastic/elasticsearch';

const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD!,
    },
});

export interface SearchDocument {
    id: string;
    [key: string]: any;
}

// Create index
export async function createIndex(indexName: string) {
    await client.indices.create({
        index: indexName,
        body: {
            settings: {
                number_of_shards: 1,
                number_of_replicas: 1,
                analysis: {
                    analyzer: {
                        autocomplete: {
                            tokenizer: 'autocomplete',
                            filter: ['lowercase'],
                        },
                    },
                    tokenizer: {
                        autocomplete: {
                            type: 'edge_ngram',
                            min_gram: 2,
                            max_gram: 10,
                            token_chars: ['letter', 'digit'],
                        },
                    },
                },
            },
        },
    });
}

// Index document
export async function indexDocument(indexName: string, doc: SearchDocument) {
    await client.index({
        index: indexName,
        id: doc.id,
        document: doc,
    });
}

// Bulk index
export async function bulkIndex(indexName: string, docs: SearchDocument[]) {
    const body = docs.flatMap(doc => [
        { index: { _index: indexName, _id: doc.id } },
        doc,
    ]);
    
    await client.bulk({ body });
}

// Search
export async function search(indexName: string, query: string, options: {
    from?: number;
    size?: number;
    fields?: string[];
} = {}) {
    const result = await client.search({
        index: indexName,
        from: options.from || 0,
        size: options.size || 10,
        query: {
            multi_match: {
                query,
                fields: options.fields || ['*'],
                fuzziness: 'AUTO',
            },
        },
    });
    
    return {
        total: (result.hits.total as any).value,
        hits: result.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            ...hit._source,
        })),
    };
}

// Autocomplete search
export async function autocomplete(indexName: string, query: string, field: string = 'title') {
    const result = await client.search({
        index: indexName,
        size: 10,
        query: {
            match: {
                [field]: {
                    query,
                    analyzer: 'autocomplete',
                },
            },
        },
    });
    
    return result.hits.hits.map(hit => hit._source);
}

// Delete document
export async function deleteDocument(indexName: string, id: string) {
    await client.delete({
        index: indexName,
        id,
    });
}

// Update document
export async function updateDocument(indexName: string, id: string, doc: Partial<SearchDocument>) {
    await client.update({
        index: indexName,
        id,
        doc,
    });
}

// Aggregation search
export async function aggregateSearch(indexName: string, field: string) {
    const result = await client.search({
        index: indexName,
        size: 0,
        aggs: {
            group_by_field: {
                terms: {
                    field: \`\${field}.keyword\`,
                    size: 10,
                },
            },
        },
    });
    
    return result.aggregations?.group_by_field as any;
}
`;
    }

    // ========================================================================
    // ALGOLIA
    // ========================================================================

    generateAlgolia(): string {
        return `import algoliasearch from 'algoliasearch';

const client = algoliasearch(
    process.env.ALGOLIA_APP_ID!,
    process.env.ALGOLIA_API_KEY!
);

export interface SearchRecord {
    objectID: string;
    [key: string]: any;
}

// Get index
export function getIndex(indexName: string) {
    return client.initIndex(indexName);
}

// Add objects
export async function addObjects(indexName: string, objects: SearchRecord[]) {
    const index = getIndex(indexName);
    await index.saveObjects(objects);
}

// Update objects
export async function updateObjects(indexName: string, objects: Partial<SearchRecord>[]) {
    const index = getIndex(indexName);
    await index.partialUpdateObjects(objects);
}

// Delete objects
export async function deleteObjects(indexName: string, objectIDs: string[]) {
    const index = getIndex(indexName);
    await index.deleteObjects(objectIDs);
}

// Search
export async function search(indexName: string, query: string, options?: {
    hitsPerPage?: number;
    page?: number;
    filters?: string;
    facets?: string[];
}) {
    const index = getIndex(indexName);
    return await index.search(query, {
        hitsPerPage: options?.hitsPerPage || 20,
        page: options?.page || 0,
        filters: options?.filters,
        facets: options?.facets,
    });
}

// Faceted search
export async function facetedSearch(indexName: string, query: string, facets: string[]) {
    const index = getIndex(indexName);
    return await index.search(query, {
        facets,
        maxValuesPerFacet: 10,
    });
}

// Configure index settings
export async function configureIndex(indexName: string) {
    const index = getIndex(indexName);
    await index.setSettings({
        searchableAttributes: ['title', 'description', 'content'],
        attributesForFaceting: ['category', 'tags'],
        customRanking: ['desc(popularity)', 'desc(rating)'],
        ranking: [
            'typo',
            'geo',
            'words',
            'filters',
            'proximity',
            'attribute',
            'exact',
            'custom',
        ],
    });
}

// Browse all objects
export async function browseAll(indexName: string) {
    const index = getIndex(indexName);
    const objects: SearchRecord[] = [];
    
    await index.browseObjects({
        query: '',
        batch: (batch) => {
            objects.push(...batch);
        },
    });
    
    return objects;
}
`;
    }

    // ========================================================================
    // MEILISEARCH
    // ========================================================================

    generateMeiliSearch(): string {
        return `import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
});

// Create index
export async function createIndex(indexName: string, primaryKey: string = 'id') {
    await client.createIndex(indexName, { primaryKey });
}

// Add documents
export async function addDocuments(indexName: string, documents: any[]) {
    const index = client.index(indexName);
    await index.addDocuments(documents);
}

// Update documents
export async function updateDocuments(indexName: string, documents: any[]) {
    const index = client.index(indexName);
    await index.updateDocuments(documents);
}

// Delete documents
export async function deleteDocuments(indexName: string, ids: string[]) {
    const index = client.index(indexName);
    await index.deleteDocuments(ids);
}

// Search
export async function search(indexName: string, query: string, options?: {
    limit?: number;
    offset?: number;
    filter?: string[];
    sort?: string[];
    attributesToRetrieve?: string[];
}) {
    const index = client.index(indexName);
    return await index.search(query, {
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        filter: options?.filter,
        sort: options?.sort,
        attributesToRetrieve: options?.attributesToRetrieve,
    });
}

// Configure searchable attributes
export async function configureSearchableAttributes(indexName: string, attributes: string[]) {
    const index = client.index(indexName);
    await index.updateSearchableAttributes(attributes);
}

// Configure filterable attributes
export async function configureFilterableAttributes(indexName: string, attributes: string[]) {
    const index = client.index(indexName);
    await index.updateFilterableAttributes(attributes);
}

// Configure sortable attributes
export async function configureSortableAttributes(indexName: string, attributes: string[]) {
    const index = client.index(indexName);
    await index.updateSortableAttributes(attributes);
}

// Get  search stats
export async function getStats(indexName: string) {
    const index = client.index(indexName);
    return await index.getStats();
}
`;
    }

    // ========================================================================
    // TYPESENSE
    // ========================================================================

    generateTypesense(): string {
        return `import Typesense from 'typesense';

const client = new Typesense.Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT || '8108'),
        protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    }],
    apiKey: process.env.TYPESENSE_API_KEY!,
    connectionTimeoutSeconds: 2,
});

// Create collection
export async function createCollection(collectionName: string, schema: {
    name: string;
    fields: Array<{
        name: string;
        type: 'string' | 'int32' | 'int64' | 'float' | 'bool' | 'string[]';
        facet?: boolean;
        optional?: boolean;
    }>;
}) {
    await client.collections().create(schema);
}

// Index documents
export async function indexDocuments(collectionName: string, documents: any[]) {
    await client.collections(collectionName).documents().import(documents);
}

// Upsert document
export async function upsertDocument(collectionName: string, document: any) {
    await client.collections(collectionName).documents().upsert(document);
}

// Delete document
export async function deleteDocument(collectionName: string, id: string) {
    await client.collections(collectionName).documents(id).delete();
}

// Search
export async function search(collectionName: string, query: string, options?: {
    queryBy: string;
    filterBy?: string;
    sortBy?: string;
    perPage?: number;
    page?: number;
}) {
    return await client.collections(collectionName).documents().search({
        q: query,
        query_by: options?.queryBy || 'title',
        filter_by: options?.filterBy,
        sort_by: options?.sortBy,
        per_page: options?.perPage || 20,
        page: options?.page || 1,
    });
}

// Multi-search
export async function multiSearch(queries: Array<{
    collection: string;
    q: string;
    query_by: string;
}>) {
    return await client.multiSearch.perform({
        searches: queries,
    });
}

// Faceted search
export async function facetedSearch(collectionName: string, query: string, facetBy: string[]) {
    return await client.collections(collectionName).documents().search({
        q: query,
        query_by: 'title,description',
        facet_by: facetBy.join(','),
        max_facet_values: 10,
    });
}

// Get collection
export async function getCollection(collectionName: string) {
    return await client.collections(collectionName).retrieve();
}

// Delete collection
export async function deleteCollection(collectionName: string) {
    await client.collections(collectionName).delete();
}
`;
    }
}

export const searchIntegrationGenerator = SearchIntegrationGenerator.getInstance();
