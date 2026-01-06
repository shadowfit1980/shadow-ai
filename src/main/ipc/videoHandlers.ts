/**
 * Video Generation IPC Handlers
 * 
 * Exposes VideoGenerationService to the renderer process.
 */

import { ipcMain } from 'electron';
import { videoGenerationService, VideoGenerationRequest } from '../ai/multimodal/VideoGenerationService';

export function registerVideoHandlers(): void {
    // Generate video from text
    ipcMain.handle('video:text-to-video', async (_event, prompt: string, options?: Partial<VideoGenerationRequest>) => {
        try {
            const result = await videoGenerationService.textToVideo(prompt, options);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // Generate video from image
    ipcMain.handle('video:image-to-video', async (_event, imageUrl: string, prompt?: string, options?: Partial<VideoGenerationRequest>) => {
        try {
            const result = await videoGenerationService.imageToVideo(imageUrl, prompt, options);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // Get job status
    ipcMain.handle('video:get-job', async (_event, jobId: string) => {
        const job = videoGenerationService.getJob(jobId);
        return job || null;
    });

    // Get all jobs
    ipcMain.handle('video:get-all-jobs', async () => {
        return videoGenerationService.getAllJobs();
    });

    // Cancel job
    ipcMain.handle('video:cancel-job', async (_event, jobId: string) => {
        return videoGenerationService.cancelJob(jobId);
    });

    // Set provider
    ipcMain.handle('video:set-provider', async (_event, providerName: string, apiKey?: string) => {
        return videoGenerationService.setProvider(providerName, apiKey);
    });

    // Get providers
    ipcMain.handle('video:get-providers', async () => {
        return videoGenerationService.getProviders();
    });

    // Subscribe to events
    videoGenerationService.on('job-progress', (data) => {
        // Broadcast to all renderer windows
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('video:progress', data);
        });
    });

    videoGenerationService.on('job-completed', (job) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('video:completed', job);
        });
    });

    console.log('🎬 Video generation handlers registered');
}
