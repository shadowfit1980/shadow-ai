/**
 * StreamingService - Real-time token streaming for AI responses
 * Enables progressive rendering of AI responses in the UI
 */

import { BrowserWindow } from 'electron';

export interface StreamToken {
    token: string;
    done: boolean;
    totalTokens?: number;
    finishReason?: string;
}

export interface StreamOptions {
    onToken?: (token: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: Error) => void;
}

class StreamingService {
    private static instance: StreamingService;
    private mainWindow: BrowserWindow | null = null;
    private currentStreamId: string | null = null;
    private buffer: string = '';

    private constructor() { }

    static getInstance(): StreamingService {
        if (!StreamingService.instance) {
            StreamingService.instance = new StreamingService();
        }
        return StreamingService.instance;
    }

    /**
     * Set the main window for IPC communication
     */
    setMainWindow(window: BrowserWindow): void {
        this.mainWindow = window;
    }

    /**
     * Generate a unique stream ID
     */
    generateStreamId(): string {
        this.currentStreamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.buffer = '';
        return this.currentStreamId;
    }

    /**
     * Emit a token to the renderer process
     */
    emitToken(streamId: string, token: string, done: boolean = false): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.buffer += token;
            this.mainWindow.webContents.send('stream:token', {
                streamId,
                token,
                done,
                buffer: this.buffer
            });
        }
    }

    /**
     * Emit stream completion
     */
    emitComplete(streamId: string, fullResponse: string): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('stream:complete', {
                streamId,
                response: fullResponse,
                tokenCount: fullResponse.split(/\s+/).length
            });
        }
        this.currentStreamId = null;
        this.buffer = '';
    }

    /**
     * Emit stream error
     */
    emitError(streamId: string, error: Error): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send('stream:error', {
                streamId,
                error: error.message
            });
        }
        this.currentStreamId = null;
        this.buffer = '';
    }

    /**
     * Get current buffer content
     */
    getBuffer(): string {
        return this.buffer;
    }

    /**
     * Check if currently streaming
     */
    isStreaming(): boolean {
        return this.currentStreamId !== null;
    }

    // =========================================================================
    // Pipeline Integration
    // =========================================================================

    private pipeline: any = null;

    /**
     * Initialize streaming with pipeline processing
     */
    async initializePipeline(): Promise<void> {
        try {
            const { streamingPipeline, JSONParserTransformer, AccumulatorTransformer } =
                await import('../ai/streaming/StreamingPipeline');

            this.pipeline = streamingPipeline;
            this.pipeline.clearStages();

            // Add JSON parsing for structured responses
            this.pipeline.addStage(new JSONParserTransformer());
            this.pipeline.addStage(new AccumulatorTransformer());

            // Forward processed chunks to renderer
            this.pipeline.on('chunk', (chunk: any) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed() && this.currentStreamId) {
                    this.mainWindow.webContents.send('stream:processed', {
                        streamId: this.currentStreamId,
                        chunk
                    });
                }
            });

            console.log('✅ StreamingService pipeline initialized');
        } catch (error) {
            console.warn('⚠️ Pipeline initialization failed:', error);
        }
    }

    /**
     * Process token through pipeline
     */
    async processWithPipeline(
        streamId: string,
        token: string
    ): Promise<void> {
        // Always emit raw token
        this.emitToken(streamId, token);

        // Also process through pipeline if available
        if (this.pipeline) {
            try {
                await this.pipeline.process({
                    id: `${streamId}_${Date.now()}`,
                    content: token,
                    type: 'token' as const,
                    timestamp: new Date()
                });
            } catch (error) {
                // Pipeline errors don't stop streaming
                console.warn('Pipeline processing error:', error);
            }
        }
    }

    /**
     * Finalize pipeline and get accumulated results
     */
    async finalizePipeline(): Promise<any[]> {
        if (!this.pipeline) return [];

        try {
            const flushed = await this.pipeline.flush();
            return flushed;
        } catch (error) {
            console.warn('Pipeline finalization error:', error);
            return [];
        }
    }

    /**
     * Get pipeline statistics
     */
    getPipelineStats(): any {
        if (!this.pipeline) return null;
        return this.pipeline.getStats();
    }
}

export const streamingService = StreamingService.getInstance();
export default StreamingService;
