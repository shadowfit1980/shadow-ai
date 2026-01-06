/**
 * API Client Generator
 * 
 * Generate type-safe API clients from OpenAPI/Swagger specs
 * or from existing backend code.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    operationId: string;
    summary?: string;
    requestBody?: {
        type: string;
        required: boolean;
    };
    parameters?: Array<{
        name: string;
        in: 'path' | 'query' | 'header';
        type: string;
        required: boolean;
    }>;
    response: {
        type: string;
    };
}

export interface APISpec {
    baseUrl: string;
    endpoints: APIEndpoint[];
    types: Record<string, Record<string, string>>;
}

export type ClientTarget = 'typescript' | 'javascript' | 'dart' | 'kotlin' | 'swift' | 'python';

// ============================================================================
// API CLIENT GENERATOR
// ============================================================================

export class APIClientGenerator extends EventEmitter {
    private static instance: APIClientGenerator;

    private constructor() {
        super();
    }

    static getInstance(): APIClientGenerator {
        if (!APIClientGenerator.instance) {
            APIClientGenerator.instance = new APIClientGenerator();
        }
        return APIClientGenerator.instance;
    }

    // ========================================================================
    // CLIENT GENERATION
    // ========================================================================

    /**
     * Generate API client
     */
    generate(spec: APISpec, target: ClientTarget): string {
        switch (target) {
            case 'typescript':
                return this.generateTypeScriptClient(spec);
            case 'dart':
                return this.generateDartClient(spec);
            case 'kotlin':
                return this.generateKotlinClient(spec);
            case 'swift':
                return this.generateSwiftClient(spec);
            case 'python':
                return this.generatePythonClient(spec);
            default:
                return this.generateTypeScriptClient(spec);
        }
    }

    private generateTypeScriptClient(spec: APISpec): string {
        let code = `// Generated API Client
// Base URL: ${spec.baseUrl}

const BASE_URL = '${spec.baseUrl}';

// Types
`;

        // Generate types
        for (const [typeName, fields] of Object.entries(spec.types)) {
            code += `export interface ${typeName} {\n`;
            for (const [fieldName, fieldType] of Object.entries(fields)) {
                code += `  ${fieldName}: ${fieldType};\n`;
            }
            code += `}\n\n`;
        }

        // API Client class
        code += `class APIClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.headers['Authorization'] = \`Bearer \${token}\`;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${path}\`, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }

`;

        // Generate methods
        for (const endpoint of spec.endpoints) {
            const methodName = endpoint.operationId || this.toMethodName(endpoint.method, endpoint.path);
            const params = endpoint.parameters || [];
            const pathParams = params.filter(p => p.in === 'path');
            const queryParams = params.filter(p => p.in === 'query');

            let args: string[] = [];
            pathParams.forEach(p => args.push(`${p.name}: ${p.type}`));
            if (endpoint.requestBody) {
                args.push(`data: ${endpoint.requestBody.type}`);
            }
            if (queryParams.length > 0) {
                args.push(`query?: { ${queryParams.map(p => `${p.name}?: ${p.type}`).join('; ')} }`);
            }

            let pathExpr = endpoint.path;
            pathParams.forEach(p => {
                pathExpr = pathExpr.replace(`{${p.name}}`, `\${${p.name}}`);
            });

            code += `  async ${methodName}(${args.join(', ')}): Promise<${endpoint.response.type}> {
    let path = \`${pathExpr}\`;
${queryParams.length > 0 ? `    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => v && params.append(k, String(v)));
      if (params.toString()) path += \`?\${params}\`;
    }
` : ''}    return this.request('${endpoint.method}', path${endpoint.requestBody ? ', data' : ''});
  }

`;
        }

        code += `}

export const apiClient = new APIClient();
export default apiClient;
`;

        return code;
    }

    private generateDartClient(spec: APISpec): string {
        let code = `// Generated API Client for Dart/Flutter
import 'dart:convert';
import 'package:http/http.dart' as http;

const String baseUrl = '${spec.baseUrl}';

`;

        // Generate models
        for (const [typeName, fields] of Object.entries(spec.types)) {
            code += `class ${typeName} {
${Object.entries(fields).map(([name, type]) => `  final ${this.toDartType(type)} ${name};`).join('\n')}

  ${typeName}({${Object.keys(fields).map(name => `required this.${name}`).join(', ')}});

  factory ${typeName}.fromJson(Map<String, dynamic> json) {
    return ${typeName}(
${Object.entries(fields).map(([name, type]) => `      ${name}: json['${name}'] as ${this.toDartType(type)},`).join('\n')}
    );
  }

  Map<String, dynamic> toJson() => {
${Object.keys(fields).map(name => `    '${name}': ${name},`).join('\n')}
  };
}

`;
        }

        // API Client
        code += `class APIClient {
  String _baseUrl;
  Map<String, String> _headers = {'Content-Type': 'application/json'};

  APIClient({String? baseUrl}) : _baseUrl = baseUrl ?? '${spec.baseUrl}';

  void setAuthToken(String token) {
    _headers['Authorization'] = 'Bearer \$token';
  }

  Future<dynamic> _request(String method, String path, {dynamic body}) async {
    final uri = Uri.parse('\$_baseUrl\$path');
    late http.Response response;

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: _headers);
        break;
      case 'POST':
        response = await http.post(uri, headers: _headers, body: jsonEncode(body));
        break;
      case 'PUT':
        response = await http.put(uri, headers: _headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: _headers);
        break;
    }

    if (response.statusCode >= 400) {
      throw Exception('API Error: \${response.statusCode}');
    }

    return jsonDecode(response.body);
  }

`;

        // Generate methods
        for (const endpoint of spec.endpoints) {
            const methodName = endpoint.operationId || this.toMethodName(endpoint.method, endpoint.path);
            const params = endpoint.parameters?.filter(p => p.in === 'path') || [];

            let args = params.map(p => `${this.toDartType(p.type)} ${p.name}`);
            if (endpoint.requestBody) {
                args.push(`${endpoint.requestBody.type} data`);
            }

            let pathExpr = endpoint.path;
            params.forEach(p => {
                pathExpr = pathExpr.replace(`{${p.name}}`, `\$${p.name}`);
            });

            code += `  Future<${endpoint.response.type}> ${methodName}(${args.join(', ')}) async {
    final result = await _request('${endpoint.method}', '${pathExpr}'${endpoint.requestBody ? ', body: data.toJson()' : ''});
    return ${endpoint.response.type}.fromJson(result);
  }

`;
        }

        code += `}

final apiClient = APIClient();
`;

        return code;
    }

    private generateKotlinClient(spec: APISpec): string {
        return `// Generated API Client for Kotlin/Android
package com.example.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

object APIClient {
    private const val BASE_URL = "${spec.baseUrl}"
    private var authToken: String? = null

    fun setAuthToken(token: String) {
        authToken = token
    }

${spec.endpoints.map(endpoint => {
            const methodName = endpoint.operationId || this.toMethodName(endpoint.method, endpoint.path);
            return `    suspend fun ${methodName}() = withContext(Dispatchers.IO) {
        // TODO: Implement ${endpoint.method} ${endpoint.path}
    }`;
        }).join('\n\n')}
}
`;
    }

    private generateSwiftClient(spec: APISpec): string {
        return `// Generated API Client for Swift/iOS
import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL = "${spec.baseUrl}"
    private var authToken: String?

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    private func request<T: Codable>(
        method: String,
        path: String,
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw APIError.httpError
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}

enum APIError: Error {
    case invalidURL
    case httpError
}
`;
    }

    private generatePythonClient(spec: APISpec): string {
        return `# Generated API Client for Python
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass

BASE_URL = "${spec.baseUrl}"

class APIClient:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.headers = {"Content-Type": "application/json"}

    def set_auth_token(self, token: str):
        self.headers["Authorization"] = f"Bearer {token}"

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        response = requests.request(method, url, headers=self.headers, **kwargs)
        response.raise_for_status()
        return response.json()

${spec.endpoints.map(endpoint => {
            const methodName = endpoint.operationId || this.toMethodName(endpoint.method, endpoint.path);
            return `    def ${methodName.replace(/([A-Z])/g, '_$1').toLowerCase()}(self):
        return self._request("${endpoint.method}", "${endpoint.path}")`;
        }).join('\n\n')}


api_client = APIClient()
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private toMethodName(method: string, path: string): string {
        const parts = path.split('/').filter(p => p && !p.startsWith('{'));
        const name = parts.map((p, i) => i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join('');

        const prefix = {
            GET: 'get',
            POST: 'create',
            PUT: 'update',
            PATCH: 'patch',
            DELETE: 'delete',
        }[method] || 'fetch';

        return prefix + name.charAt(0).toUpperCase() + name.slice(1);
    }

    private toDartType(type: string): string {
        const map: Record<string, string> = {
            string: 'String',
            number: 'int',
            boolean: 'bool',
            object: 'Map<String, dynamic>',
        };
        return map[type] || type;
    }

    /**
     * Save client to file
     */
    async saveClient(spec: APISpec, target: ClientTarget, outputPath: string): Promise<string> {
        const code = this.generate(spec, target);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, code);

        this.emit('client:generated', { target, path: outputPath });
        return outputPath;
    }
}

// Export singleton
export const apiClientGenerator = APIClientGenerator.getInstance();
