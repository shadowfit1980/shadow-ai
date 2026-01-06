/**
 * Intelligent Project Scaffolding
 * 
 * AI-powered project creation with smart defaults,
 * based on project type, requirements, and learned patterns.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { selfLearningAgent } from '../learning/SelfLearningAgent';

// ============================================================================
// TYPES
// ============================================================================

interface ProjectConfig {
    name: string;
    type: 'landing-page' | 'web-app' | 'api' | 'full-stack' | 'mobile-app' | 'cli' | 'library';
    framework?: string;
    features?: string[];
    styling?: 'css' | 'tailwind' | 'styled-components' | 'scss' | 'emotion';
    database?: 'none' | 'postgres' | 'mongodb' | 'mysql' | 'sqlite';
    auth?: 'none' | 'jwt' | 'oauth' | 'clerk' | 'auth0';
    testing?: 'jest' | 'vitest' | 'none';
    deployment?: 'vercel' | 'netlify' | 'aws' | 'docker' | 'none';
}

interface GeneratedFile {
    path: string;
    content: string;
    description: string;
}

// ============================================================================
// INTELLIGENT SCAFFOLDING
// ============================================================================

export class IntelligentScaffolding extends EventEmitter {
    private static instance: IntelligentScaffolding;

    private constructor() {
        super();
    }

    static getInstance(): IntelligentScaffolding {
        if (!IntelligentScaffolding.instance) {
            IntelligentScaffolding.instance = new IntelligentScaffolding();
        }
        return IntelligentScaffolding.instance;
    }

    // ========================================================================
    // PROJECT GENERATION
    // ========================================================================

    async generateProject(config: ProjectConfig, targetPath: string): Promise<GeneratedFile[]> {
        const files: GeneratedFile[] = [];

        // Check if we have a similar template
        const existingTemplate = await selfLearningAgent.findSimilarTemplate(
            `${config.type} ${config.framework || ''}`,
            config.type as any
        );

        if (existingTemplate) {
            this.emit('scaffold:using-template', { templateId: existingTemplate.id });
            await selfLearningAgent.duplicateFromTemplate(existingTemplate.id, targetPath);
            return [];
        }

        // Generate from scratch
        switch (config.type) {
            case 'landing-page':
                files.push(...this.generateLandingPage(config));
                break;
            case 'web-app':
                files.push(...this.generateWebApp(config));
                break;
            case 'api':
                files.push(...this.generateAPI(config));
                break;
            case 'full-stack':
                files.push(...this.generateFullStack(config));
                break;
            case 'mobile-app':
                files.push(...this.generateMobileApp(config));
                break;
            default:
                files.push(...this.generateBasicProject(config));
        }

        // Write files
        for (const file of files) {
            const fullPath = path.join(targetPath, file.path);
            const dir = path.dirname(fullPath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(fullPath, file.content);
        }

        // Save as template for future use
        const filesMap = new Map(files.map(f => [f.path, f.content]));
        await selfLearningAgent.saveAsTemplate(
            config.name,
            config.type as any,
            filesMap,
            { framework: config.framework, tags: config.features }
        );

        this.emit('scaffold:complete', { files: files.length, targetPath });
        return files;
    }

    // ========================================================================
    // LANDING PAGE
    // ========================================================================

    private generateLandingPage(config: ProjectConfig): GeneratedFile[] {
        return [
            {
                path: 'index.html',
                description: 'Main landing page',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="hero">
        <nav class="nav">
            <div class="logo">${config.name}</div>
            <ul class="nav-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
        <div class="hero-content">
            <h1>Welcome to ${config.name}</h1>
            <p>Your next-generation solution for modern problems.</p>
            <button class="cta-button">Get Started</button>
        </div>
    </header>
    
    <section id="features" class="features">
        <h2>Features</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <h3>Fast</h3>
                <p>Lightning-fast performance</p>
            </div>
            <div class="feature-card">
                <h3>Secure</h3>
                <p>Enterprise-grade security</p>
            </div>
            <div class="feature-card">
                <h3>Scalable</h3>
                <p>Grows with your needs</p>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <p>&copy; 2024 ${config.name}. All rights reserved.</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`,
            },
            {
                path: 'styles.css',
                description: 'Landing page styles',
                content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --text: #1f2937;
    --text-light: #6b7280;
    --bg: #ffffff;
    --bg-alt: #f9fafb;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--text);
    line-height: 1.6;
}

.hero {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: 2rem;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    gap: 2rem;
    list-style: none;
}

.nav-links a {
    color: white;
    text-decoration: none;
}

.hero-content {
    max-width: 800px;
    margin: 15vh auto 0;
    text-align: center;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
}

.cta-button {
    background: white;
    color: var(--primary);
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 2rem;
    transition: transform 0.2s;
}

.cta-button:hover {
    transform: scale(1.05);
}

.features {
    padding: 5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.features h2 {
    font-size: 2.5rem;
    margin-bottom: 3rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    padding: 2rem;
    background: var(--bg-alt);
    border-radius: 16px;
    transition: box-shadow 0.3s;
}

.feature-card:hover {
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.footer {
    padding: 2rem;
    text-align: center;
    background: var(--bg-alt);
    color: var(--text-light);
}`,
            },
            {
                path: 'script.js',
                description: 'Landing page JavaScript',
                content: `// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// CTA button animation
const ctaButton = document.querySelector('.cta-button');
ctaButton.addEventListener('click', () => {
    alert('Getting started!');
});`,
            },
        ];
    }

    // ========================================================================
    // WEB APP (React)
    // ========================================================================

    private generateWebApp(config: ProjectConfig): GeneratedFile[] {
        const framework = config.framework || 'react';

        return [
            {
                path: 'package.json',
                description: 'Package configuration',
                content: JSON.stringify({
                    name: config.name.toLowerCase().replace(/\s+/g, '-'),
                    version: '1.0.0',
                    private: true,
                    scripts: {
                        dev: 'vite',
                        build: 'vite build',
                        preview: 'vite preview',
                        test: config.testing === 'vitest' ? 'vitest' : 'jest',
                    },
                    dependencies: {
                        react: '^18.2.0',
                        'react-dom': '^18.2.0',
                        'react-router-dom': '^6.0.0',
                    },
                    devDependencies: {
                        vite: '^5.0.0',
                        '@vitejs/plugin-react': '^4.0.0',
                        typescript: '^5.0.0',
                        '@types/react': '^18.0.0',
                        '@types/react-dom': '^18.0.0',
                    },
                }, null, 2),
            },
            {
                path: 'src/App.tsx',
                description: 'Main React component',
                content: `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { About } from './pages/About';
import './App.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;`,
            },
            {
                path: 'src/pages/Home.tsx',
                description: 'Home page component',
                content: `export function Home() {
    return (
        <div className="page">
            <h1>Welcome to ${config.name}</h1>
            <p>Start building something amazing!</p>
        </div>
    );
}`,
            },
            {
                path: 'src/pages/About.tsx',
                description: 'About page component',
                content: `export function About() {
    return (
        <div className="page">
            <h1>About ${config.name}</h1>
            <p>Learn more about us.</p>
        </div>
    );
}`,
            },
            {
                path: 'vite.config.ts',
                description: 'Vite configuration',
                content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
});`,
            },
            {
                path: 'index.html',
                description: 'HTML entry point',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
            },
            {
                path: 'src/main.tsx',
                description: 'React entry point',
                content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);`,
            },
        ];
    }

    // ========================================================================
    // API (Express)
    // ========================================================================

    private generateAPI(config: ProjectConfig): GeneratedFile[] {
        return [
            {
                path: 'package.json',
                description: 'Package configuration',
                content: JSON.stringify({
                    name: config.name.toLowerCase().replace(/\s+/g, '-'),
                    version: '1.0.0',
                    scripts: {
                        dev: 'tsx watch src/server.ts',
                        build: 'tsc',
                        start: 'node dist/server.js',
                    },
                    dependencies: {
                        express: '^4.18.0',
                        cors: '^2.8.0',
                        helmet: '^7.0.0',
                        dotenv: '^16.0.0',
                    },
                    devDependencies: {
                        typescript: '^5.0.0',
                        tsx: '^4.0.0',
                        '@types/express': '^4.17.0',
                        '@types/cors': '^2.8.0',
                        '@types/node': '^20.0.0',
                    },
                }, null, 2),
            },
            {
                path: 'src/server.ts',
                description: 'Express server',
                content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ${config.name} API' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`,
            },
            {
                path: 'tsconfig.json',
                description: 'TypeScript configuration',
                content: JSON.stringify({
                    compilerOptions: {
                        target: 'ES2022',
                        module: 'NodeNext',
                        moduleResolution: 'NodeNext',
                        esModuleInterop: true,
                        strict: true,
                        outDir: 'dist',
                        rootDir: 'src',
                    },
                    include: ['src/**/*'],
                }, null, 2),
            },
            {
                path: '.env',
                description: 'Environment variables',
                content: `PORT=3000
NODE_ENV=development`,
            },
        ];
    }

    // ========================================================================
    // FULL-STACK
    // ========================================================================

    private generateFullStack(config: ProjectConfig): GeneratedFile[] {
        return [
            ...this.generateWebApp({ ...config, name: `${config.name}-client` }).map(f => ({
                ...f,
                path: `client/${f.path}`,
            })),
            ...this.generateAPI({ ...config, name: `${config.name}-server` }).map(f => ({
                ...f,
                path: `server/${f.path}`,
            })),
            {
                path: 'package.json',
                description: 'Root package configuration',
                content: JSON.stringify({
                    name: config.name.toLowerCase().replace(/\s+/g, '-'),
                    private: true,
                    workspaces: ['client', 'server'],
                    scripts: {
                        'dev:client': 'npm run dev --workspace=client',
                        'dev:server': 'npm run dev --workspace=server',
                        dev: 'concurrently "npm:dev:*"',
                    },
                    devDependencies: {
                        concurrently: '^8.0.0',
                    },
                }, null, 2),
            },
        ];
    }

    // ========================================================================
    // MOBILE APP (React Native)
    // ========================================================================

    private generateMobileApp(config: ProjectConfig): GeneratedFile[] {
        return [
            {
                path: 'App.tsx',
                description: 'Main React Native component',
                content: `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './screens/HomeScreen';
import { DetailsScreen } from './screens/DetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Details" component={DetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}`,
            },
            {
                path: 'screens/HomeScreen.tsx',
                description: 'Home screen',
                content: `import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export function HomeScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>${config.name}</Text>
            <Button
                title="Go to Details"
                onPress={() => navigation.navigate('Details')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});`,
            },
        ];
    }

    // ========================================================================
    // BASIC PROJECT
    // ========================================================================

    private generateBasicProject(config: ProjectConfig): GeneratedFile[] {
        return [
            {
                path: 'package.json',
                description: 'Package configuration',
                content: JSON.stringify({
                    name: config.name.toLowerCase().replace(/\s+/g, '-'),
                    version: '1.0.0',
                    main: 'index.js',
                    scripts: {
                        start: 'node index.js',
                        dev: 'node --watch index.js',
                    },
                }, null, 2),
            },
            {
                path: 'index.js',
                description: 'Main entry point',
                content: `console.log('Hello from ${config.name}!');`,
            },
            {
                path: 'README.md',
                description: 'Project documentation',
                content: `# ${config.name}\n\nA new project.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\``,
            },
        ];
    }
}

export const intelligentScaffolding = IntelligentScaffolding.getInstance();
