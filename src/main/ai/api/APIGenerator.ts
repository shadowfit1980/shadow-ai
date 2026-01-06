/**
 * API Generator
 * 
 * Generate REST APIs from specifications or database schemas.
 */

import { EventEmitter } from 'events';

interface APIEndpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    params?: { name: string; type: string; required: boolean }[];
    body?: { name: string; type: string }[];
    response: { type: string; example: any };
}

interface GeneratedAPI {
    routes: string;
    controllers: string;
    types: string;
    tests: string;
}

export class APIGenerator extends EventEmitter {
    private static instance: APIGenerator;

    private constructor() { super(); }

    static getInstance(): APIGenerator {
        if (!APIGenerator.instance) {
            APIGenerator.instance = new APIGenerator();
        }
        return APIGenerator.instance;
    }

    generateFromResource(resourceName: string, fields: { name: string; type: string }[]): GeneratedAPI {
        const name = resourceName.toLowerCase();
        const Name = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

        const types = `export interface ${Name} {\n  id: string;\n${fields.map(f => `  ${f.name}: ${f.type};`).join('\n')}\n  createdAt: Date;\n  updatedAt: Date;\n}\n\nexport interface Create${Name}Input {\n${fields.map(f => `  ${f.name}: ${f.type};`).join('\n')}\n}`;

        const routes = `import { Router } from 'express';\nimport { ${name}Controller } from './controllers/${name}.controller';\n\nconst router = Router();\n\nrouter.get('/${name}s', ${name}Controller.getAll);\nrouter.get('/${name}s/:id', ${name}Controller.getById);\nrouter.post('/${name}s', ${name}Controller.create);\nrouter.put('/${name}s/:id', ${name}Controller.update);\nrouter.delete('/${name}s/:id', ${name}Controller.delete);\n\nexport default router;`;

        const controllers = `import { Request, Response } from 'express';\nimport { ${Name} } from '../types/${name}.types';\n\nconst ${name}s: ${Name}[] = [];\n\nexport const ${name}Controller = {\n  async getAll(req: Request, res: Response) {\n    res.json(${name}s);\n  },\n\n  async getById(req: Request, res: Response) {\n    const item = ${name}s.find(x => x.id === req.params.id);\n    if (!item) return res.status(404).json({ error: 'Not found' });\n    res.json(item);\n  },\n\n  async create(req: Request, res: Response) {\n    const item: ${Name} = { id: Date.now().toString(), ...req.body, createdAt: new Date(), updatedAt: new Date() };\n    ${name}s.push(item);\n    res.status(201).json(item);\n  },\n\n  async update(req: Request, res: Response) {\n    const idx = ${name}s.findIndex(x => x.id === req.params.id);\n    if (idx === -1) return res.status(404).json({ error: 'Not found' });\n    ${name}s[idx] = { ...${name}s[idx], ...req.body, updatedAt: new Date() };\n    res.json(${name}s[idx]);\n  },\n\n  async delete(req: Request, res: Response) {\n    const idx = ${name}s.findIndex(x => x.id === req.params.id);\n    if (idx === -1) return res.status(404).json({ error: 'Not found' });\n    ${name}s.splice(idx, 1);\n    res.status(204).send();\n  }\n};`;

        const tests = `import request from 'supertest';\nimport app from '../app';\n\ndescribe('${Name} API', () => {\n  it('GET /${name}s returns array', async () => {\n    const res = await request(app).get('/${name}s');\n    expect(res.status).toBe(200);\n    expect(Array.isArray(res.body)).toBe(true);\n  });\n\n  it('POST /${name}s creates item', async () => {\n    const res = await request(app).post('/${name}s').send({ ${fields[0]?.name}: 'test' });\n    expect(res.status).toBe(201);\n    expect(res.body.id).toBeDefined();\n  });\n});`;

        this.emit('api:generated', { resource: resourceName, endpoints: 5 });
        return { routes, controllers, types, tests };
    }

    generateEndpoints(spec: APIEndpoint[]): string {
        let code = `import { Router, Request, Response } from 'express';\n\nconst router = Router();\n\n`;

        for (const ep of spec) {
            const method = ep.method.toLowerCase();
            code += `// ${ep.description}\nrouter.${method}('${ep.path}', async (req: Request, res: Response) => {\n  // TODO: Implement\n  res.json({ success: true });\n});\n\n`;
        }

        code += 'export default router;';
        return code;
    }
}

export const apiGenerator = APIGenerator.getInstance();
