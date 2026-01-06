// Microservices Generator - Generate microservice architectures
import Anthropic from '@anthropic-ai/sdk';

interface ServiceConfig {
    name: string;
    port: number;
    endpoints: Array<{
        method: string;
        path: string;
        handler: string;
    }>;
    dependencies?: string[];
}

class MicroservicesGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateExpressService(config: ServiceConfig): string {
        const routes = config.endpoints.map(ep =>
            `router.${ep.method.toLowerCase()}('${ep.path}', ${ep.handler});`
        ).join('\n    ');

        return `import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const router = express.Router();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('combined'));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
    res.setHeader('x-request-id', req.headers['x-request-id']);
    next();
});

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: '${config.name}',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
${config.endpoints.map(ep => `
const ${ep.handler} = async (req: Request, res: Response) => {
    try {
        // TODO: Implement ${ep.handler} logic
        res.json({ message: '${ep.handler} endpoint' });
    } catch (error) {
        console.error(\`[${config.name}] Error in ${ep.handler}:\`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};`).join('\n')}

    ${routes}

app.use('/api', router);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(\`[${config.name}] Unhandled error:\`, err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || ${config.port};
app.listen(PORT, () => {
    console.log(\`🚀 ${config.name} running on port \${PORT}\`);
});

export default app;
`;
    }

    generateNestJSService(config: ServiceConfig): string {
        return `// ${config.name}.module.ts
import { Module } from '@nestjs/common';
import { ${config.name}Controller } from './${config.name.toLowerCase()}.controller';
import { ${config.name}Service } from './${config.name.toLowerCase()}.service';

@Module({
    controllers: [${config.name}Controller],
    providers: [${config.name}Service],
    exports: [${config.name}Service],
})
export class ${config.name}Module {}

// ${config.name.toLowerCase()}.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${config.name}Service } from './${config.name.toLowerCase()}.service';

@ApiTags('${config.name}')
@Controller('${config.name.toLowerCase()}')
export class ${config.name}Controller {
    constructor(private readonly ${config.name.toLowerCase()}Service: ${config.name}Service) {}

    @Get('health')
    @ApiOperation({ summary: 'Health check' })
    healthCheck() {
        return {
            status: 'healthy',
            service: '${config.name}',
            timestamp: new Date().toISOString(),
        };
    }

${config.endpoints.map(ep => `
    @${ep.method.charAt(0).toUpperCase() + ep.method.slice(1).toLowerCase()}('${ep.path.replace(/^\//, '')}')
    @ApiOperation({ summary: '${ep.handler}' })
    @ApiResponse({ status: 200, description: 'Successful operation' })
    async ${ep.handler}() {
        return this.${config.name.toLowerCase()}Service.${ep.handler}();
    }`).join('\n')}
}

// ${config.name.toLowerCase()}.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ${config.name}Service {
    private readonly logger = new Logger(${config.name}Service.name);

${config.endpoints.map(ep => `
    async ${ep.handler}() {
        this.logger.log('Executing ${ep.handler}');
        // TODO: Implement ${ep.handler} logic
        return { message: '${ep.handler} executed' };
    }`).join('\n')}
}
`;
    }

    generateAPIGateway(services: Array<{ name: string; port: number; prefix: string }>): string {
        return `import express from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Service routes
${services.map(service => `
// ${service.name} Service
app.use('${service.prefix}', createProxyMiddleware({
    target: 'http://localhost:${service.port}',
    changeOrigin: true,
    pathRewrite: { '^${service.prefix}': '/api' },
    onError: (err, req, res) => {
        console.error(\`[Gateway] Error proxying to ${service.name}:\`, err.message);
        res.status(503).json({ error: '${service.name} service unavailable' });
    },
    onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('x-forwarded-for', req.ip || '');
        proxyReq.setHeader('x-request-id', req.headers['x-request-id'] || '');
    },
}));`).join('\n')}

// Gateway health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'api-gateway',
        services: ${JSON.stringify(services.map(s => s.name))},
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.GATEWAY_PORT || 3000;
app.listen(PORT, () => {
    console.log(\`🌐 API Gateway running on port \${PORT}\`);
    console.log('Available services:');
${services.map(s => `    console.log('  - ${s.name}: ${s.prefix}');`).join('\n')}
});
`;
    }

    generateServiceRegistry(): string {
        return `import express from 'express';
import { v4 as uuidv4 } from 'uuid';

interface ServiceInstance {
    id: string;
    name: string;
    host: string;
    port: number;
    status: 'healthy' | 'unhealthy';
    lastHeartbeat: Date;
    metadata?: Record<string, unknown>;
}

const app = express();
app.use(express.json());

const services = new Map<string, ServiceInstance[]>();

// Register a service
app.post('/register', (req, res) => {
    const { name, host, port, metadata } = req.body;
    
    const instance: ServiceInstance = {
        id: uuidv4(),
        name,
        host,
        port,
        status: 'healthy',
        lastHeartbeat: new Date(),
        metadata,
    };

    const instances = services.get(name) || [];
    instances.push(instance);
    services.set(name, instances);

    console.log(\`[Registry] Registered: \${name} at \${host}:\${port}\`);
    res.json({ id: instance.id });
});

// Deregister a service
app.post('/deregister', (req, res) => {
    const { name, id } = req.body;
    
    const instances = services.get(name) || [];
    const filtered = instances.filter((i) => i.id !== id);
    services.set(name, filtered);

    console.log(\`[Registry] Deregistered: \${name} (id: \${id})\`);
    res.json({ success: true });
});

// Heartbeat
app.post('/heartbeat', (req, res) => {
    const { name, id } = req.body;
    
    const instances = services.get(name) || [];
    const instance = instances.find((i) => i.id === id);
    
    if (instance) {
        instance.lastHeartbeat = new Date();
        instance.status = 'healthy';
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Instance not found' });
    }
});

// Discover services
app.get('/discover/:name', (req, res) => {
    const { name } = req.params;
    const instances = services.get(name) || [];
    const healthy = instances.filter((i) => i.status === 'healthy');
    res.json(healthy);
});

// List all services
app.get('/services', (req, res) => {
    const result: Record<string, ServiceInstance[]> = {};
    services.forEach((instances, name) => {
        result[name] = instances;
    });
    res.json(result);
});

// Health check for stale instances
setInterval(() => {
    const now = new Date();
    services.forEach((instances, name) => {
        instances.forEach((instance) => {
            const elapsed = now.getTime() - instance.lastHeartbeat.getTime();
            if (elapsed > 30000) { // 30 seconds
                instance.status = 'unhealthy';
                console.log(\`[Registry] Unhealthy: \${name} (id: \${instance.id})\`);
            }
        });
    });
}, 10000);

const PORT = process.env.REGISTRY_PORT || 8500;
app.listen(PORT, () => {
    console.log(\`📋 Service Registry running on port \${PORT}\`);
});
`;
    }

    generateDockerCompose(services: Array<{ name: string; port: number }>): string {
        const serviceConfigs = services.map(s => `
  ${s.name.toLowerCase()}:
    build:
      context: ./services/${s.name.toLowerCase()}
      dockerfile: Dockerfile
    container_name: ${s.name.toLowerCase()}
    ports:
      - "${s.port}:${s.port}"
    environment:
      - NODE_ENV=production
      - PORT=${s.port}
      - SERVICE_REGISTRY_URL=http://registry:8500
    depends_on:
      - registry
    networks:
      - microservices
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${s.port}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3`).join('\n');

        return `version: '3.8'

services:
  registry:
    build:
      context: ./services/registry
      dockerfile: Dockerfile
    container_name: service-registry
    ports:
      - "8500:8500"
    networks:
      - microservices
    restart: unless-stopped

  gateway:
    build:
      context: ./services/gateway
      dockerfile: Dockerfile
    container_name: api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - registry
${services.map(s => `      - ${s.name.toLowerCase()}`).join('\n')}
    networks:
      - microservices
    restart: unless-stopped
${serviceConfigs}

networks:
  microservices:
    driver: bridge

volumes:
  registry-data:
`;
    }
}

export const microservicesGenerator = new MicroservicesGenerator();
