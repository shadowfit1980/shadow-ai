/**
 * Template Library
 * 
 * Pre-built project templates for rapid application development.
 * Inspired by Lovable, Bolt.new, and Firebase Studio.
 */

import { ProjectConfig, FileTemplate } from './ProjectCreator';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'frontend' | 'backend' | 'fullstack' | 'mobile';
    frameworks: string[];
    features: string[];
    files: FileTemplate[];
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    setupCommands: string[];
}

// ============================================================================
// FRONTEND TEMPLATES
// ============================================================================

const REACT_VITE_TEMPLATE: ProjectTemplate = {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Modern React app with Vite, TypeScript, and Tailwind CSS',
    category: 'frontend',
    frameworks: ['react', 'vite'],
    features: ['TypeScript', 'Tailwind CSS', 'React Router', 'Hot Reload'],
    dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'react-router-dom': '^6.22.0',
    },
    devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.2.0',
        'autoprefixer': '^10.4.0',
        'postcss': '^8.4.0',
        'tailwindcss': '^3.4.0',
        'typescript': '^5.3.0',
        'vite': '^5.0.0',
    },
    scripts: {
        'dev': 'vite',
        'build': 'tsc && vite build',
        'preview': 'vite preview',
    },
    setupCommands: ['npm install'],
    files: [
        {
            path: 'src/main.tsx',
            content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`
        },
        {
            path: 'src/App.tsx',
            content: `import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
`
        },
        {
            path: 'src/pages/Home.tsx',
            content: `export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome</h1>
      <p className="text-gray-400">Your React + Vite app is ready!</p>
    </div>
  );
}
`
        },
        {
            path: 'src/pages/About.tsx',
            content: `export default function About() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <p className="text-gray-400">Built with React, Vite, and Tailwind CSS.</p>
    </div>
  );
}
`
        },
        {
            path: 'src/components/Navbar.tsx',
            content: `import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold">MyApp</Link>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-blue-400">Home</Link>
            <Link to="/about" className="hover:text-blue-400">About</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
`
        },
        {
            path: 'src/index.css',
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, -apple-system, sans-serif;
}
`
        },
        {
            path: 'index.html',
            content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
        },
        {
            path: 'vite.config.ts',
            content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`
        },
        {
            path: 'tailwind.config.js',
            content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
`
        },
        {
            path: 'postcss.config.js',
            content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
        },
        {
            path: 'tsconfig.json',
            content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`
        }
    ]
};

// ============================================================================
// FULL-STACK TEMPLATES
// ============================================================================

const NEXTJS_FULLSTACK_TEMPLATE: ProjectTemplate = {
    id: 'nextjs-fullstack',
    name: 'Next.js Full-Stack',
    description: 'Next.js 14 with App Router, Prisma, and NextAuth',
    category: 'fullstack',
    frameworks: ['nextjs', 'prisma', 'nextauth'],
    features: ['App Router', 'Server Actions', 'Prisma ORM', 'Authentication', 'API Routes'],
    dependencies: {
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@prisma/client': '^5.0.0',
        'next-auth': '^4.24.0',
        'bcryptjs': '^2.4.3',
    },
    devDependencies: {
        '@types/bcryptjs': '^2.4.0',
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'prisma': '^5.0.0',
        'tailwindcss': '^3.4.0',
        'typescript': '^5.3.0',
    },
    scripts: {
        'dev': 'next dev',
        'build': 'prisma generate && next build',
        'start': 'next start',
        'db:push': 'prisma db push',
        'db:studio': 'prisma studio',
    },
    setupCommands: ['npm install', 'npx prisma generate'],
    files: [
        {
            path: 'app/layout.tsx',
            content: `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`
        },
        {
            path: 'app/page.tsx',
            content: `export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome to Next.js</h1>
        <p className="text-gray-400">Full-stack app with Prisma and NextAuth</p>
      </div>
    </main>
  );
}
`
        },
        {
            path: 'app/globals.css',
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`
        },
        {
            path: 'app/providers.tsx',
            content: `'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
`
        },
        {
            path: 'app/api/auth/[...nextauth]/route.ts',
            content: `import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
`
        },
        {
            path: 'lib/auth.ts',
            content: `import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
};
`
        },
        {
            path: 'lib/prisma.ts',
            content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
`
        },
        {
            path: 'prisma/schema.prisma',
            content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
        },
        {
            path: 'next.config.js',
            content: `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`
        }
    ]
};

// ============================================================================
// SAAS TEMPLATE
// ============================================================================

const SAAS_STARTER_TEMPLATE: ProjectTemplate = {
    id: 'saas-starter',
    name: 'SaaS Starter Kit',
    description: 'Complete SaaS boilerplate with auth, billing, and dashboard',
    category: 'fullstack',
    frameworks: ['nextjs', 'prisma', 'stripe'],
    features: ['Authentication', 'Stripe Billing', 'Admin Dashboard', 'User Management', 'API Keys'],
    dependencies: {
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@prisma/client': '^5.0.0',
        'next-auth': '^4.24.0',
        'stripe': '^14.0.0',
        '@stripe/stripe-js': '^2.0.0',
        'zod': '^3.22.0',
        'lucide-react': '^0.300.0',
    },
    devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        'prisma': '^5.0.0',
        'tailwindcss': '^3.4.0',
        'typescript': '^5.3.0',
    },
    scripts: {
        'dev': 'next dev',
        'build': 'prisma generate && next build',
        'start': 'next start',
    },
    setupCommands: ['npm install', 'npx prisma generate'],
    files: [
        {
            path: 'app/dashboard/page.tsx',
            content: `import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        <StatCard title="Users" value="1,234" />
        <StatCard title="Revenue" value="$12,345" />
        <StatCard title="Active Plans" value="89" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="text-gray-400 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}
`
        },
        {
            path: 'app/api/stripe/webhook/route.ts',
            content: `import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        break;
      case 'customer.subscription.updated':
        // Handle subscription update
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
`
        },
        {
            path: 'components/ui/Button.tsx',
            content: `import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-medium transition-colors',
          variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
          variant === 'secondary' && 'bg-gray-700 text-white hover:bg-gray-600',
          variant === 'outline' && 'border border-gray-600 hover:bg-gray-800',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2',
          size === 'lg' && 'px-6 py-3 text-lg',
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
`
        },
        {
            path: 'lib/utils.ts',
            content: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
        }
    ]
};

// ============================================================================
// BACKEND TEMPLATES
// ============================================================================

const EXPRESS_API_TEMPLATE: ProjectTemplate = {
    id: 'express-api',
    name: 'Express REST API',
    description: 'Production-ready Express.js API with TypeScript',
    category: 'backend',
    frameworks: ['express', 'prisma'],
    features: ['TypeScript', 'JWT Auth', 'Validation', 'Error Handling', 'Logging'],
    dependencies: {
        'express': '^4.18.0',
        'cors': '^2.8.0',
        'helmet': '^7.1.0',
        'jsonwebtoken': '^9.0.0',
        'bcryptjs': '^2.4.0',
        'zod': '^3.22.0',
        '@prisma/client': '^5.0.0',
        'dotenv': '^16.0.0',
    },
    devDependencies: {
        '@types/express': '^4.17.0',
        '@types/cors': '^2.8.0',
        '@types/jsonwebtoken': '^9.0.0',
        '@types/bcryptjs': '^2.4.0',
        '@types/node': '^20.0.0',
        'prisma': '^5.0.0',
        'tsx': '^4.0.0',
        'typescript': '^5.3.0',
    },
    scripts: {
        'dev': 'tsx watch src/index.ts',
        'build': 'tsc',
        'start': 'node dist/index.js',
    },
    setupCommands: ['npm install', 'npx prisma generate'],
    files: [
        {
            path: 'src/index.ts',
            content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
`
        },
        {
            path: 'src/routes/index.ts',
            content: `import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
`
        },
        {
            path: 'src/routes/auth.ts',
            content: `import { Router } from 'express';
import { login, register, me } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, me);

export default router;
`
        },
        {
            path: 'src/middleware/auth.ts',
            content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
`
        },
        {
            path: 'src/middleware/errorHandler.ts',
            content: `import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
`
        },
        {
            path: 'src/controllers/auth.ts',
            content: `import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function me(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  res.json(user);
}
`
        }
    ]
};

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const TEMPLATE_REGISTRY: Record<string, ProjectTemplate> = {
    'react-vite': REACT_VITE_TEMPLATE,
    'nextjs-fullstack': NEXTJS_FULLSTACK_TEMPLATE,
    'saas-starter': SAAS_STARTER_TEMPLATE,
    'express-api': EXPRESS_API_TEMPLATE,
};

// ============================================================================
// TEMPLATE LIBRARY CLASS
// ============================================================================

export class TemplateLibrary {
    private static instance: TemplateLibrary;

    private constructor() { }

    static getInstance(): TemplateLibrary {
        if (!TemplateLibrary.instance) {
            TemplateLibrary.instance = new TemplateLibrary();
        }
        return TemplateLibrary.instance;
    }

    /**
     * Get all available templates
     */
    listTemplates(): ProjectTemplate[] {
        return Object.values(TEMPLATE_REGISTRY);
    }

    /**
     * Get template by ID
     */
    getTemplate(id: string): ProjectTemplate | undefined {
        return TEMPLATE_REGISTRY[id];
    }

    /**
     * Search templates by category
     */
    searchByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
        return this.listTemplates().filter(t => t.category === category);
    }

    /**
     * Search templates by framework
     */
    searchByFramework(framework: string): ProjectTemplate[] {
        return this.listTemplates().filter(t =>
            t.frameworks.includes(framework.toLowerCase())
        );
    }

    /**
     * Generate package.json from template
     */
    generatePackageJson(template: ProjectTemplate, projectName: string): string {
        const pkg = {
            name: projectName,
            version: '0.1.0',
            private: true,
            scripts: template.scripts,
            dependencies: template.dependencies,
            devDependencies: template.devDependencies,
        };
        return JSON.stringify(pkg, null, 2);
    }

    /**
     * Get all files for a template with package.json
     */
    getTemplateFiles(templateId: string, projectName: string): FileTemplate[] {
        const template = this.getTemplate(templateId);
        if (!template) return [];

        const files = [...template.files];

        // Add package.json if not present
        if (!files.some(f => f.path === 'package.json')) {
            files.push({
                path: 'package.json',
                content: this.generatePackageJson(template, projectName)
            });
        }

        return files;
    }
}

// Export singleton
export const templateLibrary = TemplateLibrary.getInstance();
