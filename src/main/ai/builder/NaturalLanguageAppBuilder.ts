/**
 * Natural Language App Builder
 * 
 * Builds complete applications from natural language descriptions,
 * including scaffolding, code generation, testing, and deployment.
 */

import { EventEmitter } from 'events';

export interface AppProject {
    id: string;
    name: string;
    description: string;
    type: AppType;
    stack: TechStack;
    features: AppFeature[];
    files: ProjectFile[];
    status: ProjectStatus;
    createdAt: Date;
    updatedAt: Date;
}

export type AppType =
    | 'web-app'
    | 'mobile-app'
    | 'api'
    | 'fullstack'
    | 'static-site'
    | 'cli-tool'
    | 'library';

export interface TechStack {
    frontend?: string[];
    backend?: string[];
    database?: string;
    hosting?: string;
    auth?: string;
    styling?: string;
}

export interface AppFeature {
    id: string;
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'implemented' | 'testing';
    components: string[];
}

export interface ProjectFile {
    path: string;
    content: string;
    type: 'component' | 'style' | 'config' | 'test' | 'util' | 'api';
}

export type ProjectStatus = 'planning' | 'generating' | 'ready' | 'deploying' | 'deployed';

export interface BuildConfig {
    includeTests?: boolean;
    includeDocs?: boolean;
    includeCI?: boolean;
    includeDocker?: boolean;
    responsive?: boolean;
    darkMode?: boolean;
    i18n?: boolean;
}

export class NaturalLanguageAppBuilder extends EventEmitter {
    private static instance: NaturalLanguageAppBuilder;
    private projects: Map<string, AppProject> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): NaturalLanguageAppBuilder {
        if (!NaturalLanguageAppBuilder.instance) {
            NaturalLanguageAppBuilder.instance = new NaturalLanguageAppBuilder();
        }
        return NaturalLanguageAppBuilder.instance;
    }

    // ========================================================================
    // APP GENERATION
    // ========================================================================

    async buildFromDescription(description: string, config?: BuildConfig): Promise<AppProject> {
        const parsed = this.parseDescription(description);
        const stack = this.determineStack(parsed);
        const features = this.extractFeatures(parsed);

        const project: AppProject = {
            id: `project_${Date.now()}`,
            name: parsed.name,
            description,
            type: parsed.type,
            stack,
            features,
            files: [],
            status: 'generating',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.projects.set(project.id, project);
        this.emit('project:created', project);

        // Generate all files
        project.files = await this.generateProjectFiles(project, config);
        project.status = 'ready';
        project.updatedAt = new Date();

        this.emit('project:ready', project);
        return project;
    }

    private parseDescription(description: string): { name: string; type: AppType; keywords: string[] } {
        const lower = description.toLowerCase();
        let type: AppType = 'web-app';

        if (lower.includes('mobile') || lower.includes('app')) {
            type = 'mobile-app';
        }
        if (lower.includes('api') || lower.includes('backend') || lower.includes('server')) {
            type = 'api';
        }
        if (lower.includes('full-stack') || lower.includes('fullstack')) {
            type = 'fullstack';
        }
        if (lower.includes('cli') || lower.includes('command line')) {
            type = 'cli-tool';
        }
        if (lower.includes('library') || lower.includes('package')) {
            type = 'library';
        }

        // Extract name
        const nameMatch = description.match(/(?:called?|named?)\s+["']?(\w+)["']?/i);
        const name = nameMatch?.[1] || this.generateProjectName(description);

        // Extract keywords
        const keywords = lower.match(/\b(auth|login|payment|stripe|cart|shop|blog|chat|dashboard|admin|user|profile|settings|todo|task|calendar|email|notification|search|filter|upload|download|video|audio|image|map|social|share|comment|like|follow|message|real-time|websocket|api|rest|graphql|database|mongodb|postgresql|redis|cache|queue|worker|test|deploy)\b/g) || [];

        return { name, type, keywords: [...new Set(keywords)] };
    }

    private generateProjectName(description: string): string {
        const words = description.split(/\s+/).slice(0, 3);
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('') + 'App';
    }

    private determineStack(parsed: { type: AppType; keywords: string[] }): TechStack {
        const { type, keywords } = parsed;

        const stack: TechStack = {
            styling: 'tailwindcss',
        };

        switch (type) {
            case 'web-app':
            case 'fullstack':
                stack.frontend = ['react', 'typescript', 'vite'];
                stack.backend = ['node', 'express'];
                stack.database = keywords.includes('mongodb') ? 'mongodb' : 'postgresql';
                stack.auth = keywords.includes('auth') || keywords.includes('login') ? 'jwt' : undefined;
                break;
            case 'mobile-app':
                stack.frontend = ['react-native', 'expo', 'typescript'];
                stack.backend = ['node', 'express'];
                stack.database = 'firebase';
                break;
            case 'api':
                stack.backend = ['node', 'express', 'typescript'];
                stack.database = 'postgresql';
                break;
            case 'static-site':
                stack.frontend = ['nextjs', 'typescript'];
                stack.hosting = 'vercel';
                break;
            case 'cli-tool':
                stack.backend = ['node', 'typescript'];
                break;
        }

        return stack;
    }

    private extractFeatures(parsed: { keywords: string[]; type: AppType }): AppFeature[] {
        const features: AppFeature[] = [];
        const { keywords } = parsed;

        const featureMap: Record<string, { name: string; desc: string; priority: AppFeature['priority'] }> = {
            auth: { name: 'Authentication', desc: 'User login and registration', priority: 'high' },
            login: { name: 'Login System', desc: 'Secure user authentication', priority: 'high' },
            payment: { name: 'Payment Processing', desc: 'Stripe integration for payments', priority: 'high' },
            stripe: { name: 'Stripe Integration', desc: 'Payment processing with Stripe', priority: 'high' },
            cart: { name: 'Shopping Cart', desc: 'E-commerce cart functionality', priority: 'high' },
            shop: { name: 'Shop Features', desc: 'Product listing and purchasing', priority: 'high' },
            dashboard: { name: 'Dashboard', desc: 'Admin/user dashboard', priority: 'medium' },
            search: { name: 'Search', desc: 'Search functionality', priority: 'medium' },
            upload: { name: 'File Upload', desc: 'File upload capability', priority: 'medium' },
            chat: { name: 'Chat System', desc: 'Real-time messaging', priority: 'medium' },
            notification: { name: 'Notifications', desc: 'Push/email notifications', priority: 'low' },
        };

        for (const keyword of keywords) {
            const feature = featureMap[keyword];
            if (feature) {
                features.push({
                    id: `feature_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: feature.name,
                    description: feature.desc,
                    priority: feature.priority,
                    status: 'pending',
                    components: [],
                });
            }
        }

        // Add default features
        features.push({
            id: `feature_${Date.now()}_ui`,
            name: 'UI Components',
            description: 'Core UI components and styling',
            priority: 'high',
            status: 'pending',
            components: ['Header', 'Footer', 'Layout'],
        });

        return features;
    }

    private async generateProjectFiles(project: AppProject, config?: BuildConfig): Promise<ProjectFile[]> {
        const files: ProjectFile[] = [];

        // Package.json
        files.push({
            path: 'package.json',
            content: this.generatePackageJson(project),
            type: 'config',
        });

        // TypeScript config
        files.push({
            path: 'tsconfig.json',
            content: this.generateTsConfig(),
            type: 'config',
        });

        // Main app file
        if (project.stack.frontend?.includes('react')) {
            files.push(...this.generateReactApp(project));
        }

        // API routes
        if (project.stack.backend) {
            files.push(...this.generateAPIFiles(project));
        }

        // Tests
        if (config?.includeTests !== false) {
            files.push(...this.generateTestFiles(project));
        }

        // Docker
        if (config?.includeDocker) {
            files.push({
                path: 'Dockerfile',
                content: this.generateDockerfile(project),
                type: 'config',
            });
        }

        // README
        files.push({
            path: 'README.md',
            content: this.generateReadme(project),
            type: 'config',
        });

        return files;
    }

    private generatePackageJson(project: AppProject): string {
        const deps: Record<string, string> = {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
        };

        if (project.stack.backend?.includes('express')) {
            deps['express'] = '^4.18.2';
        }
        if (project.stack.auth === 'jwt') {
            deps['jsonwebtoken'] = '^9.0.0';
            deps['bcryptjs'] = '^2.4.3';
        }

        return JSON.stringify({
            name: project.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: project.description,
            scripts: {
                dev: 'vite',
                build: 'vite build',
                test: 'vitest',
                lint: 'eslint .',
            },
            dependencies: deps,
            devDependencies: {
                typescript: '^5.0.0',
                vite: '^5.0.0',
                vitest: '^1.0.0',
            },
        }, null, 2);
    }

    private generateTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2020',
                lib: ['ES2020', 'DOM'],
                module: 'ESNext',
                moduleResolution: 'bundler',
                strict: true,
                jsx: 'react-jsx',
                esModuleInterop: true,
            },
            include: ['src'],
        }, null, 2);
    }

    private generateReactApp(project: AppProject): ProjectFile[] {
        const appContent = `import React from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <h1>Welcome to ${project.name}</h1>
        <p>${project.description}</p>
      </main>
      <Footer />
    </div>
  );
}

export default App;`;

        const headerContent = `import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo">${project.name}</div>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
};`;

        const footerContent = `import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <p>&copy; ${new Date().getFullYear()} ${project.name}. All rights reserved.</p>
    </footer>
  );
};`;

        return [
            { path: 'src/App.tsx', content: appContent, type: 'component' },
            { path: 'src/components/Header.tsx', content: headerContent, type: 'component' },
            { path: 'src/components/Footer.tsx', content: footerContent, type: 'component' },
        ];
    }

    private generateAPIFiles(project: AppProject): ProjectFile[] {
        const serverContent = `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: '${project.name}' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

        return [
            { path: 'server/index.ts', content: serverContent, type: 'api' },
        ];
    }

    private generateTestFiles(project: AppProject): ProjectFile[] {
        const testContent = `import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('${project.name}', () => {
  it('renders the app', () => {
    render(<App />);
    expect(screen.getByText(/Welcome/i)).toBeDefined();
  });
});`;

        return [
            { path: 'tests/App.test.tsx', content: testContent, type: 'test' },
        ];
    }

    private generateDockerfile(project: AppProject): string {
        return `FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

# ${project.name} - Auto-generated Dockerfile`;
    }

    private generateReadme(project: AppProject): string {
        return `# ${project.name}

${project.description}

## Tech Stack

${Object.entries(project.stack)
                .filter(([_, v]) => v)
                .map(([k, v]) => `- **${k}**: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('\n')}

## Features

${project.features.map(f => `- **${f.name}**: ${f.description}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Generated by Shadow AI

This project was automatically generated from the following description:

> ${project.description}
`;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getProject(id: string): AppProject | undefined {
        return this.projects.get(id);
    }

    getAllProjects(): AppProject[] {
        return Array.from(this.projects.values());
    }

    getStats(): {
        totalProjects: number;
        byType: Record<AppType, number>;
        totalFiles: number;
    } {
        const projects = Array.from(this.projects.values());
        const byType: Record<string, number> = {};

        for (const p of projects) {
            byType[p.type] = (byType[p.type] || 0) + 1;
        }

        return {
            totalProjects: projects.length,
            byType: byType as Record<AppType, number>,
            totalFiles: projects.reduce((sum, p) => sum + p.files.length, 0),
        };
    }
}

export const naturalLanguageAppBuilder = NaturalLanguageAppBuilder.getInstance();
