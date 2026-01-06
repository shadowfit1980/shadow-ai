// API Documentation Generator - Generate API documentation
import Anthropic from '@anthropic-ai/sdk';

interface APIEndpoint {
    method: string;
    path: string;
    summary: string;
    description?: string;
    parameters?: Array<{ name: string; in: string; type: string; required?: boolean; description?: string }>;
    requestBody?: { type: string; example?: unknown };
    responses?: Record<string, { description: string; example?: unknown }>;
}

class APIDocumentationGenerator {
    private anthropic: Anthropic | null = null;

    generateSwaggerUI(title: string, version: string, endpoints: APIEndpoint[]): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title} - API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            spec: ${JSON.stringify(this.generateOpenAPISpec(title, version, endpoints))},
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: 'BaseLayout'
        });
    </script>
</body>
</html>`;
    }

    generateOpenAPISpec(title: string, version: string, endpoints: APIEndpoint[]): object {
        const paths: Record<string, Record<string, unknown>> = {};

        endpoints.forEach(ep => {
            if (!paths[ep.path]) paths[ep.path] = {};
            paths[ep.path][ep.method.toLowerCase()] = {
                summary: ep.summary,
                description: ep.description,
                parameters: ep.parameters?.filter(p => p.in !== 'body'),
                requestBody: ep.requestBody ? {
                    content: { 'application/json': { schema: { type: ep.requestBody.type }, example: ep.requestBody.example } }
                } : undefined,
                responses: ep.responses || { '200': { description: 'Success' } }
            };
        });

        return {
            openapi: '3.0.0',
            info: { title, version, description: `API documentation for ${title}` },
            paths
        };
    }

    generateMarkdownDocs(title: string, endpoints: APIEndpoint[]): string {
        let md = `# ${title} API Documentation\n\n`;
        md += `## Endpoints\n\n`;

        endpoints.forEach(ep => {
            md += `### \`${ep.method.toUpperCase()}\` ${ep.path}\n\n`;
            md += `**${ep.summary}**\n\n`;
            if (ep.description) md += `${ep.description}\n\n`;

            if (ep.parameters?.length) {
                md += `#### Parameters\n\n| Name | In | Type | Required | Description |\n|------|----|----|----------|-------------|\n`;
                ep.parameters.forEach(p => {
                    md += `| ${p.name} | ${p.in} | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description || '-'} |\n`;
                });
                md += '\n';
            }

            if (ep.requestBody) {
                md += `#### Request Body\n\n\`\`\`json\n${JSON.stringify(ep.requestBody.example, null, 2)}\n\`\`\`\n\n`;
            }

            if (ep.responses) {
                md += `#### Responses\n\n`;
                Object.entries(ep.responses).forEach(([code, res]) => {
                    md += `**${code}**: ${res.description}\n`;
                    if (res.example) md += `\`\`\`json\n${JSON.stringify(res.example, null, 2)}\n\`\`\`\n`;
                });
            }
            md += '\n---\n\n';
        });

        return md;
    }

    generatePostmanCollection(title: string, baseUrl: string, endpoints: APIEndpoint[]): string {
        return JSON.stringify({
            info: { name: title, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
            item: endpoints.map(ep => ({
                name: ep.summary,
                request: {
                    method: ep.method.toUpperCase(),
                    url: { raw: `${baseUrl}${ep.path}`, host: [baseUrl], path: ep.path.split('/').filter(Boolean) },
                    body: ep.requestBody ? { mode: 'raw', raw: JSON.stringify(ep.requestBody.example, null, 2), options: { raw: { language: 'json' } } } : undefined
                }
            }))
        }, null, 2);
    }
}

export const apiDocumentationGenerator = new APIDocumentationGenerator();
