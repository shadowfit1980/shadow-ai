import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

type DeviceType = 'iphone' | 'android' | 'ipad' | 'browser';
type Orientation = 'portrait' | 'landscape';

interface EmulatorPanelProps {
    previewUrl?: string;
    htmlContent?: string;
    onRefresh?: () => void;
    onDeviceChange?: (device: DeviceType) => void;
}

const DEVICES: { type: DeviceType; name: string; width: number; height: number; icon: string }[] = [
    { type: 'iphone', name: 'iPhone 14 Pro', width: 393, height: 852, icon: '📱' },
    { type: 'android', name: 'Pixel 7', width: 412, height: 915, icon: '📱' },
    { type: 'ipad', name: 'iPad Pro', width: 1024, height: 1366, icon: '📱' },
    { type: 'browser', name: 'Browser', width: 1280, height: 800, icon: '🖥️' },
];

export default function EmulatorPanel({
    previewUrl,
    htmlContent,
    onRefresh,
    onDeviceChange
}: EmulatorPanelProps) {
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>('iphone');
    const [orientation, setOrientation] = useState<Orientation>('portrait');
    const [scale, setScale] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);

    const device = DEVICES.find(d => d.type === selectedDevice) || DEVICES[0];
    const deviceWidth = orientation === 'portrait' ? device.width : device.height;
    const deviceHeight = orientation === 'portrait' ? device.height : device.width;

    const handleDeviceChange = useCallback((type: DeviceType) => {
        setSelectedDevice(type);
        onDeviceChange?.(type);
    }, [onDeviceChange]);

    const handleRefresh = useCallback(() => {
        setIsLoading(true);
        onRefresh?.();
        setTimeout(() => setIsLoading(false), 500);
    }, [onRefresh]);

    const getDeviceFrame = () => {
        if (selectedDevice === 'browser') {
            return {
                borderRadius: '12px',
                border: '2px solid #374151',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            };
        }

        // Mobile device frame
        return {
            borderRadius: selectedDevice === 'ipad' ? '24px' : '44px',
            border: '12px solid #1f2937',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px #374151',
        };
    };

    // Generate a default preview content if none provided
    const getPreviewContent = () => {
        if (htmlContent) {
            return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        }
        if (previewUrl) {
            return previewUrl;
        }
        return `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
        }
        h1 { font-size: 28px; margin-bottom: 16px; }
        p { opacity: 0.8; max-width: 300px; line-height: 1.6; }
        .icon { font-size: 64px; margin-bottom: 24px; }
    </style>
</head>
<body>
    <div class="icon">🚀</div>
    <h1>Preview Mode</h1>
    <p>Your app preview will appear here. Write some code or generate an app to see it in action!</p>
</body>
</html>
        `)}`;
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Emulator
                    </span>

                    {/* Device Selector */}
                    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
                        {DEVICES.map((d) => (
                            <button
                                key={d.type}
                                onClick={() => handleDeviceChange(d.type)}
                                className={`px-2 py-1 text-xs rounded-md transition-colors ${selectedDevice === d.type
                                        ? 'bg-neon-cyan/20 text-neon-cyan'
                                        : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                title={d.name}
                            >
                                {d.icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Orientation Toggle (mobile only) */}
                    {selectedDevice !== 'browser' && (
                        <button
                            onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
                            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded"
                            title="Toggle Orientation"
                        >
                            {orientation === 'portrait' ? '📱' : '📱'}
                        </button>
                    )}

                    {/* Scale Controls */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <button
                            onClick={() => setScale(s => Math.max(0.25, s - 0.1))}
                            className="p-1 hover:bg-gray-800 rounded"
                        >
                            −
                        </button>
                        <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(s => Math.min(1, s + 0.1))}
                            className="p-1 hover:bg-gray-800 rounded"
                        >
                            +
                        </button>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded"
                        title="Refresh Preview"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-900/30">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'center',
                    }}
                >
                    {/* Device Frame */}
                    <div
                        className="bg-gray-900 overflow-hidden relative"
                        style={{
                            width: deviceWidth,
                            height: deviceHeight,
                            ...getDeviceFrame(),
                        }}
                    >
                        {/* Browser Top Bar */}
                        {selectedDevice === 'browser' && (
                            <div className="h-8 bg-gray-800 flex items-center px-3 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="flex-1 mx-2">
                                    <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-400 truncate">
                                        localhost:3000
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mobile Notch (iPhone) */}
                        {selectedDevice === 'iphone' && orientation === 'portrait' && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-3xl z-10" />
                        )}

                        {/* Content iframe */}
                        <iframe
                            src={getPreviewContent()}
                            className="w-full h-full border-0 bg-white"
                            style={{
                                height: selectedDevice === 'browser' ? 'calc(100% - 32px)' : '100%'
                            }}
                            title="Preview"
                            sandbox="allow-scripts allow-same-origin"
                        />

                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin text-2xl">⏳</div>
                            </div>
                        )}
                    </div>

                    {/* Device Info */}
                    <div className="text-center mt-4 text-xs text-gray-500">
                        {device.name} • {deviceWidth} × {deviceHeight}
                    </div>
                </motion.div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
                <span>📡 Hot Reload: Enabled</span>
                <span>⚡ Last update: Just now</span>
            </div>
        </div>
    );
}
