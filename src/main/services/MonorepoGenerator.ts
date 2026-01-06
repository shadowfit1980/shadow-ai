/**
 * 📦 Monorepo Setup Generator
 * 
 * Generate monorepo configurations:
 * - Turborepo, Nx, pnpm workspaces
 */

import { EventEmitter } from 'events';

export type MonorepoTool = 'turborepo' | 'nx' | 'lerna';

export class MonorepoGenerator extends EventEmitter {
    private static instance: MonorepoGenerator;

    private constructor() { super(); }

    static getInstance(): MonorepoGenerator {
        if (!MonorepoGenerator.instance) {
            MonorepoGenerator.instance = new MonorepoGenerator();
        }
        return MonorepoGenerator.instance;
    }

    getTools(): MonorepoTool[] {
        return ['turborepo', 'nx', 'lerna'];
    }

    generate(tool: MonorepoTool): { files: { name: string; content: string }[] } {
        switch (tool) {
            case 'turborepo': return this.generateTurborepo();
            case 'nx': return this.generateNx();
            case 'lerna': return this.generateLerna();
            default: return this.generateTurborepo();
        }
    }

    private generateTurborepo(): { files: { name: string; content: string }[] } {
        return {
            files: [
                {
                    name: 'turbo.json',
                    content: `{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {}
  }
}`
                },
                {
                    name: 'package.json',
                    content: `{
  "name": "monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "format": "prettier --write \\"**/*.{ts,tsx,js,jsx,json,md}\\"",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "@changesets/cli": "^2.26.0"
  },
  "engines": {
    "node": ">=18"
  },
  "packageManager": "pnpm@8.10.0"
}`
                },
                {
                    name: 'pnpm-workspace.yaml',
                    content: `packages:
  - 'apps/*'
  - 'packages/*'`
                },
                {
                    name: '.npmrc',
                    content: `auto-install-peers=true
strict-peer-dependencies=false`
                },
                {
                    name: 'apps/web/package.json',
                    content: `{
  "name": "@repo/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/utils": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
                },
                {
                    name: 'packages/ui/package.json',
                    content: `{
  "name": "@repo/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}`
                }
            ]
        };
    }

    private generateNx(): { files: { name: string; content: string }[] } {
        return {
            files: [
                {
                    name: 'nx.json',
                    content: `{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/*.spec.ts"]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    },
    "lint": {
      "inputs": ["default"],
      "cache": true
    }
  },
  "defaultBase": "main",
  "parallel": 3,
  "cacheDirectory": ".nx/cache"
}`
                },
                {
                    name: 'package.json',
                    content: `{
  "name": "nx-monorepo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "nx run-many -t serve",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint",
    "affected": "nx affected",
    "graph": "nx graph"
  },
  "devDependencies": {
    "nx": "^17.0.0",
    "@nx/js": "^17.0.0",
    "@nx/react": "^17.0.0",
    "@nx/next": "^17.0.0"
  }
}`
                }
            ]
        };
    }

    private generateLerna(): { files: { name: string; content: string }[] } {
        return {
            files: [
                {
                    name: 'lerna.json',
                    content: `{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "command": {
    "version": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    },
    "publish": {
      "conventionalCommits": true
    }
  }
}`
                },
                {
                    name: 'package.json',
                    content: `{
  "name": "lerna-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "lerna run dev --parallel",
    "build": "lerna run build",
    "test": "lerna run test",
    "publish": "lerna publish"
  },
  "devDependencies": {
    "lerna": "^7.0.0"
  }
}`
                }
            ]
        };
    }

    generateSharedConfig(): string {
        return `// Shared ESLint Config
// packages/eslint-config/index.js

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  settings: {
    react: { version: 'detect' }
  }
};

// Shared TypeScript Config
// packages/tsconfig/base.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
`;
    }
}

export const monorepoGenerator = MonorepoGenerator.getInstance();
