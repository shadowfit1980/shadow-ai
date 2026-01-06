import { useState } from 'react';
import { motion } from 'framer-motion';
import MonacoEditor from '@monaco-editor/react';

type DesignMode = 'ui' | 'image' | 'diagram';

export default function DesignStudio() {
    const [mode, setMode] = useState<DesignMode>('ui');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [code, setCode] = useState('');

    // UI Generation Options
    const [framework, setFramework] = useState('html');
    const [style, setStyle] = useState('modern');
    const [variantCount, setVariantCount] = useState(1);

    // Image Generation Options
    const [resolution, setResolution] = useState('2K');
    const [imageStyle, setImageStyle] = useState('photorealistic');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setResult(null);
        setCode('');

        try {
            const api = window.shadowAPI as any;
            if (mode === 'ui') {
                // Generate UI with Google Stitch
                if (variantCount > 1) {
                    const variants = await api.design.generateVariants(
                        prompt,
                        variantCount,
                        { framework, style }
                    );
                    setResult(variants[0]); // Show first variant
                    if (variants[0]?.html) {
                        setCode(variants[0].html + '\n\n/* CSS */\n' + variants[0].css);
                    }
                } else {
                    const design = await api.design.generateUI(prompt, {
                        framework,
                        style
                    });
                    setResult(design);
                    if (design?.html) {
                        setCode(design.html + '\n\n/* CSS */\n' + design.css);
                    }
                }
            } else if (mode === 'image') {
                // Generate Image Prompt with Nano Banana Pro
                const imagePrompt = await api.design.generateImagePrompt(prompt, {
                    resolution,
                    style: imageStyle
                });
                setResult(imagePrompt);
            } else if (mode === 'diagram') {
                // Generate Diagram
                const diagramPrompt = await api.design.generateDiagram({
                    type: 'flow',
                    title: prompt,
                    dataPoints: [],
                    style: 'modern'
                });
                setResult(diagramPrompt);
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const exportCode = async () => {
        if (!result || mode !== 'ui') return;

        const api = window.shadowAPI as any;
        const codeExport = await api.design.generateCode(result, framework);
        if (codeExport?.files?.length > 0) {
            const allCode = codeExport.files.map((f: any) =>
                `// ${f.name}\n${f.content}`
            ).join('\n\n');
            setCode(allCode);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20">
                <h2 className="text-xl font-bold text-neon-cyan">🎨 Design Studio</h2>
                <p className="text-xs text-gray-500 mt-1">
                    Powered by Google Stitch & Nano Banana Pro
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Input */}
                <div className="w-1/3 border-r border-gray-800 flex flex-col p-4 overflow-y-auto scrollbar-thin">
                    {/* Mode Selection */}
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">Design Mode</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('ui')}
                                className={`flex-1 px-3 py-2 rounded text-sm ${mode === 'ui'
                                    ? 'bg-neon-cyan text-black font-semibold'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                🖼️ UI
                            </button>
                            <button
                                onClick={() => setMode('image')}
                                className={`flex-1 px-3 py-2 rounded text-sm ${mode === 'image'
                                    ? 'bg-neon-cyan text-black font-semibold'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                🖌️ Image
                            </button>
                            <button
                                onClick={() => setMode('diagram')}
                                className={`flex-1 px-3 py-2 rounded text-sm ${mode === 'diagram'
                                    ? 'bg-neon-cyan text-black font-semibold'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                            >
                                📊 Diagram
                            </button>
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-2">
                            {mode === 'ui' ? 'UI Description' : mode === 'image' ? 'Image Description' : 'Diagram Title'}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={
                                mode === 'ui'
                                    ? 'e.g., modern landing page with hero section'
                                    : mode === 'image'
                                        ? 'e.g., futuristic city skyline at sunset'
                                        : 'e.g., user authentication flow'
                            }
                            className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white resize-none focus:outline-none focus:border-neon-cyan"
                        />
                    </div>

                    {/* UI Options */}
                    {mode === 'ui' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-2">Framework</label>
                                <select
                                    value={framework}
                                    onChange={(e) => setFramework(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-neon-cyan"
                                >
                                    <option value="html">HTML/CSS</option>
                                    <option value="react">React</option>
                                    <option value="vue">Vue</option>
                                    <option value="angular">Angular</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-2">Style</label>
                                <select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-neon-cyan"
                                >
                                    <option value="modern">Modern</option>
                                    <option value="minimal">Minimal</option>
                                    <option value="vibrant">Vibrant</option>
                                    <option value="professional">Professional</option>
                                    <option value="creative">Creative</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-2">
                                    Variants: {variantCount}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={variantCount}
                                    onChange={(e) => setVariantCount(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </>
                    )}

                    {/* Image Options */}
                    {mode === 'image' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-2">Resolution</label>
                                <select
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-neon-cyan"
                                >
                                    <option value="2K">2K</option>
                                    <option value="4K">4K</option>
                                    <option value="8K">8K</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-2">Style</label>
                                <select
                                    value={imageStyle}
                                    onChange={(e) => setImageStyle(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:border-neon-cyan"
                                >
                                    <option value="photorealistic">Photorealistic</option>
                                    <option value="illustration">Illustration</option>
                                    <option value="graphic-design">Graphic Design</option>
                                    <option value="infographic">Infographic</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="cyber-button w-full py-3"
                    >
                        {isGenerating ? '⏳ Generating...' : '🚀 Generate Design'}
                    </button>

                    {mode === 'ui' && result && (
                        <button
                            onClick={exportCode}
                            className="mt-2 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                            📦 Export Code
                        </button>
                    )}
                </div>

                {/* Right Panel - Output */}
                <div className="flex-1 flex flex-col">
                    {/* Preview/Result */}
                    <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                        {!result && (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <div className="text-4xl mb-4">🎨</div>
                                    <p>Configure options and generate your design</p>
                                </div>
                            </div>
                        )}

                        {result && mode === 'ui' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="cyber-panel p-4">
                                    <h3 className="text-lg font-semibold text-neon-cyan mb-2">
                                        {result.description}
                                    </h3>
                                    <div className="text-sm text-gray-400 space-y-2">
                                        <div>
                                            <strong>Components:</strong> {result.components?.join(', ') || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>Features:</strong> {result.features?.join(', ') || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {result.html && (
                                    <div className="cyber-panel p-4">
                                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Preview</h4>
                                        <iframe
                                            srcDoc={`
                                                <!DOCTYPE html>
                                                <html>
                                                <head>
                                                    <style>${result.css || ''}</style>
                                                </head>
                                                <body>
                                                    ${result.html}
                                                </body>
                                                </html>
                                            `}
                                            className="w-full h-96 bg-white rounded"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {result && (mode === 'image' || mode === 'diagram') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="cyber-panel p-4"
                            >
                                <h3 className="text-lg font-semibold text-neon-cyan mb-4">
                                    Optimized Prompt for {mode === 'image' ? 'Nano Banana Pro' : 'Diagram Generation'}
                                </h3>
                                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                                        {result.optimizedPrompt || result.description}
                                    </p>
                                </div>

                                {result.settings && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-purple-400 mb-2">Settings</h4>
                                        <div className="text-xs text-gray-400 space-y-1">
                                            {Object.entries(result.settings).map(([key, value]) => (
                                                <div key={key}>
                                                    <strong>{key}:</strong> {String(value)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Code View */}
                    {code && (
                        <div className="h-1/2 border-t border-gray-800">
                            <div className="h-full">
                                <MonacoEditor
                                    height="100%"
                                    language={framework === 'html' ? 'html' : 'javascript'}
                                    theme="vs-dark"
                                    value={code}
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
