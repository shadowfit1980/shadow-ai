/**
 * Code Export Generator
 * 
 * Generates code export configurations for different platforms:
 * - Electron Desktop (.exe, .dmg, .deb)
 * - Mobile (APK for Android, IPA for iOS)
 * - Web (HTML, PWA)
 * - Package managers (npm, pip, gem)
 */

class CodeExportGenerator {

    /**
     * Generate Electron Builder config for desktop apps
     */
    generateElectronConfig(options: {
        appName: string;
        version: string;
        description: string;
        platforms: ('win' | 'mac' | 'linux')[];
    }): string {
        const targets = options.platforms.map(p => {
            switch (p) {
                case 'win': return '"nsis"';
                case 'mac': return '"dmg"';
                case 'linux': return '"AppImage", "deb"';
                default: return '';
            }
        }).join(', ');

        return `// electron-builder.config.js
module.exports = {
    appId: 'com.${options.appName.toLowerCase().replace(/\s+/g, '')}.app',
    productName: '${options.appName}',
    version: '${options.version}',
    
    directories: {
        output: 'dist',
        buildResources: 'build'
    },
    
    files: [
        'dist/**/*',
        'node_modules/**/*',
        'package.json'
    ],
    
    ${options.platforms.includes('win') ? `win: {
        target: ['nsis', 'portable'],
        icon: 'build/icon.ico',
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
    },` : ''}
    
    ${options.platforms.includes('mac') ? `mac: {
        target: ['dmg', 'zip'],
        icon: 'build/icon.icns',
        category: 'public.app-category.developer-tools',
        hardenedRuntime: true,
        gatekeeperAssess: false,
    },
    dmg: {
        contents: [
            { x: 130, y: 220 },
            { x: 410, y: 220, type: 'link', path: '/Applications' }
        ]
    },` : ''}
    
    ${options.platforms.includes('linux') ? `linux: {
        target: ['AppImage', 'deb', 'rpm'],
        icon: 'build/icons',
        category: 'Development',
    },` : ''}
    
    publish: {
        provider: 'github',
        releaseType: 'release'
    }
};
`;
    }

    /**
     * Generate package.json scripts for building
     */
    generateBuildScripts(platforms: string[]): string {
        const scripts: Record<string, string> = {
            'build': 'npm run build:renderer && npm run build:main',
            'build:renderer': 'vite build',
            'build:main': 'tsc -p tsconfig.main.json',
        };

        if (platforms.includes('win')) {
            scripts['dist:win'] = 'electron-builder --win --x64';
            scripts['dist:win:32'] = 'electron-builder --win --ia32';
        }
        if (platforms.includes('mac')) {
            scripts['dist:mac'] = 'electron-builder --mac --x64 --arm64';
            scripts['dist:mac:universal'] = 'electron-builder --mac --universal';
        }
        if (platforms.includes('linux')) {
            scripts['dist:linux'] = 'electron-builder --linux';
        }
        scripts['dist:all'] = 'electron-builder -mwl';

        return `// Add to package.json "scripts"
${JSON.stringify(scripts, null, 2)}`;
    }

    /**
     * Generate React Native config for mobile apps
     */
    generateMobileConfig(options: {
        appName: string;
        bundleId: string;
        platforms: ('android' | 'ios')[];
    }): string {
        return `// app.json for React Native / Expo
{
    "expo": {
        "name": "${options.appName}",
        "slug": "${options.appName.toLowerCase().replace(/\s+/g, '-')}",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
        },
        ${options.platforms.includes('ios') ? `"ios": {
            "bundleIdentifier": "${options.bundleId}",
            "supportsTablet": true,
            "buildNumber": "1"
        },` : ''}
        ${options.platforms.includes('android') ? `"android": {
            "package": "${options.bundleId}",
            "versionCode": 1,
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#FFFFFF"
            }
        },` : ''}
        "extra": {
            "eas": {
                "projectId": "your-project-id"
            }
        }
    }
}`;
    }

    /**
     * Generate APK build script for Android
     */
    generateAndroidBuildScript(): string {
        return `#!/bin/bash
# Build Android APK

echo "🔨 Building Android APK..."

# Clean previous builds
cd android && ./gradlew clean

# Build release APK
./gradlew assembleRelease

# Sign the APK (requires keystore)
# jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \\
#   -keystore my-release-key.keystore \\
#   app/build/outputs/apk/release/app-release-unsigned.apk \\
#   my-key-alias

# Optimize APK
# zipalign -v 4 \\
#   app/build/outputs/apk/release/app-release-unsigned.apk \\
#   app/build/outputs/apk/release/app-release.apk

echo "✅ APK built: android/app/build/outputs/apk/release/"
`;
    }

    /**
     * Generate static HTML export configuration
     */
    generateHTMLExportConfig(options: {
        outputDir: string;
        basePath: string;
        minify: boolean;
    }): string {
        return `// vite.config.ts - Static HTML Export
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '${options.basePath}',
    build: {
        outDir: '${options.outputDir}',
        emptyOutDir: true,
        minify: ${options.minify ? "'terser'" : 'false'},
        cssMinify: ${options.minify},
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    ui: ['framer-motion', '@monaco-editor/react'],
                }
            }
        }
    }
});

// Build command: npm run build
// Output will be in: ${options.outputDir}/
// Can be deployed to any static hosting (Netlify, Vercel, GitHub Pages)
`;
    }

    /**
     * Generate PWA configuration
     */
    generatePWAConfig(options: {
        appName: string;
        shortName: string;
        themeColor: string;
        backgroundColor: string;
    }): string {
        return `// public/manifest.json
{
    "name": "${options.appName}",
    "short_name": "${options.shortName}",
    "description": "AI-powered coding assistant",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "${options.themeColor}",
    "background_color": "${options.backgroundColor}",
    "icons": [
        {
            "src": "/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        },
        {
            "src": "/icons/icon-512-maskable.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ]
}

// Service Worker: public/sw.js
const CACHE_NAME = '${options.shortName}-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
`;
    }

    /**
     * Generate npm package configuration
     */
    generateNpmPackageConfig(options: {
        name: string;
        version: string;
        description: string;
        main: string;
        types: string;
        keywords: string[];
    }): string {
        return `// package.json for npm publishing
{
    "name": "${options.name}",
    "version": "${options.version}",
    "description": "${options.description}",
    "main": "${options.main}",
    "types": "${options.types}",
    "files": ["dist", "README.md", "LICENSE"],
    "keywords": ${JSON.stringify(options.keywords)},
    "author": "",
    "license": "MIT",
    "repository": {
        "type": "git",
        "url": "https://github.com/user/repo"
    },
    "scripts": {
        "build": "tsc",
        "prepublishOnly": "npm run build",
        "test": "jest"
    },
    "devDependencies": {
        "typescript": "^5.0.0",
        "@types/node": "^20.0.0"
    }
}

// Publish with: npm publish
`;
    }

    /**
     * Generate Docker configuration for containerized deployment
     */
    generateDockerConfig(options: {
        baseImage: string;
        port: number;
        nodeVersion: string;
    }): string {
        return `# Dockerfile
FROM node:${options.nodeVersion}-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM ${options.baseImage}

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE ${options.port}
CMD ["node", "dist/main.js"]

# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "${options.port}:${options.port}"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`;
    }
}

export const codeExportGenerator = new CodeExportGenerator();
