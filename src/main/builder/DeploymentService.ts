import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Deployment Service
 * Handles deployment to various platforms
 */
export class DeploymentService {
    /**
     * Deploy project
     */
    async deploy(config: any): Promise<any> {
        const platform = config.platform || 'vercel';

        switch (platform.toLowerCase()) {
            case 'vercel':
                return await this.deployToVercel(config);
            case 'netlify':
                return await this.deployToNetlify(config);
            case 'render':
                return await this.deployToRender(config);
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    /**
     * Deploy to Vercel
     */
    private async deployToVercel(config: any): Promise<any> {
        const projectPath = config.path;

        try {
            // Generate SEO metadata
            await this.generateSEO(projectPath, config);

            // Deploy using Vercel CLI
            const { stdout, stderr } = await execAsync('npx -y vercel --prod --yes', {
                cwd: projectPath,
                env: {
                    ...process.env,
                    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
                },
            });

            return {
                success: true,
                platform: 'vercel',
                url: this.extractVercelUrl(stdout),
                output: stdout,
            };
        } catch (error: any) {
            return {
                success: false,
                platform: 'vercel',
                error: error.message,
            };
        }
    }

    /**
     * Deploy to Netlify
     */
    private async deployToNetlify(config: any): Promise<any> {
        const projectPath = config.path;

        try {
            await this.generateSEO(projectPath, config);

            const { stdout } = await execAsync('npx -y netlify deploy --prod', {
                cwd: projectPath,
                env: {
                    ...process.env,
                    NETLIFY_AUTH_TOKEN: process.env.NETLIFY_TOKEN,
                },
            });

            return {
                success: true,
                platform: 'netlify',
                url: this.extractNetlifyUrl(stdout),
                output: stdout,
            };
        } catch (error: any) {
            return {
                success: false,
                platform: 'netlify',
                error: error.message,
            };
        }
    }

    /**
     * Deploy to Render
     */
    private async deployToRender(config: any): Promise<any> {
        return {
            success: false,
            platform: 'render',
            error: 'Render deployment requires manual setup via their dashboard',
            instructions: 'Visit https://render.com and connect your repository',
        };
    }

    /**
     * Generate SEO metadata
     */
    private async generateSEO(projectPath: string, config: any): Promise<void> {
        const seoData = {
            title: config.name || 'My App',
            description: config.description || 'Built with Shadow AI',
            keywords: config.keywords || [],
        };

        // Generate robots.txt
        const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${config.url || 'https://example.com'}/sitemap.xml
`;

        const robotsPath = path.join(projectPath, 'public', 'robots.txt');
        const publicDir = path.dirname(robotsPath);

        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(robotsPath, robotsTxt, 'utf8');

        // Generate basic sitemap.xml
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.url || 'https://example.com'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
`;

        fs.writeFileSync(path.join(projectPath, 'public', 'sitemap.xml'), sitemap, 'utf8');
    }

    /**
     * Extract Vercel URL from output
     */
    private extractVercelUrl(output: string): string {
        const match = output.match(/https:\/\/[^\s]+\.vercel\.app/);
        return match ? match[0] : '';
    }

    /**
     * Extract Netlify URL from output
     */
    private extractNetlifyUrl(output: string): string {
        const match = output.match(/https:\/\/[^\s]+\.netlify\.app/);
        return match ? match[0] : '';
    }
}
