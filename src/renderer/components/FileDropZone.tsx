import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileDropZoneProps {
    onFilesDropped: (files: File[]) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    multiple?: boolean;
}

export default function FileDropZone({
    onFilesDropped,
    accept = {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        'application/pdf': ['.pdf'],
        'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx'],
    },
    maxSize = 10 * 1024 * 1024, // 10MB
    multiple = true,
}: FileDropZoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesDropped(acceptedFiles);
    }, [onFilesDropped]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragActive
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : isDragReject
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                }`}
        >
            <input {...getInputProps()} />

            <div className="text-4xl mb-3">
                {isDragActive ? '📥' : isDragReject ? '❌' : '📁'}
            </div>

            {isDragActive ? (
                <p className="text-neon-cyan">Drop files here...</p>
            ) : isDragReject ? (
                <p className="text-red-400">Some files will be rejected</p>
            ) : (
                <>
                    <p className="text-gray-300 mb-2">
                        Drag & drop files here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">
                        Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                    </p>
                </>
            )}
        </div>
    );
}
