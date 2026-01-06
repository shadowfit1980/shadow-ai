/**
 * File Upload Generator
 * 
 * Generate file upload handlers for S3, Cloudinary,
 * Supabase Storage, and Firebase Storage.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type StorageProvider = 's3' | 'cloudinary' | 'supabase' | 'firebase' | 'uploadthing';

// ============================================================================
// FILE UPLOAD GENERATOR
// ============================================================================

export class FileUploadGenerator extends EventEmitter {
    private static instance: FileUploadGenerator;

    private constructor() {
        super();
    }

    static getInstance(): FileUploadGenerator {
        if (!FileUploadGenerator.instance) {
            FileUploadGenerator.instance = new FileUploadGenerator();
        }
        return FileUploadGenerator.instance;
    }

    // ========================================================================
    // AWS S3
    // ========================================================================

    generateS3(): string {
        return `import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export const s3Service = {
  // Upload file
  async upload(file: Buffer, filename: string, contentType: string) {
    const key = \`uploads/\${uuid()}-\${filename}\`;
    
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    }));

    return {
      key,
      url: \`https://\${BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${key}\`,
    };
  },

  // Get signed upload URL (for direct client uploads)
  async getUploadUrl(filename: string, contentType: string) {
    const key = \`uploads/\${uuid()}-\${filename}\`;
    
    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    return { uploadUrl: url, key };
  },

  // Get signed download URL
  async getDownloadUrl(key: string) {
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      }),
      { expiresIn: 3600 }
    );
  },

  // Delete file
  async delete(key: string) {
    await s3.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
  },
};

// Express routes
import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const result = await s3Service.upload(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype
  );
  
  res.json(result);
});

router.get('/presigned-url', async (req, res) => {
  const { filename, contentType } = req.query as { filename: string; contentType: string };
  const result = await s3Service.getUploadUrl(filename, contentType);
  res.json(result);
});

export { router as uploadRouter };
`;
    }

    // ========================================================================
    // CLOUDINARY
    // ========================================================================

    generateCloudinary(): string {
        return `import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryService = {
  // Upload from buffer
  async upload(file: Buffer, options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any;
  }) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: options?.folder || 'uploads',
          resource_type: options?.resourceType || 'auto',
          transformation: options?.transformation,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file);
    });
  },

  // Upload from URL
  async uploadFromUrl(url: string, folder = 'uploads') {
    return cloudinary.uploader.upload(url, { folder });
  },

  // Delete
  async delete(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  },

  // Transform image URL
  getTransformedUrl(publicId: string, transformations: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  }) {
    return cloudinary.url(publicId, {
      transformation: [transformations],
    });
  },

  // Optimized image URL
  getOptimizedUrl(publicId: string, width?: number) {
    return cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto',
      width,
      crop: 'scale',
    });
  },
};

// Express routes
import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  try {
    const result = await cloudinaryService.upload(req.file.buffer, {
      folder: req.body.folder,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as cloudinaryRouter };
`;
    }

    // ========================================================================
    // SUPABASE STORAGE
    // ========================================================================

    generateSupabaseStorage(): string {
        return `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseStorage = {
  // Upload file
  async upload(bucket: string, path: string, file: File | Buffer, options?: {
    contentType?: string;
    upsert?: boolean;
  }) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType,
        upsert: options?.upsert,
      });

    if (error) throw error;
    return data;
  },

  // Get public URL
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Get signed URL
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Delete file
  async delete(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },

  // List files
  async list(bucket: string, folder = '') {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    if (error) throw error;
    return data;
  },
};

// React hook
import { useState } from 'react';

export function useSupabaseUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File, path?: string) => {
    setUploading(true);
    setProgress(0);

    try {
      const filePath = path || \`\${Date.now()}-\${file.name}\`;
      await supabaseStorage.upload(bucket, filePath, file);
      const url = supabaseStorage.getPublicUrl(bucket, filePath);
      setProgress(100);
      return { path: filePath, url };
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, progress };
}
`;
    }

    // ========================================================================
    // UPLOADTHING
    // ========================================================================

    generateUploadThing(): string {
        return `// uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      // Add auth check here
      return { userId: 'user_id' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete', file.url);
      return { url: file.url };
    }),

  documentUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(async () => ({ userId: 'user_id' }))
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  videoUploader: f({ video: { maxFileSize: '256MB' } })
    .middleware(async () => ({ userId: 'user_id' }))
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// uploadthing/route.ts (Next.js App Router)
import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

// React component
import { UploadButton, UploadDropzone } from '@uploadthing/react';
import type { OurFileRouter } from './core';

export function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  return (
    <UploadButton<OurFileRouter, 'imageUploader'>
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        if (res?.[0]) onUpload(res[0].url);
      }}
      onUploadError={(error) => {
        console.error(error);
      }}
    />
  );
}

export function DropzoneUpload({ onUpload }: { onUpload: (urls: string[]) => void }) {
  return (
    <UploadDropzone<OurFileRouter, 'imageUploader'>
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        onUpload(res?.map(r => r.url) || []);
      }}
    />
  );
}
`;
    }

    // ========================================================================
    // FLUTTER
    // ========================================================================

    generateFlutterUpload(): string {
        return `import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as path;
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';

class FileUploadService {
  static const String _baseUrl = 'YOUR_API_URL';

  // Upload file to server
  static Future<String?> uploadFile(File file) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('\$_baseUrl/api/upload'),
      );

      final mimeType = _getMimeType(file.path);
      request.files.add(await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: MediaType.parse(mimeType),
      ));

      final response = await request.send();
      if (response.statusCode == 200) {
        final body = await response.stream.bytesToString();
        // Parse response and return URL
        return body;
      }
      return null;
    } catch (e) {
      print('Upload error: \$e');
      return null;
    }
  }

  // Pick and upload image
  static Future<String?> pickAndUploadImage({
    ImageSource source = ImageSource.gallery,
    int maxWidth = 1024,
    int quality = 85,
  }) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      maxWidth: maxWidth.toDouble(),
      imageQuality: quality,
    );

    if (picked == null) return null;
    return uploadFile(File(picked.path));
  }

  // Pick and upload any file
  static Future<String?> pickAndUploadFile({
    List<String>? allowedExtensions,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: allowedExtensions != null ? FileType.custom : FileType.any,
      allowedExtensions: allowedExtensions,
    );

    if (result == null || result.files.isEmpty) return null;
    final file = File(result.files.first.path!);
    return uploadFile(file);
  }

  static String _getMimeType(String filePath) {
    final ext = path.extension(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.pdf':
        return 'application/pdf';
      case '.mp4':
        return 'video/mp4';
      default:
        return 'application/octet-stream';
    }
  }
}

// Supabase Storage for Flutter
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseStorageService {
  static final _storage = Supabase.instance.client.storage;

  static Future<String?> upload(String bucket, File file) async {
    try {
      final fileName = '\${DateTime.now().millisecondsSinceEpoch}_\${path.basename(file.path)}';
      await _storage.from(bucket).upload(fileName, file);
      return _storage.from(bucket).getPublicUrl(fileName);
    } catch (e) {
      print('Supabase upload error: \$e');
      return null;
    }
  }
}
`;
    }

    generateEnvTemplate(provider: StorageProvider): string {
        switch (provider) {
            case 's3':
                return `AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=`;
            case 'cloudinary':
                return `CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=`;
            case 'uploadthing':
                return `UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=`;
            default:
                return '';
        }
    }
}

export const fileUploadGenerator = FileUploadGenerator.getInstance();
