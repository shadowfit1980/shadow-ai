/**
 * Search Engine Generator
 * 
 * Generate search functionality with Elasticsearch, Algolia, or local search.
 */

import { EventEmitter } from 'events';

interface SearchConfig {
    indexName: string;
    fields: string[];
}

export class SearchEngineGenerator extends EventEmitter {
    private static instance: SearchEngineGenerator;

    private constructor() { super(); }

    static getInstance(): SearchEngineGenerator {
        if (!SearchEngineGenerator.instance) {
            SearchEngineGenerator.instance = new SearchEngineGenerator();
        }
        return SearchEngineGenerator.instance;
    }

    generateElasticsearchClient(config: SearchConfig): string {
        return `import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_API_KEY
    ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
    : undefined,
});

const INDEX = '${config.indexName}';

export async function indexDocument(id: string, document: any) {
  await client.index({ index: INDEX, id, document });
  await client.indices.refresh({ index: INDEX });
}

export async function search(query: string, options: { from?: number; size?: number } = {}) {
  const result = await client.search({
    index: INDEX,
    from: options.from || 0,
    size: options.size || 10,
    query: {
      multi_match: {
        query,
        fields: ${JSON.stringify(config.fields)},
        fuzziness: 'AUTO',
      },
    },
  });
  
  return {
    hits: result.hits.hits.map(hit => ({ id: hit._id, score: hit._score, ...hit._source })),
    total: typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value || 0,
  };
}

export async function deleteDocument(id: string) {
  await client.delete({ index: INDEX, id });
}`;
    }

    generateAlgoliaClient(config: SearchConfig): string {
        return `import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_API_KEY!
);

const index = client.initIndex('${config.indexName}');

export async function indexDocument(objectID: string, document: any) {
  await index.saveObject({ objectID, ...document });
}

export async function search(query: string, options: { page?: number; hitsPerPage?: number } = {}) {
  const result = await index.search(query, {
    page: options.page || 0,
    hitsPerPage: options.hitsPerPage || 10,
    attributesToRetrieve: ${JSON.stringify(config.fields)},
  });
  
  return {
    hits: result.hits,
    total: result.nbHits,
    page: result.page,
    totalPages: result.nbPages,
  };
}

export async function deleteDocument(objectID: string) {
  await index.deleteObject(objectID);
}`;
    }

    generateLocalSearch(): string {
        return `interface SearchableItem {
  id: string;
  [key: string]: any;
}

class LocalSearch<T extends SearchableItem> {
  private items: T[] = [];
  private fields: string[];

  constructor(fields: string[]) {
    this.fields = fields;
  }

  index(items: T[]) {
    this.items = items;
  }

  add(item: T) {
    this.items.push(item);
  }

  remove(id: string) {
    this.items = this.items.filter(item => item.id !== id);
  }

  search(query: string, limit = 10): T[] {
    const q = query.toLowerCase();
    const results = this.items
      .map(item => {
        const score = this.fields.reduce((acc, field) => {
          const value = String(item[field] || '').toLowerCase();
          if (value.includes(q)) acc += 1;
          if (value.startsWith(q)) acc += 2;
          if (value === q) acc += 3;
          return acc;
        }, 0);
        return { item, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.item);
    
    return results;
  }
}

export const createSearch = <T extends SearchableItem>(fields: string[]) => new LocalSearch<T>(fields);`;
    }
}

export const searchEngineGenerator = SearchEngineGenerator.getInstance();
