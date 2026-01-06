/**
 * CI/CD Pipeline Generator
 * 
 * Generate CI/CD configurations for GitHub Actions,
 * GitLab CI, Jenkins, CircleCI, and Azure Pipelines.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type CICDProvider = 'github-actions' | 'gitlab-ci' | 'jenkins' | 'circleci' | 'azure-pipelines';

export interface PipelineConfig {
    provider: CICDProvider;
    nodejs?: boolean;
    python?: boolean;
    docker?: boolean;
    testing?: boolean;
    linting?: boolean;
    deployment?: boolean;
    notifications?: boolean;
}

export interface DeploymentTarget {
    type: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'heroku';
    environment: 'development' | 'staging' | 'production';
}

// ============================================================================
// CI/CD PIPELINE GENERATOR
// ============================================================================

export class CICDPipelineGenerator extends EventEmitter {
    private static instance: CICDPipelineGenerator;

    private constructor() {
        super();
    }

    static getInstance(): CICDPipelineGenerator {
        if (!CICDPipelineGenerator.instance) {
            CICDPipelineGenerator.instance = new CICDPipelineGenerator();
        }
        return CICDPipelineGenerator.instance;
    }

    // ========================================================================
    // GITHUB ACTIONS
    // ========================================================================

    generateGitHubActions(config: PipelineConfig): string {
        return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
${config.linting ? `  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
` : ''}
${config.testing ? `
  test:
    runs-on: ubuntu-latest
    ${config.linting ? 'needs: lint' : ''}
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js $\{{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: $\{{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
` : ''}
${config.docker ? `
  build:
    runs-on: ubuntu-latest
    ${config.testing ? 'needs: test' : ''}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: $\{{ secrets.DOCKER_USERNAME }}
          password: $\{{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            $\{{ secrets.DOCKER_USERNAME }}/myapp:latest
            $\{{ secrets.DOCKER_USERNAME }}/myapp:$\{{ github.sha }}
          cache-from: type=registry,ref=$\{{ secrets.DOCKER_USERNAME }}/myapp:buildcache
          cache-to: type=registry,ref=$\{{ secrets.DOCKER_USERNAME }}/myapp:buildcache,mode=max
` : ''}
${config.deployment ? `
  deploy:
    runs-on: ubuntu-latest
    ${config.testing ? 'needs: [test' + (config.docker ? ', build]' : ']') : config.docker ? 'needs: build' : ''}
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Add your deployment script here
          echo "Deploying to production..."
      
      - name: Notify deployment
        if: always()
        run: |
          echo "Deployment status: $\{{ job.status }}"
` : ''}
`;
    }

    // ========================================================================
    // GITLAB CI
    // ========================================================================

    generateGitLabCI(config: PipelineConfig): string {
        return `# GitLab CI/CD Pipeline

stages:
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2

${config.linting ? `lint:
  stage: lint
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm run lint
    - npm run type-check
  cache:
    key: \${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
` : ''}
${config.testing ? `
test:
  stage: test
  image: node:\${NODE_VERSION}
  ${config.linting ? 'needs: [lint]' : ''}
  script:
    - npm ci
    - npm test
    - npm run test:coverage
  coverage: '/All files[^|]*\\|[^|]*\\s+([\\d\\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
  cache:
    key: \${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
` : ''}
${config.docker ? `
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  ${config.testing ? 'needs: [test]' : ''}
  script:
    - docker login -u \${CI_REGISTRY_USER} -p \${CI_REGISTRY_PASSWORD} \${CI_REGISTRY}
    - docker build -t \${CI_REGISTRY_IMAGE}:latest -t \${CI_REGISTRY_IMAGE}:\${CI_COMMIT_SHA} .
    - docker push \${CI_REGISTRY_IMAGE}:latest
    - docker push \${CI_REGISTRY_IMAGE}:\${CI_COMMIT_SHA}
  only:
    - main
    - develop
` : ''}
${config.deployment ? `
deploy:production:
  stage: deploy
  image: alpine:latest
  ${config.docker ? 'needs: [build]' : config.testing ? 'needs: [test]' : ''}
  script:
    - echo "Deploying to production..."
    # Add deployment commands
  environment:
    name: production
    url: https://production.example.com
  only:
    - main
  when: manual

deploy:staging:
  stage: deploy
  image: alpine:latest
  ${config.docker ? 'needs: [build]' : config.testing ? 'needs: [test]' : ''}
  script:
    - echo "Deploying to staging..."
    # Add deployment commands
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop
` : ''}
`;
    }

    // ========================================================================
    // JENKINS
    // ========================================================================

    generateJenkinsfile(config: PipelineConfig): string {
        return `pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCKER_REGISTRY = 'docker.io'
    }
    
    stages {
${config.linting ? `        stage('Lint') {
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm run type-check'
            }
        }
        
` : ''}${config.testing ? `        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test'
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit 'coverage/junit.xml'
                    publishHTML([
                        reportDir: 'coverage',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
        
` : ''}${config.docker ? `        stage('Build Docker Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.build("myapp:\${env.BUILD_ID}")
                }
            }
        }
        
        stage('Push Docker Image') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry('https://\${DOCKER_REGISTRY}', 'docker-credentials') {
                        docker.image("myapp:\${env.BUILD_ID}").push('latest')
                        docker.image("myapp:\${env.BUILD_ID}").push("\${env.BUILD_ID}")
                    }
                }
            }
        }
        
` : ''}${config.deployment ? `        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'echo "Deploying to production..."'
                // Add deployment script
            }
        }
` : ''}    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
            ${config.notifications ? "slackSend(color: 'good', message: \"Build succeeded: \${env.JOB_NAME} [\${env.BUILD_NUMBER}]\")" : ''}
        }
        failure {
            echo 'Pipeline failed!'
            ${config.notifications ? "slackSend(color: 'danger', message: \"Build failed: \${env.JOB_NAME} [\${env.BUILD_NUMBER}]\")" : ''}
        }
    }
}
`;
    }

    // ========================================================================
    // CIRCLECI
    // ========================================================================

    generateCircleCI(config: PipelineConfig): string {
        return `version: 2.1

orbs:
  node: circleci/node@5.0

jobs:
${config.linting ? `  lint:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run linter
          command: npm run lint
      - run:
          name: Type check
          command: npm run type-check
  
` : ''}${config.testing ? `  test:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run tests
          command: npm test
      - run:
          name: Generate coverage
          command: npm run test:coverage
      - store_test_results:
          path: coverage
      - store_artifacts:
          path: coverage
  
` : ''}${config.docker ? `  build:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - setup_remote_docker:
          docker_layer_caching: true
      - run:
          name: Build Docker image
          command: |
            docker build -t myapp:latest .
            docker tag myapp:latest myapp:\${CIRCLE_SHA1}
      - run:
          name: Push to registry
          command: |
            echo \${DOCKER_PASSWORD} | docker login -u \${DOCKER_USERNAME} --password-stdin
            docker push myapp:latest
            docker push myapp:\${CIRCLE_SHA1}
  
` : ''}${config.deployment ? `  deploy:
    docker:
      - image: cimg/base:stable
    steps:
      - checkout
      - run:
          name: Deploy
          command: |
            echo "Deploying to production..."
            # Add deployment commands
` : ''}
workflows:
  version: 2
  build-test-deploy:
    jobs:
${config.linting ? '      - lint\n' : ''}${config.testing ? `      - test${config.linting ? ':' : ''}
${config.linting ? '          requires:\n            - lint\n' : ''}` : ''}${config.docker ? `      - build${config.testing || config.linting ? ':' : ''}
${config.testing ? '          requires:\n            - test\n' : config.linting ? '          requires:\n            - lint\n' : ''}          filters:
            branches:
              only: main
` : ''}${config.deployment ? `      - deploy:
          requires:
${config.docker ? '            - build\n' : config.testing ? '            - test\n' : config.linting ? '            - lint\n' : ''}          filters:
            branches:
              only: main
` : ''}`;
    }

    // ========================================================================
    // DOCKER COMPOSE FOR CI
    // ========================================================================

    generateDockerComposeCI(): string {
        return `# docker-compose.ci.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: test
      DATABASE_URL: postgres://postgres:postgres@db:5432/test
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis
    command: npm test

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: test
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
`;
    }
}

export const cicdPipelineGenerator = CICDPipelineGenerator.getInstance();
