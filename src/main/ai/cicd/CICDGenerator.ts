/**
 * CI/CD Pipeline Generator
 * 
 * Generate CI/CD configurations for GitHub Actions, GitLab CI,
 * Bitbucket Pipelines, and more.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export type CIProvider = 'github' | 'gitlab' | 'bitbucket' | 'circleci' | 'jenkins';
export type DeployTarget = 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure' | 'docker' | 'kubernetes';

export interface PipelineConfig {
    provider: CIProvider;
    deploy?: DeployTarget;
    language: 'node' | 'python' | 'java' | 'go' | 'dotnet' | 'php';
    features: {
        test?: boolean;
        lint?: boolean;
        build?: boolean;
        deploy?: boolean;
        docker?: boolean;
        cache?: boolean;
    };
    branches?: string[];
    nodeVersion?: string;
    pythonVersion?: string;
}

// ============================================================================
// CI/CD GENERATOR
// ============================================================================

export class CICDGenerator extends EventEmitter {
    private static instance: CICDGenerator;

    private constructor() {
        super();
    }

    static getInstance(): CICDGenerator {
        if (!CICDGenerator.instance) {
            CICDGenerator.instance = new CICDGenerator();
        }
        return CICDGenerator.instance;
    }

    // ========================================================================
    // PIPELINE GENERATION
    // ========================================================================

    /**
     * Generate CI/CD pipeline configuration
     */
    generate(config: PipelineConfig): string {
        switch (config.provider) {
            case 'github':
                return this.generateGitHubActions(config);
            case 'gitlab':
                return this.generateGitLabCI(config);
            case 'bitbucket':
                return this.generateBitbucketPipelines(config);
            case 'circleci':
                return this.generateCircleCI(config);
            default:
                return this.generateGitHubActions(config);
        }
    }

    private generateGitHubActions(config: PipelineConfig): string {
        const { language, features, branches = ['main'], nodeVersion = '20', pythonVersion = '3.11' } = config;

        let yaml = `name: CI/CD Pipeline

on:
  push:
    branches: [${branches.join(', ')}]
  pull_request:
    branches: [${branches.join(', ')}]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
`;

        // Language setup
        if (language === 'node') {
            yaml += `
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '${nodeVersion}'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
`;
        } else if (language === 'python') {
            yaml += `
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '${pythonVersion}'
          cache: 'pip'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
`;
        } else if (language === 'go') {
            yaml += `
      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      
      - name: Install dependencies
        run: go mod download
`;
        }

        // Lint
        if (features.lint) {
            yaml += `
      - name: Lint
        run: npm run lint
`;
        }

        // Test
        if (features.test) {
            yaml += `
      - name: Run tests
        run: npm test
`;
        }

        // Build
        if (features.build) {
            yaml += `
      - name: Build
        run: npm run build
`;
        }

        // Docker
        if (features.docker) {
            yaml += `
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ github.repository }}:latest
`;
        }

        // Deploy
        if (features.deploy && config.deploy) {
            yaml += this.getDeployStep(config.deploy);
        }

        return yaml;
    }

    private getDeployStep(target: DeployTarget): string {
        switch (target) {
            case 'vercel':
                return `
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;
            case 'netlify':
                return `
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
        env:
          NETLIFY_AUTH_TOKEN: \${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: \${{ secrets.NETLIFY_SITE_ID }}
`;
            case 'aws':
                return `
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to AWS
        run: aws s3 sync ./dist s3://\${{ secrets.AWS_S3_BUCKET }}
`;
            default:
                return '';
        }
    }

    private generateGitLabCI(config: PipelineConfig): string {
        const { language, features } = config;

        let yaml = `stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "20"

`;

        if (language === 'node') {
            yaml += `build:
  stage: build
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
  cache:
    paths:
      - node_modules/

`;
        }

        if (features.test) {
            yaml += `test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm test
  cache:
    paths:
      - node_modules/

`;
        }

        if (features.deploy) {
            yaml += `deploy:
  stage: deploy
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run deploy
  only:
    - main

`;
        }

        return yaml;
    }

    private generateBitbucketPipelines(config: PipelineConfig): string {
        return `image: node:20

pipelines:
  default:
    - step:
        name: Build and Test
        caches:
          - node
        script:
          - npm ci
          - npm run lint
          - npm test
          - npm run build
        artifacts:
          - dist/**

  branches:
    main:
      - step:
          name: Deploy to Production
          deployment: production
          script:
            - npm ci
            - npm run build
            - npm run deploy
`;
    }

    private generateCircleCI(config: PipelineConfig): string {
        return `version: 2.1

orbs:
  node: circleci/node@5

jobs:
  build-and-test:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run tests
          command: npm test
      - run:
          name: Build
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist

  deploy:
    docker:
      - image: cimg/node:20.0
    steps:
      - attach_workspace:
          at: .
      - run:
          name: Deploy
          command: npm run deploy

workflows:
  build-deploy:
    jobs:
      - build-and-test
      - deploy:
          requires:
            - build-and-test
          filters:
            branches:
              only: main
`;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Save pipeline to project
     */
    async savePipeline(config: PipelineConfig, projectPath: string): Promise<string> {
        const content = this.generate(config);
        let filePath: string;

        switch (config.provider) {
            case 'github':
                filePath = path.join(projectPath, '.github', 'workflows', 'ci.yml');
                break;
            case 'gitlab':
                filePath = path.join(projectPath, '.gitlab-ci.yml');
                break;
            case 'bitbucket':
                filePath = path.join(projectPath, 'bitbucket-pipelines.yml');
                break;
            case 'circleci':
                filePath = path.join(projectPath, '.circleci', 'config.yml');
                break;
            default:
                filePath = path.join(projectPath, 'ci.yml');
        }

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);

        this.emit('pipeline:saved', { path: filePath, provider: config.provider });
        return filePath;
    }

    /**
     * Generate Dockerfile
     */
    generateDockerfile(language: 'node' | 'python' | 'go' | 'java'): string {
        switch (language) {
            case 'node':
                return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
`;
            case 'python':
                return `FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0"]
`;
            case 'go':
                return `FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
`;
            default:
                return '';
        }
    }
}

// Export singleton
export const cicdGenerator = CICDGenerator.getInstance();
