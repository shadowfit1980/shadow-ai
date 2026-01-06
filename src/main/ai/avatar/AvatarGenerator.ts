// Avatar Generator - Avatar components and user initials
import Anthropic from '@anthropic-ai/sdk';

class AvatarGenerator {
    private anthropic: Anthropic | null = null;

    generateAvatar(): string {
        return `import { useState, useMemo } from 'react';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
    className?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizes = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
const statusColors = { online: 'bg-green-500', offline: 'bg-gray-400', away: 'bg-yellow-500', busy: 'bg-red-500' };

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function getColorFromName(name: string): string {
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

export function Avatar({ src, alt, name = '', size = 'md', rounded = 'full', className = '', status }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    const dimension = typeof size === 'number' ? size : sizes[size];
    const roundedClass = rounded === true ? 'rounded' : rounded === false ? '' : \`rounded-\${rounded}\`;
    const initials = useMemo(() => getInitials(name), [name]);
    const bgColor = useMemo(() => getColorFromName(name), [name]);

    const showImage = src && !imgError;

    return (
        <div className={\`relative inline-flex items-center justify-center \${roundedClass} \${className}\`}
            style={{ width: dimension, height: dimension, backgroundColor: showImage ? 'transparent' : bgColor }}>
            {showImage ? (
                <img src={src} alt={alt || name} className={\`w-full h-full object-cover \${roundedClass}\`} onError={() => setImgError(true)} />
            ) : (
                <span className="text-white font-medium" style={{ fontSize: dimension * 0.4 }}>{initials}</span>
            )}
            {status && (
                <span className={\`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full \${statusColors[status]}\`} />
            )}
        </div>
    );
}
`;
    }

    generateAvatarGroup(): string {
        return `import { Avatar } from './Avatar';
import { ReactNode } from 'react';

interface AvatarGroupProps {
    avatars: Array<{ src?: string; name?: string; status?: 'online' | 'offline' | 'away' | 'busy' }>;
    max?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
    className?: string;
}

export function AvatarGroup({ avatars, max = 5, size = 'md', className = '' }: AvatarGroupProps) {
    const visible = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className={\`flex -space-x-2 \${className}\`}>
            {visible.map((avatar, i) => (
                <Avatar key={i} {...avatar} size={size} className="ring-2 ring-white dark:ring-gray-800" />
            ))}
            {remaining > 0 && (
                <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full ring-2 ring-white dark:ring-gray-800"
                    style={{ width: typeof size === 'number' ? size : 40, height: typeof size === 'number' ? size : 40 }}>
                    <span className="text-xs font-medium">+{remaining}</span>
                </div>
            )}
        </div>
    );
}

// Avatar with tooltip
export function AvatarWithTooltip({ name, children }: { name: string; children: ReactNode }) {
    return (
        <div className="group relative">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {name}
            </div>
        </div>
    );
}
`;
    }

    generateAvatarUpload(): string {
        return `import { useState, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
    currentImage?: string;
    onUpload: (file: File) => Promise<string>;
    onRemove?: () => void;
    size?: number;
    accept?: string;
    maxSize?: number;
}

export function AvatarUpload({
    currentImage, onUpload, onRemove, size = 96, accept = 'image/*', maxSize = 5 * 1024 * 1024
}: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > maxSize) {
            setError(\`File too large. Max size: \${maxSize / 1024 / 1024}MB\`);
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        setLoading(true);

        try {
            const url = await onUpload(file);
            setPreview(url);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setPreview(currentImage || null);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onRemove?.();
    };

    return (
        <div className="relative inline-block">
            <div className="relative group" style={{ width: size, height: size }}>
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {preview ? (
                        <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-3xl">👤</span>
                        </div>
                    )}
                </div>
                <button onClick={() => inputRef.current?.click()} disabled={loading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    {loading ? '⏳' : '📷'}
                </button>
            </div>
            <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
            {preview && onRemove && (
                <button onClick={handleRemove} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button>
            )}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-full left-0 mt-2 text-xs text-red-500">{error}</motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
`;
    }

    generateAvatarEditor(): string {
        return `import { useState, useRef, useCallback, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface AvatarEditorProps {
    image: string;
    onSave: (croppedImage: Blob) => void;
    onCancel: () => void;
    size?: number;
    borderRadius?: number;
}

export function AvatarEditor({ image, onSave, onCancel, size = 200, borderRadius = 100 }: AvatarEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }, [isDragging, dragStart]);

    const handleMouseUp = () => setIsDragging(false);

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx?.drawImage(img, position.x, position.y, img.width * scale, img.height * scale);
            canvas.toBlob((blob) => { if (blob) onSave(blob); }, 'image/png');
        };
        img.src = image;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="relative overflow-hidden" style={{ width: size, height: size, borderRadius }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <motion.img src={image} alt="Edit"
                    className="absolute cursor-move"
                    style={{ x: position.x, y: position.y, scale }} draggable={false} />
                <div className="absolute inset-0 border-2 border-white/50 pointer-events-none" style={{ borderRadius }} />
            </div>
            <input type="range" min="1" max="3" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full" />
            <div className="flex gap-2">
                <button onClick={onCancel} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Save</button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
`;
    }
}

export const avatarGenerator = new AvatarGenerator();
