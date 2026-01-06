// SEO Optimization Generator - Generate SEO utilities
import Anthropic from '@anthropic-ai/sdk';

interface SEOConfig {
    title: string;
    description: string;
    url: string;
    image?: string;
    type?: string;
    keywords?: string[];
}

class SEOOptimizationGenerator {
    private anthropic: Anthropic | null = null;

    generateNextJSSEO(config: SEOConfig): string {
        return `import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '${config.title}',
    description: '${config.description}',
    keywords: ${JSON.stringify(config.keywords || [])},
    openGraph: {
        title: '${config.title}',
        description: '${config.description}',
        url: '${config.url}',
        siteName: '${config.title}',
        images: [{ url: '${config.image || '/og-image.png'}', width: 1200, height: 630 }],
        type: '${config.type || 'website'}',
    },
    twitter: {
        card: 'summary_large_image',
        title: '${config.title}',
        description: '${config.description}',
        images: ['${config.image || '/og-image.png'}'],
    },
    robots: { index: true, follow: true },
    alternates: { canonical: '${config.url}' },
};
`;
    }

    generateReactHelmetSEO(config: SEOConfig): string {
        return `import { Helmet } from 'react-helmet-async';

export function SEO({ title = '${config.title}', description = '${config.description}', url = '${config.url}', image = '${config.image || '/og-image.png'}' }) {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content="${(config.keywords || []).join(', ')}" />
            <link rel="canonical" href={url} />
            
            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />
            <meta property="og:type" content="${config.type || 'website'}" />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
`;
    }

    generateSitemap(pages: Array<{ url: string; priority?: number; changefreq?: string }>): string {
        const urls = pages.map(p => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${p.changefreq || 'weekly'}</changefreq>
    <priority>${p.priority || 0.8}</priority>
  </url>`).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
    }

    generateRobotsTxt(sitemapUrl: string, disallow: string[] = []): string {
        return `User-agent: *
Allow: /
${disallow.map(d => `Disallow: ${d}`).join('\n')}

Sitemap: ${sitemapUrl}
`;
    }

    generateStructuredData(type: 'Organization' | 'Article' | 'Product', data: Record<string, unknown>): string {
        const schemas: Record<string, object> = {
            Organization: {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: data.name,
                url: data.url,
                logo: data.logo,
                sameAs: data.socialLinks
            },
            Article: {
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: data.title,
                description: data.description,
                author: { '@type': 'Person', name: data.author },
                datePublished: data.publishDate,
                image: data.image
            },
            Product: {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: data.name,
                description: data.description,
                image: data.image,
                offers: { '@type': 'Offer', price: data.price, priceCurrency: data.currency }
            }
        };

        return `<script type="application/ld+json">
${JSON.stringify(schemas[type], null, 2)}
</script>`;
    }
}

export const seoOptimizationGenerator = new SEOOptimizationGenerator();
