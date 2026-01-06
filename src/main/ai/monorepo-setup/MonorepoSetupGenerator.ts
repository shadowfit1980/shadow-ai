// Monorepo Setup Generator - Generate monorepo configurations
import Anthropic from '@anthropic-ai/sdk';

interface MonorepoConfig {
    name: string;
    packages: Array<{
        name: string;
        type: 'app' | 'lib' | 'shared';
        framework?: string;
    }>;
    packageManager: 'npm' | 'yarn' | 'pnpm';
}

class MonorepoSetupGenerator {
    private anthropic: Anthropic | null = null;

    private getClient(): Anthropic {
        if (!this.anthropic) {
            this.anthropic = new Anthropic();
        }
        return this.anthropic;
    }

    generateTurborepoConfig(config: MonorepoConfig): string {
        return JSON.stringify({
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
                "dev": {
                    "cache": false,
                    "persistent": true
                },
                "test": {
                    "dependsOn": ["build"],
                    "outputs": ["coverage/**"]
                },
                "typecheck": {
                    "dependsOn": ["^typecheck"]
                }
            }
        }, null, 2);
    }

    generateNxConfig(config: MonorepoConfig): string {
        return JSON.stringify({
            "$schema": "./node_modules/nx/schemas/nx-schema.json",
            "npmScope": config.name,
            "tasksRunnerOptions": {
                "default": {
                    "runner": "nx/tasks-runners/default",
                    "options": {
                        "cacheableOperations": ["build", "lint", "test", "e2e"]
                    }
                }
            },
            "targetDefaults": {
                "build": {
                    "dependsOn": ["^build"],
                    "inputs": ["production", "^production"]
                },
                "test": {
                    "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
                }
            },
            "namedInputs": {
                "default": ["{projectRoot}/**/*", "sharedGlobals"],
                "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)"],
                "sharedGlobals": []
            },
            "generators": {
                "@nx/react": {
                    "application": { "babel": true },
                    "library": { "unitTestRunner": "jest" }
                }
            }
        }, null, 2);
    }

    generateLernaConfig(config: MonorepoConfig): string {
        return JSON.stringify({
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "version": "independent",
            "npmClient": config.packageManager,
            "useWorkspaces": true,
            "command": {
                "publish": {
                    "conventionalCommits": true,
                    "message": "chore(release): publish"
                },
                "version": {
                    "conventionalCommits": true,
                    "createRelease": "github"
                }
            },
            "packages": ["packages/*", "apps/*"]
        }, null, 2);
    }

    generatePnpmWorkspace(): string {
        return `packages:
  - 'apps/*'
  - 'packages/*'
  - 'libs/*'
`;
    }

    generateRootPackageJson(config: MonorepoConfig): string {
        const workspaces = config.packageManager === 'pnpm'
            ? undefined
            : ["apps/*", "packages/*", "libs/*"];

        return JSON.stringify({
            "name": config.name,
            "version": "1.0.0",
            "private": true,
            ...(workspaces && { workspaces }),
            "scripts": {
                "build": "turbo run build",
                "dev": "turbo run dev",
                "lint": "turbo run lint",
                "test": "turbo run test",
                "typecheck": "turbo run typecheck",
                "clean": "turbo run clean && rm -rf node_modules",
                "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
                "prepare": "husky install"
            },
            "devDependencies": {
                "turbo": "^2.0.0",
                "typescript": "^5.0.0",
                "prettier": "^3.0.0",
                "eslint": "^8.0.0",
                "husky": "^9.0.0",
                "lint-staged": "^15.0.0",
                "@changesets/cli": "^2.27.0"
            },
            "packageManager": `${config.packageManager}@latest`,
            "engines": {
                "node": ">=18.0.0"
            }
        }, null, 2);
    }

    generatePackageTemplate(pkg: { name: string; type: string; framework?: string }): string {
        const isApp = pkg.type === 'app';

        return JSON.stringify({
            "name": `@monorepo/${pkg.name}`,
            "version": "1.0.0",
            "private": isApp,
            "main": isApp ? undefined : "./dist/index.js",
            "types": isApp ? undefined : "./dist/index.d.ts",
            "exports": isApp ? undefined : {
                ".": {
                    "import": "./dist/index.mjs",
                    "require": "./dist/index.js",
                    "types": "./dist/index.d.ts"
                }
            },
            "scripts": {
                "build": isApp ? "next build" : "tsup src/index.ts --format cjs,esm --dts",
                "dev": isApp ? "next dev" : "tsup src/index.ts --watch",
                "lint": "eslint src/",
                "test": "vitest run",
                "typecheck": "tsc --noEmit"
            },
            "dependencies": {},
            "devDependencies": {
                "typescript": "^5.0.0",
                "tsup": isApp ? undefined : "^8.0.0",
                "vitest": "^1.0.0",
                "@types/node": "^20.0.0"
            }
        }, null, 2);
    }

    generateTsConfigBase(): string {
        return JSON.stringify({
            "$schema": "https://json.schemastore.org/tsconfig",
            "display": "Default",
            "compilerOptions": {
                "composite": false,
                "declaration": true,
                "declarationMap": true,
                "esModuleInterop": true,
                "forceConsistentCasingInFileNames": true,
                "inlineSources": false,
                "isolatedModules": true,
                "moduleResolution": "node",
                "noUnusedLocals": false,
                "noUnusedParameters": false,
                "preserveWatchOutput": true,
                "skipLibCheck": true,
                "strict": true,
                "strictNullChecks": true
            },
            "exclude": ["node_modules"]
        }, null, 2);
    }

    generateChangesetsConfig(): string {
        return JSON.stringify({
            "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
            "changelog": "@changesets/cli/changelog",
            "commit": false,
            "fixed": [],
            "linked": [],
            "access": "restricted",
            "baseBranch": "main",
            "updateInternalDependencies": "patch",
            "ignore": []
        }, null, 2);
    }
}

export const monorepoSetupGenerator = new MonorepoSetupGenerator();
