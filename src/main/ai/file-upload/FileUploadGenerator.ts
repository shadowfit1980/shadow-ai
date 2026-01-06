// File Upload Generator - Generate file upload utilities
import Anthropic from '@anthropic-ai/sdk';

class FileUploadGenerator {
    private anthropic: Anthropic | null = null;

    generateMulterConfig(): string {
        return `import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disk storage configuration
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, \`\${uuidv4()}\${ext}\`);
    },
});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'));
    }
};

// Upload configurations
export const uploadSingle = multer({
    storage: diskStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('file');

export const uploadMultiple = multer({
    storage: diskStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).array('files', 10);

export const uploadMemory = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');
`;
    }

    generateS3Upload(): string {
        return `import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.S3_BUCKET!;

export async function uploadToS3(file: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = originalName.split('.').pop();
    const key = \`uploads/\${uuidv4()}.\${ext}\`;

    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file,
        ContentType: mimeType,
    }));

    return \`https://\${BUCKET}.s3.amazonaws.com/\${key}\`;
}

export async function deleteFromS3(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    }));
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getUploadPresignedUrl(fileName: string, mimeType: string): Promise<{ url: string; key: string }> {
    const ext = fileName.split('.').pop();
    const key = \`uploads/\${uuidv4()}.\${ext}\`;
    
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    return { url, key };
}
`;
    }

    generateReactDropzone(): string {
        return `import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';

interface FileUploadProps {
    onUpload: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number;
    accept?: Record<string, string[]>;
}

export function FileUpload({ onUpload, maxFiles = 5, maxSize = 5 * 1024 * 1024, accept }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        setErrors(rejectedFiles.map(r => \`\${r.file.name}: \${r.errors.map(e => e.message).join(', ')}\`));
        
        if (acceptedFiles.length > 0) {
            setUploading(true);
            try {
                await onUpload(acceptedFiles);
            } finally {
                setUploading(false);
            }
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles,
        maxSize,
        accept: accept || { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    });

    return (
        <div>
            <div {...getRootProps()} style={{
                border: '2px dashed #ccc',
                borderRadius: 8,
                padding: 40,
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? '#f0f0f0' : 'white',
            }}>
                <input {...getInputProps()} />
                {uploading ? (
                    <p>Uploading...</p>
                ) : isDragActive ? (
                    <p>Drop files here...</p>
                ) : (
                    <p>Drag & drop files here, or click to select</p>
                )}
            </div>
            {errors.length > 0 && (
                <ul style={{ color: 'red', marginTop: 8 }}>
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
            )}
        </div>
    );
}
`;
    }

    generateCloudinaryUpload(): string {
        return `import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
}

export async function uploadToCloudinary(file: Buffer | string, folder = 'uploads'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
                if (error) reject(error);
                else resolve({
                    url: result!.secure_url,
                    publicId: result!.public_id,
                    width: result!.width,
                    height: result!.height,
                    format: result!.format,
                });
            }
        );
        
        if (Buffer.isBuffer(file)) {
            uploadStream.end(file);
        } else {
            cloudinary.uploader.upload(file, { folder }).then(resolve).catch(reject);
        }
    });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(publicId: string, options: { width?: number; height?: number; quality?: number } = {}): string {
    return cloudinary.url(publicId, {
        transformation: [
            { width: options.width, height: options.height, crop: 'fill' },
            { quality: options.quality || 'auto', fetch_format: 'auto' },
        ],
    });
}
`;
    }
}

export const fileUploadGenerator = new FileUploadGenerator();
