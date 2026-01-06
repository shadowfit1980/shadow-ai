/**
 * SEO Generator
 * 
 * Generate SEO components, meta tags, sitemaps,
 * and structured data for Next.js/React apps.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface SEOConfig {
    siteName: string;
    siteUrl: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultImage?: string;
    twitterHandle?: string;
    locale?: string;
}

export interface PageSEO {
    title: string;
    description: string;
    url?: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    keywords?: string[];
}

// ============================================================================
// SEO GENERATOR
// ============================================================================

export class SEOGenerator extends EventEmitter {
    private static instance: SEOGenerator;

    private constructor() {
        super();
    }

    static getInstance(): SEOGenerator {
        if (!SEOGenerator.instance) {
            SEOGenerator.instance = new SEOGenerator();
        }
        return SEOGenerator.instance;
    }

    // ========================================================================
    // NEXT.JS METADATA
    // ========================================================================

    generateNextJSMetadata(): string {
        return `// lib/seo.ts
import { Metadata } from 'next';

export const siteConfig = {
  name: 'Your Site Name',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com',
  description: 'Your site description',
  defaultImage: '/og-image.png',
  twitterHandle: '@yourhandle',
  locale: 'en_US',
};

// Generate metadata for a page
export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}): Metadata {
  const pageUrl = url ? \`\${siteConfig.url}\${url}\` : siteConfig.url;
  const pageImage = image || siteConfig.defaultImage;

  return {
    title: {
      default: title,
      template: \`%s | \${siteConfig.name}\`,
    },
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url: pageUrl,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [pageImage],
      creator: siteConfig.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
    },
  };
}

// Root layout metadata
export const rootMetadata: Metadata = generateMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
});

// Example page metadata
// app/about/page.tsx
// export const metadata = generateMetadata({
//   title: 'About Us',
//   description: 'Learn more about our company',
//   url: '/about',
// });
`;
    }

    // ========================================================================
    // JSON-LD STRUCTURED DATA
    // ========================================================================

    generateStructuredData(): string {
        return `// components/structured-data.tsx
import { siteConfig } from '@/lib/seo';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization schema
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        url: siteConfig.url,
        logo: \`\${siteConfig.url}/logo.png\`,
        sameAs: [
          'https://twitter.com/yourhandle',
          'https://github.com/yourhandle',
          'https://linkedin.com/company/yourcompany',
        ],
      }}
    />
  );
}

// Website schema
export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: \`\${siteConfig.url}/search?q={search_term_string}\`,
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

// Article schema
export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: { name: string; url?: string };
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description,
        image,
        url: \`\${siteConfig.url}\${url}\`,
        datePublished,
        dateModified: dateModified || datePublished,
        author: {
          '@type': 'Person',
          name: author.name,
          url: author.url,
        },
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          logo: {
            '@type': 'ImageObject',
            url: \`\${siteConfig.url}/logo.png\`,
          },
        },
      }}
    />
  );
}

// Product schema
export function ProductJsonLd({
  name,
  description,
  image,
  price,
  currency = 'USD',
  availability = 'InStock',
  rating,
  reviewCount,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        image,
        offers: {
          '@type': 'Offer',
          price,
          priceCurrency: currency,
          availability: \`https://schema.org/\${availability}\`,
        },
        ...(rating && reviewCount && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount,
          },
        }),
      }}
    />
  );
}

// Breadcrumb schema
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: \`\${siteConfig.url}\${item.url}\`,
        })),
      }}
    />
  );
}

// FAQ schema
export function FAQJsonLd({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
`;
    }

    // ========================================================================
    // SITEMAP
    // ========================================================================

    generateSitemap(): string {
        return `// app/sitemap.ts
import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/blog',
  ].map((route) => ({
    url: \`\${siteUrl}\${route}\`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic pages (e.g., blog posts)
  // const posts = await prisma.post.findMany({
  //   select: { slug: true, updatedAt: true },
  // });
  // const blogPages = posts.map((post) => ({
  //   url: \`\${siteUrl}/blog/\${post.slug}\`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }));

  return [
    ...staticPages,
    // ...blogPages,
  ];
}

// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/private/'],
    },
    sitemap: \`\${siteUrl}/sitemap.xml\`,
  };
}
`;
    }

    // ========================================================================
    // OG IMAGE
    // ========================================================================

    generateOGImage(): string {
        return `// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Default Title';
  const description = searchParams.get('description') || '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 40,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
            {/* Your logo SVG */}
          </svg>
          <span
            style={{
              marginLeft: 16,
              fontSize: 24,
              color: '#94a3b8',
            }}
          >
            Your Site Name
          </span>
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
            lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

// Usage in metadata:
// openGraph: {
//   images: [\`/api/og?title=\${encodeURIComponent(title)}\`],
// }
`;
    }

    // ========================================================================
    // SEO COMPONENT
    // ========================================================================

    generateSEOComponent(): string {
        return `// components/seo.tsx
'use client';

import { usePathname } from 'next/navigation';
import { OrganizationJsonLd, WebsiteJsonLd, BreadcrumbJsonLd } from './structured-data';

export function SEOProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationJsonLd />
      <WebsiteJsonLd />
      {children}
    </>
  );
}

// Breadcrumb component with SEO
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const items = segments.map((segment, index) => ({
    name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
    url: '/' + segments.slice(0, index + 1).join('/'),
  }));

  if (items.length === 0) return null;

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, ...items]} />
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li>
            <a href="/">Home</a>
          </li>
          {items.map((item, index) => (
            <li key={item.url}>
              {index === items.length - 1 ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <a href={item.url}>{item.name}</a>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Analytics-friendly link tracking
export function TrackedLink({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = () => {
    // Track outbound links
    if (href?.startsWith('http') && typeof window !== 'undefined') {
      window.gtag?.('event', 'click', {
        event_category: 'outbound',
        event_label: href,
      });
    }
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
`;
    }

    // ========================================================================
    // FLUTTER SEO (FOR WEB)
    // ========================================================================

    generateFlutterSEO(): string {
        return `// For Flutter Web SEO
import 'dart:html' as html;

class SEOService {
  static void updateMetaTags({
    required String title,
    required String description,
    String? image,
    String? url,
  }) {
    // Update title
    html.document.title = title;
    
    // Update meta tags
    _updateMetaTag('description', description);
    _updateMetaTag('og:title', title);
    _updateMetaTag('og:description', description);
    if (image != null) _updateMetaTag('og:image', image);
    if (url != null) _updateMetaTag('og:url', url);
    
    // Twitter cards
    _updateMetaTag('twitter:card', 'summary_large_image');
    _updateMetaTag('twitter:title', title);
    _updateMetaTag('twitter:description', description);
    if (image != null) _updateMetaTag('twitter:image', image);
  }

  static void _updateMetaTag(String name, String content) {
    var meta = html.document.querySelector('meta[name="\$name"]') ??
        html.document.querySelector('meta[property="\$name"]');
    
    if (meta == null) {
      meta = html.MetaElement()
        ..name = name
        ..content = content;
      html.document.head?.append(meta);
    } else {
      (meta as html.MetaElement).content = content;
    }
  }

  static void setCanonicalUrl(String url) {
    var link = html.document.querySelector('link[rel="canonical"]');
    
    if (link == null) {
      link = html.LinkElement()
        ..rel = 'canonical'
        ..href = url;
      html.document.head?.append(link);
    } else {
      (link as html.LinkElement).href = url;
    }
  }
}

// Usage in StatefulWidget
// @override
// void initState() {
//   super.initState();
//   SEOService.updateMetaTags(
//     title: 'Page Title',
//     description: 'Page description',
//   );
// }
`;
    }
}

export const seoGenerator = SEOGenerator.getInstance();
