import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';

export default function PreviewArea() {
    const { codeContent } = useAppStore();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [htmlContent, setHtmlContent] = useState('');
    const [debugInfo, setDebugInfo] = useState('Ready');

    // Debug: Log store updates
    useEffect(() => {
        const len = codeContent?.length || 0;
        setDebugInfo(`Code: ${len} chars`);
        console.log('[PreviewArea] Store codeContent updated:', len, 'chars');

        if (codeContent && len > 0) {
            // Check if it looks like HTML
            const hasHtmlTags = codeContent.includes('<') && codeContent.includes('>');
            const isFullHtml = codeContent.includes('<html') || codeContent.includes('<!DOCTYPE');

            console.log('[PreviewArea] hasHtmlTags:', hasHtmlTags, 'isFullHtml:', isFullHtml);

            if (isFullHtml) {
                // Full HTML document - use directly
                setHtmlContent(codeContent);
            } else if (hasHtmlTags) {
                // Partial HTML - wrap in document
                const wrapped = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
</head>
<body>
${codeContent}
</body>
</html>`;
                setHtmlContent(wrapped);
            } else {
                // Not HTML - show as code
                const codePreview = `<!DOCTYPE html>
<html>
<head><title>Code Preview</title>
<style>
    body { background: #1e1e1e; color: #d4d4d4; padding: 20px; margin: 0; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body><pre>${codeContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;
                setHtmlContent(codePreview);
            }
        } else {
            setHtmlContent('');
        }
    }, [codeContent]);

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Toolbar */}
            <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-neon-cyan font-semibold">🔴 Live Preview</span>
                    <span className="text-xs text-green-400">{debugInfo}</span>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => {
                            console.log('[PreviewArea] Reload clicked, codeContent:', codeContent?.length);
                            if (codeContent) {
                                setHtmlContent(''); // Force clear
                                setTimeout(() => {
                                    // Re-trigger effect
                                    setHtmlContent(codeContent.includes('<html') ? codeContent : `<html><body>${codeContent}</body></html>`);
                                }, 50);
                            }
                        }}
                        className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                    >
                        🔄 Reload
                    </button>
                </div>
            </div>

            {/* Preview iframe */}
            <div className="flex-1 bg-white overflow-hidden">
                {htmlContent ? (
                    <iframe
                        ref={iframeRef}
                        srcDoc={htmlContent}
                        title="preview"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                            <p className="text-2xl mb-2">👋</p>
                            <p className="font-medium">No Preview Yet</p>
                            <p className="text-sm text-gray-400 mt-1">Generate code to see preview</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
