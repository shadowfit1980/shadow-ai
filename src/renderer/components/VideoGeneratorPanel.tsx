import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type VideoStyle = 'cinematic' | 'animated' | 'realistic' | 'artistic';
type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface VideoJob {
    id: string;
    type: 'text-to-video' | 'image-to-video';
    prompt: string;
    status: VideoStatus;
    progress: number;
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    createdAt: number;
}

const PROVIDERS = [
    { id: 'runway', name: 'RunwayML', icon: '🎬' },
    { id: 'pika', name: 'Pika', icon: '🎥' },
    { id: 'kling', name: 'Kling', icon: '🎞️' },
    { id: 'luma', name: 'LumaAI', icon: '✨' }
];

const STYLES: { id: VideoStyle; name: string; icon: string }[] = [
    { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
    { id: 'animated', name: 'Animated', icon: '🎨' },
    { id: 'realistic', name: 'Realistic', icon: '📷' },
    { id: 'artistic', name: 'Artistic', icon: '🖼️' }
];

export default function VideoGeneratorPanel() {
    const [tab, setTab] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [style, setStyle] = useState<VideoStyle>('cinematic');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [duration, setDuration] = useState(5);
    const [selectedProvider, setSelectedProvider] = useState('runway');
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (tab === 'text' && !prompt.trim()) return;
        if (tab === 'image' && !imageUrl.trim()) return;

        setIsGenerating(true);

        const job: VideoJob = {
            id: `video_${Date.now()}`,
            type: tab === 'text' ? 'text-to-video' : 'image-to-video',
            prompt: tab === 'text' ? prompt : imageUrl,
            status: 'processing',
            progress: 0,
            createdAt: Date.now()
        };

        setJobs(prev => [job, ...prev]);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setJobs(prev => prev.map(j =>
                j.id === job.id ? { ...j, progress: i } : j
            ));
        }

        // Complete
        setJobs(prev => prev.map(j =>
            j.id === job.id ? {
                ...j,
                status: 'completed',
                progress: 100,
                videoUrl: `demo://video-${j.id}.mp4`,
                thumbnailUrl: `demo://thumb-${j.id}.jpg`,
                duration
            } : j
        ));

        setIsGenerating(false);
        setPrompt('');
        setImageUrl('');

    }, [tab, prompt, imageUrl, duration]);

    const getStatusIcon = (status: VideoStatus) => {
        switch (status) {
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'processing': return '⏳';
            default: return '⬜';
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-neon-cyan flex items-center gap-2">
                    🎬 Video Generator
                </h2>
                <p className="text-xs text-gray-500 mt-1">AI-powered video creation</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setTab('text')}
                    className={`flex-1 py-2 text-sm transition-colors ${tab === 'text'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    ✨ Text to Video
                </button>
                <button
                    onClick={() => setTab('image')}
                    className={`flex-1 py-2 text-sm transition-colors ${tab === 'image'
                            ? 'text-neon-cyan border-b-2 border-neon-cyan bg-neon-cyan/5'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    🖼️ Image to Video
                </button>
            </div>

            {/* Input Section */}
            <div className="p-4 space-y-4">
                {tab === 'text' ? (
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Describe your video</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A sunset over mountains with clouds moving slowly..."
                            className="w-full h-24 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:border-neon-cyan/50 focus:outline-none text-gray-300 placeholder-gray-600 resize-none"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Image URL or path</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:border-neon-cyan/50 focus:outline-none text-gray-300"
                        />
                    </div>
                )}

                {/* Style Selection */}
                <div>
                    <label className="text-xs text-gray-400 block mb-2">Style</label>
                    <div className="grid grid-cols-4 gap-2">
                        {STYLES.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStyle(s.id)}
                                className={`p-2 rounded text-xs transition-all ${style === s.id
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {s.icon} {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Duration & Aspect Ratio */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Duration: {duration}s</label>
                        <input
                            type="range"
                            min={3}
                            max={15}
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Aspect Ratio</label>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-700 rounded text-gray-300"
                        >
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="1:1">1:1 (Square)</option>
                            <option value="4:3">4:3 (Standard)</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (tab === 'text' ? !prompt.trim() : !imageUrl.trim())}
                    className={`w-full py-3 rounded-lg font-medium transition-all ${isGenerating
                            ? 'bg-purple-500/20 text-purple-400 cursor-wait'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                >
                    {isGenerating ? '⏳ Generating...' : '🎬 Generate Video'}
                </button>
            </div>

            {/* Jobs List */}
            <div className="flex-1 overflow-y-auto p-4 border-t border-gray-800">
                <h3 className="text-xs text-gray-500 mb-2">Generated Videos</h3>
                <AnimatePresence>
                    {jobs.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-4">No videos generated yet</p>
                    ) : (
                        <div className="space-y-2">
                            {jobs.map((job) => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 bg-gray-900/50 rounded-lg border border-gray-800"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-400">
                                            {job.type === 'text-to-video' ? '✨ Text' : '🖼️ Image'} → Video
                                        </span>
                                        <span className="text-xs">{getStatusIcon(job.status)}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 truncate mb-2">{job.prompt}</p>
                                    {job.status === 'processing' && (
                                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${job.progress}%` }}
                                            />
                                        </div>
                                    )}
                                    {job.status === 'completed' && job.videoUrl && (
                                        <div className="mt-2 text-xs text-green-400">
                                            ✅ Ready • {job.duration}s
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
