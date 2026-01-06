/**
 * Project Template Generator
 * 
 * Generate project templates for various frameworks.
 */

import { EventEmitter } from 'events';

interface ProjectConfig {
    name: string;
    type: 'react' | 'nextjs' | 'express' | 'nestjs' | 'vite';
    typescript: boolean;
    features: ('tailwind' | 'prisma' | 'auth' | 'testing')[];
}

export class ProjectTemplateGenerator extends EventEmitter {
    private static instance: ProjectTemplateGenerator;

    private constructor() { super(); }

    static getInstance(): ProjectTemplateGenerator {
        if (!ProjectTemplateGenerator.instance) {
            ProjectTemplateGenerator.instance = new ProjectTemplateGenerator();
        }
        return ProjectTemplateGenerator.instance;
    }

    generatePackageJson(config: ProjectConfig): string {
        const deps: Record<string, string> = {};
        const devDeps: Record<string, string> = {};

        if (config.type === 'react' || config.type === 'vite') {
            deps['react'] = '^18.2.0';
            deps['react-dom'] = '^18.2.0';
        }
        if (config.type === 'nextjs') {
            deps['next'] = '^14.0.0';
            deps['react'] = '^18.2.0';
            deps['react-dom'] = '^18.2.0';
        }
        if (config.type === 'express') {
            deps['express'] = '^4.18.0';
        }
        if (config.type === 'nestjs') {
            deps['@nestjs/core'] = '^10.0.0';
            deps['@nestjs/common'] = '^10.0.0';
        }
        if (config.typescript) {
            devDeps['typescript'] = '^5.0.0';
            devDeps['@types/node'] = '^20.0.0';
        }
        if (config.features.includes('tailwind')) {
            devDeps['tailwindcss'] = '^3.3.0';
            devDeps['autoprefixer'] = '^10.4.0';
            devDeps['postcss'] = '^8.4.0';
        }
        if (config.features.includes('prisma')) {
            deps['@prisma/client'] = '^5.0.0';
            devDeps['prisma'] = '^5.0.0';
        }
        if (config.features.includes('testing')) {
            devDeps['jest'] = '^29.0.0';
            devDeps['@testing-library/react'] = '^14.0.0';
        }

        return JSON.stringify({
            name: config.name,
            version: '0.1.0',
            private: true,
            scripts: this.getScripts(config),
            dependencies: deps,
            devDependencies: devDeps
        }, null, 2);
    }

    private getScripts(config: ProjectConfig): Record<string, string> {
        const scripts: Record<string, string> = {};
        if (config.type === 'nextjs') {
            scripts.dev = 'next dev';
            scripts.build = 'next build';
            scripts.start = 'next start';
        } else if (config.type === 'vite') {
            scripts.dev = 'vite';
            scripts.build = 'vite build';
            scripts.preview = 'vite preview';
        } else if (config.type === 'express' || config.type === 'nestjs') {
            scripts.dev = config.typescript ? 'ts-node-dev src/index.ts' : 'nodemon src/index.js';
            scripts.build = config.typescript ? 'tsc' : 'echo "No build needed"';
            scripts.start = config.typescript ? 'node dist/index.js' : 'node src/index.js';
        }
        if (config.features.includes('testing')) {
            scripts.test = 'jest';
        }
        return scripts;
    }

    generateTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                lib: ['ES2022', 'DOM'],
                module: 'ESNext',
                moduleResolution: 'bundler',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                jsx: 'react-jsx',
                outDir: './dist',
                rootDir: './src'
            },
            include: ['src'],
            exclude: ['node_modules']
        }, null, 2);
    }

    generateReadme(config: ProjectConfig): string {
        return `# ${config.name}

A ${config.type} project${config.typescript ? ' with TypeScript' : ''}.

## Features
${config.features.map(f => `- ${f}`).join('\n')}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
${config.features.includes('testing') ? '- `npm test` - Run tests' : ''}
`;
    }
}

export const projectTemplateGenerator = ProjectTemplateGenerator.getInstance();
