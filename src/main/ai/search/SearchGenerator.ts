/**
 * Search Generator
 * 
 * Generate search functionality with Algolia, Meilisearch,
 * Elasticsearch, and full-text search.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type SearchProvider = 'algolia' | 'meilisearch' | 'elasticsearch' | 'typesense' | 'postgres';

// ============================================================================
// SEARCH GENERATOR
// ============================================================================

export class SearchGenerator extends EventEmitter {
    private static instance: SearchGenerator;

    private constructor() {
        super();
    }

    static getInstance(): SearchGenerator {
        if (!SearchGenerator.instance) {
            SearchGenerator.instance = new SearchGenerator();
        }
        return SearchGenerator.instance;
    }

    // ========================================================================
    // ALGOLIA
    // ========================================================================

    generateAlgolia(): string {
        return `import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!
);

export const algoliaService = {
  // Get index
  getIndex(indexName: string) {
    return client.initIndex(indexName);
  },

  // Index documents
  async indexDocuments(indexName: string, documents: Array<{ objectID: string; [key: string]: any }>) {
    const index = this.getIndex(indexName);
    return index.saveObjects(documents);
  },

  // Update document
  async updateDocument(indexName: string, document: { objectID: string; [key: string]: any }) {
    const index = this.getIndex(indexName);
    return index.partialUpdateObject(document);
  },

  // Delete document
  async deleteDocument(indexName: string, objectID: string) {
    const index = this.getIndex(indexName);
    return index.deleteObject(objectID);
  },

  // Search
  async search(indexName: string, query: string, options?: {
    filters?: string;
    facetFilters?: string[];
    hitsPerPage?: number;
    page?: number;
  }) {
    const index = this.getIndex(indexName);
    return index.search(query, options);
  },

  // Configure index settings
  async configureIndex(indexName: string, settings: {
    searchableAttributes?: string[];
    attributesForFaceting?: string[];
    ranking?: string[];
  }) {
    const index = this.getIndex(indexName);
    return index.setSettings(settings);
  },
};

// React hook with InstantSearch
import { liteClient } from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits, Configure } from 'react-instantsearch';

const searchClient = liteClient(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
);

export function AlgoliaSearch({ indexName }: { indexName: string }) {
  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <Configure hitsPerPage={10} />
      <SearchBox placeholder="Search..." />
      <Hits hitComponent={Hit} />
    </InstantSearch>
  );
}

function Hit({ hit }: { hit: any }) {
  return (
    <div>
      <h3>{hit.title}</h3>
      <p>{hit.description}</p>
    </div>
  );
}
`;
    }

    // ========================================================================
    // MEILISEARCH
    // ========================================================================

    generateMeilisearch(): string {
        return `import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY,
});

export const meilisearchService = {
  // Get or create index
  async getIndex(indexName: string) {
    try {
      return await client.getIndex(indexName);
    } catch {
      return await client.createIndex(indexName, { primaryKey: 'id' });
    }
  },

  // Add documents
  async addDocuments(indexName: string, documents: any[]) {
    const index = await this.getIndex(indexName);
    return index.addDocuments(documents);
  },

  // Update document
  async updateDocuments(indexName: string, documents: any[]) {
    const index = await this.getIndex(indexName);
    return index.updateDocuments(documents);
  },

  // Delete document
  async deleteDocument(indexName: string, id: string | number) {
    const index = await this.getIndex(indexName);
    return index.deleteDocument(id);
  },

  // Search
  async search(indexName: string, query: string, options?: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
    facets?: string[];
  }) {
    const index = await this.getIndex(indexName);
    return index.search(query, options);
  },

  // Configure searchable attributes
  async configureIndex(indexName: string, settings: {
    searchableAttributes?: string[];
    filterableAttributes?: string[];
    sortableAttributes?: string[];
    rankingRules?: string[];
  }) {
    const index = await this.getIndex(indexName);
    return index.updateSettings(settings);
  },
};

// React hook
import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function useMeilisearch(indexName: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await meilisearchService.search(indexName, q);
      setResults(res.hits);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    search(query);
  }, [query, search]);

  return { query, setQuery, results, loading };
}
`;
    }

    // ========================================================================
    // POSTGRES FULL TEXT
    // ========================================================================

    generatePostgresSearch(): string {
        return `import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Full-text search with Prisma
export const postgresSearch = {
  // Search products
  async searchProducts(query: string, options?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }) {
    const { category, minPrice, maxPrice, limit = 20, offset = 0 } = options || {};

    // Using raw SQL for full-text search
    const results = await prisma.$queryRaw\`
      SELECT 
        *,
        ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), 
                plainto_tsquery('english', \${query})) as rank
      FROM products
      WHERE 
        to_tsvector('english', name || ' ' || COALESCE(description, '')) 
        @@ plainto_tsquery('english', \${query})
        \${category ? Prisma.sql\`AND category = \${category}\` : Prisma.empty}
        \${minPrice ? Prisma.sql\`AND price >= \${minPrice}\` : Prisma.empty}
        \${maxPrice ? Prisma.sql\`AND price <= \${maxPrice}\` : Prisma.empty}
      ORDER BY rank DESC
      LIMIT \${limit}
      OFFSET \${offset}
    \`;

    return results;
  },

  // Search with similarity (trigram)
  async searchSimilar(table: string, column: string, query: string, limit = 10) {
    return prisma.$queryRawUnsafe(\`
      SELECT *, similarity(\${column}, $1) as sim
      FROM \${table}
      WHERE similarity(\${column}, $1) > 0.3
      ORDER BY sim DESC
      LIMIT $2
    \`, query, limit);
  },

  // Autocomplete
  async autocomplete(table: string, column: string, prefix: string, limit = 5) {
    return prisma.$queryRawUnsafe(\`
      SELECT DISTINCT \${column}
      FROM \${table}
      WHERE \${column} ILIKE $1
      ORDER BY \${column}
      LIMIT $2
    \`, \`\${prefix}%\`, limit);
  },
};

// Search API routes
import express from 'express';
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q, category, minPrice, maxPrice, page = '1' } = req.query;
  
  const results = await postgresSearch.searchProducts(q as string, {
    category: category as string,
    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    limit: 20,
    offset: (parseInt(page as string) - 1) * 20,
  });

  res.json({ results });
});

router.get('/autocomplete', async (req, res) => {
  const { q, field = 'name' } = req.query;
  const suggestions = await postgresSearch.autocomplete('products', field as string, q as string);
  res.json({ suggestions });
});

export { router as searchRouter };

// Prisma migration for full-text search
/*
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search
CREATE INDEX products_search_idx ON products 
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Create trigram index for similarity search
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);
*/
`;
    }

    // ========================================================================
    // FLUTTER SEARCH
    // ========================================================================

    generateFlutterSearch(): string {
        return `import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';

class SearchService {
  static const String _baseUrl = 'YOUR_API_URL';
  
  static Future<List<dynamic>> search(String query, {
    String? category,
    int page = 1,
  }) async {
    final params = {
      'q': query,
      if (category != null) 'category': category,
      'page': page.toString(),
    };
    
    final uri = Uri.parse('\$_baseUrl/api/search').replace(queryParameters: params);
    final response = await http.get(uri);
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['results'];
    }
    return [];
  }
  
  static Future<List<String>> autocomplete(String prefix) async {
    final uri = Uri.parse('\$_baseUrl/api/autocomplete?q=\$prefix');
    final response = await http.get(uri);
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<String>.from(data['suggestions']);
    }
    return [];
  }
}

// Search Widget
class SearchWidget extends StatefulWidget {
  final Function(List<dynamic>) onResults;
  
  const SearchWidget({super.key, required this.onResults});
  
  @override
  State<SearchWidget> createState() => _SearchWidgetState();
}

class _SearchWidgetState extends State<SearchWidget> {
  final _controller = TextEditingController();
  Timer? _debounce;
  List<String> _suggestions = [];
  bool _loading = false;

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce?.cancel();
    
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      if (query.isEmpty) {
        setState(() => _suggestions = []);
        return;
      }
      
      setState(() => _loading = true);
      
      final suggestions = await SearchService.autocomplete(query);
      setState(() {
        _suggestions = suggestions;
        _loading = false;
      });
    });
  }

  Future<void> _performSearch() async {
    final results = await SearchService.search(_controller.text);
    widget.onResults(results);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: 'Search...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
          ),
          onChanged: _onSearchChanged,
          onSubmitted: (_) => _performSearch(),
        ),
        if (_suggestions.isNotEmpty)
          ListView.builder(
            shrinkWrap: true,
            itemCount: _suggestions.length,
            itemBuilder: (context, index) => ListTile(
              title: Text(_suggestions[index]),
              onTap: () {
                _controller.text = _suggestions[index];
                _performSearch();
              },
            ),
          ),
      ],
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }
}
`;
    }

    generateEnvTemplate(provider: SearchProvider): string {
        switch (provider) {
            case 'algolia':
                return `ALGOLIA_APP_ID=
ALGOLIA_ADMIN_KEY=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=`;
            case 'meilisearch':
                return `MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=`;
            case 'typesense':
                return `TYPESENSE_HOST=
TYPESENSE_API_KEY=`;
            default:
                return '';
        }
    }
}

export const searchGenerator = SearchGenerator.getInstance();
