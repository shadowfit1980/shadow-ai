/**
 * Deployment Scripts Generator
 * 
 * Generate deployment configurations for Docker, Vercel, AWS, etc.
 */

import { EventEmitter } from 'events';

interface DeployConfig {
    appName: string;
    port?: number;
    nodeVersion?: string;
    env?: Record<string, string>;
}

export class DeploymentGenerator extends EventEmitter {
    private static instance: DeploymentGenerator;

    private constructor() { super(); }

    static getInstance(): DeploymentGenerator {
        if (!DeploymentGenerator.instance) {
            DeploymentGenerator.instance = new DeploymentGenerator();
        }
        return DeploymentGenerator.instance;
    }

    generateDockerfile(config: DeployConfig): string {
        const port = config.port || 3000;
        const nodeVersion = config.nodeVersion || '20';
        return `FROM node:${nodeVersion}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:${nodeVersion}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE ${port}
CMD ["npm", "start"]
`;
    }

    generateDockerCompose(config: DeployConfig): string {
        const port = config.port || 3000;
        return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    environment:
${Object.entries(config.env || {}).map(([k, v]) => `      - ${k}=${v}`).join('\n') || '      - NODE_ENV=production'}
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${config.appName}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`;
    }

    generateVercelConfig(config: DeployConfig): string {
        return JSON.stringify({
            name: config.appName,
            version: 2,
            builds: [{ src: 'package.json', use: '@vercel/next' }],
            env: config.env || {}
        }, null, 2);
    }

    generateGitHubActions(config: DeployConfig): string {
        return `name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${config.nodeVersion || '20'}'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '${config.nodeVersion || '20'}'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      # Add deployment steps here
`;
    }

    generateNginxConfig(config: DeployConfig): string {
        const port = config.port || 3000;
        return `server {
    listen 80;
    server_name ${config.appName}.example.com;

    location / {
        proxy_pass http://localhost:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
    }

    generatePM2Config(config: DeployConfig): string {
        return JSON.stringify({
            apps: [{
                name: config.appName,
                script: 'dist/index.js',
                instances: 'max',
                exec_mode: 'cluster',
                env: { NODE_ENV: 'development', ...config.env },
                env_production: { NODE_ENV: 'production', ...config.env }
            }]
        }, null, 2);
    }
}

export const deploymentGenerator = DeploymentGenerator.getInstance();
