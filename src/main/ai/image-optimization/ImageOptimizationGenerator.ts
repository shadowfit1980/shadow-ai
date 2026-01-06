// Image Optimization Generator - Image compression, lazy loading, responsive images
import Anthropic from '@anthropic-ai/sdk';

class ImageOptimizationGenerator {
    private anthropic: Anthropic | null = null;

    generateNextImageComponent(): string {
        return `import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
    sizes?: string;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
}

export function OptimizedImage({
    src,
    alt,
    width,
    height,
    priority = false,
    className = '',
    sizes = '100vw',
    quality = 80,
    placeholder = 'blur',
    blurDataURL,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true);

    const shimmer = (w: number, h: number) => \`
        <svg width="\${w}" height="\${h}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#f3f4f6"/>
                    <stop offset="50%" style="stop-color:#e5e7eb"/>
                    <stop offset="100%" style="stop-color:#f3f4f6"/>
                    <animate attributeName="x1" values="-100%;100%" dur="1.5s" repeatCount="indefinite"/>
                </linearGradient>
            </defs>
            <rect fill="url(#g)" width="\${w}" height="\${h}"/>
        </svg>\`;

    const toBase64 = (str: string) => typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

    return (
        <div className={\`relative overflow-hidden \${className}\`}>
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                fill={!width && !height}
                priority={priority}
                quality={quality}
                sizes={sizes}
                placeholder={placeholder}
                blurDataURL={blurDataURL || \`data:image/svg+xml;base64,\${toBase64(shimmer(width || 700, height || 400))}\`}
                className={\`transition-opacity duration-300 \${isLoading ? 'opacity-0' : 'opacity-100'}\`}
                onLoadingComplete={() => setIsLoading(false)}
            />
        </div>
    );
}

// Responsive image with art direction
export function ResponsiveImage({ sources, alt, className }: {
    sources: Array<{ src: string; media: string; width: number; height: number }>;
    alt: string;
    className?: string;
}) {
    return (
        <picture className={className}>
            {sources.map((source, i) => (
                <source key={i} srcSet={source.src} media={source.media} />
            ))}
            <Image src={sources[0].src} alt={alt} width={sources[0].width} height={sources[0].height} />
        </picture>
    );
}
`;
    }

    generateSharpUploadHandler(): string {
        return `import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

const s3 = new S3Client({ region: process.env.AWS_REGION });

interface ImageVariant {
    width: number;
    height?: number;
    suffix: string;
    quality?: number;
}

const defaultVariants: ImageVariant[] = [
    { width: 1920, suffix: 'xl', quality: 85 },
    { width: 1280, suffix: 'lg', quality: 85 },
    { width: 768, suffix: 'md', quality: 80 },
    { width: 480, suffix: 'sm', quality: 75 },
    { width: 200, suffix: 'thumb', quality: 70 },
];

export async function uploadOptimizedImage(
    buffer: Buffer,
    filename: string,
    variants: ImageVariant[] = defaultVariants
): Promise<{ original: string; variants: Record<string, string> }> {
    const id = uuid();
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const bucket = process.env.S3_BUCKET!;
    const prefix = process.env.S3_PREFIX || 'images';

    // Determine output format
    const format = ['png', 'gif', 'webp'].includes(ext) ? ext as 'png' | 'webp' : 'jpeg';

    // Upload original
    const originalKey = \`\${prefix}/\${id}/original.\${format}\`;
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: originalKey,
        Body: buffer,
        ContentType: \`image/\${format}\`,
    }));

    // Generate and upload variants
    const variantUrls: Record<string, string> = {};
    for (const variant of variants) {
        const resized = await sharp(buffer)
            .resize(variant.width, variant.height, { fit: 'inside', withoutEnlargement: true })
            .toFormat(format, { quality: variant.quality || 80 })
            .toBuffer();

        const key = \`\${prefix}/\${id}/\${variant.suffix}.\${format}\`;
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: resized,
            ContentType: \`image/\${format}\`,
        }));
        variantUrls[variant.suffix] = \`https://\${bucket}.s3.amazonaws.com/\${key}\`;
    }

    return {
        original: \`https://\${bucket}.s3.amazonaws.com/\${originalKey}\`,
        variants: variantUrls,
    };
}

export async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
    const blurred = await sharp(buffer)
        .resize(10, 10, { fit: 'inside' })
        .blur()
        .toBuffer();
    return \`data:image/jpeg;base64,\${blurred.toString('base64')}\`;
}
`;
    }

    generateLazyLoadComponent(): string {
        return `import { useRef, useState, useEffect } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    threshold?: number;
    rootMargin?: string;
}

export function LazyImage({
    src,
    alt,
    placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
    className = '',
    threshold = 0.1,
    rootMargin = '50px',
}: LazyImageProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return (
        <div className={\`relative overflow-hidden \${className}\`}>
            <img
                ref={imgRef}
                src={isInView ? src : placeholder}
                alt={alt}
                className={\`transition-opacity duration-500 \${isLoaded ? 'opacity-100' : 'opacity-0'}\`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
        </div>
    );
}

// Use native loading="lazy" with fallback
export function NativeLazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return (
        <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />
    );
}
`;
    }

    generateImageCDNUtils(): string {
        return `// CDN URL builders for popular image services

// Cloudinary
export function cloudinaryUrl(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
} = {}): string {
    const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options;
    const transforms = [
        width && \`w_\${width}\`,
        height && \`h_\${height}\`,
        \`q_\${quality}\`,
        \`f_\${format}\`,
        \`c_\${crop}\`,
    ].filter(Boolean).join(',');
    return \`https://res.cloudinary.com/\${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/\${transforms}/\${publicId}\`;
}

// Imgix
export function imgixUrl(path: string, options: {
    w?: number;
    h?: number;
    q?: number;
    auto?: string;
    fit?: 'clip' | 'crop' | 'fill' | 'scale';
} = {}): string {
    const params = new URLSearchParams();
    Object.entries({ ...options, auto: options.auto || 'format,compress' }).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
    });
    return \`https://\${process.env.IMGIX_DOMAIN}/\${path}?\${params}\`;
}

// ImageKit
export function imagekitUrl(path: string, transforms: string[]): string {
    const tr = transforms.join(',');
    return \`https://ik.imagekit.io/\${process.env.IMAGEKIT_ID}/\${path}?tr=\${tr}\`;
}

// Vercel Image Optimization
export function vercelImageUrl(src: string, options: { w?: number; q?: number } = {}): string {
    const params = new URLSearchParams({ url: src, ...options as any });
    return \`/_next/image?\${params}\`;
}

// Generate srcSet for responsive images
export function generateSrcSet(
    urlBuilder: (width: number) => string,
    widths: number[] = [320, 640, 960, 1280, 1920]
): string {
    return widths.map(w => \`\${urlBuilder(w)} \${w}w\`).join(', ');
}
`;
    }
}

export const imageOptimizationGenerator = new ImageOptimizationGenerator();
